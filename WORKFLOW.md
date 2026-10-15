# Vyneshinden Project Workflow

This document describes the current intended workflow across ChatGPT, Lovable, GitHub, and Vercel. Treat arrows marked **verify** as assumptions until checked in the relevant project settings.

## Workflow diagram

```mermaid
flowchart TD
    U["Project owner\nMakes final decisions and approves changes"]
    C["ChatGPT\nInspect code, explain architecture, suggest improvements\nNo Lovable instructions unless the owner explicitly asks"]
    L["Lovable\nVisual builder and editing environment\nOwner controls credit usage and applies changes"]
    G["GitHub repository\nVYNESHINDEN1417/vyneshinden\nSource history, backup, and code review"]
    V["Vercel\nBuild and hosting platform"]
    W["Live site\nvyneshinden.vercel.app"]
    D["Verification checklist\n• Confirm sync direction and branch settings\n• Check build status after repository updates\n• Test image paths and assets on production\n• Test mobile, desktop, and older browsers"]

    U --> C
    C -. "inspection and recommendations" .-> G
    C -. "inspection only by default" .-> L
    U -->|"approved edits"| L
    L <-->|"repository sync: verify settings"| G
    G -->|"connected deployment: verify settings"| V
    V --> W
    W -->|"report issues for analysis"| C
    D -. "quality checks" .-> W
```

## Roles and operating rules

- **Project owner:** You decide what changes are worth making and whether they should be passed to Lovable.
- **ChatGPT:** Inspect the repository and deployments, explain findings, propose improvements, and help verify results. Do not send instructions to Lovable unless you explicitly authorize that for a specific task.
- **Lovable:** The visual builder. You control when to spend credits and apply edits.
- **GitHub:** Repository backup and version history. Review changes and commits to understand what actually changed.
- **Vercel:** Deployment and hosting. A Git integration commonly triggers deployments from configured branches, but the exact branch, build settings, and sync direction must be checked in this project's settings.

## Known checks

- The live site is `https://vyneshinden.vercel.app/`.
- Broken images have previously been observed on the Vercel deployment. Verify asset paths, filename casing, and whether assets are included in the build output.
- This diagram documents the intended workflow; it does not prove that every connection or automatic sync is configured exactly as drawn.
