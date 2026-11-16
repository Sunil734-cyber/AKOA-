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

# AKOA

- AKOA is a mock-only frontend: all data lives in `src/lib/akoa.ts` with deterministic seeded telemetry generators (no Lovable Cloud, no server functions) so SSR and client render identical charts and there is no hydration mismatch. Do not add a backend unless the user asks.
- Charts are hand-rolled SVG in `src/components/chart.tsx` (observed line, dashed forecast with band, "Now" divider, dashed limit lines, hover tooltip) — extend this component instead of adding a chart library.
