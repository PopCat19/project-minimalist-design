import type { Base16Palette } from '../pmd';
import { showToast, downloadFile } from './render';

export function exportYAML(colors: Base16Palette, currentHue: number, currentScheme: string): void {
    const auxHue = (currentHue + 180) % 360;

    const yaml = `# PMD Base16 Theme
scheme: "PMD Custom${currentScheme === 'light' ? ' Light' : ''}"
author: "Project Minimalist Design"
variant: "${currentScheme}"
hue: ${currentHue}
aux_hue: ${auxHue}
${Object.entries(colors).map(([id, c]) => `${id}: "${c.hex.slice(1)}"`).join('\n')}`;

    downloadFile(yaml, `pmd-theme-${currentScheme}.yaml`, 'text/yaml');
    showToast('Downloaded YAML');
}

export function exportJSON(colors: Base16Palette, currentHue: number, currentScheme: string): void {
    const auxHue = (currentHue + 180) % 360;

    const json = JSON.stringify({
        scheme: `PMD Custom${currentScheme === 'light' ? ' Light' : ''}`,
        author: "Project Minimalist Design",
        variant: currentScheme,
        hue: currentHue,
        aux_hue: auxHue,
        ...Object.fromEntries(Object.entries(colors).map(([id, c]) => [id, c.hex.slice(1)]))
    }, null, 2);

    downloadFile(json, `pmd-theme-${currentScheme}.json`, 'application/json');
    showToast('Downloaded JSON');
}

export function copyCSS(colors: Base16Palette): void {
    const css = `:root {\n${Object.entries(colors).map(([id, c]) => `  --${id}: ${c.hex};`).join('\n')}\n}`;
    navigator.clipboard.writeText(css);
    showToast('Copied CSS variables');
}

export function copyNixConfig(currentHue: number, currentScheme: string): void {
    const nixSnippet = `  # PMD Design System Settings
  theme = {
    hue = ${currentHue};
    variant = "${currentScheme}";
  };`;

    navigator.clipboard.writeText(nixSnippet);
    showToast('Copied Nix configuration snippet!');
}