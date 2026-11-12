# House of Doctor: first-time setup without PowerShell

Updated 12 November 2026. You have no previous database, so these steps create a new Supabase project. There is no old database to migrate. Follow the sections in order.

The completed source is at `C:\doc_sin\doctor-s-house-project`, branch `production/railway-readiness`. The connected GitHub app rejected uploading with HTTP 403; nothing has been pushed or deployed by this session. A public repository is readable without permission, but writing still requires authentication. Section 1 provides a graphical upload route.

Dashboard labels can move. Official references are linked at the end. Replace every `YOUR_...` placeholder with your own value.

## 1. Upload using GitHub Desktop

GitHub Desktop is already installed on this Windows computer.

1. Open **GitHub Desktop** from Start. On another computer, install it from https://desktop.github.com/.
2. Open **File > Options > Accounts** and sign in to GitHub.com as **houseofdoctorsngo**. Finish the browser sign-in.
3. Choose **File > Add local repository > Choose**.
4. Select **`C:\doc_sin\doctor-s-house-project`**, not its parent folder, and click **Add repository**. This is an existing Git repository with the completed commits; do not create another repository or overwrite it with the old main branch.
5. Select **Current branch > production/railway-readiness**.
6. Open **History** and confirm the preparation, checkout-recovery and latest first-time-setup commits are present. Changes should be empty unless you edited more files.
7. Under **Repository > Repository settings > Remote**, verify the URL is `https://github.com/houseofdoctorsngo/doctor-s-house-project.git`.
8. Click **Publish branch**, or **Push origin** if already published. Complete any authentication prompted by Desktop. Do not force-push.
9. Open https://github.com/houseofdoctorsngo/doctor-s-house-project in the browser and switch the branch dropdown to **production/railway-readiness**.
10. Confirm this guide, `Dockerfile`, `railway.json`, `supabase/production.sql` and `supabase/verify-setup.sql` are visible.
11. In **Actions**, open **Validate website** and wait for success. A local successful build does not replace the Linux CI check.

If Desktop rejects permission, check the signed-in account and remote URL. The account must own the repository or have write access. The ChatGPT GitHub connector and GitHub Desktop have separate authentication; Desktop can work even when the connector is read-only. Do not send passwords/tokens in chat.

You can deploy this branch directly. Do not merge to main until testing finishes and you have addressed Lovable sync in section 8.

## 2. Create the first Supabase database

1. Sign in at https://supabase.com/dashboard using an NGO-controlled account.
2. Select **New project**, then create/select your organisation if prompted.
3. Name it **house-of-doctor**. Generate a strong database password and save it privately. This password is not an API key; the website does not use `DATABASE_URL`.
4. Select an available region near your visitors, preferably India if offered. Review the plan/billing displayed before creating the project.
5. Click **Create new project** and wait until provisioning finishes.
6. Open **SQL Editor > New query**.
7. Open `C:\doc_sin\doctor-s-house-project\supabase\production.sql` in Notepad/editor. Copy the entire file, including `BEGIN;` and `COMMIT;`.
8. Paste it into the SQL Editor and click **Run**. It creates the tables, permissions, functions and triggers from scratch. Do not create tables manually first or run an old Drizzle migration.
9. If SQL returns an error, stop and retain the full error message. Do not disable RLS to bypass it.
10. Open a second query. Copy all of **`supabase/verify-setup.sql`**, paste and run. Expected result: **`setup_status = PASS`**. It checks the setup without creating patient/payment records.
11. Open **Table Editor**, schema **public**. Expect three empty tables:

| Table | Purpose | Visitor access |
| --- | --- | --- |
| `assistance_requests` | Contact requests, consent timestamp, private staff status/notes | Verified INSERT only; no read/update/delete |
| `donations` | Amount, provider IDs, test/live mode, payment/refund state | None |
| `submission_permits` | Short-lived permits bound to exact form data | None |

12. Open the project's **Connect** dialog and copy its HTTPS URL, such as `https://your-project-ref.supabase.co`. Do not copy a PostgreSQL connection string.
13. Open **Settings > API Keys** and copy/create a **publishable** key (`sb_publishable_...`).
14. Create/copy a **secret** key (`sb_secret_...`) for the website server. Keep it private; you will enter it as `SUPABASE_SECRET_KEY` in Railway.
15. Keep the Data API enabled and the `public` schema available to it. Keep RLS and the supplied grants enabled. Do not create public SELECT policies.
16. Save the URL and both keys privately. All three must belong to this same project.

For this new setup use `SUPABASE_SECRET_KEY`. The code also supports `SUPABASE_SERVICE_ROLE_KEY` for older installations; you do not need both. No `VITE_SUPABASE_*` variables, Supabase Auth users, SMTP, Edge Functions or storage buckets are required by the implemented workflows.

Initially use fictional test data. You may keep this verified project for launch and distinguish test donations by `mode`, or create a separate production project with the same SQL and replace all three Supabase variables together. Do not delete financial records merely to clean up the dashboard.

## 3. Create the Railway service and public domain

1. Sign in at https://railway.com/dashboard. Link the GitHub account that can access the repository. Review billing before provisioning.
2. Select **New Project > Deploy from GitHub repo**.
3. If the repo is absent, use Railway's GitHub-app configuration to allow this repository, then refresh the list.
4. Select **houseofdoctorsngo/doctor-s-house-project** and open its service tile.
5. Under **Settings > Source** (GitHub source settings), set the trigger/deployment branch to **production/railway-readiness**. An initial build of main may still be the old code.
6. Leave the root directory at the repository root. The included `Dockerfile`, `package.json` and `railway.json` are there.
7. Confirm Railway uses **Dockerfile**. Leave custom build/start overrides blank. The Dockerfile builds the app and starts `node .output/server/index.mjs`.
8. If main was initially deployed, deploy the latest commit of the correct branch. Inspect **Deployments > Build logs**.
9. The configured healthcheck is **`/api/health`**. The informational website can start before credentials are entered; forms stay disabled.
10. Open **Settings > Networking > Public Networking > Generate Domain**. Save the HTTPS URL and hostname.
11. Railway supplies `PORT`; the server listens on it and `0.0.0.0`. If asked for a target port, use the listening port shown by the deployment. Do not point traffic at a Vite development server.
12. Open **`https://YOUR-HOSTNAME/api/health`**. Expect `{"status":"ok"}`. This proves server liveness, not database/payment connectivity.

Create only this application service. You do not need Railway PostgreSQL, MongoDB, a disk volume, Firebase or another backend service. Supabase stores the records.

## 4. Configure Cloudflare Turnstile

1. Sign in at https://dash.cloudflare.com/ and open **Turnstile**. You do not need to move your DNS to Cloudflare.
2. Click **Add widget** and name it **House of Doctor website**.
3. Add your Railway hostname, such as `your-service.up.railway.app`. Use the hostname only, without `https://` or a path.
4. Select **Managed** mode. Leave optional pre-clearance off for this setup.
5. Click **Create**, then privately save the sitekey and secret key.
6. Add your custom domain's hostname later if you change domains.

Use real keys for the deployed hostname. Dummy test keys are not a replacement for the production hostname/action checks.

## 5. Set variables and test assistance

Open the Railway **application service > Variables**. Use **New Variable** or **Raw Editor**. Enter exact names and actual values without quotes or surrounding spaces:

| Variable | Value | Source |
| --- | --- | --- |
| `SITE_URL` | `https://YOUR-HOSTNAME`, no path/query | Railway public URL |
| `VITE_SITE_URL` | Identical HTTPS origin | Used when building SEO metadata |
| `SUPABASE_URL` | `https://YOUR-PROJECT.supabase.co` | Supabase Connect dialog |
| `SUPABASE_PUBLISHABLE_KEY` | Your `sb_publishable_...` value | Supabase Settings > API Keys |
| `SUPABASE_SECRET_KEY` | Your private `sb_secret_...` value | Supabase Settings > API Keys |
| `TURNSTILE_SITE_KEY` | Widget sitekey | Cloudflare Turnstile |
| `TURNSTILE_SECRET_KEY` | Private widget secret | Cloudflare Turnstile |
| `PAYMENTS_MODE` | `disabled` initially | Your selected operating mode |

1. Save/apply variables and click **Deploy** if Railway shows staged changes. `VITE_SITE_URL` requires a new build because it is a Docker build argument.
2. Leave `NODE_ENV` and `HOST` to the Dockerfile, and `PORT` to Railway.
3. Open **`https://YOUR-HOSTNAME/api/config`**. Expect `assistanceEnabled: true`, `paymentsMode: "disabled"` and your public widget key. Private keys must not appear.
4. Open the website's assistance form. Use clearly fictional details with a valid-format mobile number, complete verification, tick consent and submit.
5. Expect a success reference. In Supabase `assistance_requests`, find that UUID and confirm `status = new` and a populated `consent_at`.
6. Mark the test request `closed` after review.

Configuration checks presence/format, not remote connectivity. If it shows enabled but submission fails, check the matching project/key pair, SQL, Data API and Turnstile settings. The phone limit is three requests/hour. Patient records deliberately cannot be read by public visitors.

Put private keys only in Railway Variables. Do not add them to GitHub files, frontend fields, screenshots or chat.

## 6. Configure Razorpay test payments

The server and checkout code are already implemented. You do not need to install a Lovable payment plugin or paste a separate checkout snippet into the page.

1. Sign in at https://dashboard.razorpay.com with the NGO's authorised account. Complete organisation onboarding requested by Razorpay; it decides merchant/donation eligibility.
2. Select **Test Mode**.
3. Open **Account & Settings > Website and app settings > API Keys > Generate Key**.
4. Save the **Key ID** (`rzp_test_...`) and **Key Secret** privately. The secret may not be displayed again.
5. In Railway, add **`RAZORPAY_KEY_ID`** and **`RAZORPAY_KEY_SECRET`** with these test values. Keep payments disabled for now.
6. Generate a separate long random webhook secret in your password manager. Set **`RAZORPAY_WEBHOOK_SECRET`** in Railway to it. Do not use a sample secret.
7. Apply/deploy the variables before configuring event delivery.
8. Back in Razorpay Test Mode, open **Account & Settings > Website and app settings > Webhooks > Add New Webhook**.
9. Enter **`https://YOUR-HOSTNAME/api/payments/webhook`**. Use your Railway/final domain, not Supabase or the old Lovable URL.
10. Enter exactly the same webhook secret as step 6. If asked for an alert email, use a monitored NGO address.
11. Select **`payment.captured`**, **`order.paid`**, **`refund.processed`**, save and leave the webhook enabled.
12. As the Razorpay account owner, open **Account & Settings > Payment Capture**. Configure **Automatic Capture**, review its capture-window/refund settings and save the wizard if shown. An authorised payment is not yet captured; do not use manual capture without an operator process.
13. Set **`PAYMENTS_MODE=test`** in Railway and deploy.
14. Open `/api/config`: expect `paymentsMode: "test"`. The donation panel must show **Test mode**.
15. Fill fictional donor details, choose an amount, tick consent and complete the widget. The payment button should open Razorpay-hosted checkout.
16. Use current Razorpay test methods/details from the official integration guide below. Do not enter real card data for a simulated test. If offered, the test netbanking flow provides simulated success/failure choices.
17. After simulated success, check **Razorpay > Transactions > Payments** and the matching order. In Supabase `donations`, expect `mode = test`, `status = captured`, matching provider IDs and `amount_paise` equal to rupees times 100.
18. Inspect webhook deliveries in Razorpay: successful signed POST events should receive HTTP 200. Opening the webhook in a browser sends GET and returns 405; that is expected.
19. Download the acknowledgement. It must say **TEST PAYMENT - NO MONEY RECEIVED**. No official settled donation receipt or tax certificate is generated automatically.

Run this checklist before live activation:

| Scenario | Expected outcome |
| --- | --- |
| Simulated success | Captured state with correct amount/order/payment |
| Close checkout | Clear message, no false success |
| Simulated failure | No captured state; check status before retry |
| Refresh in the same browser tab | Reference remains; status recovers the existing order |
| Lost order response | Existing saved order can be recovered without creating another |
| Payment awaits capture | Pending warning; no Resume invitation |
| Provider modal open | Website checkout controls stay disabled |
| Duplicate/late webhook | No duplicate payment or reversal of an earlier refund |
| Test refund, where available | Partial/full refund appears after provider verification |
| Payments paused | No new checkout; existing status/webhooks still work with retained keys |

Recovery uses sessionStorage in the same browser/tab session; it is not a cross-device donor account. If that session is lost, contact staff with the reference/payment ID. There is no public phone-number lookup.

If a provider order exists but its ID was never saved after a timeout, staff must match the UUID in Razorpay receipt/notes, amount and mode before attaching the verified order ID to the database row. Do not mark payment received from a screenshot or start another charge while uncertain.

## 7. Custom domain and live launch

1. If using an owned domain, add it in **Railway service > Settings > Networking > Custom Domain**.
2. Enter exactly the DNS records Railway displays at your registrar/DNS provider. Wait for DNS/HTTPS verification. Do not guess an IP or remove unrelated mail records.
3. Update both URL variables to the chosen HTTPS origin, rebuild, and add that hostname to Turnstile. Configure redirects for alternate hostnames; form submissions require the configured origin.
4. Update the test webhook URL and repeat a checkout. Avoid switching domains mid-checkout because recovery storage belongs to its original origin.
5. Submit the real website/organisation information to Razorpay and complete its approval and bank/settlement setup. Code cannot complete KYC or approve the merchant.
6. Confirm the NGO's legal identity, service availability, helpline, privacy/refund wording and accounting procedure. Add only verified registration/tax claims and approved photos/documents.
7. Keep new donations disabled during cutover. Generate **Live Mode** keys and replace both API-key variables together.
8. Create a **Live Mode** webhook for the final HTTPS endpoint and the three events above. Use a new private webhook secret and update the Railway value to match. Confirm live automatic-capture settings.
9. Disable the old test webhook to this same deployment, or point it at a separate staging service retaining test keys. One deployment uses one active Razorpay key pair.
10. Confirm your production Supabase project and Turnstile keys, set **`PAYMENTS_MODE=live`**, and deploy.
11. Start a fresh browser session; old test references cannot use live credentials. Keep test rows labelled `test` and exclude them from financial totals.
12. An authorised owner should approve a small real donation, verify capture/webhook results and reconcile settlement. Only the owner should authorise real refunds or money movement.
13. The website download remains an acknowledgement. Staff issue official receipts only after verified settlement/accounting checks. No automatic 80G certificate is implemented.

## 8. What replaced Lovable

| Previous integration | Current implementation |
| --- | --- |
| Lovable Vite wrapper | Standard Vite/TanStack/Nitro and Railway Docker build |
| Editor error-reporting hooks | Removed; local generic diagnostics and server logs |
| Preview-auth broker/generated unused clients | Removed; server access using your Supabase keys |
| Fixed old Supabase project link | Removed; `SUPABASE_URL` chooses your new project |
| Empty Drizzle schema/Lovable migration variable | Removed; `supabase/production.sql` is authoritative |
| Lovable-only gallery asset paths | Removed; approved local gallery assets |
| Bun/Lovable package exceptions | Removed; npm lockfile is authoritative |
| Lovable hosting | Railway domain or your owned domain |

React, TanStack, shadcn/Radix, Supabase JS and jsPDF remain normal libraries. Historical `.lovable` planning metadata and archived original documents are not runtime plugins. This build needs no Lovable subscription or secret.

Once Railway works, stop publishing conflicting edits from Lovable. To stop two-way GitHub sync, open the Lovable project: **Project settings > Git > GitHub**, open the active repository connection dropdown, choose **Disconnect**, and complete the confirmation. GitHub files/history remain intact. This does not retire the old public URL automatically; handle its publication separately. Keep the old project until cutover is verified.

If you later merge to main, use a normal reviewed merge. Change Railway's branch to main only after it contains the working release.

## 9. Staff responsibilities and troubleshooting

- Give staff individual Supabase Dashboard accounts and MFA. No website admin password or public patient list is created.
- Review assistance requests regularly using `new`, `contacted`, `in_progress`, `closed`. No automatic email/SMS alerts are implemented; assign a person and review schedule.
- Keep staff notes minimal; do not collect medical documents through this general request workflow.
- Reconcile live payments/refunds in Razorpay and distinguish capture from settlement. Review pending rows and failed webhook deliveries.
- Establish Supabase backups, restoration and retention procedures. Railway code rollback does not undo database transactions.
- Test mobile/desktop, keyboard navigation, policy anchors, search, contact links and PDF downloads. Have the NGO approve inherited health/service content.
- Add approved images under `public/images/camps/` and update `src/lib/gallery.ts`. The current empty gallery is intentional. Publication buttons request official documents by email until real PDFs are supplied.
- After CI is working, consider Railway **Wait for CI** so failed checks do not auto-deploy.

| Problem | Check |
| --- | --- |
| Old site on Railway | Source branch must contain the new release |
| GitHub 403 | Write-authorised account/app; public visibility is insufficient |
| Forms disabled | Exact HTTPS SITE_URL, Supabase keys, both Turnstile keys, deployed variables |
| Origin denied | Configured hostname versus current www/non-www/redirect destination |
| Verification failed | Widget hostname, matching key pair, expiry, script blocking |
| Database error | Same project URL/keys, Data API enabled, full SQL applied, verify-setup passes |
| Donations disabled | Mode and key prefix match, webhook secret, Supabase and Turnstile configured |
| Debited but pending | Capture and webhook status; do not request another payment before reconciliation |
| Webhook 401 | Wrong secret or mixed test/live settings |
| Webhook 405 in browser | Expected for GET; inspect signed POST deliveries |
| Webhook 502/503 | Provider/database configuration or outage; resolve and replay through Razorpay controls |
| No email notification | Not implemented; staff use the dashboard and donors download acknowledgements |

Local checks do not replace live database, widget, payment and settlement acceptance. Do not announce a full public launch until those steps succeed.

## Optional developer commands

The dashboard setup above needs no PowerShell. Developers use Node 22.23.4 and npm 12.2.2:

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run test:production
node scripts/check-production.mjs https://YOUR-HOSTNAME
```

The last check reads page/assets/config only. Local development uses `.env.local` copied from `.env.example`, localhost URL variables, staging credentials and `npm run dev`. Never commit actual secrets.

## Official references checked

- GitHub Desktop: [add local repository](https://docs.github.com/en/desktop/adding-and-cloning-repositories/adding-a-repository-from-your-local-computer-to-github-desktop), [push](https://docs.github.com/en/desktop/making-changes-in-a-branch/pushing-changes-to-github-from-github-desktop).
- Railway: [quick start](https://docs.railway.com/quick-start), [Dockerfiles](https://docs.railway.com/builds/dockerfiles), [variables](https://docs.railway.com/variables), [networking](https://docs.railway.com/networking/public-networking), [branch/CI settings](https://docs.railway.com/deployments/github-autodeploys).
- Supabase: [API keys](https://supabase.com/docs/guides/getting-started/api-keys), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [API security](https://supabase.com/docs/guides/api/securing-your-api).
- Cloudflare: [Turnstile dashboard setup](https://developers.cloudflare.com/turnstile/get-started/widget-management/dashboard/).
- Razorpay: [API keys](https://razorpay.com/docs/payments/dashboard/account-settings/api-keys), [webhooks](https://razorpay.com/docs/webhooks/setup-edit-payments), [capture settings](https://razorpay.com/docs/payments/payments/capture-settings), [integration/testing](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps).
- Lovable: [GitHub sync/disconnection](https://docs.lovable.dev/integrations/github).
