# Release validation and owner acceptance

Updated 19 November 2026. Follow FIRST_TIME_SETUP.md before checking remote providers.

## Finishing update — 19 November 2026

The donation section now follows About and combines amount selection with donor details. The website uses the corrected high-resolution logo, both email addresses, the New Bhopalpura office address and the 2024 founding year.

Receipt tests cover verified live payments, pending and failed attempts, incorrect amounts, missing access tokens and refreshed refund totals. Production smoke validation generates a PDF using the compiled server module and embedded logo/fonts. The sample receipt was rendered and checked for page overflow. The browser preview confirmed custom amount selection and the styled Mewar Connect enquiry buttons.

Preview [the sample receipt](public/sample-donation-receipt.pdf) without making a payment. Recreate it with `node scripts/sample-receipt.mjs`. The sample uses illustrative donor and transaction details. No real payment was made during these checks.

## Lovable presentation restoration, 16 November 2026

All 87 tests passed across 12 files in a single run. The gallery tests exercise a full rotation every six four-second steps, including the idle video panel, playback protection, manual controls, focus pause and reduced motion. The navigation tests verify section order, the mobile menu, policy links and direct links to supplemental sections. The server-rendered Hero, About, Services and footer text matched the retrieved Lovable page after accounting for the current phone number. All six panels and every internal link target were present. A fresh visual screenshot comparison is still unverified. See [the source and commit comparison](docs/REFERENCE_RESTORATION.md).

## Original Cashfree release evidence

- Final TypeScript typecheck: **passed**.
- Final unit/integration/browser-component suite: **81 passed across 11 files**, run with `vitest run --maxWorkers=2`. The unrestricted two-worker rerun resolved sandbox worker-start timeouts; no failed assertions remained.
- Production build: passed on Node 22.23.4 / Vite 8.1.6 / Nitro Node output.
- Compiled production smoke: passed (SSR, security headers, public fail-closed config, logo/assets, origin/JSON rejection, disabled payments and 404).
- Production dependency audit: **0 known vulnerabilities** at execution time; this is not a guarantee against all security defects.
- Browser: opened both public URLs; confirmed apex-to-www redirect, old phone, disabled transactions and empty/reference-placeholder galleries. Updated local production preview confirmed Cashfree copy, new tel/WhatsApp values, patient-support options, refund anchor opening and mobile navigation. Mobile 390px viewport check showed no horizontal overflow in the inspected state.
- Tests use mocked Cashfree/Supabase HTTP boundaries where specified. Database tests execute real schema/permissions/triggers in isolated PGlite, including repeated setup and monotonic refund updates. They do not connect to the owner's database.
- The restricted execution sandbox initially blocked loopback HTTP; rerunning the production smoke with loopback access passed. This was an environment limitation, not an application failure.

No real Cashfree payment, refund, bank settlement, real Turnstile submission or live Supabase write has been claimed. Media playback with the user's field files is pending those files. An initial Publications click was blocked by an automatic approval-review usage limit. After access resumed, the section and email links were verified. The subsequent guide-download observation timed out; actual PDF download remains unverified.

## Repeatable developer gate

### Field media follow-up — 16 November 2026

Five owner-supplied photos and one 30.85-second H.264 video were added after the initial Cashfree release. TypeScript, the three gallery component tests and the production build passed. In the compiled local browser preview, all gallery images loaded, thumbnail selection worked, the video played with native controls (`paused=false`, `readyState=4`, duration about 30.87 seconds), and selecting a photo removed the player. A 390px mobile viewport showed no horizontal overflow and a two-row thumbnail layout. The video has a visual description; spoken-audio transcription and caption accuracy were not verified.

```sh
npm run typecheck
npm test
npm run audit:production
npm run build
npm run test:production
node scripts/check-production.mjs https://www.thehouseofdoctor.in
```

Run with Node 22.23.4+ and the locked npm dependencies. GitHub Actions additionally builds the Railway Docker image. The read-only deployed check creates no requests/payments. Verify its commit matches the release; passing configuration presence checks alone does not prove provider connectivity.

## Supabase and assistance acceptance

- [ ] Export/verify existing data before schema update; retain backup privately.
- [ ] Apply current production.sql and run verify-setup.sql: PASS.
- [ ] Verify no public SELECT/UPDATE/DELETE on requests, donations or permits.
- [ ] Add canonical site, Supabase and Turnstile variables; rebuild/deploy main.
- [ ] `/api/config`: assistanceEnabled true; no private keys in response or page source.
- [ ] Submit labelled QA request with NGO-controlled test contact, valid consent and real Turnstile on www hostname.
- [ ] Success UUID corresponds to exactly one row, status new, correct fields and consent timestamp.
- [ ] Test invalid number/missing consent, expired verification and repeated submission; no false success or duplicate records.
- [ ] Staff can assign owner, set follow-up, move through contacted/in_progress/closed; visitors cannot.
- [ ] Duty coordinator and backup know the queue and phone/email/WhatsApp channels. Close QA records with a note.

## Cashfree sandbox matrix

| Scenario | Expected evidence |
| --- | --- |
| Successful payment | Cashfree PAID order + SUCCESS captured payment; exact amount/currency/order; one matching Supabase row, provider cashfree, mode test |
| Fake browser success | No paid status without provider verification |
| Cancel / failed attempt | Pending/uncertain guidance; receipt endpoint rejects the download |
| Pending/preauthorised payment | No Resume invitation until safe; no claimed payment receipt |
| Reload / lost order response | Same-tab Check payment status recovers the existing order/session |
| Creation timeout | Persisted deterministic order; Retry this order uses same UUID idempotency key after verification |
| Expired/terminated order | No reopen; check debits before clearing and starting again |
| SDK script blocked/offline | Visible error and retained reference; no false success |
| Modal open | Status/resume buttons remain busy until checkout closes/completes |
| Signed webhook | Cashfree logs show HTTP 200 after provider lookup and durable database update |
| Invalid signature/body mutation | Rejected; no payment write |
| Provider/database outage | Non-200 retryable result; fix and resend failed events |
| Duplicate/out-of-order events | No duplicate donation; cannot reduce already verified refund total |
| Partial and full refund | Only successful matching refunds counted; pending/failed refunds excluded |
| Auto refund | Order-linked event reconciled; no-order events require dashboard review |
| Amount/currency/order mismatch | Rejected, never marked paid |
| Paused donations | PAYMENTS_MODE disabled prevents new checkout, retains status/webhooks with unchanged credentials |
| Test/live switch | Old test references blocked under production credentials, test rows preserved |
| Legacy Razorpay row | Not processed through Cashfree; staff contact guidance |
| Download | Sandbox PDF labelled TEST PAYMENT - NO MONEY RECEIVED; live receipt shows logo, donor details, amount, date, transaction and order IDs, and verified refunds |

Do these with real sandbox credentials after automated checks. Check webhook logs and SQL evidence, not only the checkout screen. Retain order IDs and test outcomes privately, without secrets or patient data.

## Website and media acceptance

- [ ] Desktop and phone: navigation, keyboard focus/Escape, accordions, library search/empty result, donate amounts/custom amount, all consent and policy links.
- [ ] Phone and WhatsApp destination: +91 75689 68704 / 917568968704. Email: houseofdoctorsngo@gmail.com.
- [ ] Partner/report links open correct email subjects; office actually monitors incoming mail.
- [ ] Health PDF downloads and fits pages; medical content approved by NGO clinician.
- [ ] Supplied photos/videos have consent, captions/alt text, appropriate sizing, accessible transcript/captions; actual MP4 plays on mobile and desktop.
- [ ] Gallery previous/next and pause work; no autoplay video or forced advance during a video.
- [ ] Final canonical/social metadata uses www domain and logo; apex redirect preserves intended navigation.
- [ ] Inherited service and organisation claims approved by NGO management.

## Live acceptance and operations

- [ ] Apply the staff setup in FIRST_TIME_SETUP.md. Open `/staff` in a private window. It should show only the sign-in form. Confirm that an ordinary Supabase user cannot read either queue or change a request.
- [ ] Sign in with an approved staff account, change the temporary password, sign out and verify the new password. Keep names, credentials and payment details out of screenshots.
- [ ] Open Mewar Connect and submit a labelled staging enquiry for camp volunteering. Check its reference and interest in **Requests**. In two signed-in tabs, change its status in one and confirm the other updates automatically. Check the live connection indicator.
- [ ] Complete a Cashfree sandbox donation. Compare the order ID, transaction ID, gross amount, mode, status and refund amount in **Donations** with the sandbox dashboard. Match settlement and receipt fields only after finance has recorded them.
- [ ] Remove a staging operator's membership. Verify that the already-open tab loses access on its next refresh and a fresh login is denied.

- [ ] Cashfree production approval, bank details, approved domain and production webhook configured.
- [ ] Sandbox webhook no longer targets service using live credentials.
- [ ] PAYMENTS_MODE live matches CASHFREE_ENV production; fresh browser session.
- [ ] Authorised owner makes a small real donation; website, Supabase and Cashfree agree.
- [ ] Finance reconciles bank settlement/fees, records settled_at/reference, and matches the downloaded donation receipt to the provider transaction.
- [ ] Duty/finance/office backups assigned; daily reconciliation and unresolved-request review operating.
- [ ] Provider dispute deadlines, webhook failures, Railway errors and backup/restore procedure owned.
- [ ] GitHub Actions and Railway deployment succeeded for the pushed main commit; enable Wait for CI.

Launch is accepted only when the required external checks above are completed. The code can be deployed safely with transactions disabled while setup continues.
