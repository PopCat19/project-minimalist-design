# base16-export.nix
#
# Purpose: Exports PMD color schemes as Base16 YAML files
#
# This module:
# - Generates dark and light theme YAML files
# - Provides scheme-to-YAML conversion utilities
# - Creates distributable theme packages

{
  pkgs,
  lib ? pkgs.lib,
}:
let
  pmdCore = import ./pmd-core.nix {
    inherit lib pkgs;
    inherit oklch2rgb;
  };
  oklch2rgb = import ./oklch2rgb.nix { inherit lib; };

  schemeToYaml =
    scheme:
    let
      formatHex =
        slot:
        let
          rgb = oklch2rgb { inherit (slot) l c h; };
        in
        lib.removePrefix "#" rgb;

      b16 = scheme.base16;
    in
    ''
      scheme: "PMD ${toString scheme.hue}${lib.optionalString (scheme.variant == "light") " Light"}"
      author: "Project Minimalist Design"
      variant: "${scheme.variant}"
      base00: "${formatHex b16.base00}"
      base01: "${formatHex b16.base01}"
      base02: "${formatHex b16.base02}"
      base03: "${formatHex b16.base03}"
      base04: "${formatHex b16.base04}"
      base05: "${formatHex b16.base05}"
      base06: "${formatHex b16.base06}"
      base07: "${formatHex b16.base07}"
      base08: "${formatHex b16.base08}"
      base09: "${formatHex b16.base09}"
      base0A: "${formatHex b16.base0A}"
      base0B: "${formatHex b16.base0B}"
      base0C: "${formatHex b16.base0C}"
      base0D: "${formatHex b16.base0D}"
      base0E: "${formatHex b16.base0E}"
      base0F: "${formatHex b16.base0F}"
    '';

  mkThemes = hue: {
    dark = schemeToYaml (
      pmdCore.mkScheme {
        inherit hue;
        variant = "dark";
      }
    );
    light = schemeToYaml (
      pmdCore.mkScheme {
        inherit hue;
        variant = "light";
      }
    );
  };

  defaultHue = 260;
  themes = mkThemes defaultHue;
in
pkgs.stdenv.mkDerivation {
  pname = "pmd-base16";
  version = "0.1.0";

  dontUnpack = true;

  installPhase = ''
    mkdir -p $out/share/pmd-base16
    echo '${themes.dark}' > $out/share/pmd-base16/pmd-dark.yaml
    echo '${themes.light}' > $out/share/pmd-base16/pmd-light.yaml
  '';

  passthru = {
    inherit pmdCore mkThemes schemeToYaml;
  };
}
