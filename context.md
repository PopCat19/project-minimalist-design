# Context

- `CHANGELOG-407aea2.md` — Changelog for the dev → main merge at commit 407aea2
- `_config.yml` — Jekyll configuration for GitHub Pages, excludes conventions from processing
- `flake.nix` — Defines the Nix flake outputs for PMD design system
- `index.html` — PMD palette generator and design system inspector
- `README.md` — Project overview and quick start guide for PMD design system

## Vocabulary

DDD term mappings for this repo. Definitions at Rule 21 in
`conventions/DEVELOPMENT.md`.

| Term | This repo |
|------|-----------|
| **Aggregate Root** | `flake.nix` |
| **Domain** | `src/ts/color/`, `src/ts/pmd/`, `src/ts/ui/` |
| **Subdomain** | `src/ts/color/oklch.ts` (color conversion) |
| **Bounded Context** | `src/` (design system core) |
| **Context Boundary** | `flake.nix` (Nix ↔ TS bridge) |
| **Shared Kernel** | `src/pmd-core.nix` |
| **Anti-Corruption Layer** | `src/oklch2rgb.nix`, `src/base16-export.nix` |
| **Factory** | `src/ts/pmd/variables.ts` |
| **Value Object** | `src/palette/pmd/*.yaml` (color palettes) |
| **Entity** | `index.html` (single-page app instance) |
| **Aggregate** | `src/ts/main.ts` (application entry) |
| **Supporting Domain** | `doc/`, `conventions/` |
