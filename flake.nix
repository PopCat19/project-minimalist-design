# flake.nix
#
# Purpose: Defines the Nix flake outputs for PMD design system
#
# This module:
# - Exposes base16 theme packages
# - Provides library functions for wallpaper and scheme generation
# - Exports Home Manager and NixOS modules

{
  description = "Project Minimalist Design - A flexible design system";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        packages.default = import ./src/base16-export.nix { inherit pkgs; };
        devShells.default = import ./src/dev-shell.nix { inherit pkgs; };
      }
    )
    // {
      lib = {
        mkWallpaper =
          {
            pkgs,
            hue,
            variant,
          }:
          let
            pmdCore = import ./src/pmd-core.nix {
              inherit (pkgs) lib;
              inherit pkgs;
              oklch2rgb = import ./src/oklch2rgb.nix { inherit (pkgs) lib; };
            };
          in
          pmdCore.mkWallpaper { inherit hue variant; };

        mkScheme =
          {
            lib,
            hue,
            variant ? "dark",
          }:
          (import ./src/pmd-core.nix {
            inherit lib;
            pkgs = null;
            oklch2rgb = null;
          }).mkScheme
            { inherit hue variant; };
      };

      homeManagerModules.default = import ./src/stylix/default.nix;
      homeManagerModules.pmd = self.homeManagerModules.default;
      nixosModules.default = import ./src/stylix/default.nix;
      nixosModules.pmd = self.nixosModules.default;
    };
}
