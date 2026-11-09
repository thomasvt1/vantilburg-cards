# Changelog

## 0.2.1 — 2026-11-09

- Remove the unavailable-light count from room summaries, keeping the lights-on count compact.

## 0.2.0 — 2026-11-09

- Add an editor-only Card / Popup preview toggle that reflects unsaved changes without navigation or device-control actions.
- Preserve the preview selection across Home Assistant draft rebuilds, with keyboard-accessible switching.
- Keep the original card height beneath the preview toggle, including inside tall editor containers.

- Align README presentation, installation instructions and configuration reference with Quatt Cards.
- Add CI/HACS/release badges, an Add to HACS link and a library mark.
- Generate per-card light/dark desktop/phone previews and keep the README gallery and screenshot manifest in sync.
- Check example freshness in CI and validate HACS metadata before tagged releases.
- Add a complete example dashboard, validation notes and configuration contract.

## 0.1.0 — 2026-11-09

- Add room, house and waste collection cards with shared light/dark palettes.
- Add embedded popups with repeated sections and ordinary Lovelace child cards.
- Add visual editors for cards, popup headings, sections, columns and child cards.
- Share Bubble child-card styling while preserving explicit style overrides.
- Add unit/browser tests, synthetic demo captures and an installable release bundle.
