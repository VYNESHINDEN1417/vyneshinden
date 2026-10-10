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

- Keep portfolio detail screens in separate file-based routes and reuse the shared PortfolioPage presentation so navigation opens real pages.
- Mount the pathname-keyed loading screen in the root with an immediate opaque cover that remains through the delayed loading sequence; snapshot return-home detection per mount so rerenders cannot prematurely reveal content, and skip the sequence when returning home.
- Use the game Button variant for dimensional navigation links so the supplied button treatment remains part of the design system.
