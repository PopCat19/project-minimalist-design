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

	if (!container.dataset.ready) {
		container.innerHTML = `
    <div class="ui-pv ui-pv-panel" style="background:var(--pv-bg)">
      <div class="ui-pv-row">
        <div class="ui-pv-card" style="background:var(--pv-card)">
          <div class="ui-pv-title ui-pv-mb-xxs" style="color:var(--pv-h)">Header · 88x 600</div>
          <div class="ui-pv-body ui-pv-mb-xs" style="color:var(--pv-sub)">Subtext · 72x 500</div>
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
	pv.style.setProperty("--pv-sub", c72);
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
