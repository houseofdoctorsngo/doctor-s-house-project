# The House of Doctor

Single-page NGO website for rural healthcare across Mewar, built with React, TypeScript and TanStack Start. Railway runs the Node/Nitro application. Supabase stores private assistance requests and donation records; Razorpay handles hosted payment checkout.

**Start here: [First-time setup without PowerShell](FIRST_TIME_SETUP.md).** It covers GitHub Desktop upload, a new Supabase database, Railway, exact variables, Turnstile, Razorpay testing/live activation, Lovable replacement and staff operations.

- [Production review](PRODUCTION_REVIEW.md): architecture, gaps addressed and launch dependencies.
- [Validation](VALIDATION.md): actual local check results and unverified external integrations.
- [Database setup](supabase/production.sql): apply to a staging Supabase project first.
- [Verify database setup](supabase/verify-setup.sql): run after setup; expect PASS.
- [Environment template](.env.example): variable names only; never commit real secrets.
- [Original design brief](docs/ORIGINAL_BRIEF.md): preserved reference; deployment and payment behaviour are governed by the current code and deployment guide.

## Local commands

Use current Node 22 LTS (22.23.4 or newer Node 22) and npm 12.2.2.

```sh
npm ci
cp .env.example .env.local
# Edit .env.local with staging settings.
npm run dev
npm run typecheck
npm test
npm run build
npm run test:production
npm start
```

On Windows use `Copy-Item .env.example .env.local`. Development serves on `http://localhost:3000`. Production reads credentials from the process environment; Railway sets these through Variables. `npm start` runs the production build, not a development or Vite preview server.

## Workflows

- Assistance: validated contact request → human verification → insert-only database permission → private staff review in Supabase Dashboard. No public patient list or website admin password.
- Donations: server-created order → Razorpay hosted checkout → verified provider status → private record and downloadable payment acknowledgement. Webhooks reconcile completed payments and refunds; browser sessions can resume existing checkouts.
- Information: accessible accordion navigation, searchable education topics, downloadable general health guide, contact links and on-page policies.
- Gallery: approved local camp photos configured in `src/lib/gallery.ts`; an honest empty state is displayed until photographs are supplied.

Payments fail closed when provider configuration is absent. Test transactions are labelled. A payment acknowledgement is **not** an official donation receipt, settlement statement or tax certificate. Official receipts follow NGO reconciliation and verified settlement.

The application requires operator-owned Supabase, Railway, Turnstile and approved Razorpay accounts. It does not automatically send email receipts or assistance notifications. Review incoming requests in the dashboard and confirm operational/policy claims before launch.

This repository remains connected to Lovable. Preserve published Git history and review a working branch before merging to the connected branch.
