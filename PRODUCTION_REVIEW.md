# Production review — 5 November 2026

## Repository and published-site findings

Reviewed the public Lovable site and cloned `houseofdoctorsngo/doctor-s-house-project` at commit `d63110ea823b54e0431f371296733a3a83bef75b` before changing application code. Work is isolated on `production/railway-readiness`.

The live URL and repository are different revisions. The published page exposes placeholder card fields, gallery slides and legal links. The repository is already a newer single-page TanStack Start site with focused donation/gallery/information components, a Supabase assistance table, health search, downloadable health guidance, contact links and accessibility controls. Its donation button explicitly reported that payments were disconnected and only produced sample PDFs.

Reviewed route/layout/start/server entry points, all domain components and shared rules, Supabase clients and middleware, schema/migrations, environment/build configuration, assets, styles, existing tests and project instructions. The remaining shadcn UI components are reusable library controls rather than additional business workflows.

## Changes

| Area | Previous gap | Implementation |
| --- | --- | --- |
| Hosting | Lovable build wrapper targeted Cloudflare; no production start command | Explicit TanStack/Vite/Nitro Node configuration, Dockerfile, Railway config, health endpoint and npm lockfile. |
| Donations | No live payment flow | Server-created Razorpay orders, hosted checkout, signature validation, provider lookup, amount/order/currency checks, webhook processing and private records. |
| Payment recovery | No interrupted checkout recovery | Session reference/token, resume the same order, status refresh, pending/failure/cancel feedback and idempotent updates. |
| Receipts | Sample-only PDF | Verified payment acknowledgement with test labels; official settled receipts and tax certificates remain an operator responsibility. |
| Assistance | Direct browser insert, no server verification | Consent, shared schema validation, Turnstile hostname/action checks, one-use database permits, bounded body size, origin checks and per-phone limits. |
| Patient privacy | RLS insert policy with no workflow state | Column-level INSERT grants, private permit/donation tables, restricted RPC, locked staff fields and request status/notes for dashboard operators. |
| Assets | Gallery URLs used Lovable-only `/__l5e/` paths | Published NGO logo stored locally; broken gallery removed in favour of a configurable local-asset gallery with honest empty state. |
| Policies | Missing in newer repository | Privacy, website/donation terms, refund contact and accessibility sections on the landing route. |
| Navigation | Hash links did not reliably reveal collapsed content | Deep links open their target section; policy anchors reveal details; menu updates hash. |
| Secrets | `.env` tracked | Environment templates and ignore rules; runtime-only service keys. Historical credentials must be reviewed by owner. |

## Intended architecture

Visitors use one landing route. Contact and publication-request links open phone, email, maps or WhatsApp applications. The website does not send messages on the visitor's behalf. Medical education is inherited general content; clinical review is still required.

The Node server handles `/api/*` before rendering TanStack pages. Supabase stores assistance requests and donation records. There is no additional Railway database. Public visitors do not have logins; staff use their secured Supabase Dashboard accounts. No shared administrator password or publicly accessible patient list is introduced.

The assistance server obtains a permit with its service key after verification, then inserts under the public key. Database validation consumes the permit transactionally, resets staff-only fields and applies request limits. Only permitted input columns can be inserted. Visitors have no read/update/delete grant.

Razorpay checkout handles payment details. Provider callbacks and webhooks cannot grant success based on the browser alone. The server verifies signatures and asks Razorpay for payment state. The database RPC serialises updates and preserves increasing refund totals. UUID references and high-entropy access tokens protect donation status; token digests are stored in the database.

## External dependencies and launch gates

The code does not supply merchant approval, production credentials, domain ownership, an operational staff rota, legal registration evidence, tax-exemption evidence, real event photos or official reports. These cannot be invented from the repository. Configure and verify them using RAILWAY_DEPLOYMENT.md before public launch.

No live database schema was changed, no production request was submitted, no real payment was made, and no external messages were sent during implementation. The app has not been deployed to Railway or pushed to GitHub by this session.

The website is not a clinical record system. Store only contact/request coordination information. Privacy wording and refund handling need the NGO's operational approval. Official receipts must follow verified settlement and the organisation's accounting process.

## Verification

See VALIDATION.md for commands, results and remaining provider/account tests. Successful local checks do not replace staged Supabase/Turnstile/Razorpay tests or an owner-authorised live acceptance payment.

## Follow-up review - 12 November 2026

- A lost order-creation response previously left the browser with only a donation ID/token. The authenticated status endpoint now returns the stored checkout details when it is safe to resume, and the browser recovers them without creating another order.
- Authorised payments awaiting capture no longer offer another checkout. Controls remain busy until the provider modal closes or payment verification finishes, including provider retry/failure events.
- Test checkouts cannot be verified or resumed with live credentials. Pausing new donations still permits status checks and verification of existing payments when the matching credentials remain configured.
- Assistance retry comparisons normalize phone formatting, including older saved records. A concurrent duplicate insert is acknowledged only after confirming that the saved payload matches; conflicts return 409 instead of false success.
- Regression coverage now includes API retry races, lost-response recovery, mode changes, capture-pending behavior and browser-component modal controls. No additional database migration or environment variables are required for this follow-up.

Publishing was attempted through both local Git and the connected House of Doctors GitHub account. The GitHub app returned HTTP 403, `Resource not accessible by integration`, when creating a blob, despite account-level repository write permission. Local Git also lacked a usable non-interactive credential. No remote branch or commit was created by these attempts.
