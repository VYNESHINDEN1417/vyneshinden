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
- Keep the loading controller mounted in the root and start its timers from normal navigation clicks, not route arrivals; defer navigation and the cover until the visible button press completes, never restart the sequence on route arrival, and cancel it when returning home so navigation latency cannot extend the delay.
- Use the game Button variant for dimensional navigation links so the supplied button treatment remains part of the design system.
- Define the uploaded font through a global font-face and shared typography token, and preload its public media URL in the root so every screen uses consistent typography.
- Mount background audio once in the persistent root and retry browser-blocked playback on interaction so internal navigation never resets music.
- Keep site media as original files in public/media and reference same-origin URLs so exported repositories work without Lovable's asset proxy on external hosting.
- Show the music reopen control only on the home route without unmounting the persistent audio player so detail navigation preserves playback.
