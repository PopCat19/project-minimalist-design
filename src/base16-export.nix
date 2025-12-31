{ pkgs ? import <nixpkgs> {} }:

let
  lib = pkgs.lib;
  
  # Import color conversion functions
  oklch2rgb = import ./oklch2rgb.nix { inherit lib; };

  # ==========================================================================
  # PMD VARIABLE SYSTEM → BASE16 MAPPING (OKLCH)
  # ==========================================================================
  # DARK SCHEME:
  #   100x = oklch(1.00 0.000 h)
  #   88x  = oklch(0.88 0.056 h)
  #   80x  = oklch(0.80 0.100 h)
  #   72x  = oklch(0.72 0.122 h)
  #   8x   = oklch(0.20 0.032 h)
  #   4x   = oklch(0.16 0.022 h)
  #   0x   = oklch(0.00 0.000 h)
  #
  # LIGHT SCHEME (inverted):
  #   100x = oklch(0.00 0.000 h)
  #   88x  = oklch(0.28 0.032 h)
  #   80x  = oklch(0.20 0.032 h)
  #   72x  = oklch(0.56 0.094 h)
  #   8x   = oklch(0.88 0.056 h)
  #   4x   = oklch(0.92 0.044 h)
  #   0x   = oklch(1.00 0.000 h)
  #
  # Compositing formula (alpha blend):
  #   result = bg * (1 - alpha) + fg * alpha
  #
  # Composite values (dark):
  #   base02: 8x + 80x@12% → L: 0.272, C: 0.040
  #   base03: 80x @ 80%    → L: 0.640, C: 0.080
  # ==========================================================================

  pmdToBase16 = hue: auxHue: isDark:
    let
      # Helper to format RGB component as hex
      toHex = n:
        let
          hexChars = "0123456789ABCDEF";
          high = builtins.substring (n / 16) 1 hexChars;
          low = builtins.substring (lib.mod n 16) 1 hexChars;
        in "${high}${low}";
      
      rgbToHex = { r, g, b }: "${toHex r}${toHex g}${toHex b}";

      # PMD OKLCH color generator
      pmdColor = l: c: h: oklch2rgb l c h;

      # PMD Variable definitions - Dark scheme
      dark = {
        x100 = { l = 1.00; c = 0.000; };
        x88  = { l = 0.88; c = 0.056; };
        x80  = { l = 0.80; c = 0.100; };
        x72  = { l = 0.72; c = 0.122; };
        x8   = { l = 0.20; c = 0.032; };
        x4   = { l = 0.16; c = 0.022; };
        x0   = { l = 0.00; c = 0.000; };
      };

      # PMD Variable definitions - Light scheme (inverted)
      light = {
        x100 = { l = 0.00; c = 0.000; };
        x88  = { l = 0.28; c = 0.032; };
        x80  = { l = 0.20; c = 0.032; };
        x72  = { l = 0.56; c = 0.094; };
        x8   = { l = 0.88; c = 0.056; };
        x4   = { l = 0.92; c = 0.044; };
        x0   = { l = 1.00; c = 0.000; };
      };

      # Select scheme
      pmd = if isDark then dark else light;

      # Alpha composite: bg * (1 - alpha) + fg * alpha
      composite = bg: fg: alpha: {
        l = bg.l * (1.0 - alpha) + fg.l * alpha;
        c = bg.c * (1.0 - alpha) + fg.c * alpha;
      };

      # Bake opacity (on 0x background)
      bake = fg: alpha: composite pmd.x0 fg alpha;

      # Computed values
      surface = composite pmd.x8 pmd.x80 0.12;  # 8x + 80x@12% stacked
      muted   = bake pmd.x80 0.80;              # 80x @ 80% on 0x

    in {
      # ======================================================================
      # BACKGROUND TONES (base00-base03)
      # ======================================================================
      base00 = rgbToHex (pmdColor pmd.x4.l pmd.x4.c hue);         # PMD: 4x (true background)
      base01 = rgbToHex (pmdColor pmd.x8.l pmd.x8.c hue);         # PMD: 8x (base)
      base02 = rgbToHex (pmdColor surface.l surface.c hue);       # PMD: 8x + 80x@12% (surface)
      base03 = rgbToHex (pmdColor muted.l muted.c hue);           # PMD: 80x@80% (muted)

      # ======================================================================
      # FOREGROUND TONES (base04-base07)
      # ======================================================================
      base04 = rgbToHex (pmdColor pmd.x72.l pmd.x72.c hue);       # PMD: 72x (dark fg)
      base05 = rgbToHex (pmdColor pmd.x80.l pmd.x80.c hue);       # PMD: 80x (body)
      base06 = rgbToHex (pmdColor pmd.x88.l pmd.x88.c hue);       # PMD: 88x (headers)
      base07 = rgbToHex (pmdColor pmd.x100.l pmd.x100.c hue);     # PMD: 100x (white/black)

      # ======================================================================
      # ACCENT COLORS (base08-base0F) - 72x/80x with hue offsets
      # ======================================================================
      base08 = rgbToHex (pmdColor pmd.x72.l pmd.x72.c hue);                             # PMD: 72x primary   | Variables
      base09 = rgbToHex (pmdColor pmd.x72.l pmd.x72.c (lib.mod (hue + 30) 360));        # PMD: 72x hue+30°   | Constants
      base0A = rgbToHex (pmdColor pmd.x80.l pmd.x80.c (lib.mod (hue + 60) 360));        # PMD: 80x hue+60°   | Classes
      base0B = rgbToHex (pmdColor pmd.x72.l pmd.x72.c auxHue);                          # PMD: 72x aux       | Strings
      base0C = rgbToHex (pmdColor pmd.x80.l pmd.x80.c (lib.mod (auxHue + 30) 360));     # PMD: 80x aux+30°   | Support
      base0D = rgbToHex (pmdColor pmd.x72.l pmd.x72.c hue);                             # PMD: 72x primary   | Functions
      base0E = rgbToHex (pmdColor pmd.x72.l pmd.x72.c (lib.mod (hue + 300) 360));       # PMD: 72x hue-60°   | Keywords
      base0F = rgbToHex (pmdColor pmd.x72.l (pmd.x72.c * 0.8) (lib.mod (hue + 15) 360)); # PMD: 72x hue+15°  | Deprecated
    };
  
  # Generate YAML for a palette
  generateYaml = name: hue: isDark:
    let
      auxHue = lib.mod (hue + 180) 360;
      colors = pmdToBase16 hue auxHue isDark;
      schemeSuffix = if isDark then "" else " Light";
      schemeType = if isDark then "dark" else "light";
    in ''
      # ========================================================================
      # PMD Base16 Theme: ${name}${schemeSuffix}
      # ========================================================================
      # Scheme: ${schemeType}
      # PMD OKLCH Variables (${schemeType}):
      #   100x, 88x, 80x, 72x, 8x, 0x
      #
      # Base16 Mapping:
      #   base00-01: 4x, 8x (backgrounds)
      #   base02: 8x + 80x@12% (composited surface)
      #   base03: 80x@80% (baked muted)
      #   base04-07: 72x, 80x, 88x, 100x (foregrounds)
      #   base08-0F: 72x/80x chromatic (accents)
      #
      # Hue: ${toString hue}° | Aux: ${toString auxHue}°
      # ========================================================================

      scheme: "PMD ${name}${schemeSuffix}"
      author: "Project Minimalist Design"
      variant: "${schemeType}"
      hue: ${toString hue}
      aux_hue: ${toString auxHue}
      base00: "${colors.base00}"
      base01: "${colors.base01}"
      base02: "${colors.base02}"
      base03: "${colors.base03}"
      base04: "${colors.base04}"
      base05: "${colors.base05}"
      base06: "${colors.base06}"
      base07: "${colors.base07}"
      base08: "${colors.base08}"
      base09: "${colors.base09}"
      base0A: "${colors.base0A}"
      base0B: "${colors.base0B}"
      base0C: "${colors.base0C}"
      base0D: "${colors.base0D}"
      base0E: "${colors.base0E}"
      base0F: "${colors.base0F}"
    '';
  
  # Predefined palettes
  palettes = {
    rose = { name = "Rose"; hue = 345; };
    violet = { name = "Violet"; hue = 260; };
    blue = { name = "Blue"; hue = 240; };
    cyan = { name = "Cyan"; hue = 195; };
    green = { name = "Green"; hue = 140; };
    yellow = { name = "Yellow"; hue = 90; };
    orange = { name = "Orange"; hue = 60; };
    red = { name = "Red"; hue = 30; };
  };

in pkgs.stdenv.mkDerivation {
  pname = "pmd-base16";
  version = "0.1.0";
  
  src = ./.;
  
  buildInputs = with pkgs; [ yaml2json jq ];
  
  buildPhase = ''
    mkdir -p themes
    
    # Generate dark themes
    ${lib.concatStringsSep "\n" (lib.mapAttrsToList (key: val: ''
      cat > themes/pmd-${key}.yaml << 'EOF'
      ${generateYaml val.name val.hue true}
      EOF
    '') palettes)}

    # Generate light themes
    ${lib.concatStringsSep "\n" (lib.mapAttrsToList (key: val: ''
      cat > themes/pmd-${key}-light.yaml << 'EOF'
      ${generateYaml val.name val.hue false}
      EOF
    '') palettes)}
    
    echo "Generated ${toString (lib.length (lib.attrNames palettes) * 2)} base16 themes (dark + light)"
  '';
  
  installPhase = ''
    mkdir -p $out/share/pmd-base16
    cp -r themes/* $out/share/pmd-base16/
    
    # Also create a JSON version for programmatic access
    mkdir -p $out/share/pmd-base16/json
    for f in themes/*.yaml; do
      name=$(basename "$f" .yaml)
      ${pkgs.yaml2json}/bin/yaml2json < "$f" > "$out/share/pmd-base16/json/$name.json"
    done
  '';
  
  meta = with pkgs.lib; {
    description = "Base16 themes generated from Project Minimalist Design";
    license = licenses.mit;
  };
}