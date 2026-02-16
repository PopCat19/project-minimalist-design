import { getPMD, getBase16Defs, generatePalette, getAuxHue, HUE_MAX, type Base16Palette } from './pmd';
import {
    applyThemeToUI,
    handleColorClick,
    renderColorGrid,
    renderCodePreview,
    renderPresets,
    updateSliderGradient,
    toggleDocs,
    toggleDocMenu,
    exportYAML,
    exportJSON,
    copyCSS,
    copyNixConfig,
} from './ui';

declare global {
    interface Window {
        handleColorClick: (event: MouseEvent, hex: string, oklch: string) => void;
        toggleDocs: () => void;
        toggleDocMenu: () => void;
        exportYAML: () => void;
        exportJSON: () => void;
        copyCSS: () => void;
        copyNixConfig: () => void;
    }
}

let currentHue = 0;
let currentScheme: 'dark' | 'light' = 'dark';
let isHueLocked = false;
let lockedHueValue = 0;
let base16Defs: ReturnType<typeof getBase16Defs>;

function setHue(hue: number): void {
    currentHue = parseInt(String(hue));
    const slider = document.getElementById('hueSlider') as HTMLInputElement;
    const input = document.getElementById('hueInput') as HTMLInputElement;
    if (slider) slider.value = String(hue);
    if (input) input.value = String(hue);
    renderColors();
    renderPresets('presets', currentScheme === 'dark', setHue);
}

function renderColors(): void {
    const isDark = currentScheme === 'dark';
    const { pmd: pmdVars, computed } = getPMD(isDark);
    base16Defs = getBase16Defs(pmdVars, computed);

    const colors = generatePalette(currentHue, pmdVars, computed, isDark, isHueLocked, lockedHueValue);

    applyThemeToUI(colors);

    renderColorGrid('bgColors', base16Defs.bg, colors);
    renderColorGrid('fgColors', base16Defs.fg, colors);
    renderColorGrid('accentColors', base16Defs.accent, colors);

    renderCodePreview(colors, currentHue);

    const auxHueValue = document.getElementById('auxHueValue');
    if (auxHueValue) {
        auxHueValue.textContent = `${getAuxHue(currentHue)}°`;
    }
}

function initEventListeners(): void {
    const hueSlider = document.getElementById('hueSlider') as HTMLInputElement;
    if (hueSlider) {
        hueSlider.addEventListener('input', (e) => {
            setHue(parseInt((e.target as HTMLInputElement).value));
        });
    }

    const hueInput = document.getElementById('hueInput') as HTMLInputElement;
    if (hueInput) {
        hueInput.addEventListener('change', (e) => {
            let val = parseInt((e.target as HTMLInputElement).value) || 0;
            val = Math.max(0, Math.min(HUE_MAX, val));
            setHue(val);
        });
    }

    document.querySelectorAll('.scheme-toggle .scheme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.scheme-toggle .scheme-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentScheme = (btn as HTMLElement).dataset.scheme as 'dark' | 'light';
            renderColors();
            renderPresets('presets', currentScheme === 'dark', setHue);
        });
    });

    const hueLockBtn = document.getElementById('hueLockBtn');
    if (hueLockBtn) {
        hueLockBtn.addEventListener('click', function() {
            isHueLocked = !isHueLocked;
            if (isHueLocked) {
                lockedHueValue = currentHue;
            }
            this.classList.toggle('active');
            renderColors();
            this.textContent = isHueLocked ? 'Unlock Accent Hue' : 'Lock Accent Hue';
        });
    }
}

function getColors(): Base16Palette {
    const isDark = currentScheme === 'dark';
    const { pmd: pmdVars, computed } = getPMD(isDark);
    return generatePalette(currentHue, pmdVars, computed, isDark, isHueLocked, lockedHueValue);
}

function init(): void {
    window.handleColorClick = handleColorClick;
    window.toggleDocs = toggleDocs;
    window.toggleDocMenu = toggleDocMenu;
    window.exportYAML = () => exportYAML(getColors(), currentHue, currentScheme);
    window.exportJSON = () => exportJSON(getColors(), currentHue, currentScheme);
    window.copyCSS = () => copyCSS(getColors());
    window.copyNixConfig = () => copyNixConfig(currentHue, currentScheme);

    initEventListeners();

    updateSliderGradient('hueSlider');
    setHue(30);
}

if (typeof window !== 'undefined') {
    window.addEventListener('load', init);
}