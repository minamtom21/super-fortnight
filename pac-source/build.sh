#!/usr/bin/env bash
# Pack the canvas source into a .msapp using Power Platform CLI.
#
# Prerequisite (Linux/macOS, cross-platform):
#   sudo apt-get install -y dotnet-sdk-8.0     # or brew install dotnet@8
#   dotnet tool install --global Microsoft.PowerApps.CLI.Tool --version 1.34.4
#   export PATH="$PATH:$HOME/.dotnet/tools"
#
# Usage:
#   ./build.sh                  # outputs MinatomiraiPizza.msapp next to this script
#   ./build.sh /tmp/out.msapp   # custom output path

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT="${1:-${SCRIPT_DIR}/MinatomiraiPizza.msapp}"

if ! command -v pac >/dev/null 2>&1; then
  echo "Error: pac CLI not found in PATH." >&2
  echo "Install:" >&2
  echo "  dotnet tool install --global Microsoft.PowerApps.CLI.Tool --version 1.34.4" >&2
  echo "  export PATH=\"\$PATH:\$HOME/.dotnet/tools\"" >&2
  exit 1
fi

echo "Packing canvas source from: ${SCRIPT_DIR}"
echo "Output: ${OUT}"

pac canvas pack --sources "${SCRIPT_DIR}" --msapp "${OUT}"

echo ""
echo "Done. Import the .msapp from https://make.powerapps.com (Apps > Import canvas app)."
echo "Or open directly in Power Apps Studio (File > Open > Browse)."
