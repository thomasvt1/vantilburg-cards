# Changelog

## 0.4.0 — 2026-11-14

- Add the Energy group card: a group of power sensors with its combined draw, share of home use and devices listed by draw, idle devices muted and unavailable devices kept explicit.
- Add a remainder mode to the Energy group card that shows home use not measured by plugs.
- Add the Power card: one power or percentage tile with an optional second reading.
- Let House meters take a `max`, so non-percentage readings such as phase current show their unit against a full scale.
- Visual editors for the new cards, a device list editor and example screenshots for both cards.
- Re-render cards only when their own entities, theme, locale or units change; still forward state to popup children.
- Rebuild the Bubble popup configuration only when the popup, title, icon or theme changes.
- Create the popup after a disconnect/reconnect interrupts loading, instead of waiting for the next state update.
- Stop the package version and unrelated dev dependencies from invalidating the committed example screenshots.
- Cache the Bubble Card fixture and Playwright Chromium in CI, and retry the fixture download.

## 0.3.0 — 2026-11-09

- Replace the custom dialog with Bubble Card's native standalone popup, preserving its scrolling, positioning, animations, gestures and close behavior.
- Require Bubble Card 3.4.3 or newer for popups and show a clear installation message when missing.
- Keep the existing section editor, palette styling and noninteractive unsaved preview.
- Test runtime behavior and generate popup examples using the real pinned Bubble Card release.

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
