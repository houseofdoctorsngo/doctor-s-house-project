-- Run in Supabase SQL Editor AFTER production.sql. Reads schema/permissions only.
-- Success ends with one row: setup_status = PASS. Any exception means stop launch.
DO $$
DECLARE tbl text; actor text; col text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['assistance_requests','donations','submission_permits'] LOOP
    IF to_regclass('public.' || tbl) IS NULL THEN RAISE EXCEPTION 'Missing table: %', tbl; END IF;
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = to_regclass('public.' || tbl)) THEN
      RAISE EXCEPTION 'RLS disabled: %', tbl;
    END IF;
    FOREACH actor IN ARRAY ARRAY['anon','authenticated'] LOOP
      IF has_any_column_privilege(actor, 'public.' || tbl, 'SELECT,UPDATE') OR has_table_privilege(actor, 'public.' || tbl, 'DELETE,TRUNCATE,REFERENCES,TRIGGER') THEN
        RAISE EXCEPTION 'Unsafe visitor permission: % on %', actor, tbl;
      END IF;
      IF tbl <> 'assistance_requests' AND has_any_column_privilege(actor, 'public.' || tbl, 'INSERT') THEN
        RAISE EXCEPTION 'Unsafe visitor insert: % on %', actor, tbl;
      END IF;
    END LOOP;
    IF NOT has_table_privilege('service_role', 'public.' || tbl, 'SELECT') OR NOT has_table_privilege('service_role', 'public.' || tbl, 'INSERT') THEN
      RAISE EXCEPTION 'Missing server permissions: %', tbl;
    END IF;
  END LOOP;
  FOREACH actor IN ARRAY ARRAY['anon','authenticated'] LOOP
    FOREACH col IN ARRAY ARRAY['id','name','phone','village','assistance_type','submission_token'] LOOP
      IF NOT has_column_privilege(actor, 'public.assistance_requests', col, 'INSERT') THEN
        RAISE EXCEPTION 'Missing permitted input: % for %', col, actor;
      END IF;
    END LOOP;
    FOREACH col IN ARRAY ARRAY['status','staff_notes','created_at','consent_at'] LOOP
      IF has_column_privilege(actor, 'public.assistance_requests', col, 'INSERT') THEN
        RAISE EXCEPTION 'Visitor can set protected field: % for %', col, actor;
      END IF;
    END LOOP;
    IF has_function_privilege(actor, 'public.record_verified_payment(uuid,text,integer)', 'EXECUTE') THEN
      RAISE EXCEPTION 'Visitor can record payments: %', actor;
    END IF;
  END LOOP;
  IF NOT has_function_privilege('service_role', 'public.record_verified_payment(uuid,text,integer)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Missing payment server permission';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid='public.assistance_requests'::regclass AND tgname='validate_assistance_submission' AND tgenabled IN ('O','A')) THEN
    RAISE EXCEPTION 'Assistance verification trigger missing or disabled';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid='public.donations'::regclass AND tgname='limit_donation_orders' AND tgenabled IN ('O','A')) THEN
    RAISE EXCEPTION 'Donation limit trigger missing or disabled';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='assistance_requests' AND cmd='INSERT') THEN
    RAISE EXCEPTION 'Assistance insert policy missing';
  END IF;
END $$;
SELECT 'PASS' AS setup_status, 'Schema and visitor permissions verified. Still test the website with your project keys.' AS next_step;
