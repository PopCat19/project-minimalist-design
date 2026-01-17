# Plan: Update base02 Documentation Format

## Task
Change base02 documentation format from `8x + 80x @ 12%` to `8x+80x@12%` (remove spaces around operators) to match the implementation in index.html.

## Files to Update

### 1. doc/palettes.txt
- **Line 9**: Change `base02      | 8x + 80x @ 12%        | Surface / Selection (Composited)`
- **To**: `base02      | 8x+80x@12%            | Surface / Selection (Composited)`

### 2. PMD-DOCUMENTATION.txt
- **Line 197**: Change `base02      | 8x + 80x @ 12%        | Surface / Selection (Composited)`
- **To**: `base02      | 8x+80x@12%            | Surface / Selection (Composited)`

## Verification
- index.html already uses the correct format `8x+80x@12%` (line 771)
- No changes needed to index.html or src/lib/pmd-core.nix
- The format change is purely cosmetic/documentation consistency

## Execution Order
1. Update doc/palettes.txt
2. Update PMD-DOCUMENTATION.txt
