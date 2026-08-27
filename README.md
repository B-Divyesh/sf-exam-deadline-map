# Exam Deadline Map

Exam Deadline Map turns existing flashcard history into a realistic day-by-day route to an exam. It is for self-directed learners who know their deadline and daily time budget, but do not want to run every deck at maximum intensity for months.

The app imports an Anki-style CSV (or accepts manual counts), separates new and previously reviewed cards, and schedules the required card visits across every day before the exam. If the work does not fit, it says exactly how many visits remain unscheduled. A planned day never exceeds the chosen cap by more than 15 minutes.

Live site: [exam-deadline-map.sociobot.in](https://exam-deadline-map.sociobot.in)

## Features

- Flexible CSV import with quoted-field support and `reps`, `reviews`, `type`, or `status` classification
- Editable timings, passes, repetitions, exam date, and daily minute cap
- Steady free plan with visible overload and unscheduled-work warnings
- Day completion tracking, calendar CSV export, and full JSON backup/import
- IndexedDB persistence; deck data never leaves the browser
- Installable PWA with a verified offline return path
- Light and dark treatments, keyboard operation, reduced-motion fallback
- Optional $8 one-time Plan Plus license for front-loaded and gentle-ramp pacing

This is planning support, not a prediction of recall, grades, or exam results. It does not replace Anki or create flashcards.

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open the URL printed by Vite. No environment variables are required for the free planner.

## Test and build

```bash
npm test
npm run build
npm run preview
```

The exact production build command is `npm run build`. Static output lands in `dist/`, with `dist/index.html` at its root.

The browser audit expects the preview server on port 4173 and Chromium at the factory worker path. Override either path if needed:

```bash
AUDIT_URL=http://127.0.0.1:4173 \
CHROME_PATH=/path/to/chrome \
npm run audit:browser
```

## CSV format

The first row must contain column names. Most Anki CSV exports work as-is. If a `reps`, `reviews`, `review_count`, `type`, `state`, `status`, or `queue` column is present, zero/unseen rows are counted as new. Without one of those columns, rows are treated as previously reviewed and the UI explains that the counts can be corrected manually.

Card text is parsed only long enough to count rows. It is neither persisted nor uploaded.

## Planning model

A familiar card consumes `review passes × seconds per review`. A new card consumes `seconds per new card + later visits × seconds per review`. Integer visits are distributed according to the selected pace. Each day is capped at the preferred daily minutes plus a visible 15-minute safety band. Work beyond that band is reported as unscheduled rather than hidden in impossible days.

## Billing configuration

The app uses the Sociobot license API and never embeds a payment provider. Production defaults to `https://api.sociobot.in/api/v1`. Set `VITE_BILLING_BASE=https://pilot-api.sociobot.in/api/v1` for a registered staging product. No product ID or secret is stored in this repository.

## Deployment and privacy

Deploy the contents of `dist/` to any static host with clean-directory support. `/privacy/` and `/terms/` are static routes. The service worker precaches the app shell and discovers Vite’s hashed entry assets during installation.

User plan data is local in IndexedDB. License tokens and their cached daily verdict are localStorage entries. There are no analytics, ads, third-party fonts, or third-party runtime scripts.

## License

[MIT](LICENSE)
