// ui-export.ts
//
// Purpose: Exports theme configurations to various formats
//
// This module:
// - Generates YAML, JSON, CSS, and Nix config output
// - Copies formatted code snippets to clipboard
// - Adds metadata to exported themes
import type { Base16Palette } from "../pmd";
import { getAuxHue } from "../pmd";
import { downloadFile, showToast } from "./render";

function getThemeMeta(
	hue: number,
	scheme: string,
): { name: string; hue: number; auxHue: number; variant: string } {
	return {
		name: `PMD Custom${scheme === "light" ? " Light" : ""}`,
		hue,
		auxHue: getAuxHue(hue),
		variant: scheme,
	};
}

export function exportYAML(
	colors: Base16Palette,
	currentHue: number,
	currentScheme: string,
): void {
	const meta = getThemeMeta(currentHue, currentScheme);

	const yaml = `# PMD Base16 Theme
scheme: "${meta.name}"
author: "Project Minimalist Design"
variant: "${meta.variant}"
hue: ${meta.hue}
aux_hue: ${meta.auxHue}
${Object.entries(colors)
	.map(([id, c]) => `${id}: "${c.hex.slice(1)}"`)
	.join("\n")}`;

	downloadFile(yaml, `pmd-theme-${currentScheme}.yaml`, "text/yaml");
	showToast("Downloaded YAML");
}

export function exportJSON(
	colors: Base16Palette,
	currentHue: number,
	currentScheme: string,
): void {
	const meta = getThemeMeta(currentHue, currentScheme);

	const json = JSON.stringify(
		{
			scheme: meta.name,
			author: "Project Minimalist Design",
			variant: meta.variant,
			hue: meta.hue,
			aux_hue: meta.auxHue,
			...Object.fromEntries(
				Object.entries(colors).map(([id, c]) => [id, c.hex.slice(1)]),
			),
		},
		null,
		2,
	);

	downloadFile(json, `pmd-theme-${currentScheme}.json`, "application/json");
	showToast("Downloaded JSON");
}

export function copyCSS(colors: Base16Palette): void {
	const css = `:root {\n${Object.entries(colors)
		.map(([id, c]) => `  --${id}: ${c.hex};`)
		.join("\n")}\n}`;
	navigator.clipboard.writeText(css);
	showToast("Copied CSS variables");
}

export function copyNixConfig(currentHue: number, currentScheme: string): void {
	const nixSnippet = `  # PMD Design System Settings
  theme = {
    hue = ${currentHue};
    variant = "${currentScheme}";
  };`;

	navigator.clipboard.writeText(nixSnippet);
	showToast("Copied Nix configuration snippet!");
}
