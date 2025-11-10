#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:-vX.Y}"
REPO_ROOT="$(cd "$(dirname "$0")/../.."; pwd)"
STAMP="$(date +%Y%m%d_%H%M%S)"
OUT_DIR="$REPO_ROOT/backups"
mkdir -p "$OUT_DIR"

LABEL="STATE-LOCK_${STAMP}_${VERSION}"
ZIP_PATH="$OUT_DIR/$LABEL.zip"
MANIFEST_PATH="$OUT_DIR/$LABEL.manifest.json"

# includes
INCLUDES=(
  "apps" "services" "docs" "packages" "scripts"
  "package.json" "package-lock.json" ".gitignore" ".env" ".env.example" ".env.local"
)

# excludes
EXCLUDES=( "node_modules" "dist" ".vite" ".DS_Store" "backups" )

# collect files
FILES=()
for p in "${INCLUDES[@]}"; do
  if [[ -e "$REPO_ROOT/$p" ]]; then
    if [[ -d "$REPO_ROOT/$p" ]]; then
      while IFS= read -r -d '' f; do
        rel="${f#$REPO_ROOT/}"
        skip=0
        for ex in "${EXCLUDES[@]}"; do
          [[ "$rel" == *"$ex"* ]] && skip=1 && break
        done
        [[ $skip -eq 0 ]] && FILES+=("$rel")
      done < <(find "$REPO_ROOT/$p" -type f -print0)
    else
      FILES+=("$p")
    fi
  fi
done

# manifest (sha256 + size)
printf '[' > "$MANIFEST_PATH"
first=1
for rel in "${FILES[@]}"; do
  abs="$REPO_ROOT/$rel"
  size=$(stat -c%s "$abs" 2>/dev/null || stat -f%z "$abs")
  sha=$(sha256sum "$abs" 2>/dev/null | awk '{print $1}')
  if [[ -z "$sha" ]]; then sha=$(shasum -a 256 "$abs" | awk '{print $1}'); fi
  [[ $first -eq 0 ]] && printf ',' >> "$MANIFEST_PATH" || first=0
  printf '\n  {"path":"%s","bytes":%s,"sha256":"%s"}' "$rel" "$size" "$sha" >> "$MANIFEST_PATH"
done
printf '\n]\n' >> "$MANIFEST_PATH"

# zip
rm -f "$ZIP_PATH"
(
  cd "$REPO_ROOT"
  zip -q -r "$ZIP_PATH" "${FILES[@]}" -x "*/node_modules/*" "*/dist/*" "*/.vite/*" "backups/*"
  cd "$(dirname "$MANIFEST_PATH")"
  zip -q -u "$ZIP_PATH" "$(basename "$MANIFEST_PATH")"
)

echo "STATE-LOCK created:"
echo " - $ZIP_PATH"
echo " - $MANIFEST_PATH"
