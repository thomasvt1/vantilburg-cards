# vanTilburg Cards

Compact Home Assistant cards for room temperatures, lights, household storage and waste collection. Shared pastel palettes preserve a calm overview in light and dark themes. Each card can open a built-in popup made of reusable **sections + cards**.

![Light overview](examples/desktop-light.png)

## Cards

| Type | Purpose |
| --- | --- |
| `custom:home-room-card` | Temperature from a climate entity/sensor, or a count of lights on |
| `custom:home-house-card` | One to six named percentage sensors and progress bars |
| `custom:home-waste-card` | Days until collection, waste type, optional bin-out flag |

No backend integration is required. These cards read existing entity states. A popup's child cards retain their own actions and dependencies.

## Install

Requires Home Assistant 2026.10 or newer and a current browser with native dialog support.

Add this repository as a custom dashboard-card repository in your community-card installer, then install **vanTilburg Cards**. The JavaScript release asset is `vantilburg-cards.js`.

For manual installation, copy that release asset into `/config/www/vantilburg-cards.js`, then add `/local/vantilburg-cards.js?v=0.1.0` as a **JavaScript module** dashboard resource. Change the version query when updating and refresh the browser. Register only one copy of the module.

The three cards appear in the card picker. Visual editors configure entities, labels, palettes, meters, navigation and appearance. Under **On tap**, enable a popup and set its title, icon and unique link. Add, remove or reorder sections and choose one or two columns. Each section embeds Home Assistant's native stack/card editor to add, edit, reorder and remove child cards. Child cards without a visual editor use HA's normal YAML fallback. Advanced `type_names` mappings remain available through YAML.

## Room and popup

```yaml
type: custom:home-room-card
name: Bedroom
icon: mdi:bed-king-outline
entity: climate.bedroom
palette: purple
popup:
  hash: '#bedroom'
  sections:
    - title: Lights
      icon: mdi:lightbulb-outline
      cards:
        - type: tile
          entity: light.bedroom
          features:
            - type: light-brightness
    - title: Climate
      icon: mdi:thermometer
      cards:
        - type: tile
          entity: climate.bedroom
          features:
            - type: target-temperature
        - type: custom:quatt-chill-card
          layout: slim
```

The popup inherits the card's palette. Its optional `title` and `icon` override the header. Each section takes an optional `title`, `icon`, `columns` (1 or 2), and a `cards` list using ordinary Lovelace configuration. Quatt, OmniBattery, Bubble and other custom child cards must be installed separately. Native cards also work. A popup with native children needs no Bubble Card dependency.

Bubble children without an explicit `styles` field receive a shared palette and on/off styling preset, including children inside grids/stacks. This removes repeated per-room CSS. A child's explicit `styles` bypasses the preset. The adapter uses Bubble's styling hooks and should be rechecked when updating Bubble Card.

Use a **unique hash per popup within a view**. Opening it adds a browser-history entry; Back, Escape, the close button and clicking outside dismiss it. Forward or a direct hash link opens it again. Child cards are created lazily through Home Assistant's `loadCardHelpers()` and receive state updates. Nested popup definitions are not supported.

An embedded popup replaces `tap_action`. To retain an existing external popup instead, omit `popup` and configure:

```yaml
tap_action:
  action: navigate
  navigation_path: '#existing-popup'
```

Supported actions are `none`, `navigate` (local path/hash), and `more-info` (optional `entity`). Household/device actions belong in popup child cards. A house card needs an explicit entity for `more-info`.

Room options: `entity`, optional `attribute` (defaults to `current_temperature` for climate entities and state for sensors), `precision` (0–3, default 1), `display` (`auto`, `temperature`, `lights`), and `lights` (entity list). Auto shows temperature when an entity is configured; otherwise it counts lights. Missing sensors show **Unavailable**; missing lights are not counted as off. Celsius uses the compact ° suffix; Fahrenheit remains °F.

```yaml
type: custom:home-room-card
name: Hallway
icon: mdi:stairs
palette: slate
display: lights
lights:
  - light.hallway
  - light.landing
```

## House summary

```yaml
type: custom:home-house-card
name: House
meters:
  - entity: sensor.battery_percentage
    name: Battery
    palette: mint
  - entity: sensor.heat_storage_percentage
    name: Heat
    palette: purple
```

Sensors must report percentages from 0 to 100. Zero is valid; unavailable, nonnumeric and out-of-range values show an em dash and an empty unavailable track. Meter labels remain visible alongside the bars.

## Waste collection

```yaml
type: custom:home-waste-card
entity: sensor.collection_days
type_entity: sensor.collection_type
moved_entity: input_boolean.bin_put_out
type_names:
  pmd: PMD
  gft: Organic waste
```

`entity` must report a nonnegative integer number of days, not a timestamp. Today/tomorrow/future labels are automatic; `name` optionally overrides that title. `type_entity`, `moved_entity` and `type_names` are optional. `type_names` keys are lowercase waste states; PMD, GFT, paper and residual waste have English/Dutch defaults. A bin-out flag is informational; the card never resets it or changes collection schedules.

## Appearance and language

All cards accept `name`, `icon`, `palette`, `language` and `appearance`. Palettes: `blue`, `peach`, `purple`, `teal`, `pink`, `indigo`, `slate`, `green`, `mint`, `neutral`. Theme mode follows Home Assistant. `language` is `auto` (default), `en` or `nl`; other HA languages fall back to English.

Optional `appearance` fields: `background`, `background_dark`, `accent`, `accent_dark`, `icon_background`, `icon_background_dark` (CSS colors), and `border_radius` (0–48 pixels). Popup palette variables flow to child cards; custom child cards may override them.

## Development

```sh
npm ci
npm run build
npm test
npx playwright install --only-shell chromium
npm run test:browser
npm run dev
npm run screenshots
```

The demo uses fictional entities and values. Browser tests cover rendering, state changes, themes, navigation, progress accessibility, editor configuration preservation and popup history/focus. CI repeats the checks and uploads light/dark desktop/mobile demo captures. The build produces a single bundled module in `dist/`.

## Foundations

Based on [Quatt Cards](https://github.com/thomasvt1/quatt-cards) and [OmniBattery Cards](https://github.com/thomasvt1/omnibattery-cards): Lit + TypeScript, a shared base card, appearance settings, card-picker registration, visual editors, Vite library builds and browser tests. The domain-specific discovery/backend layers are not needed here.

Licensed under AGPL-3.0-or-later. Bundled dependency notices are in [THIRD_PARTY_NOTICES.txt](THIRD_PARTY_NOTICES.txt).
