-- Read-only. Run in the PRIVATE Supabase SQL Editor as an authorised operator.
-- Does not create public views or grant any permission.
-- Oldest open requests, with staff assignment and follow-up.
SELECT id, created_at, name, phone, village, assistance_type, status, assigned_to, follow_up_at
FROM public.assistance_requests WHERE status <> 'closed'
ORDER BY created_at ASC;

-- Requests needing attention. These are counts, not a promised response SLA.
SELECT count(*) FILTER (WHERE status='new') AS new_queue,
       count(*) FILTER (WHERE status<>'closed' AND assigned_to IS NULL) AS missing_owner,
       count(*) FILTER (WHERE status<>'closed' AND follow_up_at < now()) AS overdue_followups
FROM public.assistance_requests;

-- Verified live Cashfree totals, gross and net of successful refunds, before gateway fees.
SELECT count(*) AS verified_donations,
       coalesce(sum(amount_paise),0)/100.0 AS gross_inr,
       coalesce(sum(amount_refunded),0)/100.0 AS refunded_inr,
       coalesce(sum(amount_paise-amount_refunded),0)/100.0 AS net_before_fees_inr
FROM public.donations
WHERE provider='cashfree' AND mode='live' AND status IN ('captured','partially_refunded','refunded');

-- Pending/unreconciled items. Age alone does not mean payment failed.
SELECT id, created_at, order_id, payment_id, amount_paise/100.0 AS amount_inr,
       amount_refunded/100.0 AS refund_inr, status, settled_at, settlement_reference, receipt_reference
FROM public.donations
WHERE provider='cashfree' AND mode='live'
  AND (status='pending' OR settled_at IS NULL OR receipt_reference IS NULL)
ORDER BY created_at ASC;
