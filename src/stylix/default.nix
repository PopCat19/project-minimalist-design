{
  config,
  lib,
  pkgs,
  ...
}: let
  cfg = config.stylix.pmd;
  # Import the library helpers
  pmdCore = import ../lib/pmd-core.nix {
    inherit lib pkgs;
    oklch2rgb = import ../oklch2rgb.nix {inherit lib;};
  };

  # ... (palette generation logic) ...
  scheme = pmdCore.mkScheme {
    inherit (cfg) hue;
    inherit (cfg) variant;
  };
  base16Palette = lib.mapAttrs (_name: value: lib.removePrefix "#" (import ../oklch2rgb.nix {inherit lib;} {inherit (value) l c h;})) scheme.base16;
in {
  options.stylix.pmd = {
    enable = lib.mkEnableOption "PMD Stylix integration";
    hue = lib.mkOption {
      type = lib.types.int;
      default = 260;
    };
    variant = lib.mkOption {
      type = lib.types.enum ["dark" "light"];
      default = "dark";
    };

    # New Wallpaper Options
    wallpaper = {
      enable = lib.mkOption {
        type = lib.types.bool;
        default = true;
        description = "Whether PMD should generate and set the system wallpaper.";
      };
    };
  };

  config = lib.mkIf cfg.enable {
    stylix.base16Scheme = base16Palette;

    # Apply wallpaper only if enabled
    stylix.image = lib.mkIf cfg.wallpaper.enable (
      pmdCore.mkWallpaper {
        inherit (cfg) hue variant;
      }
    );
  };
}
