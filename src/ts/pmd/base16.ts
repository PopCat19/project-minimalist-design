// pmd-base16.ts
//
// Purpose: Generates Base16 color palettes from PMD variables
//
// This module:
// - Defines Base16 color slot mappings
// - Generates complete palettes with accent hue rotation
// - Formats OKLCH color strings
import type { RGB } from "../color";
import { oklchToRgb, rgbToHex } from "../color";
import type { PMDVariables } from "./variables";
import { type getComputed, HUE_MAX } from "./variables";

const OKLCH_PRECISION = 3;

export interface Base16Def {
	id: string;
	pmd: string;
	desc: string;
	l: number;
	c: number;
	offset?: number;
	overrideHue?: number;
}

export interface Base16Color extends Base16Def {
	rgb: RGB;
	hex: string;
	oklch: string;
	hue?: number;
}

export interface Base16Palette {
	[key: string]: Base16Color;
}

function rot(base: number, deg: number): number {
	return (base + deg + HUE_MAX) % HUE_MAX;
}

function formatOklch(l: number, c: number, h: number): string {
	return `oklch(${l.toFixed(OKLCH_PRECISION)} ${c.toFixed(OKLCH_PRECISION)} ${Math.round(h)})`;
}

export function getBase16Defs(
	pmd: PMDVariables,
	computed: ReturnType<typeof getComputed>,
): {
	bg: Base16Def[];
	fg: Base16Def[];
	accent: Base16Def[];
} {
	return {
		bg: [
			{ id: "base00", pmd: "4x", desc: "Background", ...pmd["4x"] },
			{ id: "base01", pmd: "8x", desc: "Base Container", ...pmd["8x"] },
			{ id: "base02", pmd: "8x+80x@16%", desc: "Surface", ...computed.surface },
			{
				id: "base03",
				pmd: "80x@80%",
				desc: "Muted",
				l: computed.muted.l,
				c: computed.muted.c,
			},
		],
		fg: [
			{ id: "base04", pmd: "72x", desc: "Subtext", ...pmd["72x"] },
			{ id: "base05", pmd: "80x", desc: "Body Text", ...pmd["80x"] },
			{ id: "base06", pmd: "88x", desc: "Headers", ...pmd["88x"] },
			{ id: "base07", pmd: "100x", desc: "Max Contrast", ...pmd["100x"] },
		],
		accent: [
			{
				id: "base08",
				pmd: "88x",
				l: pmd["88x"].l,
				c: pmd["88x"].c,
				desc: "Danger",
			},
			{
				id: "base09",
				pmd: "72x+290",
				l: pmd["72x"].l,
				c: pmd["72x"].c,
				offset: 290,
				desc: "Constants",
			},
			{
				id: "base0A",
				pmd: "80x",
				l: pmd["80x"].l,
				c: pmd["80x"].c,
				desc: "Warning",
			},
			{
				id: "base0B",
				pmd: "72x",
				l: pmd["72x"].l,
				c: pmd["72x"].c,
				desc: "Strings",
			},
			{
				id: "base0C",
				pmd: "80x+140",
				l: pmd["80x"].l,
				c: pmd["80x"].c,
				offset: 140,
				desc: "Support",
			},
			{
				id: "base0D",
				pmd: "72x+30",
				l: pmd["72x"].l,
				c: pmd["72x"].c,
				offset: 30,
				desc: "Functions",
			},
			{
				id: "base0E",
				pmd: "72x-30",
				l: pmd["72x"].l,
				c: pmd["72x"].c,
				offset: -30,
				desc: "Keywords",
			},
			{
				id: "base0F",
				pmd: "72x@80%",
				l: computed.muted.l,
				c: computed.muted.c,
				desc: "Meta",
			},
		],
	};
}

export function generatePalette(
	hue: number,
	pmd: PMDVariables,
	computed: ReturnType<typeof getComputed>,
	isDark: boolean,
	isHueLocked: boolean,
	lockedHueValue: number,
): Base16Palette {
	const defs = getBase16Defs(pmd, computed);
	const accentHue = isHueLocked ? lockedHueValue : hue;
	const accentL = !isDark ? 0.45 : pmd["72x"].l;
	const colors: Base16Palette = {};

	[...defs.bg, ...defs.fg].forEach((def) => {
		const rgb = oklchToRgb(def.l, def.c, hue);
		colors[def.id] = {
			...def,
			rgb,
			hex: rgbToHex(rgb),
			oklch: formatOklch(def.l, def.c, hue),
		};
	});

	defs.accent.forEach((def) => {
		let h: number;
		if (def.overrideHue !== undefined) {
			h = def.overrideHue;
		} else if (def.offset !== undefined) {
			h = rot(accentHue, def.offset);
		} else {
			h = accentHue;
		}
		const l =
			def.id === "base0F" ||
			def.pmd === "88x" ||
			def.pmd === "80x" ||
			def.pmd === "80x+140"
				? def.l
				: accentL;
		const rgb = oklchToRgb(l, def.c, h);
		colors[def.id] = {
			...def,
			rgb,
			hex: rgbToHex(rgb),
			hue: h,
			oklch: formatOklch(l, def.c, h),
		};
	});

	return colors;
}
