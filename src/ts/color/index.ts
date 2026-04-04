// color-index.ts
//
// Purpose: Barrel export module for color conversion utilities
//
// This module:
// - Re-exports HSL and OKLCH conversion functions
export { hslToRgb } from "./hsl";
export type { RGB } from "./oklch";
export { getContrastColor, oklchToRgb, rgbToHex } from "./oklch";
