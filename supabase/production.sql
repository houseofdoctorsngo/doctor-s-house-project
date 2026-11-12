-- Run once in the Supabase SQL Editor, on a backup/staging project first.
-- Safe for the existing assistance table; no existing records are deleted.
BEGIN;
CREATE TABLE IF NOT EXISTS public.assistance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
  phone text NOT NULL CHECK (phone ~ '^([+]91[ ]?)?[6-9][0-9]{9}$'),
  village text NOT NULL CHECK (char_length(village) BETWEEN 2 AND 120),
  assistance_type text NOT NULL CHECK (assistance_type IN ('Free camp','Medicines','Doctor consultation','Ambulance','Government schemes')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.assistance_requests ADD COLUMN IF NOT EXISTS submission_token uuid;
ALTER TABLE public.assistance_requests ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','in_progress','closed'));
ALTER TABLE public.assistance_requests ADD COLUMN IF NOT EXISTS staff_notes text;
-- Do not backfill consent timestamps for historical records.
ALTER TABLE public.assistance_requests ADD COLUMN IF NOT EXISTS consent_at timestamptz;
ALTER TABLE public.assistance_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.assistance_requests FROM anon, authenticated;
GRANT INSERT (id, name, phone, village, assistance_type, submission_token) ON public.assistance_requests TO anon, authenticated;
GRANT ALL ON public.assistance_requests TO service_role;
DROP POLICY IF EXISTS "Visitors can submit assistance requests" ON public.assistance_requests;
CREATE POLICY "Visitors can submit assistance requests" ON public.assistance_requests FOR INSERT TO anon, authenticated WITH CHECK (status = 'new' AND staff_notes IS NULL);
CREATE INDEX IF NOT EXISTS assistance_phone_created_idx ON public.assistance_requests(phone, created_at);

CREATE TABLE IF NOT EXISTS public.submission_permits (
  id uuid PRIMARY KEY,
  request_id uuid NOT NULL,
  payload jsonb NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '2 minutes'
);
ALTER TABLE public.submission_permits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.submission_permits FROM anon, authenticated;
GRANT ALL ON public.submission_permits TO service_role;
CREATE OR REPLACE FUNCTION public.validate_assistance_submission() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE consumed uuid;
BEGIN
  NEW.phone := regexp_replace(regexp_replace(NEW.phone, '\s', '', 'g'), '^\+91', '');
  PERFORM pg_advisory_xact_lock(hashtextextended('assistance:' || NEW.phone, 0));
  DELETE FROM public.submission_permits WHERE expires_at < now();
  DELETE FROM public.submission_permits
    WHERE id = NEW.submission_token AND request_id = NEW.id AND expires_at > now()
      AND payload = jsonb_build_object('name', NEW.name, 'phone', NEW.phone, 'village', NEW.village, 'assistance_type', NEW.assistance_type)
    RETURNING id INTO consumed;
  IF consumed IS NULL THEN RAISE EXCEPTION 'Verified submission permit required'; END IF;
  IF (SELECT count(*) FROM public.assistance_requests WHERE phone = NEW.phone AND created_at > now() - interval '1 hour') >= 3 THEN
    RAISE EXCEPTION 'Submission limit reached';
  END IF;
  NEW.submission_token := NULL;
  NEW.created_at := now();
  NEW.consent_at := now();
  NEW.status := 'new';
  NEW.staff_notes := NULL;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.validate_assistance_submission() FROM PUBLIC;
DROP TRIGGER IF EXISTS validate_assistance_submission ON public.assistance_requests;
CREATE TRIGGER validate_assistance_submission BEFORE INSERT ON public.assistance_requests FOR EACH ROW EXECUTE FUNCTION public.validate_assistance_submission();

CREATE TABLE IF NOT EXISTS public.donations (
  id uuid PRIMARY KEY,
  token_hash text NOT NULL CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 255),
  phone text NOT NULL CHECK (phone ~ '^([+]91[ ]?)?[6-9][0-9]{9}$'),
  amount_paise integer NOT NULL CHECK (amount_paise BETWEEN 100 AND 1000000000),
  mode text NOT NULL CHECK (mode IN ('test','live')),
  order_id text UNIQUE,
  payment_id text UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','captured','partially_refunded','refunded')),
  amount_refunded integer NOT NULL DEFAULT 0 CHECK (amount_refunded >= 0 AND amount_refunded <= amount_paise),
  created_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz
);
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.donations FROM anon, authenticated;
GRANT ALL ON public.donations TO service_role;
CREATE INDEX IF NOT EXISTS donations_phone_created_idx ON public.donations(phone, created_at);
CREATE OR REPLACE FUNCTION public.limit_donation_orders() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('donation:' || right(regexp_replace(NEW.phone, '[^0-9]', '', 'g'), 10), 0));
  IF (SELECT count(*) FROM public.donations WHERE right(regexp_replace(phone, '[^0-9]', '', 'g'), 10) = right(regexp_replace(NEW.phone, '[^0-9]', '', 'g'), 10) AND created_at > now() - interval '1 hour') >= 5 THEN
    RAISE EXCEPTION 'Checkout limit reached';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.limit_donation_orders() FROM PUBLIC;
DROP TRIGGER IF EXISTS limit_donation_orders ON public.donations;
CREATE TRIGGER limit_donation_orders BEFORE INSERT ON public.donations FOR EACH ROW EXECUTE FUNCTION public.limit_donation_orders();

-- Idempotent, monotonic updates: duplicate/late webhooks cannot undo a refund.
CREATE OR REPLACE FUNCTION public.record_verified_payment(donation_id uuid, provider_payment_id text, refunded_paise integer)
RETURNS jsonb LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE row_data public.donations;
BEGIN
  SELECT * INTO STRICT row_data FROM public.donations WHERE id = donation_id FOR UPDATE;
  IF row_data.payment_id IS NOT NULL AND row_data.payment_id <> provider_payment_id THEN RAISE EXCEPTION 'Payment mismatch'; END IF;
  IF refunded_paise < 0 OR refunded_paise > row_data.amount_paise THEN RAISE EXCEPTION 'Refund mismatch'; END IF;
  UPDATE public.donations SET payment_id = provider_payment_id,
    amount_refunded = greatest(amount_refunded, refunded_paise),
    status = CASE WHEN greatest(amount_refunded, refunded_paise) >= amount_paise THEN 'refunded'
                  WHEN greatest(amount_refunded, refunded_paise) > 0 THEN 'partially_refunded' ELSE 'captured' END,
    verified_at = now()
    WHERE id = donation_id RETURNING * INTO row_data;
  RETURN to_jsonb(row_data);
END $$;
REVOKE ALL ON FUNCTION public.record_verified_payment(uuid, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_verified_payment(uuid, text, integer) TO service_role;
COMMIT;
