# Staff operations: requests, donations and follow-up

Updated 16 November 2026. This is the operating procedure for the implemented release. Assign real people to the roles before enabling forms. The review cadence below is a proposed internal rota, not a promise that someone is already on duty.

## Where each request goes

| Visitor action | Destination | Responsible role | Completion evidence |
| --- | --- | --- | --- |
| Send assistance request | Supabase > Table Editor > public > assistance_requests | Duty coordinator | UUID, assigned owner, status and follow-up notes |
| Call helpline / ambulance | `+91 75689 68704` | Person holding the NGO phone | Call answered and next action agreed |
| Contact on WhatsApp | WhatsApp for the same number | Duty coordinator | Conversation assigned and followed up |
| Email / partnership / impact-report request | `houseofdoctorsngo@gmail.com` via visitor's mail app | NGO office / partnerships lead | Email received and reply tracked |
| Donation | Cashfree Payment Gateway + Supabase donations | Finance lead | Verified payment, refund and settlement reconciliation |
| Refund / uncertain debit question | Phone or email, with donation/order/payment reference | Finance lead | Provider record checked; decision and reference recorded |
| Download health guide | PDF generated in visitor's browser | Content owner | File downloads; no inbox entry |
| View media | Public gallery | Media owner | Approved image/video, caption and consent record |

A mailto click does not send an email automatically; the visitor must send it from their email app. WhatsApp is an external conversation, not a website live-chat bot. Neither channel automatically creates a Supabase row. No email/SMS alert delivery is currently implemented. Do not assume submission success has notified a phone.

## Assistance queue

1. Sign in to [Supabase Dashboard](https://supabase.com/dashboard) with an individually authorised account and MFA. Open the correct project, **Table Editor**, **public.assistance_requests**. Do not share a service-role key with staff or expose a public table view.
2. Start each shift with `status = new`, oldest first. Check overdue open items using `follow_up_at` and review `in_progress` items at handover.
3. Put the responsible staff name/initials in `assigned_to`. Use `staff_notes` for a concise dated action log and `follow_up_at` for the next agreed contact time. Enter timezone explicitly when working in SQL; the database stores timestamptz.
4. Call the requester. Change status to `contacted` after reaching them, `in_progress` when coordination has started, and `closed` when the action or referral is complete. For unanswered calls, record the attempt and next retry; do not mark care delivered.
5. The form is not emergency dispatch. Urgent callers should speak to the helpline directly; only the duty team/clinician confirms ambulance availability, appointment or clinical action. Avoid putting medical records or identity documents in this general queue.
6. Close labelled QA requests after checking them. Retain operational and finance records according to the NGO's approved retention process.

Suggested rota: check at opening, at least hourly during staffed hours, and at handover; nominate a backup for absence. Have clinical leadership define urgent-call coverage and escalation. Until the rota is staffed, keep the website's warning that online forms are not monitored continuously. Do not publish a guaranteed 24-hour form response based on the old Lovable copy.

## Donation visibility and accounting

Open **Supabase > Table Editor > public.donations** for the website ledger and **Cashfree Merchant Dashboard > Payment Gateway** for payments, refunds, settlements and disputes. Use `order_id` (starts `thd_`) and `payment_id` (`cf_payment_id`) to match records.

| Field / status | Meaning |
| --- | --- |
| `provider` | New rows: cashfree. Legacy rows: razorpay; reconcile those in their original gateway |
| `mode=test` | Simulated transaction; exclude from all real-income totals |
| `amount_paise` | Requested donation in paise; divide by 100 for INR |
| `pending` | Website has not verified successful captured payment; may be unattempted, failed, processing or unresolved |
| `captured` | Cashfree payment and order verified; not proof of bank settlement |
| `partially_refunded` / `refunded` | Verified successful refund amount; late events cannot undo recorded refunds |
| `amount_refunded` | Successful refunded paise, not pending refund requests |
| `verified_at` | Last verified payment/refund update |
| `settled_at`, `settlement_reference` | Staff records after checking provider settlement and bank statement |
| `receipt_reference` | Staff's approved accounting receipt reference |
| `staff_notes` | Dated reconciliation/refund/dispute notes, minimal necessary information |

Daily finance procedure:

1. Filter Supabase to `provider=cashfree`, `mode=live`. Review new rows, unresolved pending rows, refunds and webhook failures. Compare the same time window in Cashfree; account for UTC/IST when filtering dates.
2. Match order ID, payment ID, INR amount and status. A screenshot or client callback is not proof of payment. Never edit `status`, `payment_id` or refund totals simply to make them look paid.
3. Match provider settlement records to the bank statement. Gross donations minus refunds differ from bank credits because of gateway fees/taxes and settlement timing. Record the actual settlement reference and date; investigate differences.
4. Issue official receipts only after the NGO's finance checks. The website PDF is a payment acknowledgement, including test/refund labels, not a tax certificate. Record the receipt reference. Do not promise 80G eligibility without approved evidence and process.
5. Monitor disputes/chargebacks and their provider deadlines in Cashfree. Order-linked auto-refund events trigger reconciliation; auto-refunds without an order must be checked in Cashfree. This release does not ingest dispute or settlement webhooks; finance must handle them in the provider dashboard and annotate the ledger.

Use [supabase/operations.sql](supabase/operations.sql) for read-only queue/finance summaries in the private SQL Editor. It creates no views or public API access. Protect any exported patient/donor details; do not commit or share them publicly.

## Exceptions and escalation

| Situation | Action |
| --- | --- |
| Debited but website pending | Record reference; inspect Cashfree payment, order and webhook logs. Do not ask for another payment. Replay failed payment webhook or have donor check the existing checkout |
| Browser response lost | Same tab > Check payment status. Resume returns the same session; interrupted creation can use Retry this order with verification |
| Tab/session lost | Staff match reference in Cashfree and Supabase. There is no public phone/name lookup or unauthenticated receipt retrieval |
| Expired checkout | Confirm no debit/processing payment in Cashfree before the donor clears it and starts another |
| Wrong amount/currency/order | Stop; do not override database status. Finance and technical owner investigate |
| Approved refund | Authorised finance operator initiates it in Cashfree to the original payment method, records reason, then checks successful provider refund and database update. Refund creation is not automatic |
| Refund webhook exhausted | Confirm provider refund; donor status check re-verifies. Technical owner investigates authenticated reconciliation, preserving evidence rather than fabricating a callback |
| Failed webhooks | Check final www endpoint, environment/secret, SQL and logs; fix then resend. A GET 405 is normal |
| Forms unavailable | Use phone/email; technical owner checks variables, SQL PASS, Turnstile hostname and Railway logs |
| Payment incident | Set only PAYMENTS_MODE=disabled; keep keys for reconciliation. Assign an incident owner and retain order references |
| Old Razorpay record | Handle in the original provider; it is intentionally never sent to Cashfree |

## Roles and routine

| Role | Routine |
| --- | --- |
| Duty coordinator + backup | Assistance, phone, WhatsApp and handover; assign every open request |
| Finance lead + authorised backup | Daily live-payment/refund/settlement check; receipts and disputes |
| Office/partnerships lead | Monitor NGO email daily; fulfil impact report and partnership requests |
| Technical owner | GitHub Actions, Railway deployment/logs, provider failures, updates and restore tests |
| Media/content owner | Consent, captions, video transcripts, current service claims and official publications |

Enable individually scoped provider access and MFA according to available plans. Supabase dashboard access is privileged: give it only to trusted operators. There is no website staff login or granular custom role system in this release. If the team outgrows direct dashboards, a separately designed authenticated staff portal and a consent-aware notification service are follow-up work, not hidden capabilities of this site.

Keep verified backups and perform a restore exercise on an isolated project before relying on them. Railway rollback restores application code, not deleted or changed database records. Keep credentials in provider settings/password management, never in Git, client code or support messages.
