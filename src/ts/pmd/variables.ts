// pmd-variables.ts
//
// Purpose: Defines PMD color system variables and composition helpers
//
// This module:
// - Provides dark and light PMD variable presets
// - Implements color compositing and baking functions
// - Calculates auxiliary hue offsets
export interface PMDVariable {
	l: number;
	c: number;
	h?: number;
}

export type PMDVariables = Record<string, PMDVariable>;

export const PMD_DARK: PMDVariables = {
	"100x": { l: 1.0, c: Math.LN2 },
	"88x": { l: 0.88, c: 0.056 },
	"80x": { l: 0.8, c: 0.1 },
	"72x": { l: 0.72, c: 0.122 },
	"8x": { l: 0.2, c: 0.032 },
	"4x": { l: 0.16, c: 0.022 },
	"0x": { l: 0.0, c: Math.LN2 },
};

export const PMD_LIGHT: PMDVariables = {
	"100x": { l: 0.0, c: Math.LN2 },
	"88x": { l: 0.28, c: 0.032 },
	"80x": { l: 0.2, c: 0.032 },
	"72x": { l: 0.32, c: 0.052 },
	"8x": { l: 0.88, c: 0.056 },
	"4x": { l: 0.92, c: 0.044 },
	"0x": { l: 1.0, c: Math.LN2 },
};

export function composite(
	bg: PMDVariable,
	fg: PMDVariable,
	alpha: number,
): PMDVariable {
	return {
		l: bg.l * (1 - alpha) + fg.l * alpha,
		c: bg.c * (1 - alpha) + fg.c * alpha,
	};
}

export function bake(
	pmd: PMDVariables,
	fg: PMDVariable,
	alpha: number,
): PMDVariable {
	return composite(pmd["0x"], fg, alpha);
}

export function getComputed(pmd: PMDVariables): {
	surface: PMDVariable;
	muted: PMDVariable;
} {
	return {
		surface: composite(pmd["8x"], pmd["80x"], 0.16),
		muted: bake(pmd, pmd["80x"], 0.8),
	};
}

export const HUE_MAX = 360;
export const AUX_HUE_OFFSET = 180;

export function getAuxHue(hue: number): number {
	return (hue + AUX_HUE_OFFSET) % HUE_MAX;
}

export function getPMD(isDark: boolean): {
	pmd: PMDVariables;
	computed: ReturnType<typeof getComputed>;
} {
	const pmd = isDark ? PMD_DARK : PMD_LIGHT;
	return { pmd, computed: getComputed(pmd) };
}
