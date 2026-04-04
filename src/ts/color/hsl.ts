// color-hsl.ts
//
// Purpose: Converts HSL color values to RGB
//
// This module:
// - Implements HSL-to-RGB color space conversion
import type { RGB } from "./oklch";

export function hslToRgb(h: number, s: number, l: number): RGB {
	h /= 360;
	const a = s * Math.min(l, 1 - l);
	const f = (n: number): number => {
		const k = (n + h * 12) % 12;
		return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
	};
	return {
		r: Math.round(f(0) * 255),
		g: Math.round(f(8) * 255),
		b: Math.round(f(4) * 255),
	};
}
