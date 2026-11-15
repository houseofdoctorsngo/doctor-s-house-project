# Codebase inventory

15 November 2026. Project-owned tracked/new source files; excludes ignored credentials, installed dependencies, local tooling and generated build output. Inventory coverage is not a claim that every unused UI component is a tested product feature.

| File | Lines | Review area |
| --- | ---: | --- |
| `.dockerignore` | 10 | Runtime/configuration |
| `.env.example` | 16 | Runtime/configuration |
| `.github/workflows/ci.yml` | 31 | Runtime/configuration |
| `.gitignore` | 37 | Runtime/configuration |
| `.lovable/plan/the-house-of-doctor-standalone-4-file-static-website-2026-11-03.md` | 34 | Historical/reference or audit documentation |
| `.lovable/project.json` | 5 | Historical/reference or audit documentation |
| `.prettierignore` | 8 | Runtime/configuration |
| `.prettierrc` | 6 | Runtime/configuration |
| `AGENTS.md` | 16 | Project guidance/runbook |
| `Dockerfile` | 17 | Runtime/configuration |
| `FIRST_TIME_SETUP.md` | 122 | Project guidance/runbook |
| `MEDIA_GUIDE.md` | 22 | Project guidance/runbook |
| `OPERATIONS.md` | 87 | Project guidance/runbook |
| `PRODUCTION_REVIEW.md` | 5 | Project guidance/runbook |
| `PROJECT_AUDIT.md` | 115 | Project guidance/runbook |
| `RAILWAY_DEPLOYMENT.md` | 45 | Project guidance/runbook |
| `README.md` | 43 | Project guidance/runbook |
| `VALIDATION.md` | 93 | Project guidance/runbook |
| `components.json` | 22 | Runtime/configuration |
| `docs/ORIGINAL_BRIEF.md` | 190 | Historical/reference or audit documentation |
| `docs/original-bun.lock` | 1537 | Historical/reference or audit documentation |
| `eslint.config.js` | 40 | Runtime/configuration |
| `package-lock.json` | 7592 | Dependency lock; advisory scan and build validation |
| `package.json` | 105 | Runtime/configuration |
| `public/favicon.png` | binary | Static image asset |
| `public/images/ngo-logo.jpeg` | binary | Static image asset |
| `public/robots.txt` | 14 | Runtime/configuration |
| `railway.json` | 10 | Runtime/configuration |
| `roadmap.md` | 11 | Project guidance/runbook |
| `scripts/check-production.mjs` | 29 | Runtime/configuration |
| `scripts/test-production.mjs` | 56 | Runtime/configuration |
| `src/assets/ngo-emblem.png` | binary | Static image asset |
| `src/components/donation.tsx` | 533 | Public interaction/content reviewed |
| `src/components/gallery.tsx` | 125 | Public interaction/content reviewed |
| `src/components/help-desk.tsx` | 56 | Public interaction/content reviewed |
| `src/components/human-verification.tsx` | 34 | Public interaction/content reviewed |
| `src/components/ngo-sections.tsx` | 21 | Public interaction/content reviewed |
| `src/components/policies.tsx` | 20 | Public interaction/content reviewed |
| `src/components/ui/accordion.tsx` | 51 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/alert-dialog.tsx` | 115 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/alert.tsx` | 49 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/aspect-ratio.tsx` | 5 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/avatar.tsx` | 47 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/badge.tsx` | 32 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/breadcrumb.tsx` | 101 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/button.tsx` | 52 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/calendar.tsx` | 177 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/card.tsx` | 55 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/carousel.tsx` | 240 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/chart.tsx` | 331 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/checkbox.tsx` | 26 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/collapsible.tsx` | 11 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/command.tsx` | 143 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/context-menu.tsx` | 186 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/dialog.tsx` | 104 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/drawer.tsx` | 98 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/dropdown-menu.tsx` | 187 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/form.tsx` | 171 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/hover-card.tsx` | 27 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/input-otp.tsx` | 73 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/input.tsx` | 22 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/label.tsx` | 21 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/menubar.tsx` | 228 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/navigation-menu.tsx` | 120 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/pagination.tsx` | 98 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/popover.tsx` | 31 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/progress.tsx` | 25 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/radio-group.tsx` | 36 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/resizable.tsx` | 37 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/scroll-area.tsx` | 44 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/select.tsx` | 152 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/separator.tsx` | 24 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/sheet.tsx` | 122 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/sidebar.tsx` | 744 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/skeleton.tsx` | 7 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/slider.tsx` | 23 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/sonner.tsx` | 23 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/switch.tsx` | 27 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/table.tsx` | 94 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/tabs.tsx` | 53 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/textarea.tsx` | 21 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/toggle-group.tsx` | 57 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/toggle.tsx` | 42 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/components/ui/tooltip.tsx` | 32 | Generic UI library; active primitives reviewed, unused components static inventory |
| `src/hooks/use-mobile.tsx` | 19 | Runtime/configuration |
| `src/lib/api.ts` | 13 | Runtime/configuration |
| `src/lib/error-capture.ts` | 81 | Runtime/configuration |
| `src/lib/error-page.ts` | 30 | Runtime/configuration |
| `src/lib/gallery.ts` | 13 | Runtime/configuration |
| `src/lib/ngo.ts` | 24 | Runtime/configuration |
| `src/lib/utils.ts` | 6 | Runtime/configuration |
| `src/routeTree.gen.ts` | 69 | Runtime/configuration |
| `src/router.tsx` | 16 | Runtime/configuration |
| `src/routes/README.md` | 21 | Public interaction/content reviewed |
| `src/routes/__root.tsx` | 124 | Public interaction/content reviewed |
| `src/routes/index.tsx` | 16 | Public interaction/content reviewed |
| `src/server.ts` | 68 | Server and trust boundary reviewed |
| `src/server/api.ts` | 531 | Server and trust boundary reviewed |
| `src/server/cashfree.ts` | 101 | Server and trust boundary reviewed |
| `src/server/security.ts` | 35 | Server and trust boundary reviewed |
| `src/server/supabase-fetch.ts` | 13 | Server and trust boundary reviewed |
| `src/start.ts` | 31 | Server and trust boundary reviewed |
| `src/styles.css` | 42 | Runtime/configuration |
| `src/test/api.test.ts` | 50 | Automated regression coverage |
| `src/test/app-routing.test.tsx` | 17 | Automated regression coverage |
| `src/test/assistance-retry.test.ts` | 47 | Automated regression coverage |
| `src/test/database.test.ts` | 96 | Automated regression coverage |
| `src/test/donation-recovery.test.tsx` | 43 | Automated regression coverage |
| `src/test/ngo.test.ts` | 13 | Automated regression coverage |
| `src/test/payment-verification.test.ts` | 281 | Automated regression coverage |
| `src/test/security.test.ts` | 34 | Automated regression coverage |
| `src/test/setup.ts` | 22 | Automated regression coverage |
| `src/test/supabase-fetch.test.ts` | 26 | Automated regression coverage |
| `src/test/webhook.test.ts` | 165 | Automated regression coverage |
| `supabase/operations.sql` | 28 | Database schema/permissions/operations reviewed |
| `supabase/production.sql` | 121 | Database schema/permissions/operations reviewed |
| `supabase/verify-setup.sql` | 56 | Database schema/permissions/operations reviewed |
| `tsconfig.json` | 36 | Runtime/configuration |
| `vite.config.ts` | 16 | Runtime/configuration |
| `vitest.config.ts` | 16 | Runtime/configuration |
| `src/test/gallery.test.tsx` | 65 | Automated media regression coverage |
