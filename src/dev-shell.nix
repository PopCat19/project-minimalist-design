{
  pkgs ? import <nixpkgs> { },
}:
pkgs.mkShell {
  buildInputs = with pkgs; [
    yaml2json
    jq
    nodejs
    python3
  ];

  shellHook = ''
    echo "Project Minimalist Design development environment"
    echo "Available tools: yaml2json, jq, node, python3"
  '';
}
