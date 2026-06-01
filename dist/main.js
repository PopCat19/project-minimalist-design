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
  "72x": { l: 0.72, c: 0.122 },
  "8x": { l: 0.2, c: 0.032 },
  "4x": { l: 0.16, c: 0.022 },
  "0x": { l: 0, c: 0 }
};
var PMD_LIGHT = {
  "100x": { l: 0, c: 0 },
  "88x": { l: 0.28, c: 0.032 },
  "80x": { l: 0.2, c: 0.032 },
  "72x": { l: 0.32, c: 0.052 },
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
      { id: "base04", pmd: "72x", desc: "Subtext", ...pmd["72x"] },
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
        pmd: "72x+290",
        l: pmd["72x"].l,
        c: pmd["72x"].c,
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
        pmd: "72x",
        l: pmd["72x"].l,
        c: pmd["72x"].c,
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
        pmd: "72x+30",
        l: pmd["72x"].l,
        c: pmd["72x"].c,
        offset: 30,
        desc: "Functions"
      },
      {
        id: "base0E",
        pmd: "72x-30",
        l: pmd["72x"].l,
        c: pmd["72x"].c,
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
  const accentL = pmd["72x"].l;
  const accentC = isLight ? 0.1 : pmd["72x"].c;
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
    const useAccent = !(def.id === "base0F" || def.pmd === "88x" || def.pmd === "80x" || def.pmd === "80x+140");
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
var GRADIENT_STEP = 30;
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
  const theme = pmd["72x"];
  container.innerHTML = presets.map((preset) => {
    const rgb = safeOklchToRgb(theme.l, theme.c, preset.hue);
    const hex = rgbToHex(rgb);
    return `
            <button class="preset"
                    style="background: ${hex};"
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
}
function updateSliderGradient(sliderId, isDark) {
  const slider = document.getElementById(sliderId);
  if (!slider)
    return;
  const theme = (isDark ? PMD_DARK : PMD_LIGHT)["72x"];
  const stops = [];
  for (let i = 0;i <= HUE_MAX; i += GRADIENT_STEP) {
    const rgb = safeOklchToRgb(theme.l, theme.c, i);
    stops.push(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
  }
  slider.style.background = `linear-gradient(to right, ${stops.join(", ")})`;
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
function renderColorCard(color, desc, pmd) {
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
function renderColorGrid(containerId, defs, colors) {
  const container = document.getElementById(containerId);
  if (!container)
    return;
  container.innerHTML = defs.map((def) => {
    const color = colors[def.id];
    return renderColorCard(color, def.desc, def.pmd);
  }).join("");
}
function renderFoundationGrid(containerId, pmd, hue) {
  const container = document.getElementById(containerId);
  if (!container)
    return;
  const slotOrder = ["100x", "88x", "80x", "72x", "8x", "4x", "0x"];
  const roles = {
    "100x": "max contrast",
    "88x": "primary",
    "80x": "secondary",
    "72x": "accent",
    "8x": "base surface",
    "4x": "deep bg",
    "0x": "canvas"
  };
  container.innerHTML = slotOrder.map((key) => {
    const slot = pmd[key];
    if (!slot)
      return "";
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
  }).join("");
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
  container.innerHTML = defs.map((def) => {
    const baseSlot = pmd[def.base];
    const tintSlot = pmd[def.tint];
    if (!baseSlot || !tintSlot)
      return "";
    const effHue = def.offset ? (hue + def.offset) % 360 : hue;
    const baked = oklchToRgb(baseSlot.l * (1 - def.opacity) + tintSlot.l * def.opacity, baseSlot.c * (1 - def.opacity) + tintSlot.c * def.opacity, effHue);
    const hex = rgbToHex(baked);
    const txt = getContrastColor(baked.r, baked.g, baked.b);
    const tint = oklchToRgb(tintSlot.l, tintSlot.c, effHue);
    const rgba = `rgba(${tint.r}, ${tint.g}, ${tint.b}, ${def.opacity.toFixed(2)})`;
    return `
        <div class="color-card" onclick="window.handleColorClick(event, '${hex}', 'composite(${def.base}, ${def.tint}, ${def.opacity.toFixed(2)})')">
            <div class="color-swatch stack-swatch${def.hasBlur ? " blur" : ""}" style="--swatch: ${rgba}; color: ${txt}">
                <div class="swatch-hex">${hex}</div>
                <div class="swatch-oklch">${def.label}</div>
            </div>
            <div class="color-info">
                <div class="color-name">${def.label}</div>
                <div class="color-desc">${def.role}</div>
            </div>
        </div>`;
  }).join("");
}
function renderCodePreview(colors, currentHue) {
  const preview = document.getElementById("codePreview");
  if (!preview)
    return;
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
  const c72 = hex("72x");
  const c8x = hex("8x");
  const c4x = hex("4x");
  const _c0x = hex("0x");
  const surfWidget = stackHex("8x", "80x", 0.08);
  const surfMuted = stackHex("8x", "80x", 0.48);
  const txtInactive = `${c88}3D`;
  const alertBg = hex("88x", 12);
  const alertBorder = `${c88}FF`;
  container.innerHTML = `
    <div class="ui-pv ui-pv-panel" style="background:${c4x}">
      <div class="ui-pv-row">
        <div class="ui-pv-card" style="background:${c8x}">
          <div class="ui-pv-title ui-pv-mb-xxs" style="color:${c88}">Header · 88x 600</div>
          <div class="ui-pv-body ui-pv-mb-xs" style="color:${c72}">Subtext · 72x 500</div>
          <div class="ui-pv-gap-xs">
            <div class="ui-pv-btn" style="background:${c88};color:${txtOn(c88)};font-weight:500">88x active</div>
            <div class="ui-pv-btn" style="background:${surfWidget};color:${txtInactive};font-weight:500">88×24%</div>
            <div class="ui-pv-btn" style="background:${surfWidget};color:${c80};font-weight:500">80×8%</div>
          </div>
        </div>
        <div class="ui-pv-card ui-pv-col" style="background:${c8x}">
          <div class="ui-pv-btwn">
            <span class="ui-pv-head" style="color:${c88}">0:56</span>
            <span class="ui-pv-body ui-pv-center" style="color:${c80}">Zen Browser</span>
            <span class="ui-pv-body" style="color:${surfMuted}">4:08</span>
          </div>
          <div class="ui-pv-slider">
            <div class="ui-pv-sfill" style="background:${c88}"></div>
            <div class="ui-pv-sknob" style="background:${c88}"></div>
            <div class="ui-pv-strack" style="background:${surfMuted}">
              <div class="ui-pv-sdot" style="background:${c80}"></div>
            </div>
          </div>
          <div class="ui-pv-gap-xs">
            <div class="ui-pv-btn" style="flex:1;background:${c88};color:${txtOn(c88)};font-weight:500">88x active</div>
            <div class="ui-pv-btn" style="flex:1;background:${surfWidget};color:${c80};font-weight:500">80×8% def</div>
          </div>
        </div>
      </div>
      <div class="ui-pv-row">
        <div class="ui-pv-gap-sm ui-pv-card" style="background:${c8x};padding:0.5rem 0.75rem">
          <span class="ui-pv-body" style="color:${surfMuted}">Timestamp</span>
          <span class="ui-pv-meta" style="color:${surfMuted}">14:32</span>
          <span class="ui-pv-meta" style="color:${surfMuted}">· 80x 48%</span>
        </div>
        <div class="ui-pv-alert ui-pv-head" style="background:${alertBg};border:2px solid ${alertBorder};color:${txtOn(alertBg)}">88×12 priority</div>
      </div>
    </div>`;
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
  const slider = document.getElementById("hueSlider");
  const input = document.getElementById("hueInput");
  if (slider)
    slider.value = String(hue);
  if (input)
    input.value = String(hue);
  renderColors();
  renderPresets("presets", currentScheme === "dark", setHue);
}
function renderColors() {
  const isDark = currentScheme === "dark";
  const { pmd: pmdVars, computed } = getPMD(isDark);
  updateSliderGradient("hueSlider", isDark);
  base16Defs = getBase16Defs(pmdVars, computed);
  const colors = generatePalette(currentHue, pmdVars, computed, isHueLocked, lockedHueValue);
  applyThemeToUI(colors);
  renderFoundationGrid("foundationGrid", pmdVars, currentHue);
  renderStackGrid("stackGrid", pmdVars, currentHue);
  renderUIPreview("uiPreview", colors, pmdVars, currentHue);
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
    hueSlider.addEventListener("input", (e) => {
      setHue(parseInt(e.target.value, 10));
    });
  }
  const hueInput = document.getElementById("hueInput");
  if (hueInput) {
    hueInput.addEventListener("change", (e) => {
      let val = parseInt(e.target.value, 10) || 0;
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
  window.exportYAML = () => exportYAML(getColors(), currentHue, currentScheme);
  window.exportJSON = () => exportJSON(getColors(), currentHue, currentScheme);
  window.copyCSS = () => copyCSS(getColors());
  window.copyNixConfig = () => copyNixConfig(currentHue, currentScheme);
  initEventListeners();
  initSheetGesture();
  updateSliderGradient("hueSlider", currentScheme === "dark");
  setHue(30);
}
if (typeof window !== "undefined") {
  window.addEventListener("load", init);
}
