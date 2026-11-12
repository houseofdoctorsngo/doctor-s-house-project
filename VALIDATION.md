# Validation - updated 12 November 2026

## Follow-up verification - 12 November

- TypeScript passed again after the follow-up changes.
- Full Vitest run: **43 tests passed across 8 files**, including the new assistance retry API tests and donation browser-component tests.
- After adding the paused-donations case, the final payment suite passed **13/13 tests**. Together these runs cover 44 distinct tests; the full suite was not rerun after this final targeted change.
- The production build and compiled-server smoke check passed again. These checks make no external provider requests.
- Git whitespace checks passed. The follow-up requires no new SQL migration, dependency or environment variable.

The new tests cover normalization of permitted phone formats, legacy phone-format retry comparison, concurrent identical/conflicting inserts, lost order-response recovery, capture-pending checkout suppression, modal busy controls, test/live isolation, missing credentials and payment status checks while new donations are paused.

GitHub publishing remains blocked: the connected account reports repository push permission, but the app returned HTTP 403 (`Resource not accessible by integration`) when asked to create a blob. Local Git had no usable non-interactive credential. No changes were uploaded and no remote CI run was triggered. Authorize a connection capable of writing repository contents, or sign in to Git locally and push `production/railway-readiness`.

## Original verification - 6 November

## Passed locally

| Check | Result |
| --- | --- |
| TypeScript (`tsc --noEmit`) | Passed; repeated successfully after resuming the Windows workspace. |
| Vitest | **28 tests passed across 6 files.** |
| Production Vite/Nitro build | Passed; generated `.output/server/index.mjs` and client assets. |
| Production runtime (`node scripts/test-production.mjs`) | Passed against the compiled Node server, with external credentials removed. |
| Git whitespace/diff check | Passed; Git emitted only Windows line-ending conversion notices. |

The tests cover shared input rules, route matching, HMAC signatures and tampering, raw webhook-body validation, origin and body-size restrictions, disabled/mismatched payment configuration, provider amount/currency/order mismatches, authorised-only payments, and captured-payment confirmation.

Database tests execute the real `supabase/production.sql` against an isolated PostgreSQL-compatible PGlite instance. They apply the setup twice, check anonymous/authenticated read-update-delete denial, restrict staff fields, consume single-use permits, reject expired/replayed/mismatched permits, enforce request limits and constraints, and exercise duplicate/out-of-order payment/refund updates. They do not connect to the owner's live Supabase database.

Runtime smoke checks verified server-rendered content, security response headers, the local logo, four referenced application assets, fail-closed public configuration, cross-origin rejection, malformed JSON rejection, disabled payment handling and a missing-page 404. No patient request, email, message or payment was sent to an external service.

## Installation note

The machine's npm 10.9.2 encountered an installer error. npm 12 generated the package-lock, but local extraction was repeatedly interrupted by execution limits. Bun 1.4.4 successfully repaired the local dependencies using the npm lockfile (`bun install --ignore-scripts --no-save`). Validation then ran using Node 22.23.4. Docker and CI use Node 22.23.4 / npm 12.2.2 and `npm ci`.

A clean Linux Docker build and the GitHub Actions workflow have not yet run in their remote environments. Do not confuse the successful local production build with a successful Railway deployment.

## Still required before public launch

1. Apply SQL and verify the full HTTP/database flow on an owner-controlled staging Supabase project.
2. Configure real Turnstile keys and test correct hostname/action handling in a browser.
3. Test the approved Razorpay account: success, cancellation, failure, refresh/recovery, webhook delivery/retry, capture, refunds and settlement reconciliation.
4. Test desktop/mobile browser interaction and keyboard access on the deployed domain. Browser automation was unavailable for the final local pass; the earlier live-site review is not a visual test of this modified build.
5. Confirm NGO identity, service claims, policy wording, staff response process, retention practices and official receipt procedure. Provide approved camp photos and publications when available.
6. Run `node scripts/check-production.mjs https://YOUR-DOMAIN` after Railway deployment and have an authorised owner complete the live acceptance payment.

The local code/build checks passed. **Production account activation and end-to-end acceptance remain outstanding.** Follow RAILWAY_DEPLOYMENT.md in order.
