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

function _renderColorCard(
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
	const root = document.documentElement;

	if (!container.dataset.ready) {
		container.innerHTML = defs
			.map(
				(def) => `
        <div class="color-card" data-b16="${def.id}">
            <div class="color-swatch" style="background: var(--b16-${def.id}); color: var(--b16c-${def.id})">
                <div class="swatch-hex" data-b16hex="${def.id}"></div>
                <div class="swatch-oklch">${def.pmd}</div>
            </div>
            <div class="color-info">
                <div class="color-name">${def.id}</div>
                <div class="color-desc">${def.desc}</div>
            </div>
        </div>`,
			)
			.join("");

		container.querySelectorAll(".color-card").forEach((card) => {
			card.addEventListener("click", (e) => {
				const id = (card as HTMLElement).dataset.b16 || "";
				const c = colors[id];
				if (c) window.handleColorClick(e as MouseEvent, c.hex, c.oklch);
			});
		});

		container.dataset.ready = "1";
	}

	defs.forEach((def) => {
		const color = colors[def.id];
		if (!color) return;
		root.style.setProperty(`--b16-${def.id}`, color.hex);
		root.style.setProperty(
			`--b16c-${def.id}`,
			getContrastColor(color.rgb.r, color.rgb.g, color.rgb.b),
		);

		const card = container.querySelector(`[data-b16="${def.id}"]`);
		if (card) {
			const hexEl = card.querySelector(
				`[data-b16hex="${def.id}"]`,
			) as HTMLElement;
			if (hexEl) hexEl.textContent = color.hex;
		}
	});
}

export function renderFoundationGrid(
	containerId: string,
	pmd: PMDVariables,
	hue: number,
): void {
	const container = document.getElementById(containerId);
	if (!container) return;

	const slotOrder = ["100x", "88x", "80x", "64x", "8x", "4x", "0x"];
	const roles: Record<string, string> = {
		"100x": "max contrast",
		"88x": "primary",
		"80x": "secondary",
		"64x": "accent",
		"8x": "base surface",
		"4x": "deep bg",
		"0x": "canvas",
	};

	const root = document.documentElement;

	if (!container.dataset.ready) {
		container.innerHTML = slotOrder
			.map((key) => {
				const slot = pmd[key];
				if (!slot) return "";
				return `
        <div class="color-card" data-slot="${key}">
            <div class="color-swatch" style="background: var(--fs-${key}); color: var(--fsc-${key})">
                <div class="swatch-hex" data-hex="${key}"></div>
                <div class="swatch-oklch" data-oklch="${key}"></div>
            </div>
            <div class="color-info">
                <div class="color-name">${key}</div>
                <div class="color-desc">${roles[key] || ""}</div>
            </div>
        </div>`;
			})
			.join("");

		container.querySelectorAll(".color-card").forEach((card) => {
			card.addEventListener("click", (e) => {
				const _k = (card as HTMLElement).dataset.slot || "";
				const el = card.querySelector(".swatch-oklch") as HTMLElement;
				const hexEl = card.querySelector(".swatch-hex") as HTMLElement;
				const hex = getComputedStyle(hexEl).color;
				const oklch = el?.dataset.oklch || "";
				window.handleColorClick(e as MouseEvent, hex, oklch);
			});
		});

		container.dataset.ready = "1";
	}

	slotOrder.forEach((key) => {
		const slot = pmd[key];
		if (!slot) return;
		const rgb = oklchToRgb(slot.l, slot.c, hue);
		const hex = rgbToHex(rgb);
		const txt = getContrastColor(rgb.r, rgb.g, rgb.b);
		root.style.setProperty(`--fs-${key}`, hex);
		root.style.setProperty(`--fsc-${key}`, txt);

		const card = container.querySelector(`[data-slot="${key}"]`);
		if (card) {
			const hexEl = card.querySelector(`[data-hex="${key}"]`) as HTMLElement;
			const oklchEl = card.querySelector(
				`[data-oklch="${key}"]`,
			) as HTMLElement;
			if (hexEl) hexEl.textContent = hex;
			if (oklchEl) {
				oklchEl.textContent = `oklch(${slot.l.toFixed(3)} ${slot.c.toFixed(3)} ${hue})`;
				oklchEl.dataset.oklch = `oklch(${slot.l.toFixed(3)} ${slot.c.toFixed(3)} ${hue})`;
			}
		}
	});
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
		hasBlur?: boolean;
		role: string;
	}

	const defs: StackDef[] = [
		{
			label: "8×40%",
			base: "0x",
			tint: "8x",
			opacity: 0.4,
			hasBlur: true,
			role: "translucent flyout surface",
		},
		{
			label: "8×80%",
			base: "0x",
			tint: "8x",
			opacity: 0.8,
			role: "art-showing surface",
		},
		{
			label: "80×8%",
			base: "8x",
			tint: "80x",
			opacity: 0.08,
			role: "interactable surface hint",
		},
		{
			label: "80×48%",
			base: "8x",
			tint: "80x",
			opacity: 0.48,
			role: "muted text / inactive track",
		},
		{
			label: "88×24%",
			base: "8x",
			tint: "88x",
			opacity: 0.24,
			role: "disabled foreground",
		},
		{
			label: "88×12",
			base: "88x",
			tint: "88x",
			opacity: 1.0,
			offset: 12,
			role: "priority alert",
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

	const root = document.documentElement;

	if (!container.dataset.ready) {
		container.innerHTML = defs
			.map((def, i) => {
				return `
        <div class="color-card" data-stack="${i}">
            <div class="color-swatch stack-swatch${def.hasBlur ? " blur" : ""}" style="--swatch: var(--ss-${i}); color: var(--ssc-${i})">
                <div class="swatch-hex" data-shex="${i}"></div>
                <div class="swatch-oklch">${def.label}</div>
            </div>
            <div class="color-info">
                <div class="color-name">${def.label}</div>
                <div class="color-desc">${def.role}</div>
            </div>
        </div>`;
			})
			.join("");

		container.querySelectorAll(".color-card").forEach((card) => {
			card.addEventListener("click", (e) => {
				const hexEl = card.querySelector("[data-shex]") as HTMLElement;
				const hex = hexEl?.textContent || "";
				const _lbl =
					(card.querySelector(".color-name") as HTMLElement)?.textContent || "";
				const _oklchEl = card.querySelector(".swatch-oklch") as HTMLElement;
				window.handleColorClick(
					e as MouseEvent,
					hex,
					`composite(${defs[parseInt((card as HTMLElement).dataset.stack || "0", 10)].base}, ${defs[parseInt((card as HTMLElement).dataset.stack || "0", 10)].tint}, ...)`,
				);
			});
		});

		container.dataset.ready = "1";
	}

	defs.forEach((def, i) => {
		const baseSlot = pmd[def.base];
		const tintSlot = pmd[def.tint];
		if (!baseSlot || !tintSlot) return;

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

		root.style.setProperty(`--ss-${i}`, rgba);
		root.style.setProperty(`--ssc-${i}`, txt);

		const card = container.querySelector(`[data-stack="${i}"]`);
		if (card) {
			const hexEl = card.querySelector(`[data-shex="${i}"]`) as HTMLElement;
			if (hexEl) hexEl.textContent = hex;
		}
	});
}

export function renderCodePreview(
	colors: Base16Palette,
	currentHue: number,
): void {
	const preview = document.getElementById("codePreview");
	if (!preview) return;
	const root = document.documentElement;

	if (!preview.dataset.ready) {
		preview.innerHTML = `
        <div class="preview-content" style="background: var(--cp-bg); color: var(--cp-fg);">
            <span style="color: var(--cp-muted);">// PMD Base16 · <span data-cp-hue></span>° · <span data-cp-scheme></span></span><br><br>
            <span style="color: var(--cp-kw);">use</span> <span style="color: var(--cp-support);">std::collections</span>::<span style="color: var(--cp-type);">HashMap</span>;<br><br>
            <span style="color: var(--cp-muted);">/// Palette entry with OKLCH source and baked hex output.</span><br>
            <span style="color: var(--cp-kw);">pub struct</span> <span style="color: var(--cp-type);">Palette</span> {<br>
            &nbsp;&nbsp;<span style="color: var(--cp-kw);">pub</span> id: <span style="color: var(--cp-type);">String</span>,<br>
            &nbsp;&nbsp;<span style="color: var(--cp-kw);">pub</span> hex: <span style="color: var(--cp-type);">String</span>,<br>
            &nbsp;&nbsp;<span style="color: var(--cp-kw);">pub</span> hue: <span style="color: var(--cp-type);">u16</span>,<br>
            }<br><br>
            <span style="color: var(--cp-kw);">impl</span> <span style="color: var(--cp-type);">Palette</span> {<br>
            &nbsp;&nbsp;<span style="color: var(--cp-kw);">pub fn</span> <span style="color: var(--cp-fn);">generate</span>(hue: <span style="color: var(--cp-type);">u16</span>) -> <span style="color: var(--cp-type);">Self</span> {<br>
            &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: var(--cp-kw);">let</span> <span style="color: var(--cp-var);">shift</span> = (<span style="color: var(--cp-var);">hue</span> + <span style="color: var(--cp-const);">180</span>) % <span style="color: var(--cp-const);">360</span>;<br>
            &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: var(--cp-kw);">let</span> <span style="color: var(--cp-var);">bg</span> = <span style="color: var(--cp-fn);">oklch</span>(<span style="color: var(--cp-const);">0.16</span>, <span style="color: var(--cp-const);">0.022</span>, hue);<br>
            &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: var(--cp-kw);">let</span> <span style="color: var(--cp-var);">fg</span> = <span style="color: var(--cp-fn);">oklch</span>(<span style="color: var(--cp-const);">0.80</span>, <span style="color: var(--cp-const);">0.100</span>, hue);<br>
            &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: var(--cp-kw);">let</span> <span style="color: var(--cp-var);">alert</span> = <span style="color: var(--cp-fn);">oklch</span>(<span style="color: var(--cp-const);">0.88</span>, <span style="color: var(--cp-const);">0.056</span>, hue + <span style="color: var(--cp-const);">12</span>);<br>
            &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: var(--cp-muted);">// return baked hex for base16 export</span><br>
            &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: var(--cp-type);">Palette</span> { id: <span style="color: var(--cp-str);">"pmd"</span>.<span style="color: var(--cp-fn);">into</span>(), hex: <span style="color: var(--cp-str);">"<span data-cp-accent></span>"</span>.<span style="color: var(--cp-fn);">into</span>() }<br>
            &nbsp;&nbsp;}<br>
            }<br>
        </div>
    `;
		preview.dataset.ready = "1";
	}

	const schemeLabel = colors.base00.hex === "#120c17" ? "dark" : "light";

	root.style.setProperty("--cp-bg", colors.base00.hex);
	root.style.setProperty("--cp-fg", colors.base05.hex);
	root.style.setProperty("--cp-muted", colors.base03.hex);
	root.style.setProperty("--cp-kw", colors.base0E.hex);
	root.style.setProperty("--cp-fn", colors.base0D.hex);
	root.style.setProperty("--cp-type", colors.base0A.hex);
	root.style.setProperty("--cp-const", colors.base09.hex);
	root.style.setProperty("--cp-str", colors.base0B.hex);
	root.style.setProperty("--cp-support", colors.base0C.hex);
	root.style.setProperty("--cp-var", colors.base08.hex);

	const hueEl = preview.querySelector("[data-cp-hue]");
	const schemeEl = preview.querySelector("[data-cp-scheme]");
	const accentEl = preview.querySelector("[data-cp-accent]");
	if (hueEl) hueEl.textContent = String(currentHue);
	if (schemeEl) schemeEl.textContent = schemeLabel;
	if (accentEl) accentEl.textContent = colors.base0D.hex;
}

export function renderComponentReference(pmd: PMDVariables, hue: number): void {
	const container = document.getElementById("componentReference");
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

	const h4x = hex("4x");
	const h80x = hex("80x");
	const h88x = hex("88x");
	const h64x = hex("64x");
	const h8x = hex("8x");
	const h80x48 = stackHex("8x", "80x", 0.48);
	const h80x8 = stackHex("8x", "80x", 0.08);
	const h88x24 = stackHex("8x", "88x", 0.24);

	const root = document.documentElement;

	if (!container.dataset.ready) {
		container.innerHTML = [
			// ── Buttons ──
			`<div class="cref-group"><h3 class="cref-group-title">Buttons</h3><div class="cref-grid">`,
			// CTA
			`<div class="cref-card"><div class="cref-preview" style="background:var(--cref-panel);gap:0.375rem;display:flex"><div class="cref-btn" style="background:var(--cref-cta-bg);color:var(--cref-cta-fg)">CTA</div><div class="cref-btn" style="background:var(--cref-cta-bg);color:var(--cref-cta-fg)"><span style="display:flex;align-items:center;gap:0.25rem"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="6"/></svg>Icon+Label</span></div></div><div class="cref-tokens"><div class="cref-tok-row"><span class="cref-tok-prop">Surface</span><span class="cref-tok-stack">88x</span><span class="cref-tok-var">--base06</span><span class="cref-tok-hex" data-cref="cta-bg"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Text</span><span class="cref-tok-stack">4x</span><span class="cref-tok-var">--base01</span><span class="cref-tok-hex" data-cref="cta-fg"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Weight</span><span class="cref-tok-stack">—</span><span class="cref-tok-var">500</span></div><div class="cref-tok-row"><span class="cref-tok-prop">Radius</span><span class="cref-tok-stack">—</span><span class="cref-tok-var">1rem</span></div><div class="cref-tok-row"><span class="cref-tok-prop">Icon</span><span class="cref-tok-stack">16px</span><span class="cref-tok-var">4x</span></div></div><div class="cref-label">CTA</div></div>`,
			// Default
			`<div class="cref-card"><div class="cref-preview" style="background:var(--cref-panel);gap:0.375rem;display:flex"><div class="cref-btn" style="background:var(--cref-def-bg);color:var(--cref-def-fg)">Default</div><div class="cref-btn" style="background:var(--cref-def-bg);color:var(--cref-def-fg)"><span style="display:flex;align-items:center;gap:0.25rem"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="6"/></svg>Icon+Label</span></div></div><div class="cref-tokens"><div class="cref-tok-row"><span class="cref-tok-prop">Surface</span><span class="cref-tok-stack">8x</span><span class="cref-tok-var">--base01</span><span class="cref-tok-hex" data-cref="def-bg"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Text</span><span class="cref-tok-stack">80x</span><span class="cref-tok-var">--base05</span><span class="cref-tok-hex" data-cref="def-fg"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Weight</span><span class="cref-tok-stack">—</span><span class="cref-tok-var">500</span></div><div class="cref-tok-row"><span class="cref-tok-prop">Radius</span><span class="cref-tok-stack">—</span><span class="cref-tok-var">1rem</span></div><div class="cref-tok-row"><span class="cref-tok-prop">Icon</span><span class="cref-tok-stack">16px</span><span class="cref-tok-var">80x</span></div></div><div class="cref-label">Default</div></div>`,
			// Disabled
			`<div class="cref-card"><div class="cref-preview" style="background:var(--cref-panel);gap:0.375rem;display:flex"><div class="cref-btn" style="background:transparent;color:var(--cref-dis-fg);outline-color:var(--cref-dis-ol)">Disabled</div></div><div class="cref-tokens"><div class="cref-tok-row"><span class="cref-tok-prop">Surface</span><span class="cref-tok-stack">none</span></div><div class="cref-tok-row"><span class="cref-tok-prop">Text</span><span class="cref-tok-stack">88×24%</span><span class="cref-tok-hex" data-cref="dis-fg"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Outline</span><span class="cref-tok-stack">80×8%</span><span class="cref-tok-hex" data-cref="dis-ol"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Weight</span><span class="cref-tok-stack">—</span><span class="cref-tok-var">500</span></div></div><div class="cref-label">Disabled</div></div>`,
			`</div></div>`,

			// ── Tabs ──
			`<div class="cref-group"><h3 class="cref-group-title">Tabs</h3><div class="cref-grid">
<div class="cref-card" style="grid-column:1/-1"><div class="cref-preview" style="background:var(--cref-panel)"><div class="cref-tab"><div class="cref-tab-sel" style="background:var(--cref-tab-sel-bg);color:var(--cref-tab-sel-fg);border-radius:var(--r) 8px 8px var(--r);padding:0.25rem 0.625rem;font-size:var(--fs);font-weight:600">First</div><div class="cref-tab-unsel" style="background:var(--cref-tab-unsel-bg);color:var(--cref-tab-unsel-fg);border-radius:8px;padding:0.25rem 0.625rem;font-size:var(--fs);font-weight:500">Second</div><div class="cref-tab-unsel" style="background:var(--cref-tab-unsel-bg);color:var(--cref-tab-unsel-fg);border-radius:8px;padding:0.25rem 0.625rem;font-size:var(--fs);font-weight:500">Third</div><div class="cref-tab-unsel" style="background:transparent;color:var(--cref-dis-fg);outline-color:var(--cref-dis-ol);border-radius:8px var(--r) var(--r) 8px;padding:0.25rem 0.625rem;font-size:var(--fs);font-weight:500">Fourth</div></div></div><div class="cref-tokens"><div class="cref-tok-row"><span class="cref-tok-prop">Selected</span><span class="cref-tok-stack">88x · 600</span><span class="cref-tok-hex" data-cref="tab-sel-bg"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Unselected</span><span class="cref-tok-stack">8x · 80×48%</span><span class="cref-tok-hex" data-cref="tab-unsel-fg"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Disabled</span><span class="cref-tok-stack">88×24% · 80×8% OL</span><span class="cref-tok-hex" data-cref="dis-fg"></span></div></div><div class="cref-label">Selected · Unselected · Disabled</div></div>
</div></div>`,

			// ── Togglables ──
			`<div class="cref-group"><h3 class="cref-group-title">Togglables</h3><div class="cref-grid">`,
			// Toggle pill
			`<div class="cref-card"><div class="cref-preview" style="background:var(--cref-panel);gap:0.375rem;display:flex"><div class="cref-tgl" style="background:var(--cref-tgl-on-bg);border:2px solid var(--cref-tgl-on-bor)"></div><div class="cref-tgl" style="background:var(--cref-panel);border:2px solid var(--cref-tgl-off-bor)"></div><div class="cref-tgl" style="background:transparent;border:2px solid var(--cref-dis-ol)"></div></div><div class="cref-tokens"><div class="cref-tok-row"><span class="cref-tok-prop">On</span><span class="cref-tok-stack">88x · 88x b</span><span class="cref-tok-hex" data-cref="tgl-on-bg"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Off</span><span class="cref-tok-stack">4x · 80×48% b</span><span class="cref-tok-hex" data-cref="tgl-off-bg"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Disabled</span><span class="cref-tok-stack">80×8% OL</span><span class="cref-tok-hex" data-cref="dis-ol"></span></div></div><div class="cref-label">Pill Toggle</div></div>`,
			// Radio
			`<div class="cref-card"><div class="cref-preview" style="background:var(--cref-panel);gap:0.5rem;display:flex"><div class="cref-radio" style="box-shadow:inset 0 0 0 4px var(--cref-radio-on)"></div><div class="cref-radio" style="box-shadow:inset 0 0 0 4px var(--cref-radio-off)"></div><div class="cref-radio" style="box-shadow:inset 0 0 0 4px var(--cref-dis-ol);background:transparent"></div></div><div class="cref-tokens"><div class="cref-tok-row"><span class="cref-tok-prop">Active</span><span class="cref-tok-stack">88x</span><span class="cref-tok-hex" data-cref="radio-on"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Inactive</span><span class="cref-tok-stack">80×48%</span><span class="cref-tok-hex" data-cref="radio-off"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Disabled</span><span class="cref-tok-stack">80×8% OL</span><span class="cref-tok-hex" data-cref="dis-ol"></span></div></div><div class="cref-label">Radio</div></div>`,
			`</div></div>`,

			// ── Pagination ──
			`<div class="cref-group"><h3 class="cref-group-title">Pagination</h3><div class="cref-grid"><div class="cref-card"><div class="cref-preview" style="background:var(--cref-panel)"><div class="cref-pagination"><div class="cref-dot-pill" style="background:var(--cref-pg-active)"></div><div class="cref-dot-circle" style="background:var(--cref-pg-inactive)"></div><div class="cref-dot-circle" style="background:var(--cref-pg-inactive)"></div><div class="cref-dot-circle" style="background:var(--cref-pg-inactive)"></div></div></div><div class="cref-tokens"><div class="cref-tok-row"><span class="cref-tok-prop">Active</span><span class="cref-tok-stack">88x</span><span class="cref-tok-hex" data-cref="pg-active"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Inactive</span><span class="cref-tok-stack">80×48%</span><span class="cref-tok-hex" data-cref="pg-inactive"></span></div></div><div class="cref-label">Pill + Circles</div></div></div></div>`,

			// ── Notifications ──
			`<div class="cref-group"><h3 class="cref-group-title">Notifications</h3><div class="cref-grid">`,
			// Priority
			`<div class="cref-card" style="grid-column:1/-1"><div class="cref-preview" style="background:var(--cref-panel);padding:0.5rem"><div class="cref-notif" style="background:var(--cref-notif-bg);border:2px solid var(--cref-alert-border);border-radius:var(--r);padding:0.5rem 0.75rem;display:flex;flex-direction:column;gap:0.5rem"><div style="display:flex;gap:0.5rem;align-items:start"><div class="cref-avatar" style="background:var(--cref-alert-fg);color:var(--cref-notif-bg);flex-shrink:0"><span class="material-symbols-rounded" style="font-size:1rem">person</span></div><div style="flex:1"><div style="display:flex;gap:0.25rem;align-items:baseline;margin-bottom:0.125rem"><span style="font-weight:600;font-size:var(--fs);color:var(--cref-alert-fg)">Priority Title</span><span style="font-size:0.625rem;font-weight:500;color:var(--cref-notif-meta)">· 18:22</span></div><div style="font-size:0.625rem;color:var(--cref-notif-bd);line-height:1.25;margin-bottom:0.25rem">Body text · 80x 500</div><div style="display:flex;gap:0.125rem;align-items:baseline"><span style="font-size:0.625rem;font-weight:600;color:var(--cref-notif-bd)">Source Label</span><span style="font-size:0.625rem;font-weight:500;color:var(--cref-notif-meta)">· 80×48%</span></div></div><div class="cref-chev" style="background:var(--cref-surf-hint);color:var(--cref-notif-bd);flex-shrink:0"><span class="material-symbols-rounded" style="font-size:0.75rem">expand_more</span></div></div><div style="display:flex;gap:0.25rem"><div class="cref-btn" style="background:var(--cref-alert-fg);color:var(--cref-notif-bg);font-size:0.625rem;padding:0.25rem 0.5rem;border-radius:var(--r);font-weight:500;display:flex;align-items:center;gap:0.25rem"><span class="material-symbols-rounded" style="font-size:0.75rem">open_in_new</span>Action</div><div class="cref-btn" style="background:var(--cref-surf-hint);color:var(--cref-alert-fg);font-size:0.625rem;padding:0.25rem 0.5rem;border-radius:var(--r);font-weight:500;display:flex;align-items:center;gap:0.25rem"><span class="material-symbols-rounded" style="font-size:0.75rem">content_copy</span>Copy</div></div></div></div><div class="cref-tokens"><div class="cref-tok-row"><span class="cref-tok-prop">Surface</span><span class="cref-tok-stack">8x</span><span class="cref-tok-hex" data-cref="notif-bg"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Border</span><span class="cref-tok-stack">88×12 · 2px</span><span class="cref-tok-hex" data-cref="alert-border"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Title</span><span class="cref-tok-stack">88×12 · 600</span><span class="cref-tok-hex" data-cref="alert-fg"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Body</span><span class="cref-tok-stack">80x · 500</span><span class="cref-tok-hex" data-cref="notif-bd"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Meta</span><span class="cref-tok-stack">80×48%</span><span class="cref-tok-hex" data-cref="notif-meta"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">CTA</span><span class="cref-tok-stack">88x · 4x · 500</span></div><div class="cref-tok-row"><span class="cref-tok-prop">Copy</span><span class="cref-tok-stack">80×8% · 88x</span></div></div><div class="cref-label">Priority</div></div>`,
			// Standard
			`<div class="cref-card" style="grid-column:1/-1"><div class="cref-preview" style="background:var(--cref-panel);padding:0.5rem"><div class="cref-notif" style="background:var(--cref-notif-bg);border-radius:var(--r);padding:0.5rem 0.75rem;display:flex;flex-direction:column;gap:0.5rem"><div style="display:flex;gap:0.5rem;align-items:start"><div class="cref-avatar" style="background:var(--cref-notif-h);color:var(--cref-notif-bg);flex-shrink:0"><span class="material-symbols-rounded" style="font-size:1rem">person</span></div><div style="flex:1"><div style="display:flex;gap:0.25rem;align-items:baseline;margin-bottom:0.125rem"><span style="font-weight:600;font-size:var(--fs);color:var(--cref-notif-h)">Standard Title</span><span style="font-size:0.625rem;font-weight:500;color:var(--cref-notif-meta)">· 17:38</span></div><div style="font-size:0.625rem;color:var(--cref-notif-bd);line-height:1.25;margin-bottom:0.25rem">Body text · 80x 500</div><div style="display:flex;gap:0.125rem;align-items:baseline"><span style="font-size:0.625rem;font-weight:600;color:var(--cref-notif-bd)">Source Label</span><span style="font-size:0.625rem;font-weight:500;color:var(--cref-notif-meta)">· 80×48%</span></div></div><div class="cref-chev" style="background:var(--cref-surf-hint);color:var(--cref-notif-bd);flex-shrink:0"><span class="material-symbols-rounded" style="font-size:0.75rem">expand_more</span></div></div><div style="display:flex;gap:0.25rem"><div class="cref-btn" style="background:var(--cref-surf-hint);color:var(--cref-notif-bd);font-size:0.625rem;padding:0.25rem 0.5rem;border-radius:var(--r);font-weight:500;display:flex;align-items:center;gap:0.25rem"><span class="material-symbols-rounded" style="font-size:0.75rem">content_copy</span>Copy</div></div></div></div><div class="cref-tokens"><div class="cref-tok-row"><span class="cref-tok-prop">Surface</span><span class="cref-tok-stack">8x</span><span class="cref-tok-hex" data-cref="notif-bg"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Title</span><span class="cref-tok-stack">88x · 600</span><span class="cref-tok-hex" data-cref="notif-h"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Body</span><span class="cref-tok-stack">80x · 500</span><span class="cref-tok-hex" data-cref="notif-bd"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Source</span><span class="cref-tok-stack">80x · 600</span><span class="cref-tok-hex" data-cref="notif-bd"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Meta</span><span class="cref-tok-stack">80×48% · 500</span><span class="cref-tok-hex" data-cref="notif-meta"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Copy</span><span class="cref-tok-stack">80×8% · 80x</span></div></div><div class="cref-label">Standard</div></div>`,
			`</div></div>`,

			// ── Slider ──
			`<div class="cref-group"><h3 class="cref-group-title">Slider</h3><div class="cref-grid"><div class="cref-card"><div class="cref-preview" style="background:var(--cref-panel);flex-direction:column;align-items:stretch;gap:0.25rem;padding:0.625rem 0.5rem"><div style="font-size:var(--fs);font-weight:500;color:var(--cref-sl-dot);margin-bottom:0.125rem">Source Label</div><div style="display:flex;justify-content:space-between"><span style="font-size:var(--fs);font-weight:600;color:var(--cref-sl-fill)">64%</span><span style="font-size:var(--fs);font-weight:500;color:var(--cref-sl-track)">150%</span></div><div class="cref-slider-std"><div class="cref-sl-std-fill" style="background:var(--cref-sl-fill);width:2.5rem"></div><div class="cref-sl-std-knob" style="background:var(--cref-sl-fill)"></div><div class="cref-sl-std-track" style="background:var(--cref-sl-track)"><div style="margin-left:auto;margin-right:0.25rem"><div class="cref-sl-std-dot" style="background:var(--cref-sl-dot)"></div></div></div></div></div><div class="cref-tokens"><div class="cref-tok-row"><span class="cref-tok-prop">Active</span><span class="cref-tok-stack">88x</span><span class="cref-tok-var">--base06</span><span class="cref-tok-hex" data-cref="sl-fill"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Track</span><span class="cref-tok-stack">80×48%</span><span class="cref-tok-var">--base03</span><span class="cref-tok-hex" data-cref="sl-track"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Handle</span><span class="cref-tok-stack">4×32px · 88x</span><span class="cref-tok-hex" data-cref="sl-fill"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Disabled</span><span class="cref-tok-stack">80×8% OL · 88×24%</span><span class="cref-tok-hex" data-cref="dis-ol"></span></div></div><div class="cref-label">Standard</div></div></div></div>`,

			// ── Workspace Cards ──
			`<div class="cref-group"><h3 class="cref-group-title">Workspace Cards</h3><div class="cref-grid"><div class="cref-card"><div class="cref-preview" style="background:var(--cref-panel);gap:0.375rem;display:flex"><div class="cref-ws-card" style="background:var(--cref-ws-cur-bg);border:2px solid var(--cref-ws-cur-border);color:var(--cref-ws-cur-fg)">1</div><div class="cref-ws-card" style="background:var(--cref-ws-pres-bg);border:2px solid var(--cref-ws-pres-border);color:var(--cref-ws-pres-fg)">2</div><div class="cref-ws-card" style="background:var(--cref-ws-empty-bg);border:2px solid var(--cref-ws-empty-border);color:var(--cref-ws-empty-fg)">3</div></div><div class="cref-tokens"><div class="cref-tok-row"><span class="cref-tok-prop">Current</span><span class="cref-tok-stack">8x·88x</span><span class="cref-tok-hex" data-cref="ws-cur-bg"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Present</span><span class="cref-tok-stack">8x·64x</span><span class="cref-tok-hex" data-cref="ws-pres-bg"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Empty</span><span class="cref-tok-stack">8×80%</span><span class="cref-tok-hex" data-cref="ws-empty-bg"></span></div></div><div class="cref-label">Current · Present · Empty</div></div></div></div>`,

			// ── Input & Progress ──
			`<div class="cref-group"><h3 class="cref-group-title">Input & Progress</h3><div class="cref-grid">`,
			`<div class="cref-card"><div class="cref-preview" style="background:var(--cref-panel);flex-direction:column;gap:0.25rem"><div class="cref-input" style="outline-color:var(--cref-num-ol);color:var(--cref-num-fg)">30°</div></div><div class="cref-tokens"><div class="cref-tok-row"><span class="cref-tok-prop">Outline</span><span class="cref-tok-stack">80×48%</span><span class="cref-tok-var">--base03</span><span class="cref-tok-hex" data-cref="num-ol"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Text</span><span class="cref-tok-stack">80x</span><span class="cref-tok-var">--base05</span><span class="cref-tok-hex" data-cref="num-fg"></span></div></div><div class="cref-label">Number Input</div></div>`,
			`<div class="cref-card"><div class="cref-preview" style="background:var(--cref-panel);flex-direction:column;align-items:stretch;gap:0.25rem"><div style="display:flex;justify-content:space-between"><span style="font-size:var(--fs);font-weight:600;color:var(--cref-sl-fill)">72%</span><span style="font-size:var(--fs);font-weight:500;color:var(--cref-sl-track)">100%</span></div><div class="cref-slider-std" style="overflow:hidden"><div class="cref-sl-pg-fill" style="background:var(--cref-sl-fill);width:2.5rem"></div><div class="cref-sl-pg-track" style="background:var(--cref-sl-track)"></div></div></div><div class="cref-tokens"><div class="cref-tok-row"><span class="cref-tok-prop">Fill</span><span class="cref-tok-stack">88x</span><span class="cref-tok-var">--base06</span><span class="cref-tok-hex" data-cref="sl-fill"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Disabled</span><span class="cref-tok-stack">80×8% OL · 88×24%</span><span class="cref-tok-hex" data-cref="dis-ol"></span></div></div><div class="cref-label">Progress Bar</div></div>`,
			`</div></div>`,
		].join("");
		container.dataset.ready = "1";
	}

	// ── CSS variable updates ──
	root.style.setProperty("--cref-panel", h4x);
	// Buttons
	root.style.setProperty("--cref-cta-bg", h88x);
	root.style.setProperty("--cref-cta-fg", h4x);
	root.style.setProperty("--cref-def-bg", h8x);
	root.style.setProperty("--cref-def-fg", h80x);
	root.style.setProperty("--cref-sec-bg", h80x8);
	root.style.setProperty("--cref-dis-fg", h88x24);
	root.style.setProperty("--cref-dis-ol", h80x8);
	// Tabs
	root.style.setProperty("--cref-tab-sel-bg", h88x);
	root.style.setProperty("--cref-tab-sel-fg", h4x);
	root.style.setProperty("--cref-tab-unsel-bg", h8x);
	root.style.setProperty("--cref-tab-unsel-fg", h80x48);
	// Togglables
	root.style.setProperty("--cref-tgl-on-bg", h88x);
	root.style.setProperty("--cref-tgl-on-bor", h88x);
	root.style.setProperty("--cref-tgl-off-bg", h80x8);
	root.style.setProperty("--cref-tgl-off-bor", h80x48);
	root.style.setProperty("--cref-radio-on", h88x);
	root.style.setProperty("--cref-radio-off", h80x48);
	// Pagination
	root.style.setProperty("--cref-pg-active", h88x);
	root.style.setProperty("--cref-pg-inactive", h80x48);
	// Notifications
	root.style.setProperty("--cref-notif-bg", h8x);
	root.style.setProperty("--cref-notif-h", h88x);
	root.style.setProperty("--cref-notif-bd", h80x);
	root.style.setProperty("--cref-notif-meta", h80x48);
	root.style.setProperty("--cref-surf-hint", h80x8);
	root.style.setProperty("--cref-alert-border", hex("88x", 12));
	root.style.setProperty("--cref-alert-fg", hex("88x", 12));
	// Slider
	root.style.setProperty("--cref-sl-fill", h88x);
	root.style.setProperty("--cref-sl-track", h80x48);
	root.style.setProperty("--cref-sl-dot", h80x);
	// Workspace
	root.style.setProperty("--cref-ws-cur-bg", h8x);
	root.style.setProperty("--cref-ws-cur-border", h88x);
	root.style.setProperty("--cref-ws-cur-fg", h88x);
	root.style.setProperty("--cref-ws-pres-bg", h8x);
	root.style.setProperty("--cref-ws-pres-border", h64x);
	root.style.setProperty("--cref-ws-pres-fg", h64x);
	{
		const ws8x = pmd["8x"];
		if (!ws8x) return;
		const rgb = oklchToRgb(ws8x.l, ws8x.c, hue);
		root.style.setProperty(
			"--cref-ws-empty-bg",
			`rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`,
		);
	}
	root.style.setProperty("--cref-ws-empty-border", h88x24);
	root.style.setProperty("--cref-ws-empty-fg", h88x24);
	// Input & Progress
	root.style.setProperty("--cref-num-ol", h80x48);
	root.style.setProperty("--cref-num-fg", h80x);

	// ── Hex token map ──
	const hexMap: Record<string, string> = {
		"cta-bg": h88x,
		"cta-fg": h4x,
		"def-bg": h8x,
		"def-fg": h80x,
		"dis-fg": h88x24,
		"dis-ol": h80x8,
		"tab-sel-bg": h88x,
		"tab-sel-fg": h4x,
		"tab-unsel-fg": h80x48,
		"tgl-on-bg": h88x,
		"tgl-on-bor": h88x,
		"tgl-off-bg": h4x,
		"tgl-off-bor": h80x48,
		"radio-on": h88x,
		"radio-off": h80x48,
		"pg-active": h88x,
		"pg-inactive": h80x48,
		"notif-bg": h8x,
		"notif-h": h88x,
		"notif-bd": h80x,
		"notif-meta": h80x48,
		"surf-hint": h80x8,
		"alert-border": hex("88x", 12),
		"alert-fg": hex("88x", 12),
		"sl-fill": h88x,
		"sl-track": h80x48,
		"sl-dot": h80x,
		"ws-cur-bg": h8x,
		"ws-pres-bg": h8x,
		"ws-empty-bg": stackHex("8x", "0x", 0.8),
		"num-ol": h80x48,
		"num-fg": h80x,
	};

	container.querySelectorAll("[data-cref]").forEach((el) => {
		const key = (el as HTMLElement).dataset.cref;
		if (key && hexMap[key]) (el as HTMLElement).textContent = hexMap[key];
	});
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
	const c64 = hex("64x");
	const c8x = hex("8x");
	const c4x = hex("4x");
	const _c0x = hex("0x");

	const surfWidget = stackHex("8x", "80x", 0.08);
	const surfMuted = stackHex("8x", "80x", 0.48);
	const txtInactive = `${c88}3D`;
	const alertBg = hex("88x", 12);
	const alertBorder = `${c88}FF`;

	if (!container.dataset.ready) {
		container.innerHTML = `
    <div class="ui-pv ui-pv-panel" style="background:var(--pv-bg)">
      <div class="ui-pv-row">
        <div class="ui-pv-card" style="background:var(--pv-card)">
          <div class="ui-pv-title ui-pv-mb-xxs" style="color:var(--pv-h)">Header · 88x 600</div>
          <div class="ui-pv-body ui-pv-mb-xs" style="color:var(--pv-sub)">Subtext · 64x 500</div>
          <div class="ui-pv-gap-xs">
            <div class="ui-pv-btn" style="background:var(--pv-active);color:var(--pv-on-active);font-weight:500">88x active</div>
            <div class="ui-pv-btn" style="background:var(--pv-surf);color:var(--pv-inactive);font-weight:500">88×24%</div>
            <div class="ui-pv-btn" style="background:var(--pv-surf);color:var(--pv-body);font-weight:500">80×8%</div>
          </div>
        </div>
        <div class="ui-pv-card ui-pv-col" style="background:var(--pv-card)">
          <div class="ui-pv-btwn">
            <span class="ui-pv-head" style="color:var(--pv-h)">0:56</span>
            <span class="ui-pv-body ui-pv-center" style="color:var(--pv-body)">Zen Browser</span>
            <span class="ui-pv-body" style="color:var(--pv-muted)">4:08</span>
          </div>
          <div class="ui-pv-slider">
            <div class="ui-pv-sfill" style="background:var(--pv-active)"></div>
            <div class="ui-pv-sknob" style="background:var(--pv-active)"></div>
            <div class="ui-pv-strack" style="background:var(--pv-muted)">
              <div class="ui-pv-sdot" style="background:var(--pv-body)"></div>
            </div>
          </div>
          <div class="ui-pv-gap-xs">
            <div class="ui-pv-btn" style="flex:1;background:var(--pv-active);color:var(--pv-on-active);font-weight:500">88x active</div>
            <div class="ui-pv-btn" style="flex:1;background:var(--pv-surf);color:var(--pv-body);font-weight:500">80×8% def</div>
          </div>
        </div>
      </div>
      <div class="ui-pv-row">
        <div class="ui-pv-gap-sm ui-pv-card" style="background:var(--pv-card);padding:0.5rem 0.75rem">
          <span class="ui-pv-body" style="color:var(--pv-muted)">Timestamp</span>
          <span class="ui-pv-meta" style="color:var(--pv-muted)">14:32</span>
          <span class="ui-pv-meta" style="color:var(--pv-muted)">· 80x 48%</span>
        </div>
        <div class="ui-pv-alert ui-pv-head" style="background:var(--pv-alert-bg);border:2px solid var(--pv-alert-border);color:var(--pv-on-alert)">88×12 priority</div>
      </div>
    </div>`;
		container.dataset.ready = "1";
	}

	const pv = container.firstElementChild as HTMLElement;
	if (!pv) return;

	pv.style.setProperty("--pv-bg", c4x);
	pv.style.setProperty("--pv-card", c8x);
	pv.style.setProperty("--pv-h", c88);
	pv.style.setProperty("--pv-sub", c64);
	pv.style.setProperty("--pv-body", c80);
	pv.style.setProperty("--pv-muted", surfMuted);
	pv.style.setProperty("--pv-surf", surfWidget);
	pv.style.setProperty("--pv-active", c88);
	pv.style.setProperty("--pv-on-active", txtOn(c88));
	pv.style.setProperty("--pv-inactive", txtInactive);
	pv.style.setProperty("--pv-alert-bg", alertBg);
	pv.style.setProperty("--pv-alert-border", alertBorder);
	pv.style.setProperty("--pv-on-alert", txtOn(alertBg));
}
