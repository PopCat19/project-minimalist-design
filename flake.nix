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
      in
      {
        packages.default = import ./src/base16-export.nix { inherit pkgs; };
        
        devShells.default = import ./src/dev-shell.nix { inherit pkgs; };
      }
    );
}
