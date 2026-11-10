#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/.."
node packages/cli/index.mjs install-skills --host "${1:-generic}" --target "${2:-.}"
