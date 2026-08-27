# Exam Deadline Map — repair handoff

## Released

- Commit: `7f8f02b` (`fix: validate backups and harden static delivery`), pushed to `main`.
- Deployment: Azure Static Web Apps **Standard**, deployment `37f2e355-d80f-4df5-b9b3-4ba3142a6d8f`.
- Live URL: https://exam-deadline-map.sociobot.in

## What changed

1. JSON backups and IndexedDB records now pass strict, full schema validation before they are used or written. A generated plan is additionally checked against a freshly derived schedule, including every date, allocation, capacity result, and completion flag type. Invalid imports never replace the in-memory plan or reach persistence.
2. A legacy corrupt IndexedDB record no longer aborts startup. The planner opens a clear recovery notice with **Clear invalid local data**, which removes only the broken local record and keeps the user in the app.
3. Dark generated-plan kicker and exam-seal copy now use a contrast-safe deep coral (`#9B291C`) on the reversed parchment summary (6.79:1). The light summary preserves its bright coral treatment.
4. The build now writes `dist/staticwebapp.config.json`. It applies a scoped self-only CSP, `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `nosniff`, strict referrer policy, and one-year immutable cache headers only to Vite’s content-hashed JS/CSS assets.
5. Regression coverage now exercises the exact parseable malformed import `{"input":{}}`, legacy-corrupt storage recovery, dark generated-plan Axe scans at mobile and desktop widths, keyboard form submission, checkbox completion, and CSV export.

## Verification run

```bash
npm ci
npm test
npm run build
npm run preview
npm run audit:browser
AUDIT_URL=https://exam-deadline-map.sociobot.in npm run audit:browser
```

- `npm test`: 10 tests across 3 files, all passing.
- `npm run build`: passing. Output: JS 24.92 kB raw / 9.10 kB gzip; CSS 16.35 kB raw / 4.85 kB gzip. `dist/` contains the static host configuration.
- Local and live Chromium audits: no console errors, no failed requests, and no serious/critical Axe findings. The audit verifies a 30-day plan, persistence after keyboard Space completion, Enter-based form submission and CSV export, 390×844 mobile behavior, 1440×900 dark/reduced-motion plan accessibility, service-worker control, and offline reload with all 30 days retained.
- The exact malformed JSON import reports “That backup is not valid. No data was changed.” and leaves the existing plan intact. A raw `{"input":{}}` record injected into IndexedDB reloads to the recovery action and clears successfully in-app.
- Live header checks confirm `Content-Security-Policy` with `frame-ancestors 'none'`, `X-Frame-Options: DENY`, and `Cache-Control: public, max-age=31536000, immutable` on `/assets/index-laaVlcbv.js`.

## Known gap

The Lighthouse CLI could not run in this container because no Chrome Stable binary is installed; it rejects the packaged Playwright Chromium (`CHROME_PATH` launcher error). The equivalent live mobile accessibility, console, PWA/offline, keyboard, and performance-size checks above passed. No product issues remain known.

## Independent verifier result — PASS (2026-08-27)

Candidate `30d98f3ee57f97d535f090955f6f15274a2306c6` was independently verified against https://exam-deadline-map.sociobot.in. The live app shell, worker, manifest, legal pages, bundles, imagery, and icons hash-identically match the candidate build. Clean `npm ci`, all 10 unit tests, TypeScript production build, local/live browser audits, desktop/mobile accessibility, keyboard, malformed-input recovery, privacy/network, headers/cache, worker update, and offline reload checks passed. There are **no P0/P1/P2 defects**. Full evidence and commands: `.factory/verification-3.md`.
