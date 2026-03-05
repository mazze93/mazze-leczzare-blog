#!/usr/bin/env bash
set -euo pipefail

WITH_CODEQL=0
if [[ "${1:-}" == "--with-codeql" ]]; then
  WITH_CODEQL=1
fi

if ! command -v brew >/dev/null 2>&1; then
  echo "Homebrew is required but not found." >&2
  exit 1
fi

BREW_REQUIRED=(pnpm cloudflared semgrep nmap)
BREW_OPTIONAL=()
if [[ "$WITH_CODEQL" -eq 1 ]]; then
  BREW_OPTIONAL+=(codeql)
fi

NPM_GLOBAL=(wrangler)

install_brew_pkg() {
  local pkg="$1"
  if [[ "$pkg" == "codeql" ]]; then
    if brew list --cask "$pkg" >/dev/null 2>&1; then
      echo "[ok] brew cask already installed: $pkg"
    else
      echo "[install] brew install --cask $pkg"
      brew install --cask "$pkg"
    fi
    return
  fi

  if brew list --versions "$pkg" >/dev/null 2>&1; then
    echo "[ok] brew package already installed: $pkg"
  else
    echo "[install] brew install $pkg"
    brew install "$pkg"
  fi
}

install_npm_global() {
  local pkg="$1"
  if command -v "$pkg" >/dev/null 2>&1; then
    echo "[ok] npm global already available: $pkg"
  else
    echo "[install] npm install -g $pkg"
    npm install -g "$pkg"
  fi
}

for pkg in "${BREW_REQUIRED[@]}"; do
  install_brew_pkg "$pkg"
done

if [[ "${#BREW_OPTIONAL[@]}" -gt 0 ]]; then
  for pkg in "${BREW_OPTIONAL[@]}"; do
    install_brew_pkg "$pkg"
  done
fi

for pkg in "${NPM_GLOBAL[@]}"; do
  install_npm_global "$pkg"
done

echo
echo "Toolbelt status:"
for cmd in gh jq curl dig openssl node npm pnpm wrangler cloudflared semgrep nmap codeql; do
  if command -v "$cmd" >/dev/null 2>&1; then
    echo "[ok] $cmd"
  else
    echo "[missing] $cmd"
  fi
done
