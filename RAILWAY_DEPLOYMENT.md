# Host The House of Doctor on Railway

This is a React + TanStack Start application with a Node/Nitro server. Railway hosts the application. **Keep Supabase for the database**: the existing assistance workflow relies on PostgreSQL row-level security. Adding Railway PostgreSQL or MongoDB is unnecessary for this version.

The public Lovable URL currently shows an older site than this repository. Deploying this repository will publish the newer compact design, plus the fixes described in PRODUCTION_REVIEW.md.

## 1. Local checkout and prerequisites

The working copy is at `C:\doc_sin\doctor-s-house-project`, on `production/railway-readiness`.

Use a current Node 22 LTS release (22.23.4 or newer Node 22) and npm 12. The older installed npm 10.9.2 fails on this dependency tree. The Docker build uses Node 22 and the npm version specified in the Dockerfile.

After installing a compatible Node release, run `npm install -g npm@12.2.2` to select the npm version used by CI and Docker. Do not copy the `node_modules` directory to Railway; its Linux dependencies must be installed during the build.

```powershell
cd C:\doc_sin\doctor-s-house-project
npm ci
Copy-Item .env.example .env.local
# Fill .env.local with staging values using your editor.
npm run typecheck
npm test
npm run build
npm run test:production
npm run dev
```

Open `http://localhost:3000`. Set both SITE_URL and VITE_SITE_URL to this exact origin locally. Do not put production secrets in chat, source files, or GitHub. `.env` and `.env.local` are ignored. The old repository already contained a tracked `.env`; it is removed from the new tracked tree, but remains in old Git history. Review the historical values and rotate any private credential if it was exposed. Public Supabase keys are not admin credentials.

## 2. Prepare Supabase

1. Sign in to [Supabase](https://supabase.com/dashboard). If you control the existing Lovable-connected Supabase project and can retrieve its settings, you can retain it. Otherwise create a new project and keep the old database intact until any existing requests are safely migrated. Source code alone does not export live data.
2. Take a backup of any existing database. Use a separate staging project first.
3. Open SQL Editor. Paste and run all of `supabase/production.sql`. It creates or extends the assistance table without deleting existing records, creates private donation records and one-use submission permits, and installs validation and permissions. Do not run `drizzle push`: the old generated Drizzle schema is empty.
4. In the project settings, copy the project URL, publishable (or legacy anon) key, and **server-only service-role/secret key**. Put them in Railway Variables using the names below. Do not use `VITE_` for secret keys.
5. Check that anonymous and authenticated users cannot read, update or delete assistance rows, and cannot access donation/permit rows. The SQL test file describes and tests the expected permissions. Assistance INSERT is permitted only for allowed fields and with a short-lived permit issued after server verification.
6. Staff use the authenticated **Supabase Dashboard**, with individual accounts and MFA. No public website admin account is created. In Table Editor, filter `assistance_requests` by `status = new`, contact the person, then move through `contacted`, `in_progress`, and `closed`. Keep staff notes brief; do not add medical records to this general enquiry system.
7. Nominate an operator to review the dashboard regularly. The website does not send email/SMS alerts or promise a response time. Email/WhatsApp links open the visitor's own application.

The server verifies forms with Turnstile, creates a two-minute permit tied to the exact request data, and inserts using the public role. A database trigger consumes that permit and limits each phone to three requests per hour. Anonymous callers cannot generate permits or set staff status/notes.

## 3. Prepare Railway and the domain

1. Commit and push this branch to GitHub using an account with write access:

```powershell
git status
git add .
git commit -m "Prepare House of Doctor for Railway production hosting"
git push -u origin production/railway-readiness
```

If Git reports nothing to commit, continue to the push. The connected GitHub integration in this session has read access only; no changes have been pushed automatically. Review the branch before merging into `main`. Do not force-push or rewrite Lovable's published history.

2. At [Railway](https://railway.com), choose New Project → Deploy from GitHub repo → `houseofdoctorsngo/doctor-s-house-project`. Authorise the repository if it is not listed.
3. Select the `production/railway-readiness` branch while testing. The repository root is the service root. Railway detects the Dockerfile. Leave custom build and start overrides blank: the Dockerfile builds the app and starts `.output/server/index.mjs`.
4. In Networking, generate a Railway domain. Initial deployment may show the informational site with forms disabled until variables are configured. `/api/health` checks server liveness; it does not prove database or payment credentials work.
5. Set SITE_URL and VITE_SITE_URL to the final HTTPS origin, e.g. `https://your-service.up.railway.app` (no path). VITE_SITE_URL is a build argument for canonical SEO metadata. Redeploy after changing it.
6. For a custom domain, add it in Railway Networking, then add the exact DNS records Railway shows at your DNS provider. Wait for certificate and domain validation. Change both URL variables to that origin and redeploy. Pick one canonical origin; redirect alternate domains at your DNS/proxy provider. Forms deliberately reject requests from a different origin.

## 4. Turnstile verification

1. In [Cloudflare Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile), create a widget for the Railway domain and your custom domain. A Cloudflare-hosted domain is not required.
2. Choose a managed widget. Add only the hostnames you actually use. Copy its site key and secret key to Railway.
3. Set TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY. Keep the secret server-side.
4. The server checks token success, action (`assistance` or `donation`) and exact hostname. Production forms are disabled if verification is not configured. Locally, both keys can be left empty for development; never use that as a production configuration.

## 5. Railway variables

| Variable | Value / purpose |
| --- | --- |
| `SITE_URL` | Exact public HTTPS origin; server checks form origins and verification hostname. |
| `VITE_SITE_URL` | Same origin, available during Docker build; changing it requires rebuild. |
| `SUPABASE_URL` | Supabase project URL. |
| `SUPABASE_PUBLISHABLE_KEY` | Public/anon key, used by server for insert-only assistance writes. |
| `SUPABASE_SERVICE_ROLE_KEY` | Private service-role/secret key; never expose to browser. |
| `TURNSTILE_SITE_KEY` | Public widget key. |
| `TURNSTILE_SECRET_KEY` | Private verification secret. |
| `PAYMENTS_MODE` | `disabled` initially, then `test`, finally `live` after acceptance checks. |
| `RAZORPAY_KEY_ID` | `rzp_test_...` or `rzp_live_...`, matching PAYMENTS_MODE. |
| `RAZORPAY_KEY_SECRET` | Private Razorpay API secret. |
| `RAZORPAY_WEBHOOK_SECRET` | Separate random webhook signing secret, also entered in Razorpay. |

NODE_ENV and HOST are set in the container. Railway supplies PORT. Do not add a database volume to the app service; records live in Supabase. The server does not need writable local storage.

## 6. Razorpay activation and test checkout

1. Use an NGO-owned [Razorpay](https://dashboard.razorpay.com) account. Complete the provider's merchant/NGO eligibility and verification requirements. The code cannot approve an account or establish eligibility to collect donations.
2. Generate **test** API keys. Set PAYMENTS_MODE=test and the matching test credentials in Railway.
3. In Razorpay payment-capture settings, enable automatic capture for the intended account. Authorised-only payments are not shown as verified payments by this site.
4. Add a webhook to `https://YOUR-DOMAIN/api/payments/webhook`. Subscribe to `payment.captured`, `order.paid`, and `refund.processed`. Use the same secret as RAZORPAY_WEBHOOK_SECRET. Configure test and live webhooks in their respective provider modes.
5. Redeploy. Open the donation section and confirm the **Test mode** notice appears. Use provider-documented test payment details inside the provider checkout. Do not use real card data in tests.
6. Verify success, cancellation, failure, browser refresh, interrupted verification, duplicate webhook delivery and refund handling. Inspect the corresponding `donations` row in Supabase and the order/payment in Razorpay. A successful test must show `captured`, with the correct order, payment and amount. A refund must never revert to captured when an older event is replayed.
7. Confirm PDF downloads are **TEST PAYMENT — NO MONEY RECEIVED** in test mode. Payment acknowledgements are generated on demand from freshly checked server status; no email receipt is sent automatically.
8. After NGO approval, replace test keys with live keys, set PAYMENTS_MODE=live, configure the live webhook, and redeploy. Clear old test checkout sessions. Test records remain labelled `test` in the database; exclude them from actual totals. Never mix test and live keys within an ongoing checkout.
9. Have an authorised owner perform a small real payment and reconcile it in the provider dashboard before public launch. Only the owner should authorise actual money movement/refunds.

The server creates orders, verifies HMAC signatures using the stored order ID, fetches provider payment state, checks amount/currency/order, and stores idempotent results. Webhooks are validated against their raw request body. Browser redirects alone do not mark money received.

**Official receipts:** The download is a payment acknowledgement, not a settled donation receipt or 80G certificate. An authorised operator must reconcile settlement and issue the NGO's official receipt. Add no tax-exemption claims without verified documentation. If automatic official receipts are required, supply the NGO's legal receipt template, approval details and settlement process before extending this workflow.

## 7. Content and operational launch checks

- Confirm the exact NGO legal name, registration claims, address, helpline hours, free-ambulance availability, hospital affiliation, and policy wording with the organisation. Existing claims are inherited from the supplied repository, not independently verified.
- The local logo comes from the public website you supplied. Add approved event photographs to `public/images/camps/` and entries to `src/lib/gallery.ts`. Include meaningful alt text and credits; use consent for identifiable people. Until then, the gallery shows an honest informational empty state.
- Annual report and partnership proposal buttons request documents by email. Upload official PDFs and change those links only when the approved documents exist. The health-awareness guide is general educational content; have a clinician approve it before publication.
- Review retention periods and access privileges with the NGO. Establish scheduled deletion of unnecessary assistance records and expired permit rows, and a financial-record retention process. Back up Supabase and rehearse restore. Do not treat Railway deployment rollback as a database rollback.
- Open the deployed site on mobile and desktop. Test all navigation, policy links, search, contact links, guide download and form validation. Submit a clearly marked staging assistance request; verify it is visible only to staff. Check direct anonymous SELECT/UPDATE/DELETE denial.
- Confirm no `.env` files or service keys are present in the built client assets or commit. Check provider/domain logs for errors. Restrict staff dashboard access and enable MFA.

Run the included read-only smoke check after deployment:

```powershell
node scripts/check-production.mjs https://YOUR-DOMAIN
```

This checks SSR, the logo, health and public configuration without creating patient or payment data. It does not replace a staging form submission or provider checkout test.

## 8. Troubleshooting and recovery

| Symptom | What to check |
| --- | --- |
| Docker build fails | Use the committed package-lock.json; check build logs and Node/npm versions. Do not deploy a Vite preview server. |
| Site works but forms disabled | Verify Supabase variables and both Turnstile keys. Production intentionally fails closed. |
| Request origin not allowed | SITE_URL must equal the origin in the address bar, including HTTPS and hostname. |
| Verification fails | Widget hostname, SITE_URL, token expiry, and matching action; refresh verification. |
| Assistance could not be saved | Apply the full SQL file, check project/key pair, permit trigger and phone request limit. |
| Donations remain disabled | Check PAYMENTS_MODE, matching key prefix, webhook secret, database variables and Turnstile configuration. |
| Debited but pending | Use Check payment status; inspect Razorpay capture and webhook delivery. Do not ask the donor to pay twice. |
| Checkout response was lost | Use Check payment status with the saved browser reference. If the server already stored the provider order, the same checkout can be resumed without creating another order. An authorised payment awaiting capture does not offer Resume. |
| Order creation unresolved | Gateway timeout can leave a reserved donation without an order ID. Search Razorpay Orders by the donation UUID in `receipt`/notes. An authorised operator can attach the verified matching order ID in Supabase after checking amount and mode. If there is no order, tell the donor to clear the unpaid checkout. Never infer payment success from a screenshot. |
| Old test checkout fails after going live | Clear the test browser session and use a new checkout. Test and live credentials are separate. |
| Gallery has no photos | Add real approved local assets; the old `/__l5e/` asset URLs are not portable. |

To pause new donations, set PAYMENTS_MODE=disabled and redeploy. Keep existing keys/webhook configuration until outstanding payments and refunds are reconciled. Existing payment status/verification and webhooks continue with matching credentials; checkout recovery does not offer Resume while paused. To roll back the site, redeploy the previous known-good Railway deployment; preserve database records and reconcile any events that arrived during the incident.

Before launch, also simulate a lost order response, then recover the same order using Check payment status. Confirm Resume is absent while a payment awaits capture, that checkout controls remain disabled while the provider modal is open, and that paused donations still allow status checks. Keep test and live acceptance records separate.

## References

- https://railway.com/guides/tanstack-start
- https://tanstack.com/start/latest/docs/framework/react/guide/hosting
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps
- https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
