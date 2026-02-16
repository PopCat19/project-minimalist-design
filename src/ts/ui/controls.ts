import { oklchToRgb, rgbToHex } from '../color';
import { PMD_DARK, PMD_LIGHT, HUE_MAX } from '../pmd';

const GRADIENT_STEP = 30;

interface Preset {
    name: string;
    hue: number;
}

const presets: Preset[] = [
    { name: 'Red', hue: 30 },
    { name: 'Orange', hue: 60 },
    { name: 'Yellow', hue: 90 },
    { name: 'Green', hue: 140 },
    { name: 'Cyan', hue: 195 },
    { name: 'Blue', hue: 260 },
    { name: 'Purple', hue: 290 },
    { name: 'Rose', hue: 345 },
];

export { presets };

export function renderPresets(
    containerId: string,
    isDark: boolean,
    setHueCallback: (hue: number) => void
): void {
    const container = document.getElementById(containerId);
    if (!container) return;

    const pmd = isDark ? PMD_DARK : PMD_LIGHT;
    const theme = pmd['68x'];

    container.innerHTML = presets.map(preset => {
        const rgb = oklchToRgb(theme.l, theme.c, preset.hue);
        const hex = rgbToHex(rgb);
        return `
            <button class="preset"
                    style="background: ${hex};"
                    data-name="${preset.name}"
                    data-hue="${preset.hue}">
            </button>`;
    }).join('');

    container.querySelectorAll('.preset').forEach(btn => {
        btn.addEventListener('click', () => {
            const hue = parseInt((btn as HTMLElement).dataset.hue || '0');
            setHueCallback(hue);
        });
    });
}

export function updateSliderGradient(sliderId: string, isDark: boolean): void {
    const slider = document.getElementById(sliderId) as HTMLInputElement;
    if (!slider) return;

    const theme = (isDark ? PMD_DARK : PMD_LIGHT)['68x'];
    const stops: string[] = [];
    for (let i = 0; i <= HUE_MAX; i += GRADIENT_STEP) {
        const rgb = oklchToRgb(theme.l, theme.c, i);
        stops.push(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
    }
    slider.style.background = `linear-gradient(to right, ${stops.join(', ')})`;
}