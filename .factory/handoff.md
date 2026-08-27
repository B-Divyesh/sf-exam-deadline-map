# Exam Deadline Map — build handoff

Work order: `exam-deadline-map-build-1`

Completed: 2026-08-27

Deploy type: static PWA; publish `dist/`

## What shipped

- A complete deck-to-deadline workflow: flexible Anki CSV import or manual counts, exam date, daily minute cap, editable time/repetition assumptions, and day-by-day new/review allocations.
- A planner that enforces the requested capacity contract. It uses the preferred cap first, allows at most a visible 15-minute overflow, and reports remaining card visits as unscheduled when the route is impossible.
- Completion tracking with an accessible progress indicator, automatic IndexedDB persistence, calendar CSV export, and full JSON backup/import.
- Explicit privacy and safety language: card text is never persisted or transmitted; the product is planning support, not an exam-result prediction.
- Installable offline PWA: manifest, 192/512 maskable icons, versioned service-worker cache, discovered Vite hashed bundles, offline fallback, lifecycle update toast, and repeat-visit offline operation.
- Plan Plus one-time unlock: Sociobot-hosted buy link, URL-token capture and cleanup, optimistic cached entitlement, at-most-daily verification, revoked-license handling, and paste-to-restore. The free steady planner, data export, accessibility, and safety behavior remain ungated.
- Responsive surreal editorial visual system with light/dark modes, reduced-motion behavior, custom paper-observatory hero, 44 px targets, visible focus treatment, and a deliberate 390 px layout.
- Static `/privacy/` and `/terms/` pages, complete README, MIT license, robots and sitemap files.

## Original artwork

The source PNG, factory-generated metadata, and prompt sidecar are in `assets/src/`. Reviewed result: no people, malformed text, logos, brands, watermarks, or unintended symbols. Shipping WebP sizes are 29 KB at 640×427 and 63 KB at 960×640. The exact prompt, generator, date, license/provenance statement, palette, typography, spacing, and motion policy are recorded in `.factory/design.md`.

## Run and verify

```bash
npm install
npm test
npm run build
npm run preview
```

The required clean build command is exactly `npm run build`; it produces `dist/index.html`. Final output budgets:

- Application JavaScript: 21.54 KB raw / 8.03 KB gzip (budget: 200 KB)
- CSS: 16.30 KB raw / 4.83 KB gzip (budget: 50 KB)
- Mobile hero WebP: 29 KB (budget: 300 KB)
- No downloaded fonts, runtime CDN scripts, analytics, or trackers

Verification completed locally against the production build on `http://127.0.0.1:4173`:

- `npm test`: 7/7 unit tests passed (planner constraints, impossible-plan reporting, date bounds, quoted CSV, classification fallback).
- `npm run audit:browser`: passed at 390×844; generated a 30-day plan, persisted a completed day across reload, focused the keyboard skip link first, found zero serious/critical Axe violations in light setup, dark/reduced-motion setup, and generated-plan states, and restored all 30 days with Playwright offline mode enabled.
- Factory `verify-url.sh`: HTTP 200, 534 ms local load, no console errors, one h1, `lang`, main landmark, all image alt text, and no unlabeled buttons.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.2 s, CLS 0, TBT 10 ms.
- `npm audit`: zero known vulnerabilities at handoff.

For the repeatable browser audit, start `npm run preview`, then run:

```bash
AUDIT_URL=http://127.0.0.1:4173 \
CHROME_PATH=/path/to/chrome \
npm run audit:browser
```

## Known gaps and release notes

- This is a transparent count-based workload forecast, not an FSRS simulator. Anki exports without a recognizable reps/type field are conservatively counted as previously reviewed; the UI tells the learner to correct those counts.
- Daily availability is a single recurring cap in v1. Individual rest days and per-weekday caps are sensible next additions, but are not needed for the researched smallest useful product.
- The factory must register `exam-deadline-map` with the Sociobot billing engine and ensure the hosted price matches the displayed $8 one-time price before release. Staging can set `VITE_BILLING_BASE=https://pilot-api.sociobot.in/api/v1`; production defaults to `https://api.sociobot.in/api/v1`. No product ID or secret is committed.
- Static hosting must preserve clean-directory routes for `/privacy/` and `/terms/`. The root planner itself is not dependent on SPA rewrites.
