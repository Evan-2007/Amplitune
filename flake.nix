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
              nativeBuildInputs = with pkgs; [
              pkg-config
              gobject-introspection
              cargo
              cargo-tauri
              nodejs
            ];
            buildInputs = with pkgs; [
              at-spi2-atk
              atkmm
              cairo
              gdk-pixbuf
              glib
              gtk3
              harfbuzz
              librsvg
              libsoup_3
              pango
              webkitgtk_4_1
              openssl
            ];

            shellHook = ''
              echo "Entered Rust/Node.js development environment."
              echo "Available tools: Rust/Cargo, Node $(node --version), PNPM $(pnpm --version), Git $(git --version)"
              export WEBKIT_DISABLE_COMPOSITING_MODE=1
            '';
          };
        });
    };
}
