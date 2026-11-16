-- Run after production.sql in the same Supabase project.
BEGIN;
CREATE SCHEMA IF NOT EXISTS ngo_private;
REVOKE ALL ON SCHEMA ngo_private FROM PUBLIC, anon, authenticated;
CREATE TABLE IF NOT EXISTS ngo_private.staff_members (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);
REVOKE ALL ON ngo_private.staff_members FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_ngo_staff() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT FROM ngo_private.staff_members WHERE user_id = auth.uid())
$$;
REVOKE ALL ON FUNCTION public.is_ngo_staff() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_ngo_staff() TO authenticated;

-- Only this change signal goes into Realtime. Each read of a queue checks current membership.
CREATE TABLE IF NOT EXISTS public.staff_queue_signal (
  id integer PRIMARY KEY CHECK (id = 1), revision bigint NOT NULL DEFAULT 0
);
INSERT INTO public.staff_queue_signal(id) VALUES (1) ON CONFLICT DO NOTHING;
ALTER TABLE public.staff_queue_signal ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.staff_queue_signal FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.staff_queue_signal TO authenticated;
DROP POLICY IF EXISTS staff_signal_read ON public.staff_queue_signal;
CREATE POLICY staff_signal_read ON public.staff_queue_signal FOR SELECT TO authenticated
USING (public.is_ngo_staff());
CREATE OR REPLACE FUNCTION ngo_private.signal_queue_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.staff_queue_signal SET revision = revision + 1 WHERE id = 1;
  RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION ngo_private.signal_queue_change() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS assistance_signal ON public.assistance_requests;
CREATE TRIGGER assistance_signal AFTER INSERT OR UPDATE OR DELETE ON public.assistance_requests
FOR EACH STATEMENT EXECUTE FUNCTION ngo_private.signal_queue_change();
DROP TRIGGER IF EXISTS donation_signal ON public.donations;
CREATE TRIGGER donation_signal AFTER INSERT OR UPDATE OR DELETE ON public.donations
FOR EACH STATEMENT EXECUTE FUNCTION ngo_private.signal_queue_change();
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_publication_tables WHERE pubname='supabase_realtime'
                 AND schemaname='public' AND tablename='staff_queue_signal') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_queue_signal;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.staff_queue(queue_name text, page_number integer) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.is_ngo_staff() THEN RAISE insufficient_privilege; END IF;
  IF page_number IS NULL OR page_number < 0 THEN RAISE invalid_parameter_value; END IF;
  IF queue_name = 'requests' THEN
    RETURN (SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY created_at DESC, id DESC), '[]') FROM (
      SELECT id, name, phone, village, assistance_type, status, assigned_to, follow_up_at, staff_notes, created_at
      FROM public.assistance_requests ORDER BY created_at DESC, id DESC LIMIT 25 OFFSET page_number::bigint * 25
    ) r);
  ELSIF queue_name = 'donations' THEN
    RETURN (SELECT coalesce(jsonb_agg(to_jsonb(d) ORDER BY created_at DESC, id DESC), '[]') FROM (
      SELECT id, name, email, phone, provider, mode, order_id, payment_id, amount_paise, amount_refunded,
        status, verified_at, settled_at, settlement_reference, receipt_reference, staff_notes, created_at
      FROM public.donations ORDER BY created_at DESC, id DESC LIMIT 25 OFFSET page_number::bigint * 25
    ) d);
  END IF;
  RAISE invalid_parameter_value;
END $$;
REVOKE ALL ON FUNCTION public.staff_queue(text,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.staff_queue(text,integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.staff_update_request(request_id uuid, previous_status text, next_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.is_ngo_staff() THEN RAISE insufficient_privilege; END IF;
  IF next_status IS NULL OR next_status NOT IN ('new','contacted','in_progress','closed') THEN RAISE invalid_parameter_value; END IF;
  UPDATE public.assistance_requests SET status = next_status
  WHERE id = request_id AND status = previous_status;
  IF NOT FOUND THEN RAISE EXCEPTION 'Request changed. Refresh and try again.'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.staff_update_request(uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.staff_update_request(uuid,text,text) TO authenticated;
COMMIT;
