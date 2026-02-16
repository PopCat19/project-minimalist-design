import { oklchToRgb, rgbToHex } from '../color';

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

    const theme = isDark
        ? { l: 0.72, c: 0.122 }
        : { l: 0.32, c: 0.052 };

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

export function updateSliderGradient(sliderId: string): void {
    const slider = document.getElementById(sliderId) as HTMLInputElement;
    if (!slider) return;

    const stops: string[] = [];
    for (let i = 0; i <= 360; i += 30) {
        const rgb = oklchToRgb(0.72, 0.122, i);
        stops.push(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
    }
    slider.style.background = `linear-gradient(to right, ${stops.join(', ')})`;
}