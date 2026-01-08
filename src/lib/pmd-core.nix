# src/lib/pmd-core.nix
# PMD Core Library - Single Source of Truth for OKLCH Constants
{
  lib ? import <nixpkgs/lib>,
  pkgs,
  oklch2rgb,
}: let
  # PMD Variable Definitions: { l = lightness, c = chroma }
  dark = {
    "100x" = {
      l = 1.00;
      c = 0.000;
    };
    "88x" = {
      l = 0.88;
      c = 0.056;
    };
    "80x" = {
      l = 0.80;
      c = 0.100;
    };
    "72x" = {
      l = 0.72;
      c = 0.122;
    };
    "8x" = {
      l = 0.20;
      c = 0.032;
    };
    "4x" = {
      l = 0.16;
      c = 0.022;
    };
    "0x" = {
      l = 0.00;
      c = 0.000;
    };
    # Fixed semantic accents (shared across schemes)
    "danger" = {
      l = 0.64;
      c = 0.200;
      h = 30;
    };
    "warning" = {
      l = 0.72;
      c = 0.160;
      h = 60;
    };
  };

  light = {
    "100x" = {
      l = 0.00;
      c = 0.000;
    };
    "88x" = {
      l = 0.28;
      c = 0.032;
    };
    "80x" = {
      l = 0.20;
      c = 0.032;
    };
    "72x" = {
      l = 0.32;
      c = 0.052;
    };
    "8x" = {
      l = 0.88;
      c = 0.056;
    };
    "4x" = {
      l = 0.92;
      c = 0.044;
    };
    "0x" = {
      l = 1.00;
      c = 0.000;
    };
    # Fixed semantic accents (tinted for light scheme contrast)
    "danger" = {
      l = 0.48;
      c = 0.160;
      h = 30;
    };
    "warning" = {
      l = 0.48;
      c = 0.112;
      h = 60;
    };
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
    surface = composite pmd."8x" pmd."80x" 0.12; # base02: 8x + 80x@12%
    muted = bake pmd pmd."80x" 0.80; # base03: 80x@80% on 0x
  };

  mkBase16Slots = pmd: derived: root: let
    rot = base: deg: lib.mod (base + deg + 360) 360;
    # Light Mode Fix: L=0.45 ensures WCAG AA contrast against L=0.92 background
    isLight = pmd."4x".l > 0.5;
    accentL =
      if isLight
      then 0.45
      else pmd."72x".l;
  in {
    # --- Background Stack ---
    base00 = {
      inherit (pmd."4x") l c;
      h = root;
    };
    base01 = {
      inherit (pmd."8x") l c;
      h = root;
    };
    base02 = {
      inherit (derived.surface) l c;
      h = root;
    };
    base03 = {
      inherit (bake pmd pmd."80x" 0.80) l c;
      h = root;
    }; # Muted (80x@80%)

    # --- Foreground Stack: Strict Visibility Hierarchy ---
    base04 = {
      inherit (pmd."72x") l c;
      h = root;
    }; # 72x (Subtext)
    base05 = {
      inherit (pmd."80x") l c;
      h = root;
    }; # 80x (Standard Body)
    base06 = {
      inherit (pmd."88x") l c;
      h = root;
    }; # 88x (Primary Header)
    base07 = {
      inherit (pmd."100x") l c;
      h = root;
    }; # 100x (Max Contrast)

    # --- Accent Stack: Fixed Semantics ---
    base08 = {
      inherit (pmd."88x") l c;
      h = root;
    }; # Danger (88x @ Root)
    base09 = {
      l = accentL;
      inherit (pmd."72x") c;
      h = rot root 290;
    }; # Constants (Purple @ Root+290)
    base0A = {
      inherit (pmd."warning") l c h;
    }; # Warning
    base0B = {
      inherit (pmd."80x") l c;
      h = root;
    }; # Strings (80x @ Root)
    base0C = {
      l = accentL;
      inherit (pmd."72x") c;
      h = rot root 140;
    }; # Support (Root+140)
    base0D = {
      l = accentL;
      inherit (pmd."72x") c;
      h = rot root 30;
    }; # Functions (Identity+)
    base0E = {
      l = accentL;
      inherit (pmd."72x") c;
      h = rot root (-30);
    }; # Keywords (Identity-30)

    # Meta
    base0F = {
      inherit (bake pmd pmd."72x" 0.80) l c;
      h = root;
    }; # Deprecated (Baked Meta)
  };

  # Generate a wallpaper derivation
  mkWallpaper = {
    hue,
    variant,
    width ? 3840,
    height ? 2160,
  }: let
    pmd =
      if variant == "light"
      then light
      else dark;
    # Gradient Stop 1: Center (using 8x - Surface)
    hex8x = oklch2rgb {
      inherit (pmd."8x") l c;
      h = hue;
    };
    # Gradient Stop 2: Edges (using 4x - Background)
    hex4x = oklch2rgb {
      inherit (pmd."4x") l c;
      h = hue;
    };
  in
    pkgs.runCommand "pmd-wallpaper.png" {
      nativeBuildInputs = [pkgs.imagemagick];
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
  mkScheme = {
    hue,
    variant ? "dark",
  }: let
    pmd =
      if variant == "light"
      then light
      else dark;
    derived = computeDerived pmd;
  in {
    inherit hue variant;
    auxHue = lib.mod (hue + 180) 360;
    variables = pmd;
    computed = derived;
    base16 = mkBase16Slots pmd derived hue;
  };

  # Convenience: Get raw PMD variables for a variant
  getVariables = variant:
    if variant == "light"
    then light
    else dark;
}
