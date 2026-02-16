# dev-shell.nix
#
# Purpose: Development environment shell for PMD project
#
# This module:
# - Provides yaml2json, jq, bun, python3 tools
# - Displays environment info on shell entry

{
  pkgs ? import <nixpkgs> { },
}:
pkgs.mkShell {
  buildInputs = with pkgs; [
    yaml2json
    jq
    bun
    python3
  ];

  shellHook = ''
    echo "PMD • bun run build"
  '';
}
