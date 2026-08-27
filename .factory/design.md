# Visual thesis — The observatory of finite time

Exam Deadline Map uses **surreal editorial scenery** to turn an abstract deadline into a landscape a learner can navigate. The signature scene is a paper observatory floating over an ink-dark plain: a calendar ribbon crosses a sculptural eye/sundial and runs toward one coral-red exam marker. It explains the product (time made spatial, capacity made visible) rather than decorating it. The working interface keeps that editorial character through ruled paper, clipped labels, circular celestial markers, and a horizon-like timeline—never a generic dashboard grid.

## Palette

The light treatment is deliberately warm, like a marked-up revision notebook; the dark treatment is an evening observatory rather than an inverted UI.

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| Paper / background | `#F3EBDD` | `#171713` | page field |
| Sheet / surface | `#FFF9EE` | `#23231D` | working layer |
| Ink / text | `#18201D` | `#F7F0E3` | primary copy |
| Pencil / muted | `#59635E` | `#BFC5BC` | secondary copy |
| Coral / accent | `#AD3825` | `#F2775F` | deadline and primary action |
| Moss / success | `#285E4D` | `#70C3A0` | workable capacity |
| Ochre / warning | `#86610C` | `#F2C767` | overload warning |
| Plum / danger | `#852F49` | `#FF8FAA` | invalid and destructive states |
| Rule | `#C9BDAA` | `#4A4A40` | boundaries and graph lines |

All foreground/token combinations used for text meet WCAG AA. State is always paired with an icon or label, never color alone. The mode follows the operating system; both are explicitly painted.

The generated-route summary uses its own contrast-safe signal treatment: light mode retains coral `#FF8A73` on the ink summary; dark mode uses deep coral `#9B291C` on the parchment summary (6.79:1). This preserves the deadline marker’s meaning after the summary reverses its surface in dark mode.

## Typography and spacing

- Display: `Georgia`, `Iowan Old Style`, `Times New Roman`, serif. The irregular editorial serif makes the deadline feel consequential, not gamified.
- Utility/body: `Aptos`, `Segoe UI`, system-ui, sans-serif. It keeps inputs, dense numbers, and the calendar highly legible without a font download.
- Type scale: 14, 16, 18, 23, 31, and fluid 44–68 px. Body is never below 16 px. Calendar figures use tabular numerals.
- Spacing follows a 4/8 px rhythm: 4, 8, 12, 16, 24, 32, 48, 72. Reading measures stay between 45 and 72 characters.
- Corners are restrained (2–12 px); clipped ticket corners and one circular motif create identity. Cards appear only for independent days or decisions.

## Interaction grammar

- The setup is a three-stop route—deck, deadline, pace—with a persistent paper-map summary. The primary action is always the coral “Draw my plan” button.
- The calendar is a horizontal horizon on wide screens and a vertical itinerary on phones. Days expose the work mix and minutes; overload days carry an explicit “Over cap” stamp.
- Assumptions are readable before generation and editable afterward. Replanning preserves imported data and study completion history.
- Completion is tactile: checking a day crosses its route line and updates progress immediately. Destructive reset names what it removes and requires confirmation.
- Buttons and inputs have 44 px minimum targets, visible ochre/coral focus halos, immediate pressed states, and plain-language feedback.

## Motion policy

- Initial scene layers settle vertically over 420 ms; calendar days reveal from the deadline backward in 30 ms increments (maximum 360 ms). Replanning uses a 220 ms paper-slide transition. Only opacity and transforms animate.
- No decorative loops or parallax. The deadline marker may pulse once after generation, never continuously.
- Under `prefers-reduced-motion: reduce`, all movement and smooth scrolling become instant; hierarchy remains through scale, tone, and layering.

## Asset plan and provenance

### `hero-observatory`

- Purpose: explanatory landing/setup illustration and install splash identity.
- Subject/world: a lone folded-paper observatory on an ink-dark plain; a ribbon of calendar squares travels through a circular brass instrument toward a coral exam marker; no people.
- Materials/light/lens: torn paper, graphite, oxidized brass, dry pigment; long dawn side-light; slightly elevated 50 mm editorial still-life framing.
- Palette words: parchment, carbon ink, coral signal, moss shadow, ochre brass.
- Negative list: no text, letters, numbers, logos, watermarks, UI screenshots, gradients, people, brands, school clichés, floating glass cards, photorealistic stock aesthetic.
- Prompt: “Surreal editorial still-life for an exam planning web app: a folded parchment observatory rising from a charcoal paper landscape, a ribbon made of blank calendar tiles threading through a circular brass astrolabe and converging on one small coral-red flag at the horizon, graphite route marks and moss-green shadows, tactile torn paper and dry-pigment texture, long soft dawn side light, slightly elevated 50 mm composition, generous quiet negative space, sophisticated magazine illustration, coherent physical shadows. No people, no text, no letters, no numbers, no logos, no watermark, no brands, no classroom clichés, no glossy 3D, no neon, no generic gradient.”
- Generator: factory Azure image deployment via `/opt/fleet/lib/gen-image.sh`, 1536×1024, medium quality, 2026-08-27. Original generated asset; no third-party source material. Source prompt sidecar retained in `assets/src/`.
- Delivery: reviewed source PNG retained in `assets/src/`; responsive WebP derivatives in `public/assets/`, each ≤300 KB. The footer discloses AI-assisted original imagery.

### Hand-authored marks

Compass, clock, warning, download, and check symbols are authored as inline SVG/CSS from basic geometry for this product. App icons use the same calendar-ribbon/astrolabe mark and palette. They contain no third-party assets.
