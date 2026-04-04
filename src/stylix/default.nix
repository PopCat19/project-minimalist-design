# default.nix
#
# Purpose: Stylix integration module for PMD theme system
#
# This module:
# - Defines PMD configuration options
# - Generates base16 palette for Stylix
# - Creates wallpapers from PMD color system

{
  config,
  lib,
  pkgs,
  ...
}:
let
  cfg = config.stylix.pmd;
  pmdCore = import ../pmd-core.nix {
    inherit lib pkgs;
    oklch2rgb = import ../oklch2rgb.nix { inherit lib; };
  };

  scheme = pmdCore.mkScheme {
    inherit (cfg) hue;
    inherit (cfg) variant;
  };
  base16Palette = lib.mapAttrs (
    _name: value:
    lib.removePrefix "#" (import ../oklch2rgb.nix { inherit lib; } { inherit (value) l c h; })
  ) scheme.base16;
in
{
  options.stylix.pmd = {
    enable = lib.mkEnableOption "PMD Stylix integration";
    hue = lib.mkOption {
      type = lib.types.int;
      default = 260;
    };
    variant = lib.mkOption {
      type = lib.types.enum [
        "dark"
        "light"
      ];
      default = "dark";
    };

    wallpaper = {
      enable = lib.mkOption {
        type = lib.types.bool;
        default = true;
      };
    };
  };

  config = lib.mkIf cfg.enable {
    stylix.base16Scheme = base16Palette;

    stylix.image = lib.mkIf cfg.wallpaper.enable (
      pmdCore.mkWallpaper {
        inherit (cfg) hue variant;
      }
    );
  };
}
