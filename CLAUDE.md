# Proline Electrical Works website

Read `PROGRESS.md` before doing anything: it lists the owner's rules (no prices, Delhi only, no AI assistant, no invented facts), what is done, what is not, and where each thing lives. After each finished step, tick it in `PROGRESS.md`, add a session-log line, then commit and push to `main`.

- Stack: Astro 5 static site, Markdown content in `src/content/`, Cloudflare Pages.
- Build: `npm run build`. Content rules: `node scripts/check-content.mjs`. Writing guide: `docs/content-brief.md`.
- Never redo a ticked item unless the owner asks for a change.
