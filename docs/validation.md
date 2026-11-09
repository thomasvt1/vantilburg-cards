# Validation

## Initial release — 9 November 2026

- TypeScript checking and Vite production build passed.
- 15 unit tests passed for room readings, summary readings and child-card styling.
- 13 Chromium browser tests passed for rendering, state updates, unavailable values, themes, navigation, popup history/focus and visual-editor configuration preservation.
- GitHub CI and the v0.1.0 release workflow passed.

The browser suite renders actual Lit components with synthetic Home Assistant state. Demo screenshots use fictional entities and readings; they are not household screenshots.

The bundle was loaded as a dashboard module in a separate live Home Assistant preview. All three card types rendered real entities. Room, house and waste popups composed the existing Bubble, Quatt, OmniBattery and other child cards. Opening a Quatt climate details panel worked from inside the popup. Desktop and 390px phone popup layouts were visually checked.

The live visual editor added a section and a native child card, and saved a changed section title. Reading the stored dashboard configuration confirmed both changes; the temporary test changes were removed afterward. The original household dashboard was not modified. No device-control commands were executed during validation. Private screenshots and entity identifiers are excluded from this repository.

## Repository conventions

The example generator captures all three registered cards and the popup in both themes at desktop and phone widths. It writes 20 PNGs, a source/output SHA-256 manifest and the README gallery. The freshness check normalizes source line endings; it does not compare image pixels between operating systems.

CI checks the committed example manifest before regenerating examples. HACS metadata validation runs separately and is required by the tagged release workflow. HACS validation does not imply inclusion in the default HACS catalog. The initial live check used an inline module resource; installation through HACS has not been verified on this repository.

Unlike Quatt Cards, this package does not yet enforce Quatt's 81% per-card coverage gate. Passing test counts are not a coverage claim.

## Compatibility boundaries

- Popup editing embeds Home Assistant's native stack/card editor. A child without a visual editor uses Home Assistant's YAML fallback.
- Child custom cards remain separate dependencies and retain their own device actions.
- Shared Bubble styling depends on Bubble's CSS hooks. Recheck it when upgrading Bubble Card.
- The tests cover Chromium. No separate Firefox or Safari run is claimed.
