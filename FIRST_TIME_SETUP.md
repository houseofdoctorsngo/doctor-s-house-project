# Railway setup: Supabase, Turnstile and Cashfree

Updated 16 November 2026. This replaces the old Razorpay/temporary-branch instructions.

Your existing Railway service deploys `main` from [houseofdoctorsngo/doctor-s-house-project](https://github.com/houseofdoctorsngo/doctor-s-house-project). Reuse your existing Supabase project and Cloudflare Turnstile widget. Do not create another database or Railway service.

The audit observed `https://thehouseofdoctor.in` redirecting to **https://www.thehouseofdoctor.in**. This guide therefore uses the **www** hostname consistently. If you intentionally change the canonical hostname later, change both site variables, Turnstile allowed hosts and Cashfree domain/webhook configuration together.

## 1. Update your existing Supabase schema

1. Open your project at [Supabase Dashboard](https://supabase.com/dashboard).
2. If any records exist, export the three public tables and verify the export before applying changes. Retain a database backup according to your plan; do not place exports in Git.
3. Open **SQL Editor > New query**. Paste and run the complete current [supabase/production.sql](supabase/production.sql), including `BEGIN` and `COMMIT`.
4. This script can be reapplied. It preserves rows, adds Cashfree provider identification and private staff tracking fields, and adds Patient support / Other request types. Existing donation rows remain labelled `razorpay`; new website donations explicitly use `cashfree`.
5. Run [supabase/verify-setup.sql](supabase/verify-setup.sql). Expect **PASS**. Stop on any SQL error; do not disable RLS.
6. In **Table Editor > public**, expect `assistance_requests`, `donations`, `submission_permits`.
7. Copy the **project HTTPS URL**, **publishable key** (`sb_publishable_...`) and **secret key** (`sb_secret_...`) from the project's Connect/API Keys settings. All three must belong to the same project. The database password is not an API key.

Keep the Data API enabled for `public`. No public SELECT policy, Supabase Auth login, Edge Function, storage bucket, SMTP service or database connection URL is required by this release.

## 2. Confirm Cloudflare Turnstile

Open your existing widget at [Cloudflare Dashboard](https://dash.cloudflare.com/). Use Managed mode and add `www.thehouseofdoctor.in` to its allowed hostnames. You may also retain `thehouseofdoctor.in` and your Railway hostname, but website POSTs must originate on the canonical origin configured below. Keep pre-clearance off unless you have separately configured a need for it.

Copy the widget sitekey and secret. Creating a Cloudflare account alone is insufficient: this application specifically uses **Turnstile**, not a generic Cloudflare API token. It does not require Cloudflare DNS proxying, Workers or R2.

## 3. Add Railway variables

Open **Railway project > application service > Variables > Raw Editor**. Paste this template, replace the placeholder values privately, save and deploy. Values have no surrounding quotes. Do not leave `REPLACE_...` text as a credential.

```dotenv
SITE_URL=https://www.thehouseofdoctor.in
VITE_SITE_URL=https://www.thehouseofdoctor.in
SUPABASE_URL=https://REPLACE_PROJECT_REF.supabase.co
SUPABASE_PUBLISHABLE_KEY=REPLACE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY=REPLACE_SECRET_KEY
TURNSTILE_SITE_KEY=REPLACE_TURNSTILE_SITEKEY
TURNSTILE_SECRET_KEY=REPLACE_TURNSTILE_SECRET
PAYMENTS_MODE=disabled
CASHFREE_ENV=sandbox
```

| Variable | Where it comes from | Exposure / purpose |
| --- | --- | --- |
| `SITE_URL` | Final public origin above | Server checks incoming form origin and constructs payment return URL |
| `VITE_SITE_URL` | Same final public origin | Public, build-time canonical/social metadata; rebuild after changing |
| `SUPABASE_URL` | Supabase project URL | Runtime server database target |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase API Keys | Used by server for insert-only public role |
| `SUPABASE_SECRET_KEY` | Supabase API Keys | Private server access; never prefix with `VITE_` |
| `TURNSTILE_SITE_KEY` | Existing Turnstile widget | Public widget key |
| `TURNSTILE_SECRET_KEY` | Same widget | Private verification key |
| `PAYMENTS_MODE` | Your operating choice | `disabled`, `test` or `live` |
| `CASHFREE_ENV` | Your Cashfree key environment | `sandbox` for test, `production` for live |
| `CASHFREE_APP_ID` | Cashfree Payment Gateway API credentials | Server only; add in step 5 |
| `CASHFREE_SECRET_KEY` | Same Cashfree credential pair | Private API and webhook verification secret |

Legacy `SUPABASE_SERVICE_ROLE_KEY` is supported instead of `SUPABASE_SECRET_KEY`, but do not set both. Remove obsolete `RAZORPAY_*` variables after recording any legacy-payment reconciliation arrangements. No separate Cashfree webhook secret is needed: Cashfree signs with the PG secret key.

Leave `PORT` to Railway and `NODE_ENV=production` / `HOST=0.0.0.0` to the Dockerfile. Do not add `VITE_` versions of private keys. `.env` files on your laptop are not automatically deployed.

## 4. Validate assistance before payments

1. In Railway **Settings > Source**, confirm repository and branch **main**, root directory repository root, and Dockerfile build. Leave custom build/start commands empty; runtime is `node .output/server/index.mjs`.
2. Confirm `/api/health` is the healthcheck. Save/deploy staged variables. Check deployment commit and build/runtime logs.
3. Visit [health](https://www.thehouseofdoctor.in/api/health): `{"status":"ok"}` means only that the server runs.
4. Visit [public configuration](https://www.thehouseofdoctor.in/api/config): expect `assistanceEnabled: true`, `paymentsMode: "disabled"`, and your public Turnstile sitekey. This checks configuration, not remote connectivity.
5. Submit one clearly labelled test request with an NGO-controlled phone number and no patient information. Complete Turnstile and consent yourself.
6. Copy the success UUID. Find it in **Supabase > Table Editor > assistance_requests**. Confirm `status=new`, consent timestamp and expected details. Set `assigned_to`, then close the test with a note.
7. If saving fails, check SQL PASS, matching keys, Turnstile hostname/action and Railway logs. The form permits three requests per phone per hour. Creating an account or passing healthcheck alone does not enable submissions.

## 5. Configure Cashfree sandbox

1. Open the NGO's authorised [Cashfree Merchant Dashboard](https://merchant.cashfree.com). Select Payment Gateway and sandbox/test environment. Complete whatever onboarding Cashfree requires for your organisation.
2. Under Developers/API Keys, generate or obtain the sandbox **App ID** and **Secret Key**. Use PG credentials, not Payouts credentials.
3. Add `CASHFREE_APP_ID` and `CASHFREE_SECRET_KEY` to Railway. Keep `CASHFREE_ENV=sandbox` and `PAYMENTS_MODE=disabled`, then deploy.
4. Whitelist/approve `https://www.thehouseofdoctor.in` under Cashfree website/domain settings as required for hosted checkout. Use the real organisation details and policies; Cashfree controls approval.
5. Under **Payment Gateway > Developers > Webhooks**, add this endpoint exactly:

   `https://www.thehouseofdoctor.in/api/payments/webhook`

6. Choose webhook version **2025-01-01** (the documented version with idempotency headers), and select **Success Payment**, **Failed Payment**, **User Dropped Payment** and **Refund**. Test the endpoint and save it. The REST integration separately pins API version `2026-01-01`.
7. The endpoint verifies `x-webhook-timestamp` plus the exact raw body against `x-webhook-signature` using the PG secret. Do not configure an unrelated custom secret. Dashboard test events are acknowledged after signature verification; this alone is not a donation test. GET in a browser returns 405 by design.
8. Keep ordinary automatic payment capture enabled; do not enable preauthorisation/manual capture or customer surcharges for this donation flow. The website accepts only an exact matching INR donation, a PAID order and a successful captured payment.
9. Set `PAYMENTS_MODE=test` and deploy. `/api/config` must show `test`, and the page must show a test-mode notice.
10. Make a sandbox checkout using Cashfree's current official test methods. Confirm the same `order_id` in Cashfree and Supabase, `provider=cashfree`, `mode=test`, `status=captured` and the expected amount in paise (INR x 100).
11. Confirm successful webhook delivery in Cashfree Logs. Test cancellation, failed/pending payment, refresh, retry, refund and duplicate webhook cases in [VALIDATION.md](VALIDATION.md).
12. A downloaded acknowledgement must say **TEST PAYMENT - NO MONEY RECEIVED**. It is not an official donation receipt or tax certificate.

Checkout uses Cashfree-hosted payment fields. The website does not collect card details or UPI PINs. A browser success message cannot mark a donation paid: the server checks Cashfree and updates Supabase.

Interrupted orders retain a random access token in the same browser tab's session storage. **Check payment status** recovers the existing session. If creation never reached Cashfree, **Retry this order** verifies the visitor and retries the same stored order ID/idempotency key. It does not create a second donation. If the tab/session is lost, staff reconcile using the reference; there is no public phone-based lookup.

## 6. Live activation

1. Finish Cashfree merchant approval, bank/settlement setup and domain approval. Confirm NGO identity, current service availability, privacy/refund wording, finance ownership and receipt procedure.
2. Set `PAYMENTS_MODE=disabled` during cutover. Retain test evidence; do not delete test or financial rows.
3. Replace both Cashfree credentials with the production pair and set `CASHFREE_ENV=production`. Configure the production webhook at the final www endpoint with the same event selections.
4. Disable the sandbox webhook to this production deployment or send it to a separate staging deployment that retains sandbox credentials. One deployed service uses one environment at a time; old test references cannot be verified with live credentials.
5. Set `PAYMENTS_MODE=live` and deploy. Check `/api/config`, then have the authorised owner make a small real donation and reconcile provider success, Supabase, webhook delivery and bank settlement.
6. Record `settled_at` and `settlement_reference` only after finance verifies the actual settlement. Issue and record the official receipt using your approved accounting process. No automatic 80G certificate is implemented.
7. To pause new donations later, change **only** `PAYMENTS_MODE=disabled`; retain Cashfree environment/keys and Supabase keys so existing status checks and webhooks still work.

## 7. Daily operation and media

Read [OPERATIONS.md](OPERATIONS.md) for who reviews each channel, request filters, finance reconciliation and incident handling. There is no website `/admin` page and no automatic email/SMS alert integration; assign a dashboard-monitoring rota before enabling the form. Supabase and Cashfree dashboards are the private operator tools.

Read [MEDIA_GUIDE.md](MEDIA_GUIDE.md) for the five owner-supplied field photos and video added on 16 November 2026, and for future media additions. Annual reports and the partnership proposal remain email-request links until approved documents exist.

Enable Railway **Wait for CI** after the GitHub Actions workflow passes. Railway code rollback does not roll back database records. Stop conflicting Lovable publishing after cutover; never force-push connected Git history.

## Official references

- [Cashfree hosted web checkout and domain setup](https://www.cashfree.com/docs/payments/online/web/redirect)
- [Cashfree API orders](https://www.cashfree.com/docs/api-reference/payments/latest/orders/create-order)
- [Webhook configuration and logs](https://www.cashfree.com/docs/payments/online/webhooks/configure)
- [Webhook signature verification](https://www.cashfree.com/docs/payments/online/webhooks/signature-verification)
- [Payment verification](https://www.cashfree.com/docs/api-reference/payments/latest/payments/get-payments-for-an-order)
- [Refund verification](https://www.cashfree.com/docs/api-reference/payments/latest/refunds/get-all-refunds-for-an-order)
- [Railway Dockerfile variables](https://docs.railway.com/builds/dockerfiles)
- [Railway Wait for CI](https://docs.railway.com/deployments/github-autodeploys)

Dashboard labels may change; follow the provider's current interface. Keep all actual keys out of source control, chat and screenshots.
