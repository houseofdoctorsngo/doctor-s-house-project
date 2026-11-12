# Railway and Supabase deployment

Use **[FIRST_TIME_SETUP.md](FIRST_TIME_SETUP.md)** for the complete, current instructions. They assume a new Supabase database and use GitHub Desktop instead of PowerShell.

Follow that guide in order:

1. Publish `production/railway-readiness` with GitHub Desktop.
2. Create a new Supabase project and run [production.sql](supabase/production.sql).
3. Run [verify-setup.sql](supabase/verify-setup.sql) and confirm PASS.
4. Deploy the correct branch to Railway using the included Dockerfile; generate its domain.
5. Create a Turnstile widget and enter the exact Railway variables from the guide.
6. Test an assistance request and inspect it privately in Supabase.
7. Configure Razorpay test keys, automatic capture and signed webhooks; complete acceptance tests.
8. Complete domain/merchant approval and live-mode activation with the owner's authorised payment.
9. Retire conflicting Lovable sync after the new site is verified; establish staff review and reconciliation.

For new projects, use `SUPABASE_SECRET_KEY=sb_secret_...`. Older installations may retain the `SUPABASE_SERVICE_ROLE_KEY` alias. Do not add secrets to GitHub source or expose them with a `VITE_` prefix.

See [VALIDATION.md](VALIDATION.md) for actual checks and remaining account-dependent work, and [PRODUCTION_REVIEW.md](PRODUCTION_REVIEW.md) for the implementation audit. Nothing in these instructions implies that the app has already been uploaded or deployed.
