#!/usr/bin/env bash
# Pack the canvas source into a .msapp using Power Platform CLI.
#
# Prerequisite:
#   Install pac CLI: https://learn.microsoft.com/power-platform/developer/cli/introduction
#     winget install Microsoft.PowerPlatformCLI            # Windows
#     dotnet tool install --global Microsoft.PowerApps.CLI.Tool   # cross-platform
#
# Usage:
#   ./build.sh                  # outputs MinatomiraiPizza.msapp next to this script
#   ./build.sh /tmp/out.msapp   # custom output path

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT="${1:-${SCRIPT_DIR}/MinatomiraiPizza.msapp}"

if ! command -v pac >/dev/null 2>&1; then
  echo "Error: pac CLI not found in PATH." >&2
  echo "Install: dotnet tool install --global Microsoft.PowerApps.CLI.Tool" >&2
  exit 1
fi

echo "Packing canvas source from: ${SCRIPT_DIR}"
echo "Output: ${OUT}"

pac canvas pack --sources "${SCRIPT_DIR}" --msapp "${OUT}"

echo "Done. Import the .msapp from https://make.powerapps.com (Apps > Import canvas app)."
