// src/ts/color/oklch.ts
function oklchToRgb(l, c, h) {
  const hRad = h * Math.PI / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const lCubed = l_ * l_ * l_;
  const mCubed = m_ * m_ * m_;
  const sCubed = s_ * s_ * s_;
  const rLin = 4.0767416621 * lCubed - 3.3077115913 * mCubed + 0.2309699292 * sCubed;
  const gLin = -1.2684380046 * lCubed + 2.6097574011 * mCubed - 0.3413193965 * sCubed;
  const bLin = -0.0041960863 * lCubed - 0.7034186147 * mCubed + 1.707614701 * sCubed;
  const gamma = (v) => v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
  const clamp = (v) => Math.max(0, Math.min(1, v));
  return {
    r: Math.round(clamp(gamma(rLin)) * 255),
    g: Math.round(clamp(gamma(gLin)) * 255),
    b: Math.round(clamp(gamma(bLin)) * 255)
  };
}
function rgbToHex({ r, g, b }) {
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}
function isInGamut(l, c, h) {
  const hRad = h * Math.PI / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const lCubed = l_ * l_ * l_;
  const mCubed = m_ * m_ * m_;
  const sCubed = s_ * s_ * s_;
  const rLin = 4.0767416621 * lCubed - 3.3077115913 * mCubed + 0.2309699292 * sCubed;
  const gLin = -1.2684380046 * lCubed + 2.6097574011 * mCubed - 0.3413193965 * sCubed;
  const bLin = -0.0041960863 * lCubed - 0.7034186147 * mCubed + 1.707614701 * sCubed;
  return rLin >= -0.000000001 && rLin <= 1 + 0.000000001 && gLin >= -0.000000001 && gLin <= 1 + 0.000000001 && bLin >= -0.000000001 && bLin <= 1 + 0.000000001;
}
function maxChroma(l, h) {
  let lo = 0;
  let hi = 0.4;
  for (let i = 0;i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (isInGamut(l, mid, h))
      lo = mid;
    else
      hi = mid;
  }
  return lo;
}
function clampChroma(l, c, h) {
  const max = maxChroma(l, h);
  return Math.min(c, max);
}
function safeOklchToRgb(l, c, h) {
  return oklchToRgb(l, clampChroma(l, c, h), h);
}
function getContrastColor(r, g, b) {
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#FFFFFF";
}
// src/ts/pmd/variables.ts
var PMD_DARK = {
  "100x": { l: 1, c: 0 },
  "88x": { l: 0.88, c: 0.056 },
  "80x": { l: 0.8, c: 0.1 },
  "64x": { l: 0.64, c: 0.111 },
  "8x": { l: 0.2, c: 0.032 },
  "4x": { l: 0.16, c: 0.022 },
  "0x": { l: 0, c: 0 }
};
var PMD_LIGHT = {
  "100x": { l: 0, c: 0 },
  "88x": { l: 0.28, c: 0.032 },
  "80x": { l: 0.2, c: 0.032 },
  "64x": { l: 0.36, c: 0.058 },
  "8x": { l: 0.88, c: 0.056 },
  "4x": { l: 0.92, c: 0.044 },
  "0x": { l: 1, c: 0 }
};
function composite(bg, fg, alpha) {
  return {
    l: bg.l * (1 - alpha) + fg.l * alpha,
    c: bg.c * (1 - alpha) + fg.c * alpha
  };
}
function getComputed(pmd) {
  return {
    surface: composite(pmd["8x"], pmd["80x"], 0.08),
    muted: composite(pmd["8x"], pmd["80x"], 0.48)
  };
}
var HUE_MAX = 360;
var AUX_HUE_OFFSET = 180;
function getAuxHue(hue) {
  return (hue + AUX_HUE_OFFSET) % HUE_MAX;
}
function getPMD(isDark) {
  const pmd = isDark ? PMD_DARK : PMD_LIGHT;
  return { pmd, computed: getComputed(pmd) };
}

// src/ts/pmd/base16.ts
var OKLCH_PRECISION = 3;
function rot(base, deg) {
  return (base + deg + HUE_MAX) % HUE_MAX;
}
function formatOklch(l, c, h) {
  return `oklch(${l.toFixed(OKLCH_PRECISION)} ${c.toFixed(OKLCH_PRECISION)} ${Math.round(h)})`;
}
function getBase16Defs(pmd, computed) {
  return {
    bg: [
      { id: "base00", pmd: "4x", desc: "Background", ...pmd["4x"] },
      { id: "base01", pmd: "8x", desc: "Base Container", ...pmd["8x"] },
      { id: "base02", pmd: "80×8%", desc: "Surface", ...computed.surface },
      {
        id: "base03",
        pmd: "80×48%",
        desc: "Muted",
        l: computed.muted.l,
        c: computed.muted.c
      }
    ],
    fg: [
      { id: "base04", pmd: "64x", desc: "Subtext", ...pmd["64x"] },
      { id: "base05", pmd: "80x", desc: "Body Text", ...pmd["80x"] },
      { id: "base06", pmd: "88x", desc: "Headers", ...pmd["88x"] },
      { id: "base07", pmd: "100x", desc: "Max Contrast", ...pmd["100x"] }
    ],
    accent: [
      {
        id: "base08",
        pmd: "88x",
        l: pmd["88x"].l,
        c: pmd["88x"].c,
        desc: "Danger"
      },
      {
        id: "base09",
        pmd: "64x+290",
        l: pmd["64x"].l,
        c: pmd["64x"].c,
        offset: 290,
        desc: "Constants"
      },
      {
        id: "base0A",
        pmd: "80x",
        l: pmd["80x"].l,
        c: pmd["80x"].c,
        desc: "Warning"
      },
      {
        id: "base0B",
        pmd: "64x",
        l: pmd["64x"].l,
        c: pmd["64x"].c,
        desc: "Strings"
      },
      {
        id: "base0C",
        pmd: "80x+140",
        l: pmd["80x"].l,
        c: pmd["80x"].c,
        offset: 140,
        desc: "Support"
      },
      {
        id: "base0D",
        pmd: "80x+30",
        l: pmd["80x"].l,
        c: pmd["80x"].c,
        offset: 30,
        desc: "Functions"
      },
      {
        id: "base0E",
        pmd: "64x-30",
        l: pmd["64x"].l,
        c: pmd["64x"].c,
        offset: -30,
        desc: "Keywords"
      },
      {
        id: "base0F",
        pmd: "80×48%",
        l: computed.muted.l,
        c: computed.muted.c,
        desc: "Meta"
      }
    ]
  };
}
function generatePalette(hue, pmd, computed, isHueLocked, lockedHueValue) {
  const defs = getBase16Defs(pmd, computed);
  const accentHue = isHueLocked ? lockedHueValue : hue;
  const isLight = pmd["4x"].l > 0.5;
  const accentL = pmd["64x"].l;
  const accentC = isLight ? 0.122 : pmd["64x"].c;
  const colors = {};
  [...defs.bg, ...defs.fg].forEach((def) => {
    const rgb = safeOklchToRgb(def.l, def.c, hue);
    colors[def.id] = {
      ...def,
      rgb,
      hex: rgbToHex(rgb),
      oklch: formatOklch(def.l, def.c, hue)
    };
  });
  defs.accent.forEach((def) => {
    let h;
    if (def.overrideHue !== undefined) {
      h = def.overrideHue;
    } else if (def.offset !== undefined) {
      h = rot(accentHue, def.offset);
    } else {
      h = accentHue;
    }
    const useAccent = !(def.id === "base0F" || def.pmd === "88x" || def.pmd === "80x" || def.pmd === "80x+30" || def.pmd === "80x+140");
    const l = useAccent ? accentL : def.l;
    const c = useAccent ? accentC : def.c;
    const rgb = safeOklchToRgb(l, c, h);
    colors[def.id] = {
      ...def,
      rgb,
      hex: rgbToHex(rgb),
      hue: h,
      oklch: formatOklch(l, c, h)
    };
  });
  return colors;
}
// src/ts/ui/controls.ts
var presets = [
  { name: "Red", hue: 30 },
  { name: "Orange", hue: 60 },
  { name: "Yellow", hue: 90 },
  { name: "Green", hue: 140 },
  { name: "Cyan", hue: 195 },
  { name: "Blue", hue: 260 },
  { name: "Purple", hue: 290 },
  { name: "Rose", hue: 345 }
];
function renderPresets(containerId, isDark, setHueCallback) {
  const container = document.getElementById(containerId);
  if (!container)
    return;
  const pmd = isDark ? PMD_DARK : PMD_LIGHT;
  const theme = pmd["64x"];
  const root = document.documentElement;
  if (!container.dataset.ready) {
    container.innerHTML = presets.map((preset, i) => {
      return `
            <button class="preset"
                    style="background: var(--pr-${i});"
                    data-name="${preset.name}"
                    data-hue="${preset.hue}">
            </button>`;
    }).join("");
    container.querySelectorAll(".preset").forEach((btn) => {
      btn.addEventListener("click", () => {
        const hue = parseInt(btn.dataset.hue || "0", 10);
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
// src/ts/ui/docs.ts
var pmdDocs = [
  { name: "Overview", path: "doc/overview.txt" },
  { name: "Variables", path: "doc/variables.txt" },
  { name: "Usage Guidelines", path: "doc/usage.txt" },
  { name: "Palette Mapping", path: "doc/palettes.txt" },
  { name: "Hierarchy Rules", path: "doc/hierarchy.txt" },
  { name: "Nix Integration", path: "doc/nix/overview.txt" },
  { name: "Conventions", path: "doc/conventions.txt" }
];
var docsOpen = false;
function toggleDocs() {
  const overlay = document.getElementById("docsOverlay");
  if (!overlay)
    return;
  docsOpen = !docsOpen;
  overlay.style.display = docsOpen ? "flex" : "none";
  document.body.classList.toggle("no-scroll", docsOpen);
  if (docsOpen && document.getElementById("docSidebar")?.children.length === 0) {
    renderDocSidebar();
  }
}
function toggleDocMenu() {
  const sidebar = document.getElementById("docSidebar");
  const backdrop = document.getElementById("docBackdrop");
  const isOpen = sidebar?.classList.toggle("open");
  backdrop?.classList.toggle("show", isOpen ?? false);
}
function renderDocSidebar() {
  const sidebar = document.getElementById("docSidebar");
  if (!sidebar)
    return;
  sidebar.innerHTML = pmdDocs.map((doc) => `
        <button class="export-btn doc-nav-btn" data-path="${doc.path}" style="text-align: left; justify-content: flex-start;">
            <span class="material-symbols-rounded" style="font-size: 1.125rem;">description</span>
            ${doc.name}
        </button>
    `).join("");
  sidebar.querySelectorAll(".doc-nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const path = btn.dataset.path || "";
      loadDoc(path);
    });
  });
}
async function loadDoc(path) {
  const viewer = document.getElementById("docViewer");
  if (!viewer)
    return;
  document.querySelectorAll(".doc-nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.path === path);
  });
  document.getElementById("docSidebar")?.classList.remove("open");
  if (window.location.protocol === "file:") {
    viewer.innerHTML = `
            <div style="max-width: 750px; margin: 0 auto; white-space: normal; border: 0.125rem solid var(--base08); border-radius: 1rem; background: var(--base01); overflow: hidden;">
                <div style="background: var(--base08); color: var(--base00); padding: 0.875rem 1.5rem; font-weight: 700; display: flex; align-items: center; justify-content: space-between;">
                    <span class="material-symbols-rounded" style="font-size: 1.25rem;">security</span>
                    <span style="letter-spacing: 0.05em; font-size: 0.8125rem;">LOCAL_SECURITY_RESTRICTION</span>
                    <span style="width: 1.25rem;"></span>
                </div>
                <div style="padding: 2rem;">
                    <p style="margin-bottom: 1.5rem; color: var(--base05); font-weight: 500;">
                        Browsers block <code style="color: var(--base08); background: var(--base00); padding: 0.125rem 0.375rem; border-radius: 0.5rem;">fetch()</code> requests on the <code style="color: var(--base08); background: var(--base00); padding: 0.125rem 0.375rem; border-radius: 0.5rem;">file:///</code> protocol.
                        To view documentation locally, you must serve the directory via HTTP.
                    </p>
                    <div style="background: var(--base00); border: 0.125rem solid var(--base02); border-radius: 0.75rem; padding: 1.5rem; font-family: 'FiraCode Nerd Font', monospace;">
                        <div style="color: var(--base03); margin-bottom: 0.75rem; font-size: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">$ python3 -m http.server 8080</div>
                    </div>
                </div>
            </div>
        `;
    return;
  }
  viewer.innerHTML = '<div style="max-width: 850px; margin: 0 auto; color: var(--base03)">Fetching document...</div>';
  try {
    const response = await fetch(path);
    if (!response.ok)
      throw new Error("File not found");
    const text = await response.text();
    const cleanText = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    viewer.innerHTML = `<div style="max-width: 850px; margin: 0 auto;">${cleanText}</div>`;
    viewer.scrollTop = 0;
  } catch {
    viewer.innerHTML = `<div style="max-width: 850px; margin: 0 auto; color: var(--base08);">Error: Failed to load ${path}. Ensure the /doc directory exists.</div>`;
  }
}
// src/ts/ui/render.ts
function applyThemeToUI(colors) {
  const root = document.documentElement;
  Object.entries(colors).forEach(([id, color]) => {
    root.style.setProperty(`--${id}`, color.hex);
  });
}
function handleColorClick(event, hex, oklch) {
  if (event.shiftKey) {
    navigator.clipboard.writeText(oklch);
    showToast(`Copied OKLCH: ${oklch}`);
  } else {
    navigator.clipboard.writeText(hex);
    showToast(`Copied Hex: ${hex}`);
  }
}
function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast)
    return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2000);
}
function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
function renderColorGrid(containerId, defs, colors) {
  const container = document.getElementById(containerId);
  if (!container)
    return;
  const root = document.documentElement;
  if (!container.dataset.ready) {
    container.innerHTML = defs.map((def) => `
        <div class="color-card" data-b16="${def.id}">
            <div class="color-swatch" style="background: var(--b16-${def.id}); color: var(--b16c-${def.id})">
                <div class="swatch-hex" data-b16hex="${def.id}"></div>
                <div class="swatch-oklch">${def.pmd}</div>
            </div>
            <div class="color-info">
                <div class="color-name">${def.id}</div>
                <div class="color-desc">${def.desc}</div>
            </div>
        </div>`).join("");
    container.querySelectorAll(".color-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        const id = card.dataset.b16 || "";
        const c = colors[id];
        if (c)
          window.handleColorClick(e, c.hex, c.oklch);
      });
    });
    container.dataset.ready = "1";
  }
  defs.forEach((def) => {
    const color = colors[def.id];
    if (!color)
      return;
    root.style.setProperty(`--b16-${def.id}`, color.hex);
    root.style.setProperty(`--b16c-${def.id}`, getContrastColor(color.rgb.r, color.rgb.g, color.rgb.b));
    const card = container.querySelector(`[data-b16="${def.id}"]`);
    if (card) {
      const hexEl = card.querySelector(`[data-b16hex="${def.id}"]`);
      if (hexEl)
        hexEl.textContent = color.hex;
    }
  });
}
function renderFoundationGrid(containerId, pmd, hue) {
  const container = document.getElementById(containerId);
  if (!container)
    return;
  const slotOrder = ["100x", "88x", "80x", "64x", "8x", "4x", "0x"];
  const roles = {
    "100x": "max contrast",
    "88x": "primary",
    "80x": "secondary",
    "64x": "accent",
    "8x": "base surface",
    "4x": "deep bg",
    "0x": "canvas"
  };
  const root = document.documentElement;
  if (!container.dataset.ready) {
    container.innerHTML = slotOrder.map((key) => {
      const slot = pmd[key];
      if (!slot)
        return "";
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
    }).join("");
    container.querySelectorAll(".color-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        const _k = card.dataset.slot || "";
        const el = card.querySelector(".swatch-oklch");
        const hexEl = card.querySelector(".swatch-hex");
        const hex = getComputedStyle(hexEl).color;
        const oklch = el?.dataset.oklch || "";
        window.handleColorClick(e, hex, oklch);
      });
    });
    container.dataset.ready = "1";
  }
  slotOrder.forEach((key) => {
    const slot = pmd[key];
    if (!slot)
      return;
    const rgb = oklchToRgb(slot.l, slot.c, hue);
    const hex = rgbToHex(rgb);
    const txt = getContrastColor(rgb.r, rgb.g, rgb.b);
    root.style.setProperty(`--fs-${key}`, hex);
    root.style.setProperty(`--fsc-${key}`, txt);
    const card = container.querySelector(`[data-slot="${key}"]`);
    if (card) {
      const hexEl = card.querySelector(`[data-hex="${key}"]`);
      const oklchEl = card.querySelector(`[data-oklch="${key}"]`);
      if (hexEl)
        hexEl.textContent = hex;
      if (oklchEl) {
        oklchEl.textContent = `oklch(${slot.l.toFixed(3)} ${slot.c.toFixed(3)} ${hue})`;
        oklchEl.dataset.oklch = `oklch(${slot.l.toFixed(3)} ${slot.c.toFixed(3)} ${hue})`;
      }
    }
  });
}
function renderStackGrid(containerId, pmd, hue) {
  const container = document.getElementById(containerId);
  if (!container)
    return;
  const defs = [
    {
      label: "8×40%",
      base: "0x",
      tint: "8x",
      opacity: 0.4,
      hasBlur: true,
      role: "translucent flyout surface"
    },
    {
      label: "8×80%",
      base: "0x",
      tint: "8x",
      opacity: 0.8,
      role: "art-showing surface"
    },
    {
      label: "80×8%",
      base: "8x",
      tint: "80x",
      opacity: 0.08,
      role: "interactable surface hint"
    },
    {
      label: "80×48%",
      base: "8x",
      tint: "80x",
      opacity: 0.48,
      role: "muted text / inactive track"
    },
    {
      label: "88×24%",
      base: "8x",
      tint: "88x",
      opacity: 0.24,
      role: "disabled foreground"
    },
    {
      label: "88×12",
      base: "88x",
      tint: "88x",
      opacity: 1,
      offset: 12,
      role: "priority alert"
    },
    {
      label: "80×8%+12",
      base: "8x",
      tint: "80x",
      opacity: 0.08,
      offset: 12,
      role: "subtle alert surface"
    }
  ];
  const root = document.documentElement;
  if (!container.dataset.ready) {
    container.innerHTML = defs.map((def, i) => {
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
    }).join("");
    container.querySelectorAll(".color-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        const hexEl = card.querySelector("[data-shex]");
        const hex = hexEl?.textContent || "";
        const _lbl = card.querySelector(".color-name")?.textContent || "";
        const _oklchEl = card.querySelector(".swatch-oklch");
        window.handleColorClick(e, hex, `composite(${defs[parseInt(card.dataset.stack || "0", 10)].base}, ${defs[parseInt(card.dataset.stack || "0", 10)].tint}, ...)`);
      });
    });
    container.dataset.ready = "1";
  }
  defs.forEach((def, i) => {
    const baseSlot = pmd[def.base];
    const tintSlot = pmd[def.tint];
    if (!baseSlot || !tintSlot)
      return;
    const effHue = def.offset ? (hue + def.offset) % 360 : hue;
    const baked = oklchToRgb(baseSlot.l * (1 - def.opacity) + tintSlot.l * def.opacity, baseSlot.c * (1 - def.opacity) + tintSlot.c * def.opacity, effHue);
    const hex = rgbToHex(baked);
    const txt = getContrastColor(baked.r, baked.g, baked.b);
    const tint = oklchToRgb(tintSlot.l, tintSlot.c, effHue);
    const rgba = `rgba(${tint.r}, ${tint.g}, ${tint.b}, ${def.opacity.toFixed(2)})`;
    root.style.setProperty(`--ss-${i}`, rgba);
    root.style.setProperty(`--ssc-${i}`, txt);
    const card = container.querySelector(`[data-stack="${i}"]`);
    if (card) {
      const hexEl = card.querySelector(`[data-shex="${i}"]`);
      if (hexEl)
        hexEl.textContent = hex;
    }
  });
}
function renderCodePreview(colors, currentHue) {
  const preview = document.getElementById("codePreview");
  if (!preview)
    return;
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
  if (hueEl)
    hueEl.textContent = String(currentHue);
  if (schemeEl)
    schemeEl.textContent = schemeLabel;
  if (accentEl)
    accentEl.textContent = colors.base0D.hex;
}
function renderComponentReference(pmd, hue) {
  const container = document.getElementById("componentReference");
  if (!container)
    return;
  const hex = (key, hOff) => {
    const s = pmd[key];
    if (!s)
      return "#000";
    const rgb = oklchToRgb(s.l, s.c, hOff ? (hue + hOff) % 360 : hue);
    return rgbToHex(rgb);
  };
  const stackHex = (baseKey, tintKey, alpha, hOff) => {
    const b = pmd[baseKey];
    const t = pmd[tintKey];
    if (!b || !t)
      return "#000";
    const rgb = oklchToRgb(b.l * (1 - alpha) + t.l * alpha, b.c * (1 - alpha) + t.c * alpha, hOff ? (hue + hOff) % 360 : hue);
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
      `<div class="cref-group"><h3 class="cref-group-title">Buttons</h3><div class="cref-grid">`,
      `<div class="cref-card"><div class="cref-preview" style="background:var(--cref-panel);gap:0.375rem;display:flex"><div class="cref-btn" style="background:var(--cref-cta-bg);color:var(--cref-cta-fg)">CTA</div><div class="cref-btn" style="background:var(--cref-cta-bg);color:var(--cref-cta-fg)"><span style="display:flex;align-items:center;gap:0.25rem"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="6"/></svg>Icon+Label</span></div></div><div class="cref-tokens"><div class="cref-tok-row"><span class="cref-tok-prop">Surface</span><span class="cref-tok-stack">88x</span><span class="cref-tok-var">--base06</span><span class="cref-tok-hex" data-cref="cta-bg"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Text</span><span class="cref-tok-stack">4x</span><span class="cref-tok-var">--base01</span><span class="cref-tok-hex" data-cref="cta-fg"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Weight</span><span class="cref-tok-stack">—</span><span class="cref-tok-var">500</span></div><div class="cref-tok-row"><span class="cref-tok-prop">Radius</span><span class="cref-tok-stack">—</span><span class="cref-tok-var">1rem</span></div><div class="cref-tok-row"><span class="cref-tok-prop">Icon</span><span class="cref-tok-stack">16px</span><span class="cref-tok-var">4x</span></div></div><div class="cref-label">CTA</div></div>`,
      `<div class="cref-card"><div class="cref-preview" style="background:var(--cref-panel);gap:0.375rem;display:flex"><div class="cref-btn" style="background:var(--cref-def-bg);color:var(--cref-def-fg)">Default</div><div class="cref-btn" style="background:var(--cref-def-bg);color:var(--cref-def-fg)"><span style="display:flex;align-items:center;gap:0.25rem"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="6"/></svg>Icon+Label</span></div></div><div class="cref-tokens"><div class="cref-tok-row"><span class="cref-tok-prop">Surface</span><span class="cref-tok-stack">8x</span><span class="cref-tok-var">--base01</span><span class="cref-tok-hex" data-cref="def-bg"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Text</span><span class="cref-tok-stack">80x</span><span class="cref-tok-var">--base05</span><span class="cref-tok-hex" data-cref="def-fg"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Weight</span><span class="cref-tok-stack">—</span><span class="cref-tok-var">500</span></div><div class="cref-tok-row"><span class="cref-tok-prop">Radius</span><span class="cref-tok-stack">—</span><span class="cref-tok-var">1rem</span></div><div class="cref-tok-row"><span class="cref-tok-prop">Icon</span><span class="cref-tok-stack">16px</span><span class="cref-tok-var">80x</span></div></div><div class="cref-label">Default</div></div>`,
      `<div class="cref-card"><div class="cref-preview" style="background:var(--cref-panel);gap:0.375rem;display:flex"><div class="cref-btn" style="background:transparent;color:var(--cref-dis-fg);outline-color:var(--cref-dis-ol)">Disabled</div></div><div class="cref-tokens"><div class="cref-tok-row"><span class="cref-tok-prop">Surface</span><span class="cref-tok-stack">none</span></div><div class="cref-tok-row"><span class="cref-tok-prop">Text</span><span class="cref-tok-stack">88×24%</span><span class="cref-tok-hex" data-cref="dis-fg"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Outline</span><span class="cref-tok-stack">80×8%</span><span class="cref-tok-hex" data-cref="dis-ol"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Weight</span><span class="cref-tok-stack">—</span><span class="cref-tok-var">500</span></div></div><div class="cref-label">Disabled</div></div>`,
      `</div></div>`,
      `<div class="cref-card"><div class="cref-preview" style="background:var(--cref-panel)"><div class="cref-tab"><div class="cref-tab-sel" style="background:var(--cref-tab-sel-bg);color:var(--cref-tab-sel-fg);border-radius:var(--r) 8px 8px var(--r);padding:0.25rem 0.625rem;font-size:var(--fs);font-weight:600">First</div><div class="cref-tab-unsel" style="background:var(--cref-tab-unsel-bg);color:var(--cref-tab-unsel-fg);border-radius:8px;padding:0.25rem 0.625rem;font-size:var(--fs);font-weight:500">Middle</div><div class="cref-tab-unsel" style="background:var(--cref-tab-unsel-bg);color:var(--cref-tab-unsel-fg);border-radius:8px var(--r) var(--r) 8px;padding:0.25rem 0.625rem;font-size:var(--fs);font-weight:500">Last</div></div></div><div class="cref-tokens"><div class="cref-tok-row"><span class="cref-tok-prop">Selected</span><span class="cref-tok-stack">88x · 600</span><span class="cref-tok-hex" data-cref="tab-sel-bg"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Unselected</span><span class="cref-tok-stack">8x · 80×48%</span><span class="cref-tok-hex" data-cref="tab-unsel-fg"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Disabled</span><span class="cref-tok-stack">88×24% · 80×8% OL</span><span class="cref-tok-hex" data-cref="dis-fg"></span></div></div><div class="cref-label">Selected · Unselected · Disabled</div></div></div></div>`,
      `<div class="cref-group"><h3 class="cref-group-title">Togglables</h3><div class="cref-grid">`,
      `<div class="cref-card"><div class="cref-preview" style="background:var(--cref-panel);gap:0.375rem;display:flex"><div class="cref-tgl" style="background:var(--cref-tgl-on-bg);border:2px solid var(--cref-tgl-on-bor)"></div><div class="cref-tgl" style="background:var(--cref-tgl-off-bg);border:2px solid var(--cref-tgl-off-bor)"></div><div class="cref-tgl" style="background:transparent;border:2px solid var(--cref-dis-ol);display:flex;align-items:center;justify-content:center;color:var(--cref-dis-fg);font-size:0.5rem;line-height:1;font-weight:700;font-family:Fredoka">/</div></div><div class="cref-tokens"><div class="cref-tok-row"><span class="cref-tok-prop">On</span><span class="cref-tok-stack">88x · 88x b</span><span class="cref-tok-hex" data-cref="tgl-on-bg"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Off</span><span class="cref-tok-stack">80×8% · 80×48% b</span><span class="cref-tok-hex" data-cref="tgl-off-bg"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Disabled</span><span class="cref-tok-stack">80×8% OL</span><span class="cref-tok-hex" data-cref="dis-ol"></span></div></div><div class="cref-label">Pill Toggle</div></div>`,
      `<div class="cref-card"><div class="cref-preview" style="background:var(--cref-panel);gap:0.5rem;display:flex"><div class="cref-radio" style="border-color:var(--cref-radio-on)"></div><div class="cref-radio" style="border-color:var(--cref-radio-off)"></div><div class="cref-radio" style="border:2px solid var(--cref-dis-ol);background:transparent;display:flex;align-items:center;justify-content:center;color:var(--cref-dis-fg);font-size:0.5rem;line-height:1;font-weight:700;font-family:Fredoka">/</div></div><div class="cref-tokens"><div class="cref-tok-row"><span class="cref-tok-prop">Active</span><span class="cref-tok-stack">88x</span><span class="cref-tok-hex" data-cref="radio-on"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Inactive</span><span class="cref-tok-stack">80×8%</span><span class="cref-tok-hex" data-cref="radio-off"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Disabled</span><span class="cref-tok-stack">80×8% OL</span><span class="cref-tok-hex" data-cref="dis-ol"></span></div></div><div class="cref-label">Radio</div></div>`,
      `</div></div>`,
      `<div class="cref-group"><h3 class="cref-group-title">Pagination</h3><div class="cref-grid"><div class="cref-card"><div class="cref-preview" style="background:var(--cref-panel)"><div class="cref-pagination"><div class="cref-dot-pill" style="background:var(--cref-pg-active)"></div><div class="cref-dot-circle" style="background:var(--cref-pg-inactive)"></div><div class="cref-dot-circle" style="background:var(--cref-pg-inactive)"></div><div class="cref-dot-circle" style="background:var(--cref-pg-inactive)"></div></div></div><div class="cref-tokens"><div class="cref-tok-row"><span class="cref-tok-prop">Active</span><span class="cref-tok-stack">88x</span><span class="cref-tok-var">--base06</span><span class="cref-tok-hex" data-cref="pg-active"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Inactive</span><span class="cref-tok-stack">80×48%</span><span class="cref-tok-var">--base03</span><span class="cref-tok-hex" data-cref="pg-inactive"></span></div></div><div class="cref-label">Pill + Circles</div></div></div></div>`,
      `<div class="cref-group"><h3 class="cref-group-title">Notifications</h3><div class="cref-grid">`,
      `<div class="cref-card"><div class="cref-preview" style="background:var(--cref-panel);padding:0.5rem"><div class="cref-notif" style="background:var(--cref-notif-bg);border:2px solid var(--cref-alert-border);border-radius:var(--r);padding:0.5rem 0.75rem"><div style="font-weight:600;font-size:var(--fs);color:var(--cref-alert-fg);margin-bottom:0.125rem">Priority Title</div><div style="font-size:0.625rem;color:var(--cref-notif-bd);line-height:1.25">Body text · 80x 500 <span style="color:var(--cref-sl-track)">· meta 80×48%</span></div><div style="display:flex;gap:0.25rem;margin-top:0.375rem"><div class="cref-btn" style="background:var(--cref-alert-fg);color:var(--cref-panel);font-size:0.625rem;padding:0.25rem 0.5rem;border-radius:var(--r);font-weight:500">Action</div><div class="cref-btn" style="background:var(--cref-sec-bg);color:var(--cref-alert-fg);font-size:0.625rem;padding:0.25rem 0.5rem;border-radius:var(--r);font-weight:500">Copy</div></div></div></div><div class="cref-tokens"><div class="cref-tok-row"><span class="cref-tok-prop">Surface</span><span class="cref-tok-stack">8x</span><span class="cref-tok-var">--base01</span><span class="cref-tok-hex" data-cref="notif-bg"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Border</span><span class="cref-tok-stack">88×12</span><span class="cref-tok-hex" data-cref="alert-border"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Title</span><span class="cref-tok-stack">88×12 · 600</span><span class="cref-tok-hex" data-cref="alert-fg"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Body</span><span class="cref-tok-stack">80x · 500</span><span class="cref-tok-hex" data-cref="notif-bd"></span></div></div><div class="cref-label">Priority</div></div>`,
      `<div class="cref-card"><div class="cref-preview" style="background:var(--cref-panel);padding:0.5rem"><div class="cref-notif" style="background:var(--cref-notif-bg);border-radius:var(--r);padding:0.5rem 0.75rem"><div style="font-weight:600;font-size:var(--fs);color:var(--cref-notif-h);margin-bottom:0.125rem">Standard Title</div><div style="font-size:0.625rem;color:var(--cref-notif-bd);line-height:1.25">Body text · 80x 500</div></div></div><div class="cref-tokens"><div class="cref-tok-row"><span class="cref-tok-prop">Surface</span><span class="cref-tok-stack">8x</span><span class="cref-tok-var">--base01</span><span class="cref-tok-hex" data-cref="notif-bg"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Title</span><span class="cref-tok-stack">88x · 600</span><span class="cref-tok-var">--base06</span><span class="cref-tok-hex" data-cref="notif-h"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Body</span><span class="cref-tok-stack">80x · 500</span><span class="cref-tok-var">--base05</span><span class="cref-tok-hex" data-cref="notif-bd"></span></div></div><div class="cref-label">Standard</div></div>`,
      `</div></div>`,
      `<div class="cref-group"><h3 class="cref-group-title">Slider</h3><div class="cref-grid"><div class="cref-card"><div class="cref-preview" style="background:var(--cref-panel);flex-direction:column;align-items:stretch;gap:0.25rem;padding:0.625rem 0.5rem"><div style="font-size:var(--fs);font-weight:500;color:var(--cref-sl-dot);margin-bottom:0.125rem">Source Label</div><div style="display:flex;justify-content:space-between"><span style="font-size:var(--fs);font-weight:600;color:var(--cref-sl-fill)">64%</span><span style="font-size:var(--fs);font-weight:500;color:var(--cref-sl-track)">150%</span></div><div class="cref-slider-std"><div class="cref-sl-std-fill" style="background:var(--cref-sl-fill);width:2.5rem"></div><div class="cref-sl-std-knob" style="background:var(--cref-sl-fill)"></div><div class="cref-sl-std-track" style="background:var(--cref-sl-track)"><div style="margin-left:auto;margin-right:0.25rem"><div class="cref-sl-std-dot" style="background:var(--cref-sl-dot)"></div></div></div></div></div><div class="cref-tokens"><div class="cref-tok-row"><span class="cref-tok-prop">Active</span><span class="cref-tok-stack">88x</span><span class="cref-tok-var">--base06</span><span class="cref-tok-hex" data-cref="sl-fill"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Track</span><span class="cref-tok-stack">80×48%</span><span class="cref-tok-var">--base03</span><span class="cref-tok-hex" data-cref="sl-track"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Handle</span><span class="cref-tok-stack">4×32px · 88x</span><span class="cref-tok-hex" data-cref="sl-fill"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Disabled</span><span class="cref-tok-stack">80×8% OL · 88×24%</span><span class="cref-tok-hex" data-cref="dis-ol"></span></div></div><div class="cref-label">Standard</div></div></div></div>`,
      `<div class="cref-group"><h3 class="cref-group-title">Workspace Cards</h3><div class="cref-grid"><div class="cref-card"><div class="cref-preview" style="background:var(--cref-panel);gap:0.375rem;display:flex"><div class="cref-ws-card" style="background:var(--cref-ws-cur-bg);border:2px solid var(--cref-ws-cur-border);color:var(--cref-ws-cur-fg)">1</div><div class="cref-ws-card" style="background:var(--cref-ws-pres-bg);border:2px solid var(--cref-ws-pres-border);color:var(--cref-ws-pres-fg)">2</div><div class="cref-ws-card" style="background:var(--cref-ws-empty-bg);border:2px solid var(--cref-ws-empty-border);color:var(--cref-ws-empty-fg)">3</div></div><div class="cref-tokens"><div class="cref-tok-row"><span class="cref-tok-prop">Current</span><span class="cref-tok-stack">8x·88x</span><span class="cref-tok-hex" data-cref="ws-cur-bg"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Present</span><span class="cref-tok-stack">8x·64x</span><span class="cref-tok-hex" data-cref="ws-pres-bg"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Empty</span><span class="cref-tok-stack">8×80%</span><span class="cref-tok-hex" data-cref="ws-empty-bg"></span></div></div><div class="cref-label">Current · Present · Empty</div></div></div></div>`,
      `<div class="cref-group"><h3 class="cref-group-title">Input & Progress</h3><div class="cref-grid">`,
      `<div class="cref-card"><div class="cref-preview" style="background:var(--cref-panel);flex-direction:column;gap:0.25rem"><div class="cref-input" style="outline-color:var(--cref-num-ol);color:var(--cref-num-fg)">30°</div></div><div class="cref-tokens"><div class="cref-tok-row"><span class="cref-tok-prop">Outline</span><span class="cref-tok-stack">80×48%</span><span class="cref-tok-var">--base03</span><span class="cref-tok-hex" data-cref="num-ol"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Text</span><span class="cref-tok-stack">80x</span><span class="cref-tok-var">--base05</span><span class="cref-tok-hex" data-cref="num-fg"></span></div></div><div class="cref-label">Number Input</div></div>`,
      `<div class="cref-card"><div class="cref-preview" style="background:var(--cref-panel);flex-direction:column;align-items:stretch;gap:0.25rem"><div style="display:flex;justify-content:space-between"><span style="font-size:var(--fs);font-weight:600;color:var(--cref-sl-fill)">72%</span><span style="font-size:var(--fs);font-weight:500;color:var(--cref-sl-track)">100%</span></div><div class="cref-slider-std" style="overflow:hidden"><div class="cref-sl-pg-fill" style="background:var(--cref-sl-fill);width:2.5rem"></div><div class="cref-sl-pg-track" style="background:var(--cref-sl-track)"></div></div></div><div class="cref-tokens"><div class="cref-tok-row"><span class="cref-tok-prop">Fill</span><span class="cref-tok-stack">88x</span><span class="cref-tok-var">--base06</span><span class="cref-tok-hex" data-cref="sl-fill"></span></div><div class="cref-tok-row"><span class="cref-tok-prop">Disabled</span><span class="cref-tok-stack">80×8% OL · 88×24%</span><span class="cref-tok-hex" data-cref="dis-ol"></span></div></div><div class="cref-label">Progress Bar</div></div>`,
      `</div></div>`
    ].join("");
    container.dataset.ready = "1";
  }
  root.style.setProperty("--cref-panel", h4x);
  root.style.setProperty("--cref-cta-bg", h88x);
  root.style.setProperty("--cref-cta-fg", h4x);
  root.style.setProperty("--cref-def-bg", h8x);
  root.style.setProperty("--cref-def-fg", h80x);
  root.style.setProperty("--cref-sec-bg", h80x8);
  root.style.setProperty("--cref-dis-fg", h88x24);
  root.style.setProperty("--cref-dis-ol", h80x8);
  root.style.setProperty("--cref-tab-sel-bg", h88x);
  root.style.setProperty("--cref-tab-sel-fg", h4x);
  root.style.setProperty("--cref-tab-unsel-bg", h8x);
  root.style.setProperty("--cref-tab-unsel-fg", h80x48);
  root.style.setProperty("--cref-tgl-on-bg", h88x);
  root.style.setProperty("--cref-tgl-on-bor", h88x);
  root.style.setProperty("--cref-tgl-off-bg", h80x8);
  root.style.setProperty("--cref-tgl-off-bor", h80x48);
  root.style.setProperty("--cref-radio-on", h88x);
  root.style.setProperty("--cref-radio-off", h80x8);
  root.style.setProperty("--cref-pg-active", h88x);
  root.style.setProperty("--cref-pg-inactive", h80x48);
  root.style.setProperty("--cref-notif-bg", h8x);
  root.style.setProperty("--cref-notif-h", h88x);
  root.style.setProperty("--cref-notif-bd", h80x);
  root.style.setProperty("--cref-alert-border", hex("88x", 12));
  root.style.setProperty("--cref-alert-fg", hex("88x", 12));
  root.style.setProperty("--cref-sl-fill", h88x);
  root.style.setProperty("--cref-sl-track", h80x48);
  root.style.setProperty("--cref-sl-dot", h80x);
  root.style.setProperty("--cref-ws-cur-bg", h8x);
  root.style.setProperty("--cref-ws-cur-border", h88x);
  root.style.setProperty("--cref-ws-cur-fg", h88x);
  root.style.setProperty("--cref-ws-pres-bg", h8x);
  root.style.setProperty("--cref-ws-pres-border", h64x);
  root.style.setProperty("--cref-ws-pres-fg", h64x);
  {
    const ws8x = pmd["8x"];
    if (!ws8x)
      return;
    const rgb = oklchToRgb(ws8x.l, ws8x.c, hue);
    root.style.setProperty("--cref-ws-empty-bg", `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`);
  }
  root.style.setProperty("--cref-ws-empty-border", h88x24);
  root.style.setProperty("--cref-ws-empty-fg", h88x24);
  root.style.setProperty("--cref-num-ol", h80x48);
  root.style.setProperty("--cref-num-fg", h80x);
  const hexMap = {
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
    "tgl-off-bg": h80x8,
    "tgl-off-bor": h80x48,
    "radio-on": h88x,
    "radio-off": h80x8,
    "pg-active": h88x,
    "pg-inactive": h80x48,
    "notif-bg": h8x,
    "notif-h": h88x,
    "notif-bd": h80x,
    "alert-border": hex("88x", 12),
    "alert-fg": hex("88x", 12),
    "sl-fill": h88x,
    "sl-track": h80x48,
    "sl-dot": h80x,
    "ws-cur-bg": h8x,
    "ws-pres-bg": h8x,
    "ws-empty-bg": stackHex("8x", "0x", 0.8),
    "num-ol": h80x48,
    "num-fg": h80x
  };
  container.querySelectorAll("[data-cref]").forEach((el) => {
    const key = el.dataset.cref;
    if (key && hexMap[key])
      el.textContent = hexMap[key];
  });
}
function renderUIPreview(containerId, _colors, pmd, hue) {
  const container = document.getElementById(containerId);
  if (!container)
    return;
  const hex = (key, hOff) => {
    const s = pmd[key];
    if (!s)
      return "#000";
    const rgb = oklchToRgb(s.l, s.c, hOff ? (hue + hOff) % 360 : hue);
    return rgbToHex(rgb);
  };
  const stackHex = (baseKey, tintKey, alpha, hOff) => {
    const b = pmd[baseKey];
    const t = pmd[tintKey];
    if (!b || !t)
      return "#000";
    const rgb = oklchToRgb(b.l * (1 - alpha) + t.l * alpha, b.c * (1 - alpha) + t.c * alpha, hOff ? (hue + hOff) % 360 : hue);
    return rgbToHex(rgb);
  };
  const txtOn = (h) => {
    const m = h.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
    if (!m)
      return "#fff";
    return getContrastColor(parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16));
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
  const pv = container.firstElementChild;
  if (!pv)
    return;
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

// src/ts/ui/export.ts
function getThemeMeta(hue, scheme) {
  return {
    name: `PMD Custom${scheme === "light" ? " Light" : ""}`,
    hue,
    auxHue: getAuxHue(hue),
    variant: scheme
  };
}
function exportYAML(colors, currentHue, currentScheme) {
  const meta = getThemeMeta(currentHue, currentScheme);
  const yaml = `# PMD Base16 Theme
scheme: "${meta.name}"
author: "Project Minimalist Design"
variant: "${meta.variant}"
hue: ${meta.hue}
aux_hue: ${meta.auxHue}
${Object.entries(colors).map(([id, c]) => `${id}: "${c.hex.slice(1)}"`).join(`
`)}`;
  downloadFile(yaml, `pmd-theme-${currentScheme}.yaml`, "text/yaml");
  showToast("Downloaded YAML");
}
function exportJSON(colors, currentHue, currentScheme) {
  const meta = getThemeMeta(currentHue, currentScheme);
  const json = JSON.stringify({
    scheme: meta.name,
    author: "Project Minimalist Design",
    variant: meta.variant,
    hue: meta.hue,
    aux_hue: meta.auxHue,
    ...Object.fromEntries(Object.entries(colors).map(([id, c]) => [id, c.hex.slice(1)]))
  }, null, 2);
  downloadFile(json, `pmd-theme-${currentScheme}.json`, "application/json");
  showToast("Downloaded JSON");
}
function copyCSS(colors) {
  const css = `:root {
${Object.entries(colors).map(([id, c]) => `  --${id}: ${c.hex};`).join(`
`)}
}`;
  navigator.clipboard.writeText(css);
  showToast("Copied CSS variables");
}
function copyNixConfig(currentHue, currentScheme) {
  const nixSnippet = `  # PMD Design System Settings
  theme = {
    hue = ${currentHue};
    variant = "${currentScheme}";
  };`;
  navigator.clipboard.writeText(nixSnippet);
  showToast("Copied Nix configuration snippet!");
}
// src/ts/main.ts
var currentHue = 0;
var currentScheme = "dark";
var isHueLocked = false;
var lockedHueValue = 0;
var base16Defs;
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const isOpen = sidebar?.classList.toggle("open");
  overlay?.classList.toggle("show", isOpen ?? false);
  document.body.classList.toggle("overlay-open", isOpen ?? false);
}
function toggleExportSheet() {
  const sheet = document.getElementById("exportSheet");
  const isOpen = sheet?.classList.toggle("show");
  document.body.classList.toggle("overlay-open", isOpen ?? false);
}
var sheetStartY = 0;
var sheetCurrentY = 0;
var SHEET_CLOSE_THRESHOLD = 100;
function initSheetGesture() {
  const sheet = document.getElementById("exportSheet");
  if (!sheet)
    return;
  sheet.addEventListener("touchstart", (e) => {
    sheetStartY = e.touches[0].clientY;
    sheet.style.transition = "none";
  }, { passive: true });
  sheet.addEventListener("touchmove", (e) => {
    sheetCurrentY = e.touches[0].clientY;
    const diff = sheetCurrentY - sheetStartY;
    if (diff > 0) {
      sheet.style.transform = `translateY(${diff}px)`;
    }
  }, { passive: true });
  sheet.addEventListener("touchend", () => {
    const diff = sheetCurrentY - sheetStartY;
    sheet.style.transition = "";
    sheet.style.transform = "";
    if (diff > SHEET_CLOSE_THRESHOLD) {
      sheet.classList.remove("show");
      document.body.classList.remove("overlay-open");
    }
    sheetStartY = 0;
    sheetCurrentY = 0;
  });
}
function setHue(hue) {
  currentHue = parseInt(String(hue), 10);
  const input = document.getElementById("hueInput");
  if (input)
    input.value = String(currentHue);
  const fill = document.getElementById("hueSliderFill");
  if (fill)
    fill.style.flex = `${currentHue / HUE_MAX * 100} 1 0%`;
  const slider = document.getElementById("hueSlider");
  const track = slider?.querySelector(".hue-slider-track");
  if (track)
    track.style.flex = `${(1 - currentHue / HUE_MAX) * 100} 1 0%`;
  renderColors();
  renderPresets("presets", currentScheme === "dark", setHue);
}
function renderColors() {
  const isDark = currentScheme === "dark";
  const { pmd: pmdVars, computed } = getPMD(isDark);
  base16Defs = getBase16Defs(pmdVars, computed);
  const colors = generatePalette(currentHue, pmdVars, computed, isHueLocked, lockedHueValue);
  applyThemeToUI(colors);
  renderFoundationGrid("foundationGrid", pmdVars, currentHue);
  renderStackGrid("stackGrid", pmdVars, currentHue);
  renderUIPreview("uiPreview", colors, pmdVars, currentHue);
  renderComponentReference(pmdVars, currentHue);
  renderColorGrid("bgColors", base16Defs.bg, colors);
  renderColorGrid("fgColors", base16Defs.fg, colors);
  renderColorGrid("accentColors", base16Defs.accent, colors);
  renderCodePreview(colors, currentHue);
  const auxHueValue = document.getElementById("auxHueValue");
  if (auxHueValue) {
    auxHueValue.textContent = `${getAuxHue(currentHue)}°`;
  }
}
function initEventListeners() {
  const menuBtn = document.getElementById("menuBtn");
  const sidebarOverlay = document.getElementById("sidebarOverlay");
  const fabBtn = document.getElementById("fabBtn");
  const exportSheetClose = document.getElementById("exportSheetClose");
  menuBtn?.addEventListener("click", toggleSidebar);
  sidebarOverlay?.addEventListener("click", toggleSidebar);
  fabBtn?.addEventListener("click", toggleExportSheet);
  exportSheetClose?.addEventListener("click", toggleExportSheet);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const sidebar = document.getElementById("sidebar");
      const exportSheet = document.getElementById("exportSheet");
      const docsOverlay = document.getElementById("docsOverlay");
      if (exportSheet?.classList.contains("show")) {
        toggleExportSheet();
      } else if (sidebar?.classList.contains("open")) {
        toggleSidebar();
      } else if (docsOverlay?.style.display === "flex") {
        toggleDocs();
      }
    }
  });
  const hueSlider = document.getElementById("hueSlider");
  if (hueSlider) {
    const updateFromEvent = (clientX) => {
      const rect = hueSlider.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      setHue(Math.round(pct * HUE_MAX));
    };
    hueSlider.addEventListener("mousedown", (e) => {
      updateFromEvent(e.clientX);
      const onMove = (ev) => updateFromEvent(ev.clientX);
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    });
    hueSlider.addEventListener("touchstart", (e) => {
      updateFromEvent(e.touches[0].clientX);
      const onMove = (ev) => updateFromEvent(ev.touches[0].clientX);
      const onUp = () => {
        document.removeEventListener("touchmove", onMove);
        document.removeEventListener("touchend", onUp);
      };
      document.addEventListener("touchmove", onMove);
      document.addEventListener("touchend", onUp);
    });
  }
  const hueInput = document.getElementById("hueInput");
  if (hueInput) {
    hueInput.addEventListener("change", (e) => {
      let val = parseInt(e.target.value, 10) || 0;
      val = Math.max(0, Math.min(HUE_MAX, val));
      setHue(val);
    });
    hueInput.addEventListener("wheel", (e) => {
      e.preventDefault();
      const step = e.deltaY < 0 ? 1 : -1;
      let val = (parseInt(hueInput.value, 10) || 0) + step;
      val = Math.max(0, Math.min(HUE_MAX, val));
      setHue(val);
    });
  }
  document.querySelectorAll(".scheme-toggle .scheme-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".scheme-toggle .scheme-btn").forEach((b) => {
        b.classList.remove("active");
      });
      btn.classList.add("active");
      currentScheme = btn.dataset.scheme;
      renderColors();
      renderPresets("presets", currentScheme === "dark", setHue);
    });
  });
  const hueLockBtn = document.getElementById("hueLockBtn");
  if (hueLockBtn) {
    hueLockBtn.addEventListener("click", function() {
      isHueLocked = !isHueLocked;
      if (isHueLocked) {
        lockedHueValue = currentHue;
      }
      this.classList.toggle("active");
      renderColors();
      this.textContent = isHueLocked ? "Unlock Accent Hue" : "Lock Accent Hue";
    });
  }
}
function getColors() {
  const isDark = currentScheme === "dark";
  const { pmd: pmdVars, computed } = getPMD(isDark);
  return generatePalette(currentHue, pmdVars, computed, isHueLocked, lockedHueValue);
}
function init() {
  window.handleColorClick = handleColorClick;
  window.toggleDocs = toggleDocs;
  window.toggleDocMenu = toggleDocMenu;
  window.toggleSidebar = toggleSidebar;
  window.toggleExportSheet = toggleExportSheet;
  const y = exportYAML;
  const j = exportJSON;
  const c = copyCSS;
  const n = copyNixConfig;
  window.exportYAML = () => y(getColors(), currentHue, currentScheme);
  window.exportJSON = () => j(getColors(), currentHue, currentScheme);
  window.copyCSS = () => c(getColors());
  window.copyNixConfig = () => n(currentHue, currentScheme);
  initEventListeners();
  initSheetGesture();
  setHue(30);
}
if (typeof window !== "undefined") {
  window.addEventListener("load", init);
}
