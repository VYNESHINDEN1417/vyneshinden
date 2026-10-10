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
- Keep the loading controller mounted in the root and start its timers from normal navigation clicks, not route arrivals; route changes must not restart a click's sequence, and returning home cancels it so navigation latency cannot extend the delay.
- Use the game Button variant for dimensional navigation links so the supplied button treatment remains part of the design system.
