# Changelog — dev → main

**Date:** 2026-02-16
**Branch:** dev
**Merge type:** Merge commit (linear history)
**HEAD:** `pending` (rename after merge)

## Commits

- revert(base16): use chromatic 88x/80x for danger/warning, remove vars ([`f150ab0`](https://github.com/PopCat19/project-minimalist-design/commit/f150ab0))
- fix(pmd-core): align base16 slots with typescript reference ([`2092b0b`](https://github.com/PopCat19/project-minimalist-design/commit/2092b0b))
- fix(base16): apply hue lock and use semantic danger/warning colors ([`cdaef48`](https://github.com/PopCat19/project-minimalist-design/commit/cdaef48))
- fix(ui): open sidebar from right to match menu button position ([`ec0db9b`](https://github.com/PopCat19/project-minimalist-design/commit/ec0db9b))
- feat(ui): improve mobile UX with scroll lock, gestures, and keyboard support ([`4b46171`](https://github.com/PopCat19/project-minimalist-design/commit/4b46171))
- feat(ui): add mobile-responsive layout with slide-out sidebar and bottom sheet ([`7b05937`](https://github.com/PopCat19/project-minimalist-design/commit/7b05937))
- fix(ui): update presets when switching color scheme ([`b926856`](https://github.com/PopCat19/project-minimalist-design/commit/b926856))
- refactor(ts): extract shared functions and constants for DRY compliance ([`6d73384`](https://github.com/PopCat19/project-minimalist-design/commit/6d73384))
- feat(ui): set red (hue 30) as default startup color ([`05bed65`](https://github.com/PopCat19/project-minimalist-design/commit/05bed65))
- style(devshell): simplify greet message to show build command ([`2c1b9aa`](https://github.com/PopCat19/project-minimalist-design/commit/2c1b9aa))
- fix(devshell): replace nodejs with bun for TypeScript bundling ([`be49442`](https://github.com/PopCat19/project-minimalist-design/commit/be49442))
- feat(ts): rewrite JavaScript to TypeScript modules with Bun bundler ([`f1ac50a`](https://github.com/PopCat19/project-minimalist-design/commit/f1ac50a))
- docs: add file headers per conventions ([`bd51ebb`](https://github.com/PopCat19/project-minimalist-design/commit/bd51ebb))
- style: remove unnecessary comments per conventions ([`6e3f406`](https://github.com/PopCat19/project-minimalist-design/commit/6e3f406))
- docs(pmd): sync documentation with codebase implementation ([`e6382ed`](https://github.com/PopCat19/project-minimalist-design/commit/e6382ed))
- feat(pmd): change base0C from 72x+140 to 80x+140 ([`1fc41dc`](https://github.com/PopCat19/project-minimalist-design/commit/1fc41dc))
- style(nix): apply nixfmt formatting across codebase ([`996c9d5`](https://github.com/PopCat19/project-minimalist-design/commit/996c9d5))
- chore: sync dev-conventions ([`f3a3b15`](https://github.com/PopCat19/project-minimalist-design/commit/f3a3b15))
- feat(palette): add pmd red color scheme (hue 30) ([`807f02f`](https://github.com/PopCat19/project-minimalist-design/commit/807f02f))

## Files changed

```
 PMD-DOCUMENTATION.txt             |  336 -------
 conventions/AGENTS.md             |   93 ++
 conventions/DEV-EXAMPLES.md       |  398 ++++++++
 conventions/DEVELOPMENT.md        | 1885 +++++++++++++++++++++++++++++++++++++
 conventions/generate-changelog.sh |  260 +++++
 conventions/sync-conventions.sh   |  326 +++++++
 dist/main.js                      |  555 +++++++++++
 doc/base16-implementation.txt     |   27 +-
 doc/conventions.txt               |    2 +-
 doc/opacity.txt                   |    2 +-
 doc/palettes.txt                  |   38 +-
 doc/variables.txt                 |   26 +-
 flake.nix                         |   77 +-
 index.html                        | 1138 ++++++++++------------
 package.json                      |    9 +
 src/base16-export.nix             |  119 ++-
 src/dev-shell.nix                 |   17 +-
 src/hsl2rgb.nix                   |   68 +-
 src/lib/pmd-core.nix              |  297 +++---
 src/oklch2rgb.nix                 |  201 ++--
 src/palette/pmd/030.yaml          |   31 +
 src/stylix/default.nix            |   27 +-
 src/ts/color/hsl.ts               |   15 +
 src/ts/color/index.ts             |    3 +
 src/ts/color/oklch.ts             |   43 +
 src/ts/main.ts                    |  210 +++++
 src/ts/pmd/base16.ts              |  101 ++
 src/ts/pmd/index.ts               |    4 +
 src/ts/pmd/variables.ts           |   57 ++
 src/ts/ui/controls.ts             |   65 ++
 src/ts/ui/docs.ts                 |  101 ++
 src/ts/ui/export.ts               |   60 ++
 src/ts/ui/index.ts                |    4 +
 src/ts/ui/render.ts               |   91 ++
 src/variables/singleton.qml       |    8 +
 tsconfig.json                     |   14 +
 36 files changed, 5306 insertions(+), 1402 deletions(-)
```
