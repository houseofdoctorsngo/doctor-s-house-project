# The House of Doctor

Doctor-led rural healthcare NGO website. A single React/TanStack Start landing route, deployed from **main** to Railway using the included Node Dockerfile.

## Current release

- Assistance submissions protected by Cloudflare Turnstile, server validation and insert-only Supabase RLS.
- Cashfree-hosted donations with deterministic orders, status recovery, signed webhooks and verified refunds.
- Contact phone: **+91 75689 68704**; email: **houseofdoctorsngo@gmail.com**.
- Published Lovable presentation restored, with the owner's five field photos and video in a 3D rotating gallery.
- Approved operators use the private staff workspace for requests and donation transactions. Account setup and payment reconciliation are covered in FIRST_TIME_SETUP.md and OPERATIONS.md.

## Start here

| Document | Purpose |
| --- | --- |
| [FIRST_TIME_SETUP.md](FIRST_TIME_SETUP.md) | Exact Railway variables, existing Supabase/Turnstile setup, Cashfree sandbox and live cutover |
| [VALIDATION.md](VALIDATION.md) | Current evidence and launch acceptance checklist |
| [OPERATIONS.md](OPERATIONS.md) | Where requests/donations are viewed, ownership, follow-up and finance procedures |
| [PROJECT_AUDIT.md](PROJECT_AUDIT.md) | Architecture, website comparison, fixed gaps and remaining launch dependencies |
| [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md) | Build/deployment/rollback reference |
| [MEDIA_GUIDE.md](MEDIA_GUIDE.md) | How to add field photographs, videos and captions |
| [docs/REFERENCE_RESTORATION.md](docs/REFERENCE_RESTORATION.md) | Pre-November history, published-reference comparison, restoration plan and operational differences |

## Development

Use Node 22.23.4 or newer (Docker/CI pin 22.23.4) and npm 12.2.2 for the authoritative lockfile. Copy `.env.example` to `.env.local`, keep real credentials private, then:

```sh
npm ci
npm run dev
npm run typecheck
npm test
npm run build
npm run test:production
```

For this Windows checkout, the tested Node runtime is `C:\doc_sin\tooling\node-v22.23.4-win-x64\node.exe`; the globally installed Node can be older. Do not commit local tooling or `.env` files.

Apply `supabase/production.sql` and then `supabase/verify-setup.sql` in your Supabase SQL Editor before enabling forms/payments. `supabase/operations.sql` contains private read-only staff queries.

The site's observed final origin is [www.thehouseofdoctor.in](https://www.thehouseofdoctor.in). Missing credentials deliberately disable transactions. A build or healthcheck is not proof of a real donation, database submission or bank settlement.

`docs/ORIGINAL_BRIEF.md`, `docs/original-bun.lock` and `.lovable/` retain historical material. Current setup docs and npm lockfile supersede their implementation instructions. Preserve published Git history; do not force-push a Lovable-connected branch.
