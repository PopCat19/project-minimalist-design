# PMD Mockup Examples

## PMQuickshellMockup (1440x1024)

Primary Hue: 345° (Pink/Rose)
Auxiliary Hue: 165° (Teal) [(345 + 180) mod 360]

### Color Palette

Light Scheme OKLCH Mapping:
- 100x = oklch(0 0 0) - Black/lowest priority
- 88x = oklch(0.28 0.032 0) - Primary lightness
- 80x = oklch(0.2 0.032 0) - Secondary lightness
- 64x -> 72x = oklch(0.56 0.094 0) - Accent lightness
- 8x = oklch(0.88 0.056 0) - Base lightness
- 0x = oklch(1 0 0) - White/highest priority

Dark Scheme OKLCH Mapping:
- 100x = oklch(1 0 0) - White/highest priority
- 88x = oklch(0.88 0.056 0) - Primary lightness
- 80x = oklch(0.8 0.1 0) - Secondary lightness
- 64x -> 72x = oklch(0.72 0.122 0) - Accent lightness
- 8x = oklch(0.2 0.032 0) - Base lightness
- 0x = oklch(0 0 0) - Black/lowest priority

DEPRECATED:
- 96x = oklch(0.96 0.016 0) - Near-white [REDUNDANT - use 100x instead]

Actual Colors:
- 100x: #FFFFFF [100%, 32%]
- 88x: #FFC2D1 [100%, 24%]
- 88x+12: #C2FFF0 [100%, 24%]
- 80x: #FF99B2 [100%, 48%, 12%, 8%]
- 80x+12: #99FFE5 [100%, 48%, 12%, 8%]
- 64x: #FF4775 [100%, 80%]
- 8x: #1E0B10 [100%, 80%, 64%, 40%]
- 0x: #000000 [100%, 80%, 64%, 40%]

### Implementation Notes
Demonstrates complete dark scheme implementation with complementary accents.
Uses Fredoka for typography, FiraCode Nerd Font for icons and monospace.
Applies 24% backdrop blur to base translucent surfaces.
