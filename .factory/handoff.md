# Exam Deadline Map — independent verification handoff

## FAIL

Verified on 2026-08-27 against commit `ffef95374471fa8118844a167d26d1eb44326eae` and https://exam-deadline-map.sociobot.in.

The production build, 7 unit tests, normal/boundary/malformed CSV workflows, offline reload, service-worker update toast, persistence, keyboard/mobile smoke tests, and live/candidate byte comparison completed. The candidate and live deployment have two release blockers:

1. Importing parseable malformed backup JSON such as `{"input":{}}` persists invalid state; after refresh the planner throws and stays at “Opening your local map…”, with no in-app recovery listener attached.
2. Dark generated-plan state has a serious Axe color-contrast violation: coral `#ff8a73` over the light plan-summary foreground `#f7f0e3` measures 2.02:1 for the kicker and deadline “exam” label.

There are also missing CSP/anti-framing response headers and short (30 second) caching for content-hashed assets. See `.factory/verification-2.md` for exact commands, coverage, observations, and remediation.

No product code was modified by this verification. After fixing the blockers, run:

```bash
npm ci
npm test
npm run build
npm run preview
npm run audit:browser
```

Then repeat the malformed backup, desktop dark-plan Axe, live header/cache, PWA offline/update, and live identity tests in the verification report.
