{
  description = "Project Minimalist Design - A flexible design system";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        pmdCore = import ./src/lib/pmd-core.nix { lib = pkgs.lib; };
        oklch2rgb = import ./src/oklch2rgb.nix { lib = pkgs.lib; };
      in
      {
        packages.default = import ./src/base16-export.nix { inherit pkgs; lib = pkgs.lib; };

        devShells.default = import ./src/dev-shell.nix { inherit pkgs; };

        # Expose PMD library functions
        lib = {
          inherit (pmdCore) mkScheme getVariables dark light;

          # Generate Base16 YAML string for a hue/variant
          mkBase16Yaml = { hue, variant ? "dark" }:
            let
              scheme = pmdCore.mkScheme { inherit hue variant; };
              formatHex = slot:
                pkgs.lib.removePrefix "#" (oklch2rgb { inherit (slot) l c h; });
              b16 = scheme.base16;
            in
              builtins.concatStringsSep "\n" (
                [ "scheme: \"PMD ${toString hue}${pkgs.lib.optionalString (variant == "light") " Light"}\""
                  "author: \"Project Minimalist Design\""
                  "variant: \"${variant}\""
                ] ++ map (slot: "${slot}: \"${formatHex b16.${slot}}\"")
                  [ "base00" "base01" "base02" "base03" "base04" "base05" "base06" "base07"
                    "base08" "base09" "base0A" "base0B" "base0C" "base0D" "base0E" "base0F" ]
              );
        };
      }
    ) // {
      # System-independent library exports
      lib = let
        lib = nixpkgs.lib;
        pmdCore = import ./src/lib/pmd-core.nix { inherit lib; };
      in {
        inherit (pmdCore) mkScheme getVariables dark light composite bake;
      };
    };
}
