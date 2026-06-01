// ui-render.ts
//
// Purpose: Renders theme colors and UI components to the DOM
//
// This module:
// - Applies color palettes to CSS custom properties
// - Renders color grids, code previews, and toast notifications
// - Handles file download triggers from UI events

import { getContrastColor, oklchToRgb, rgbToHex } from "../color";
import type { Base16Color, Base16Palette, PMDVariables } from "../pmd";

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

export function renderFoundationGrid(
	containerId: string,
	pmd: PMDVariables,
	hue: number,
): void {
	const container = document.getElementById(containerId);
	if (!container) return;

	const slotOrder = ["100x", "88x", "80x", "72x", "8x", "4x", "0x"];
	const roles: Record<string, string> = {
		"100x": "max contrast",
		"88x": "primary",
		"80x": "secondary",
		"72x": "accent",
		"8x": "base surface",
		"4x": "deep bg",
		"0x": "canvas",
	};

	container.innerHTML = slotOrder
		.map((key) => {
			const slot = pmd[key];
			if (!slot) return "";
			const rgb = oklchToRgb(slot.l, slot.c, hue);
			const hex = rgbToHex(rgb);
			const txt = getContrastColor(rgb.r, rgb.g, rgb.b);
			return `
        <div class="color-card" onclick="window.handleColorClick(event, '${hex}', 'oklch(${slot.l.toFixed(3)} ${slot.c.toFixed(3)} ${hue})')">
            <div class="color-swatch" style="background: ${hex}; color: ${txt}">
                <div class="swatch-hex">${hex}</div>
                <div class="swatch-oklch">oklch(${slot.l.toFixed(3)} ${slot.c.toFixed(3)} ${hue})</div>
            </div>
            <div class="color-info">
                <div class="color-name">${key}</div>
                <div class="color-desc">${roles[key] || ""}</div>
            </div>
        </div>`;
		})
		.join("");
}

export function renderStackGrid(
	containerId: string,
	pmd: PMDVariables,
	hue: number,
): void {
	const container = document.getElementById(containerId);
	if (!container) return;

	interface StackDef {
		label: string;
		base: string;
		tint: string;
		opacity: number;
		offset?: number;
		role: string;
	}

	const defs: StackDef[] = [
		{
			label: "8×40%",
			base: "0x",
			tint: "8x",
			opacity: 0.4,
			role: "flyout container (w/ blur)",
		},
		{
			label: "8×80%",
			base: "0x",
			tint: "8x",
			opacity: 0.8,
			role: "deep surface",
		},
		{
			label: "80×8%",
			base: "8x",
			tint: "80x",
			opacity: 0.08,
			role: "interactable hint",
		},
		{
			label: "80×48%",
			base: "8x",
			tint: "80x",
			opacity: 0.48,
			role: "muted / inactive track",
		},
		{
			label: "88×24%",
			base: "8x",
			tint: "88x",
			opacity: 0.24,
			role: "disabled foreground",
		},
		{
			label: "64×80%",
			base: "8x",
			tint: "64x",
			opacity: 0.8,
			role: "subdued accent",
		},
		{
			label: "88×12",
			base: "88x",
			tint: "88x",
			opacity: 1.0,
			offset: 12,
			role: "priority alert (+12°)",
		},
		{
			label: "80×8%+12",
			base: "8x",
			tint: "80x",
			opacity: 0.08,
			offset: 12,
			role: "subtle alert surface",
		},
	];

	container.innerHTML = defs
		.map((def) => {
			const baseSlot = pmd[def.base];
			const tintSlot = pmd[def.tint];
			if (!baseSlot || !tintSlot) return "";

			const effHue = def.offset ? (hue + def.offset) % 360 : hue;
			const baked = oklchToRgb(
				baseSlot.l * (1 - def.opacity) + tintSlot.l * def.opacity,
				baseSlot.c * (1 - def.opacity) + tintSlot.c * def.opacity,
				effHue,
			);
			const hex = rgbToHex(baked);
			const txt = getContrastColor(baked.r, baked.g, baked.b);

			const tint = oklchToRgb(tintSlot.l, tintSlot.c, effHue);
			const rgba = `rgba(${tint.r}, ${tint.g}, ${tint.b}, ${def.opacity.toFixed(2)})`;

			return `
        <div class="color-card" onclick="window.handleColorClick(event, '${hex}', 'composite(${def.base}, ${def.tint}, ${def.opacity.toFixed(2)})')">
            <div class="color-swatch stack-swatch" style="--swatch: ${rgba}; color: ${txt}">
                <div class="swatch-hex">${hex}</div>
                <div class="swatch-oklch">${def.label}</div>
            </div>
            <div class="color-info">
                <div class="color-name">${def.label}</div>
                <div class="color-desc">${def.role}</div>
            </div>
        </div>`;
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

export function renderUIPreview(
	containerId: string,
	_colors: Base16Palette,
	pmd: PMDVariables,
	hue: number,
): void {
	const container = document.getElementById(containerId);
	if (!container) return;

	const hex = (key: string, hOff?: number) => {
		const s = pmd[key];
		if (!s) return "#000";
		const rgb = oklchToRgb(s.l, s.c, hOff ? (hue + hOff) % 360 : hue);
		return rgbToHex(rgb);
	};
	const stackHex = (
		baseKey: string,
		tintKey: string,
		alpha: number,
		hOff?: number,
	) => {
		const b = pmd[baseKey];
		const t = pmd[tintKey];
		if (!b || !t) return "#000";
		const rgb = oklchToRgb(
			b.l * (1 - alpha) + t.l * alpha,
			b.c * (1 - alpha) + t.c * alpha,
			hOff ? (hue + hOff) % 360 : hue,
		);
		return rgbToHex(rgb);
	};
	const txtOn = (h: string) => {
		const m = h.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
		if (!m) return "#fff";
		return getContrastColor(
			parseInt(m[1], 16),
			parseInt(m[2], 16),
			parseInt(m[3], 16),
		);
	};

	const _c100 = hex("100x");
	const c88 = hex("88x");
	const c80 = hex("80x");
	const c72 = hex("72x");
	const c8x = hex("8x");
	const c4x = hex("4x");
	const _c0x = hex("0x");

	const surfWidget = stackHex("8x", "80x", 0.08);
	const surfMuted = stackHex("8x", "80x", 0.48);
	const txtInactive = `${c88}3D`;
	const alertBg = hex("88x", 12);
	const alertBorder = `${c88}FF`;

	const F = "font-family:Fredoka,system-ui,sans-serif";
	const T12 = "font-size:0.75rem;line-height:1.25";
	const T10 = "font-size:0.625rem;line-height:1.25";

	container.innerHTML = `
    <div style="background:${c4x};border-radius:1rem;padding:0.75rem;display:flex;flex-direction:column;gap:0.5rem;${F}">
<div style="display:flex;gap:0.5rem">
        <div style="flex:1;background:${c8x};border-radius:1rem;padding:0.75rem">
          <div style="color:${c88};font-weight:600;${T12};margin-bottom:0.25rem">Header · 88x 600</div>
          <div style="color:${c72};font-weight:500;${T12};margin-bottom:0.625rem">Subtext · 72x 500</div>
          <div style="display:flex;gap:0.25rem">
            <div style="padding:0.25rem 0.5rem;border-radius:1rem;background:${c88};color:${txtOn(c88)};font-weight:600;${T12}">88x active</div>
            <div style="padding:0.25rem 0.5rem;border-radius:1rem;background:${surfWidget};color:${txtInactive};font-weight:500;${T12}">88×24%</div>
            <div style="padding:0.25rem 0.5rem;border-radius:1rem;background:${surfWidget};color:${c80};font-weight:500;${T12}">80×8%</div>
          </div>
        </div>
        <div style="flex:1;background:${c8x};border-radius:1rem;padding:0.75rem;display:flex;flex-direction:column;gap:0.375rem">
          <div style="display:flex;justify-content:space-between">
            <span style="color:${c88};font-weight:600;${T12}">0:56</span>
            <span style="color:${c80};font-weight:500;${T12};text-align:center;overflow:hidden;white-space:nowrap">Zen Browser</span>
            <span style="color:${surfMuted};font-weight:500;${T12}">4:08</span>
          </div>
          <div style="display:flex;align-items:center;height:1.5rem;gap:0.25rem">
            <div style="width:3rem;height:0.75rem;background:${c88};border-radius:1rem 0.125rem 0.125rem 1rem;flex-shrink:0"></div>
            <div style="width:0.25rem;height:100%;background:${c88};border-radius:1rem;flex-shrink:0"></div>
            <div style="flex:1;height:0.75rem;background:${surfMuted};border-radius:0.125rem 1rem 1rem 0.125rem;display:flex;align-items:center;justify-content:flex-end;padding-right:0.25rem">
              <div style="width:0.25rem;height:0.25rem;background:${c80};border-radius:1rem;flex-shrink:0"></div>
            </div>
          </div>
          <div style="display:flex;gap:0.25rem">
            <div style="flex:1;padding:0.25rem 0.5rem;border-radius:1rem;background:${c88};color:${txtOn(c88)};text-align:center;font-weight:600;${T12}">88x active</div>
            <div style="flex:1;padding:0.25rem 0.5rem;border-radius:1rem;background:${surfWidget};color:${c80};text-align:center;font-weight:500;${T12}">80×8% def</div>
          </div>
        </div>
      </div>
      <div style="display:flex;gap:0.5rem">
        <div style="flex:1;background:${c8x};border-radius:1rem;padding:0.5rem 0.75rem;display:flex;align-items:center;gap:0.375rem">
          <span style="color:${surfMuted};font-weight:500;${T12}">Timestamp</span>
          <span style="color:${surfMuted};font-weight:500;${T10}">14:32</span>
          <span style="color:${surfMuted};font-weight:500;${T10}">· 80x 48%</span>
        </div>
        <div style="background:${alertBg};border:2px solid ${alertBorder};border-radius:1rem;padding:0.5rem 0.75rem;color:${txtOn(alertBg)};font-weight:600;${T12}">88×12 priority</div>
      </div>
    </div>`;
}
