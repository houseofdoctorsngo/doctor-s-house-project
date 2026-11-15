# Railway deployment reference

Updated 16 November 2026. Use [FIRST_TIME_SETUP.md](FIRST_TIME_SETUP.md) for the complete dashboard walkthrough and exact variable template.

| Setting | Value |
| --- | --- |
| Repository | `houseofdoctorsngo/doctor-s-house-project` |
| Deployment branch | `main` |
| Root | Repository root |
| Builder | Included multi-stage Dockerfile |
| Node | 22.23.4 |
| Build | `npm ci`, then `npm run build` inside Docker |
| Runtime | `node .output/server/index.mjs` as non-root user |
| Network | `HOST=0.0.0.0`; Railway-provided `PORT` |
| Healthcheck | `/api/health` (liveness only) |
| Canonical origin observed | `https://www.thehouseofdoctor.in` |
| Database | Existing Supabase, `supabase/production.sql` |
| Bot protection | Existing Cloudflare Turnstile widget |
| Payment provider | Cashfree hosted checkout, server verification, signed webhooks |

## Deploy sequence

1. Export/verify any existing database records, apply current SQL and run verification SQL to PASS.
2. Set variables from FIRST_TIME_SETUP. Start with donations disabled. Add no real secrets to Git.
3. Push a normal commit to main; no force-push. Confirm GitHub Actions passes on that commit.
4. Deploy that exact main commit in Railway. Leave custom build/start overrides blank. Enable Wait for CI in service settings.
5. Rebuild after changing `VITE_SITE_URL`; it is an explicit Docker build ARG. Other secrets are runtime variables and are not copied into the image.
6. Visit the final www origin. Confirm assistance storage with a test request before enabling Cashfree sandbox.
7. Complete VALIDATION.md, then activate live credentials/mode only after owner acceptance.

## Read-only deployed check

```powershell
node scripts/check-production.mjs https://www.thehouseofdoctor.in
```

This does not create requests or payments. It is not an end-to-end provider test. Missing variables intentionally leave forms/payments unavailable while the informational site runs.

## Recovery

- Pause new donations with `PAYMENTS_MODE=disabled`, retaining Cashfree/Supabase credentials. Existing webhooks and status checks continue.
- If a deployment fails healthcheck, inspect build/runtime logs and the deployed commit. Use Railway's previous known-good deployment if necessary; preserve current data.
- After this migration, rolling back to Razorpay-era application code is not a Cashfree recovery strategy. Keep payments disabled and deploy a corrected Cashfree build. Never delete new donation rows to make old code fit.
- After a provider outage, inspect Cashfree webhook logs and resend failed payment events. Reconcile remaining exceptions in OPERATIONS.md.
- Monitor the canonical HTTPS site and `/api/health`, provider webhooks and database separately. A healthy homepage cannot prove donations work.
