# Published-reference restoration — 16 November 2026

## Sources and history

The owner requested the viewing format, rotation, captions and section information of https://thehouseofdoctor.lovable.app, with no newly invented promotional content. The live reference HTML, `/assets/routes-BVL48Fzn.js` and `/assets/styles-dQEm5QzX.css` were retrieved successfully for this comparison. This is a distinct published design from the latest October source in this Git repository.

| Snapshot / commit | Effect on the website |
| --- | --- |
| `e6d51b6` (8 October) | Introduced the compact single-page accordion layout, side-by-side hero and donation-before-information order. |
| `f32e376` (26 October) | Last commit before November. It already contained the compact layout, extra Mewar/education/publication sections, and a six-face 3D gallery rotating every 4.5 seconds with representative stock photographs. |
| `582d059`, `d63110e` (3 November) | Documentation rename/merge; no additional homepage redesign. |
| `b0f3817` (6 November) | Railway/Supabase/payment production work; replaced editor-hosted/representative gallery assets with an honest empty gallery and a flat viewer. Added working server workflows and policies. |
| `5ffca75`, `88e697c`, `9cd24bc` (12 November) | Checkout recovery, submission reliability, standalone setup and merge to main. Did not restore the published reference's page structure. |
| `dfa7cea` (16 November) | Cashfree integration, updated phone, operations documentation and gallery video support. Kept compact presentation. |
| `6967360` (16 November) | Published the owner's five photographs and video; used a flat media viewer with thumbnail selection and newly written captions. |

The published Lovable site has a centred large-logo hero, desktop navigation, open About and Services sections, gallery before Help Desk, donations after Help Desk, and a light footer. Its six placeholder cards rotate every **4 seconds**, with **60-degree steps**, **280px depth**, **1400px perspective** and **0.9-second transitions**. It includes no real field photos. Its request/payment submissions use browser alerts, not the current production integrations.

## Implemented plan

1. Restore the published header, centred hero, open About/Services content, main section order, light footer, palette, typography sizes, card shadows and logo animation. The static sections in `src/components/reference-sections.tsx` are a mechanical transcription of the published HTML, not newly composed marketing text.
2. Restore the rotating six-face gallery, overlaid captions, category/number badges, arrow controls and dot navigation. Keep the supplied media. Use continuous rotation across the last-to-first boundary, a pause control, hover/focus pause and reduced-motion support. An idle video poster participates in rotation. Starting playback holds the panel until the video ends or the visitor navigates away.
3. Replace the added promotional captions with generic labels already present on the reference site: Free Prescriptions, Patient Support, Free Medical Camps, Community, Doctors on Duty and Health Camp. Use its `The House of Doctor • Udaipur` attribution. Do not assign the placeholder location `Kotra`, a diagnosis, a vaccination event or an unverified activity to these supplied files. Existing descriptive image alt text remains for accessibility.
4. Restore donation heading/intro, two-column presentation and reference INR presets (251, 501, 1,100, 2,100, 5,100, 11,000; initial amount 500). Keep donor validation, Cashfree-hosted payment collection, server verification, status recovery and consent.
5. Restore Help Desk labels/layout and wire Chat with Support to the existing WhatsApp link. Keep the real insert-only assistance workflow, Turnstile, consent, request reference and truthful availability notices. Presentation labels map to existing database values; no migration is needed.
6. As explicitly selected by the owner, retain Mewar Connect, Focus Areas, Health Library and Publications as collapsible sections below the main content. Keep working policy links. Retain the current phone **+91 75689 68704** everywhere.

## Deliberate operational differences

- Do not copy the reference's raw card-number/CVV fields, fake donation alert, placeholder social links, or unverified 24-hour response guarantee. Cashfree remains the payment collector.
- Bank methods are labelled Netbanking rather than promising NEFT/IMPS options that depend on the merchant configuration.
- The page uses the reference's exact existing public wording where requested, including its community terminology, superseding the older brief's wording preference for these restored sections.
- Existing functional policy, consent, verification and status messages remain. No generated imagery is added, and source photos/video are unchanged.
- Existing Railway/Supabase/Cashfree configuration steps are unchanged. This release needs no new secrets or SQL migration.

## Validation scope

Reference inspection is based on downloaded live HTML, CSS, client code and Git history. Browser automation was unavailable during this restoration (its local helper could not initialize), so a fresh visual screenshot comparison is not claimed. Component tests cover four-second advancement, forward wrap, keyboard-focus pause, reduced motion, inactive-panel isolation and video lifecycle. The release also runs TypeScript, production build/smoke and the existing payment/database test suite. Final results are recorded in VALIDATION.md.
