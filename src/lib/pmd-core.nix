# src/lib/pmd-core.nix
# PMD Core Library - Single Source of Truth for OKLCH Constants
{ lib ? import <nixpkgs/lib>, pkgs, oklch2rgb }:

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

  mkBase16Slots = pmd: derived: root: let
    aux = lib.mod (root + 180) 360;
    rootC = pmd."72x".c;
    cStep = n: let val = rootC - (n * 0.02); in if val < 0.01 then 0.01 else val;
  in {
    # --- Background Stack ---
    base00 = { inherit (pmd."4x") l c; h = root; };                # 4x (True BG)
    base01 = { inherit (pmd."8x") l c; h = root; };                # 8x (Base)
    base02 = { inherit (derived.surface) l c; h = root; };         # 8x + 80x @ 12%
    base03 = { inherit (bake pmd pmd."80x" 0.64) l c; h = root; };    # 80x @ 64%

    # --- Foreground Stack ---
    base04 = { inherit (bake pmd pmd."80x" 0.80) l c; h = root; };    # 80x @ 80%
    base05 = { inherit (pmd."80x") l c; h = root; };                # 80x (Body)
    base06 = { inherit (pmd."80x") l c; h = root; };                # 80x (Secondary)
    base07 = { inherit (pmd."88x") l c; h = root; };                # 88x (Headers)

    # --- Accent Stack (Semantic Tiers) ---
    # High Visibility Tier (Alert/Identity)
    base08 = { inherit (pmd."88x") l c; h = aux; };                # 88x Alert (Aux)
    base09 = { inherit (pmd."80x") l c; h = root; };               # 80x Identity (Root)

    # Chroma Hierarchy Tier (72x Monochromatic)
    base0E = { l = pmd."72x".l; c = rootC;   h = root; };          # Keywords (Vibrant)
    base0D = { l = pmd."72x".l; c = cStep 1; h = root; };          # Functions (-0.02c)
    base0C = { l = pmd."72x".l; c = cStep 2; h = root; };          # Support (-0.04c)
    base0B = { l = pmd."72x".l; c = cStep 3; h = root; };          # Strings (-0.06c)
    base0A = { l = pmd."72x".l; c = cStep 4; h = root; };          # Classes (-0.08c)

    # Meta Tier
    base0F = { inherit (bake pmd pmd."72x" 0.80) l c; h = root; };    # 72x @ 80% (Deprecated)
  };

  # Generate a wallpaper derivation
  mkWallpaper = { hue, variant, width ? 3840, height ? 2160 }: 
    let
      pmd = if variant == "light" then light else dark;
      # Gradient Stop 1: Center (using 8x - Surface)
      hex8x = oklch2rgb { inherit (pmd."8x") l c; h = hue; };
      # Gradient Stop 2: Edges (using 4x - Background)
      hex4x = oklch2rgb { inherit (pmd."4x") l c; h = hue; };
    in
    pkgs.runCommand "pmd-wallpaper.png" { 
      nativeBuildInputs = [ pkgs.imagemagick ]; 
    } ''
      # 1. Create a radial gradient from Center (8x) to Edges (4x)
      # 2. Add subtle grain (+noise)
      # 3. Soften the noise by attenuating it
      magick -size ${toString width}x${toString height} \
        radial-gradient:"${hex8x}-${hex4x}" \
        -attenuate 0.2 +noise gaussian \
        -colorspace sRGB $out
    '';

in {
  inherit dark light composite bake computeDerived mkBase16Slots mkWallpaper;

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
