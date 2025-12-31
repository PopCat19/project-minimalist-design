# src/lib/pmd-core.nix
# PMD Core Library - Single Source of Truth for OKLCH Constants
{ lib ? import <nixpkgs/lib> }:

let
  # PMD Variable Definitions: { l = lightness, c = chroma }
  dark = {
    "100x" = { l = 1.00; c = 0.000; };
    "88x"  = { l = 0.88; c = 0.056; };
    "80x"  = { l = 0.80; c = 0.100; };
    "72x"  = { l = 0.72; c = 0.122; };
    "8x"   = { l = 0.20; c = 0.032; };
    "4x"   = { l = 0.16; c = 0.022; };
    "0x"   = { l = 0.00; c = 0.000; };
  };

  light = {
    "100x" = { l = 0.00; c = 0.000; };
    "88x"  = { l = 0.28; c = 0.032; };
    "80x"  = { l = 0.20; c = 0.032; };
    "72x"  = { l = 0.32; c = 0.052; };
    "8x"   = { l = 0.88; c = 0.056; };
    "4x"   = { l = 0.92; c = 0.044; };
    "0x"   = { l = 1.00; c = 0.000; };
  };

  # Alpha compositing: result = bg * (1 - alpha) + fg * alpha
  composite = bg: fg: alpha: {
    l = bg.l * (1.0 - alpha) + fg.l * alpha;
    c = bg.c * (1.0 - alpha) + fg.c * alpha;
  };

  # Bake fg onto 0x background at given alpha
  bake = pmd: fg: alpha: composite pmd."0x" fg alpha;

  # Compute derived values for a scheme
  computeDerived = pmd: {
    surface = composite pmd."8x" pmd."80x" 0.12;  # base02: 8x + 80x@12%
    muted   = bake pmd pmd."80x" 0.80;            # base03: 80x@80% on 0x
  };

  # Base16 slot definitions with PMD variable mappings
  mkBase16Slots = pmd: derived: hue: let
    auxHue = lib.mod (hue + 180) 360;
  in {
    # Background colors
    base00 = { inherit (pmd."4x") l c; h = hue; desc = "Background"; };
    base01 = { inherit (pmd."8x") l c; h = hue; desc = "Base Container"; };
    base02 = { inherit (derived.surface) l c; h = hue; desc = "Surface/Selection"; };
    base03 = { inherit (derived.muted) l c; h = hue; desc = "Muted/Comments"; };

    # Foreground colors
    base04 = { inherit (pmd."72x") l c; h = hue; desc = "Dark Foreground"; };
    base05 = { inherit (pmd."80x") l c; h = hue; desc = "Body Text"; };
    base06 = { inherit (pmd."88x") l c; h = hue; desc = "Headers/Primary"; };
    base07 = { inherit (pmd."100x") l c; h = hue; desc = "Highest Contrast"; };

    # Accent colors (chromatic)
    base08 = { inherit (pmd."72x") l c; h = hue; desc = "Variables/Error"; };
    base09 = { inherit (pmd."72x") l c; h = lib.mod (hue + 30) 360; desc = "Constants/Warning"; };
    base0A = { inherit (pmd."80x") l c; h = lib.mod (hue + 60) 360; desc = "Classes/Info"; };
    base0B = { inherit (pmd."72x") l c; h = auxHue; desc = "Strings/Success"; };
    base0C = { inherit (pmd."80x") l c; h = lib.mod (auxHue + 30) 360; desc = "Support/Cyan"; };
    base0D = { inherit (pmd."72x") l c; h = hue; desc = "Functions/Links"; };
    base0E = { inherit (pmd."72x") l c; h = lib.mod (hue + 300) 360; desc = "Keywords/Purple"; };
    base0F = { l = pmd."72x".l; c = pmd."72x".c * 0.8; h = lib.mod (hue + 15) 360; desc = "Deprecated"; };
  };

in {
  inherit dark light composite bake computeDerived mkBase16Slots;

  # Primary API: Generate a complete scheme
  mkScheme = { hue, variant ? "dark" }: let
    pmd = if variant == "light" then light else dark;
    derived = computeDerived pmd;
  in {
    inherit hue variant;
    auxHue = lib.mod (hue + 180) 360;
    variables = pmd;
    computed = derived;
    base16 = mkBase16Slots pmd derived hue;
  };

  # Convenience: Get raw PMD variables for a variant
  getVariables = variant: if variant == "light" then light else dark;
}
