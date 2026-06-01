// ui-controls.ts
//
// Purpose: Renders UI controls for color selection and theme presets
//
// This module:
// - Manages hue/lightness/chroma sliders and gradient backgrounds
// - Provides preset color configurations
// - Handles slider interactions and theme switching
import { rgbToHex, safeOklchToRgb } from "../color";
import { HUE_MAX, PMD_DARK, PMD_LIGHT } from "../pmd";

const GRADIENT_STEP = 30;

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
	const theme = pmd["72x"];
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

export function updateSliderGradient(sliderId: string, isDark: boolean): void {
	const slider = document.getElementById(sliderId) as HTMLInputElement;
	if (!slider) return;

	const theme = (isDark ? PMD_DARK : PMD_LIGHT)["72x"];
	const stops: string[] = [];
	for (let i = 0; i <= HUE_MAX; i += GRADIENT_STEP) {
		const rgb = safeOklchToRgb(theme.l, theme.c, i);
		stops.push(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
	}
	slider.style.background = `linear-gradient(to right, ${stops.join(", ")})`;
}
