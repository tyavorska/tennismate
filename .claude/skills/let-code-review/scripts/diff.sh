#!/usr/bin/env bash
# Prints every uncommitted change, including untracked files that `git diff HEAD` leaves out.
set -uo pipefail
cd "$(git rev-parse --show-toplevel)" || exit 1

status=$(git status --porcelain)
if [ -z "$status" ]; then
  echo "NO CHANGES"
  exit 0
fi

echo "### git status"
echo "$status"
echo
echo "### git diff HEAD"
git diff HEAD
git ls-files --others --exclude-standard -z | while IFS= read -r -d '' file; do
  lines=$(wc -l < "$file" | tr -d ' ')
  if [ "$lines" -gt 1500 ]; then
    echo "### $file: new file, $lines lines, too long to inline. Read it if the review needs it."
  else
    git diff --no-index -- /dev/null "$file"
  fi
done
exit 0
