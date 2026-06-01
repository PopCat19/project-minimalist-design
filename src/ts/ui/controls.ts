// ui-controls.ts
//
// Purpose: Renders UI controls for color selection and theme presets
//
// This module:
// - Manages hue/lightness/chroma sliders and gradient backgrounds
// - Provides preset color configurations
// - Handles slider interactions and theme switching
import { rgbToHex, safeOklchToRgb } from "../color";
import { PMD_DARK, PMD_LIGHT } from "../pmd";

interface Preset {
	name: string;
	hue: number;
}

const presets: Preset[] = [
	{ name: "Red", hue: 30 },
	{ name: "Orange", hue: 60 },
	{ name: "Yellow", hue: 90 },
	{ name: "Green", hue: 140 },
	{ name: "Cyan", hue: 195 },
	{ name: "Blue", hue: 260 },
	{ name: "Purple", hue: 290 },
	{ name: "Rose", hue: 345 },
];

export { presets };

export function renderPresets(
	containerId: string,
	isDark: boolean,
	setHueCallback: (hue: number) => void,
): void {
	const container = document.getElementById(containerId);
	if (!container) return;

	const pmd = isDark ? PMD_DARK : PMD_LIGHT;
	const theme = pmd["64x"];
	const root = document.documentElement;

	if (!container.dataset.ready) {
		container.innerHTML = presets
			.map((preset, i) => {
				return `
            <button class="preset"
                    style="background: var(--pr-${i});"
                    data-name="${preset.name}"
                    data-hue="${preset.hue}">
            </button>`;
			})
			.join("");

		container.querySelectorAll(".preset").forEach((btn) => {
			btn.addEventListener("click", () => {
				const hue = parseInt((btn as HTMLElement).dataset.hue || "0", 10);
				setHueCallback(hue);
			});
		});

		container.dataset.ready = "1";
	}

	presets.forEach((preset, i) => {
		const rgb = safeOklchToRgb(theme.l, theme.c, preset.hue);
		root.style.setProperty(`--pr-${i}`, rgbToHex(rgb));
	});
}

export function updateSliderGradient(
	_sliderId: string,
	_isDark: boolean,
): void {
	// Slider uses PMD tokens (--base03 track, --base06 thumb) — no gradient
}
