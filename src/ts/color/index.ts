// color-index.ts
//
// Purpose: Barrel export module for color conversion utilities
//
// This module:
// - Re-exports HSL and OKLCH conversion functions
export { hslToRgb } from "./hsl";
export type { RGB } from "./oklch";
export {
	clampChroma,
	getContrastColor,
	isInGamut,
	maxChroma,
	oklchToRgb,
	rgbToHex,
	safeOklchToRgb,
} from "./oklch";
