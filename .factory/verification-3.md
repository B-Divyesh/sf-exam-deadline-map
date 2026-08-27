# Independent verification — PASS

Date: 2026-08-27  
Candidate commit: `30d98f3ee57f97d535f090955f6f15274a2306c6`  
Candidate subject: `docs: record repair verification handoff`  
Live URL: https://exam-deadline-map.sociobot.in

## Verdict

**PASS.** The candidate is buildable and the deployed product is byte-for-byte the candidate build. It meets the researched brief's local-first deadline-planning job, including malformed-input recovery and offline PWA use. No release-blocking defects were found. No product code was changed during verification.

## Clean-build evidence

- Started in a clean worktree at exactly the candidate SHA (`git status --porcelain` was empty).
- `npm ci` completed successfully: 173 audited packages, zero known vulnerabilities.
- `npm test` passed: 3 test files / 10 tests (CSV parsing, planner, and persisted-state validation).
- `npm run build` passed (`tsc --noEmit`, Vite production build, static-host policy writer) and produced `dist/`. There is no separate lint script; the build's TypeScript check is the available type check.
- Production output is within the static-PWA budgets: JS 24,919 B raw / 9.10 kB gzip, CSS 16,346 B raw / 4.85 kB gzip, and the mobile hero is 28,904 B. No third-party fonts are shipped.
- A Lighthouse CLI attempt was blocked by this container's Chrome launcher, which rejects the packaged Chromium before loading a page. This is recorded as an environment limitation, not a Lighthouse pass; all available Chromium performance-size, accessibility, console, responsiveness, and PWA checks passed.

## Candidate/live identity and transport policy

The live SHA-256 values exactly match `dist/` for the app HTML, `sw.js`, `manifest.webmanifest`, `offline.html`, privacy and terms pages, both hashed bundles, both hero images, and both icons. The live HTML references the candidate's exact `index-laaVlcbv.js` and `index-IzpXaw1b.css` assets.

Live HTTPS responses provide HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, a self-only CSP with `frame-ancestors 'none'`, and `X-Frame-Options: DENY`. The content-hashed JS and CSS responses have `Cache-Control: public, max-age=31536000, immutable`; the worker correctly remains short-revalidated (`max-age=30`). Chrome's `Page.getAppManifest` reports no manifest errors and recognizes the standalone display, scoped start URL, and 192/512 maskable icons.

## Product exercises

Local production preview and the deployed site were exercised in Chromium, using a fresh browser context for each recovery path.

- **Normal job:** 300 reviewed + 80 new cards generated a 30-day revision calendar. A keyboard Space completion persisted across reload; Enter submitted the form and exported the calendar CSV.
- **CSV:** a quoted-field `reps` CSV imported 2 rows as 1 new / 1 seen. Header-only input showed “This CSV has no card rows. Export a deck with a header row and try again.”
- **Invalid/recovery:** blank deck, negative cards, no cards, same-day exam, and four-minute availability produced the complete error summary and focused it. The exact parseable malformed backup `{"input":{}}` reports “That backup is not valid. No data was changed.” and retains the current plan. An intentionally corrupt IndexedDB record exposes **Clear invalid local data** and recovers in-app.
- **Boundaries/overload:** one card with the five-minute cap generated one study day and a one-minute session. A one-day 200,000 reviewed-card workload showed 399,880 visits unscheduled; the scheduled day was exactly 20 minutes (five-minute cap + the documented 15-minute maximum), never beyond the permitted band.
- **Privacy/network:** normal free-planner traffic made requests only to the product origin. No analytics, trackers, CDN scripts, or third-party fonts were observed. CSV remains local; IndexedDB and optional localStorage license storage are accurately described by `/privacy/` and `/terms/`. The only allowed external connect destinations in CSP are the documented optional Sociobot billing endpoints.

## Browser, accessibility, and responsive checks

- `npm run audit:browser` passed locally and with `AUDIT_URL=https://exam-deadline-map.sociobot.in`: zero serious/critical Axe findings, zero console/page errors, zero failed requests, visible keyboard skip link, state persistence, keyboard CSV export, corrupt-storage recovery, worker control, and offline plan reload.
- Axe was exercised in setup and generated-plan states: light and dark, 390×844 mobile and 1440×900 desktop, including `prefers-reduced-motion: reduce`; all serious/critical counts were zero.
- On the deployed site, the first Tab selects the skip link with a visible `rgb(181, 121, 0) solid 3px` focus outline. The data dialog opens modally with focus on its labelled close control. Mobile and desktop had no horizontal overflow (390/390 and 1440/1440 scroll widths); a generated desktop calendar contained all 30 day rows.
- Reduced-motion mode was included in the Axe/browser audit with no errors or accessibility regression.

## PWA/offline/update evidence

- The deployed page is controlled by `https://exam-deadline-map.sociobot.in/sw.js`; the precache contains the shell, hashed JS/CSS, images, icons, manifest, and offline page.
- After service-worker installation, `context.setOffline(true)` and reload retained all 30 generated calendar days, with no errors or failed requests.
- In an isolated copy of the exact built output, replacing the service worker with a new cache version and calling `registration.update()` showed “An update is ready. Refresh to use it.” The replacement worker entered activation, confirming the required update-notice path.

## Defects

None found (no P0, P1, or P2 defects).

## Reproduce

```bash
npm ci
npm test
npm run build
npm run preview -- --host 127.0.0.1
npm run audit:browser
AUDIT_URL=https://exam-deadline-map.sociobot.in npm run audit:browser
```
