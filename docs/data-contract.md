# Configuration and entity contract

vanTilburg Cards consumes explicitly configured Home Assistant entities. It does not discover integrations, rename entities, subscribe to Recorder history or synthesize backend sensors.

| Card | Input | Missing or invalid input |
| --- | --- | --- |
| Room temperature | Climate `current_temperature`, sensor state, or a configured attribute; precision 0–3 | Shows Unavailable. Celsius uses °; Fahrenheit retains °F. |
| Room lights | List of light entity IDs; duplicate IDs count once | Missing/unavailable lights are reported separately, not counted as off. |
| House | One to six named numeric percentage sensors in the range 0–100, or nonnegative readings with a `max` | Shows an em dash and an unavailable empty track. Zero is valid. Readings above `max` show a full bar. |
| Waste | Nonnegative integer days until collection; optional waste type and bin-out boolean | Missing/invalid days show unavailable, not today. The card never resets the bin-out flag. |
| Energy group | 1–30 power sensors in W, kW or MW; optional home consumption sensor | Unavailable devices are listed as Unavailable and left out of the total. With no available device the total is Unavailable, not 0 W. kWh and unitless sensors are not power. A remainder below zero shows 0 W. |
| Power | Any numeric sensor; optional second numeric sensor | Shows Unavailable. W/kW/MW use power formatting; other units keep their unit. |

Language follows Home Assistant for English and Dutch; other languages fall back to English. Labels may be overridden per card. Waste type names can be overridden by a YAML mapping.

Popups have a unique `#hash` within a view and an ordered list of sections. Each section contains ordinary Lovelace child-card configurations and one or two columns. The library compiles sections to Bubble separators and Lovelace cards/grids, passes state updates, and provides the shared palette. Bubble Card 3.4.3+ owns the actual popup, child-card lifecycle, scrolling, gestures, backdrop and closing/history behavior. Child cards own device-control behavior. The runtime host is isolated from the summary card's layout cell but remains inside Home Assistant's app so child more-info events reach HA. Disconnecting the card removes its runtime host.

Popup configuration is edited through the native Home Assistant card editor inside each section. Nested configuration-change events are captured without replacing the parent card configuration. Unknown child-card options are preserved. Nested popups are unsupported.

The public custom element names remain `home-room-card`, `home-house-card` and `home-waste-card`, as shipped in v0.1.0, joined by `home-energy-card` and `home-power-card`. The package, release asset and card-picker labels use vanTilburg Cards. Repository alignment does not require users to rewrite existing card types.
