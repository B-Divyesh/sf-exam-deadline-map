# Independent verification — FAIL

Date: 2026-08-27  
Candidate commit: `ffef95374471fa8118844a167d26d1eb44326eae`  
Live URL: https://exam-deadline-map.sociobot.in

## Verdict

**FAIL.** The live deployment is byte-identical to the candidate's built app shell and assets, so the two release blockers below affect both. No product code was modified during this verification.

## Environment and build evidence

- Began from a clean `main` worktree at exactly `ffef95374471fa8118844a167d26d1eb44326eae`.
- `npm ci` completed; `npm audit` reported zero known vulnerabilities.
- `npm test` passed: 2 files, 7 tests.
- `npm run build` passed (`tsc --noEmit && vite build`) and produced `dist/`.
- There is no separate lint/type-check script; the build's TypeScript check passed.
- Output budgets: JS 21.54 kB raw / 8.03 kB gzip; CSS 16.30 kB raw / 4.83 kB gzip; mobile hero 28,904 bytes. All are within the stated static-PWA budgets.
- A Lighthouse CLI run could not be completed in this container: its launcher rejected the packaged Chromium, and a direct remote-debugging attempt crashed the Lighthouse tab. This is an environment limitation, not a pass; the Playwright checks below did run against Chromium successfully.

## Live/candidate identity

The following live resources had the same SHA-256 as `dist/`: `/`, `/sw.js`, `/assets/index-aay-4b91.js`, `/assets/index-C9SrSc-q.css`, `/manifest.webmanifest`, `/offline.html`, `/privacy/`, and `/terms/`. The live HTML points to the candidate's exact hashed JS and CSS bundles.

## End-to-end exercises

Local production preview and the live deployment were exercised in Chromium. The repository browser audit passed on both at 390×844:

- normal plan: 300 reviewed + 80 new cards created a 30-day calendar; completing a day survived reload;
- offline reload: all 30 generated days returned with `context.setOffline(true)` after service-worker install;
- keyboard: the skip link was first in tab order and had a solid visible focus outline; Enter submitted the form and exported the calendar;
- representative CSV: `reps` values imported 3 rows as 2 new and 1 reviewed; quoted-field parsing is covered by unit tests;
- boundary: a five-minute cap was respected; a one-day, 199,998-card workload visibly reported 499,961 unscheduled visits rather than hiding overload;
- malformed/recovery: empty-header-only CSV produced a useful error; syntactically invalid JSON said “That backup is not valid. No data was changed” and retained a 30-day plan;
- desktop 1440×900 and mobile 390×844 layout/function smoke tests completed without console/page errors. Mobile visual inspection found usable stacked controls and calendar rows.

Normal free-planner traffic made requests only to the same origin; no analytics, trackers, CDN fonts, or third-party runtime scripts were observed. CSV card content remains client-side. The privacy and terms routes load and document IndexedDB/localStorage use and the optional Sociobot license call.

Service-worker update behavior was also simulated against the built app by serving a changed worker version: it installed the changed cache and displayed “An update is ready. Refresh to use it.” No page errors occurred. The installed service worker uses `skipWaiting` and `clientsClaim`.

## Accessibility and runtime results

- Repository `npm run audit:browser`, local and live: zero serious/critical Axe findings for its mobile setup/dark/reduced-motion/generated-plan coverage; zero console/page errors; zero failed requests.
- Additional independent desktop Axe scan of a generated plan in light mode: zero serious/critical findings.
- Additional independent desktop dark + reduced-motion scan: **one serious violation** (`color-contrast`), detailed below.
- `prefers-reduced-motion` reduces day-card animation duration to `0.01ms`.

## Defects

### P1 — malformed but parseable backup bricks the planner after refresh

Steps reproduced locally and on the live URL in a fresh browser context:

1. Open **Your data**.
2. Import a file containing exactly `{"input":{}}`.
3. Reload.

The import reports its failure message but has already persisted the malformed state. Reload throws `TypeError: Cannot read properties of undefined (reading 'replace')`; `#app` remains “Opening your local map…”. Boot aborts before the data-button listener is attached, so the in-app deletion/recovery control is unavailable. This violates the required malformed-input/recovery behavior and can make a user's local planner unusable until browser storage is cleared externally.

### P1 — serious contrast failure in dark generated-plan state

Independent Axe 4.13.0 scan at 1440×900, dark scheme and reduced motion, reports `color-contrast` (serious):

- `.plan-summary .kicker`: `#ff8a73` on `#f7f0e3`, ratio **2.02:1**, 12.48 px bold.
- `.deadline-seal small`: same colors, ratio **2.02:1**, 9.6 px bold.

Both are below the required 4.5:1. This is a release blocker under the accessibility contract.

### P2 — live response lacks CSP and anti-framing protection

Live HTTPS responses include HSTS, `nosniff`, strict referrer policy, and legacy `X-XSS-Protection`, but do not send `Content-Security-Policy`, `frame-ancestors`, or `X-Frame-Options`. Add an appropriately scoped CSP and framing policy at deploy time.

### P2 — hashed assets are not immutable-cached on the live host

Both `/sw.js` and `/assets/index-aay-4b91.js` respond with `Cache-Control: public, must-revalidate, max-age=30`. The worker needs a short revalidation window, but the content-hashed assets should receive long-lived immutable caching as required by the PWA performance policy.

## Required next steps

1. Validate backup schema before mutating or persisting state; keep the existing state untouched on every invalid import and ensure recovery remains reachable.
2. Correct the dark plan-summary/deadline-seal palette and rerun Axe in generated-plan dark mode at desktop and mobile sizes.
3. Set CSP/framing headers and immutable cache policy for hashed assets, then redeploy.
4. Rerun this verification against the new commit and deployed URL.
