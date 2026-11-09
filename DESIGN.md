# Shipped design

Mode: Operate. Preserve the existing calm pastel household dashboard.

Room tiles use a 104px minimum height, 18px corners, 40px circular icon background, 13px medium name and 23px semibold temperature. Text summaries use 14px. Overview summary cards use 44px icons, 16px names, 13px secondary text and 16px padding. House meters use 6px tracks with 16px gaps.

Ten named palettes each define a light/dark surface, icon background and accent in `src/appearance.ts`. Foreground and secondary text inherit Home Assistant theme variables. Native buttons provide keyboard activation and a 3px visible focus outline; missing readings are explicit text rather than apparent zero values.

Popups use a 560px maximum width, 28px corners, viewport-constrained scrolling, a sticky header, and a close button. Sections have a 16px title, optional icon and quiet divider; child cards use one or two equal columns with an 8px gap. Mobile keeps 12px side space and a 16px top margin. Native dialogs provide modal focus containment.

Reference captures in `examples/` are generated from fictional demo data at desktop/mobile widths in light/dark themes. Native Home Assistant preview validation is separate from these mock fixtures.
