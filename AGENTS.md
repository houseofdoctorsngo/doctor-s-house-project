<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep all public website content on the index route with in-page accordion navigation; the brief explicitly requires a single landing route.
- Split donation, gallery, and information sections into focused browser-safe components so the landing route remains maintainable.
- Store assistance requests through insert-only public RLS with database validation and no visitor read permissions; request data must not be publicly exposed.
- Issue donation receipts only after server-verified successful Cashfree payment and order matching, as requested by the owner. Preserve refund status and distinguish test/sample receipts. Bank settlement remains a separate finance reconciliation step.
- Keep shared input schemas and donation rules in a browser-safe utility with focused rule tests to preserve validation consistency.
