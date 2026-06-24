#!/usr/bin/env bash
# setup-dev.sh
# Complete local development setup:
#   1. Generates per-package .env files from the root .env (via generate-env.sh)
#   2. Installs npm dependencies
#   3. For every package that has a prisma.config.ts, either runs
#      `prisma migrate deploy` (if migrations/ exists) or `prisma db push`

set -euo pipefail

# ── Step 1: Generate per-package .env files ──────────────────────────────────
echo "Generating per-package .env files..."
bash ./scripts/generate-env.sh "${1:-.env}"

# ── Step 2: Install dependencies ─────────────────────────────────────────────
echo ""
echo "Installing dependencies..."
npm install

# ── Step 3: Prisma setup — iterate every package ─────────────────────────────
echo ""
echo "Running Prisma setup for packages..."

for pkg_dir in packages/*/; do
  pkg_dir="${pkg_dir%/}"  # strip trailing slash

  # Skip if no prisma.config.ts in the package root
  if [ ! -f "${pkg_dir}/prisma.config.ts" ]; then
    continue
  fi

  pkg_name=$(basename "$pkg_dir")
  echo ""
  echo "── ${pkg_name} ──"

  if [ -d "${pkg_dir}/prisma/migrations" ]; then
    echo "  Migrations folder found → running prisma migrate deploy"
    (cd "$pkg_dir" && npx prisma migrate deploy)
  else
    echo "  No migrations folder → running prisma db push"
    (cd "$pkg_dir" && npx prisma db push --accept-data-loss)
  fi

  echo "  Done."
done

echo ""
echo "Setup complete. You can now run: npm run dev"
