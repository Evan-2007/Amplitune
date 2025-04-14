# flake.nix
{
  description = "Development environment with Rust, Node.js 18, PNPM, and Git";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs, ... }@inputs:
    let
      supportedSystems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];

      forAllSystems = nixpkgs.lib.genAttrs supportedSystems;

      pkgsFor = system: import nixpkgs { inherit system; };

    in
    {
      devShells = forAllSystems (system:
        let
          pkgs = pkgsFor system;
        in
        {
          default = pkgs.mkShell {
            buildInputs = with pkgs; [
              cargo
              git
              nodejs-18_x
              nodePackages.pnpm
              pkg-config
              glib
              atk
              cairo
              pango
              libsoup_3
              webkitgtk_4_1
              haskellPackages.gi-javascriptcore
            ];

            shellHook = ''
              echo "Entered Rust/Node.js development environment."
              echo "Available tools: Rust/Cargo, Node $(node --version), PNPM $(pnpm --version), Git $(git --version)"
            '';
          };
        });
    };
}
