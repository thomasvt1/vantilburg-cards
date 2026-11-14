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

The example generator captures all three registered cards, the popup and the editor preview in both themes at desktop and phone widths. It writes 24 PNGs, a source/output SHA-256 manifest and the README gallery. The freshness check normalizes source line endings; it does not compare image pixels between operating systems. The source digest covers the rendering source and scripts plus the installed versions of Lit, `@mdi/js` and Playwright from `package-lock.json`; the package version and unrelated development tooling do not invalidate the screenshots.

## Editor popup preview — 0.2.0

Six added browser tests cover inline Card / Popup switching, keyboard access, unsaved config and state changes, selection persistence across Home Assistant preview rebuilds, removal of the popup, independent editor ownership, dashboard layout-edit mode isolation and unchanged card heights in a tall preview container. The suite now contains 15 unit tests and 19 browser tests. Preview children are inert and receive Home Assistant's preview/edit-mode flags; previewing does not change browser history or open a modal.

A live Home Assistant House editor rendered the existing button-card, Quatt and OmniBattery children inline. An unsaved popup-title edit immediately updated the right-hand preview while Popup stayed selected. The title was restored without saving. No household dashboard configuration was changed.

CI checks the committed example manifest before regenerating examples. HACS metadata validation runs separately and is required by the tagged release workflow. HACS validation does not imply inclusion in the default HACS catalog. The initial live check used an inline module resource; installation through HACS has not been verified on this repository.

Unlike Quatt Cards, this package does not yet enforce Quatt's 81% per-card coverage gate. Passing test counts are not a coverage claim.

## Bubble popup runtime — 0.3.0

The production adapter instantiates the installed `custom:bubble-card` with standalone `cards` configuration. The modal implementation is no longer part of this library. The original section configuration remains unchanged; the adapter emits native Bubble separators and Lovelace grids. The Card / Popup editor preview is still an inert inline content preview, not a simulation of Bubble gestures or animation.

The browser integration suite loads the real official Bubble Card v3.4.3 bundle, pinned by SHA-256. It checks opening, Escape, Back/Forward and hash navigation, child state updates, removal on disconnect, and propagation of child more-info events through a Home Assistant shadow-root fixture. A separate test checks the missing-dependency message. There are 17 unit tests and 21 browser tests. The fixture is downloaded for development/tests only and is excluded from the distributed bundle; generated popup screenshots also use that real runtime.

The household preview was checked with the same installed Bubble Card v3.4.3: desktop and 390px layouts, scrolling to the climate controls, close button, Escape, and opening the native Home Assistant climate details panel from a Quatt child card. No device-control commands were sent. The main dashboard remained on its restored original configuration. Physical touch swipes and separate Firefox/Safari runs have not been verified.

## Rendering efficiency — Unreleased

Cards now re-render only when their own entities, theme, locale or unit configuration change. Other Home Assistant state updates are forwarded to the popup without re-rendering the summary card. The Bubble popup configuration is rebuilt only when the popup configuration, title, icon or theme changes; plain state updates are passed to Bubble directly. A popup whose loading is interrupted by a disconnect and reconnect is now created after the reconnect, without waiting for the next state update.

Two added browser tests cover these paths: a popup child receives unrelated state without re-rendering the card or calling Bubble's `setConfig`, while a theme change rebuilds the configuration once; and a reconnect during loading produces exactly one popup. Both tests fail on 0.3.0. There are 17 unit tests and 23 browser tests. All 24 regenerated example PNGs were byte-identical to 0.3.0. These changes have not yet been checked in a live Home Assistant dashboard.

CI caches the pinned Bubble Card fixture and Playwright's headless Chromium. The fixture download uses a 30-second timeout and up to three attempts.

## Compatibility boundaries

- Popup editing embeds Home Assistant's native stack/card editor. A child without a visual editor uses Home Assistant's YAML fallback.
- Child custom cards remain separate dependencies and retain their own device actions.
- Shared Bubble styling depends on Bubble's CSS hooks. Recheck it when upgrading Bubble Card.
- The tests cover Chromium. No separate Firefox or Safari run is claimed.
