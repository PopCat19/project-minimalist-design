// ui-render.ts
//
// Purpose: Renders theme colors and UI components to the DOM
//
// This module:
// - Applies color palettes to CSS custom properties
// - Renders color grids, code previews, and toast notifications
// - Handles file download triggers from UI events

import { getContrastColor } from "../color";
import type { Base16Color, Base16Palette } from "../pmd";

export function applyThemeToUI(colors: Base16Palette): void {
	const root = document.documentElement;
	Object.entries(colors).forEach(([id, color]) => {
		root.style.setProperty(`--${id}`, color.hex);
	});
}

export function handleColorClick(
	event: MouseEvent,
	hex: string,
	oklch: string,
): void {
	if (event.shiftKey) {
		navigator.clipboard.writeText(oklch);
		showToast(`Copied OKLCH: ${oklch}`);
	} else {
		navigator.clipboard.writeText(hex);
		showToast(`Copied Hex: ${hex}`);
	}
}

export function showToast(message: string): void {
	const toast = document.getElementById("toast");
	if (!toast) return;
	toast.textContent = message;
	toast.classList.add("show");
	setTimeout(() => toast.classList.remove("show"), 2000);
}

export function downloadFile(
	content: string,
	filename: string,
	type: string,
): void {
	const blob = new Blob([content], { type });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

function renderColorCard(
	color: Base16Color,
	desc: string,
	pmd: string,
): string {
	const textColor = getContrastColor(color.rgb.r, color.rgb.g, color.rgb.b);
	return `
        <div class="color-card" onclick="window.handleColorClick(event, '${color.hex}', '${color.oklch}')">
            <div class="color-swatch" style="background: ${color.hex}; color: ${textColor}">
                <div class="swatch-hex">${color.hex}</div>
                <div class="swatch-oklch">${color.oklch}</div>
            </div>
            <div class="color-info">
                <div class="color-name">${color.id}</div>
                <div class="color-desc">${desc}</div>
                <div class="color-values">
                    <div class="color-hex">${pmd}</div>
                </div>
            </div>
        </div>
    `;
}

export function renderColorGrid(
	containerId: string,
	defs: { id: string; pmd: string; desc: string }[],
	colors: Base16Palette,
): void {
	const container = document.getElementById(containerId);
	if (!container) return;
	container.innerHTML = defs
		.map((def) => {
			const color = colors[def.id];
			return renderColorCard(color, def.desc, def.pmd);
		})
		.join("");
}

export function renderCodePreview(
	colors: Base16Palette,
	currentHue: number,
): void {
	const preview = document.getElementById("codePreview");
	if (!preview) return;
	preview.innerHTML = `
        <div class="preview-header" style="background: ${colors.base01.hex};">
            <div class="preview-dot" style="background: ${colors.base08.hex};"></div>
            <div class="preview-dot" style="background: ${colors.base0A.hex};"></div>
            <div class="preview-dot" style="background: ${colors.base0B.hex};"></div>
        </div>
        <div class="preview-content" style="background: ${colors.base00.hex}; color: ${colors.base05.hex};">
            <span style="color: ${colors.base03.hex};">// PMD Base16 Theme Preview</span><br>
            <span style="color: ${colors.base0E.hex};">function</span> <span style="color: ${colors.base0D.hex};">generatePalette</span>(<span style="color: ${colors.base08.hex};">hue</span>) {<br>
            &nbsp;&nbsp;<span style="color: ${colors.base0E.hex};">const</span> <span style="color: ${colors.base08.hex};">auxHue</span> = (<span style="color: ${colors.base08.hex};">hue</span> + <span style="color: ${colors.base09.hex};">180</span>) % <span style="color: ${colors.base09.hex};">360</span>;<br>
            &nbsp;&nbsp;<span style="color: ${colors.base0E.hex};">return</span> {<br>
            &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: ${colors.base08.hex};">primary</span>: <span style="color: ${colors.base0B.hex};">"oklch(0.72 0.122 ${currentHue})"</span>,<br>
            &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: ${colors.base08.hex};">auxiliary</span>: <span style="color: ${colors.base0B.hex};">\`oklch(0.72 0.122 \${auxHue})\`</span><br>
            &nbsp;&nbsp;};<br>
            }
        </div>
    `;
}
