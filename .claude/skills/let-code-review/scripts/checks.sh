#!/usr/bin/env bash
# Runs the pre-commit checks and prints only the result and the first failing lines of each.
set -uo pipefail
cd "$(git rev-parse --show-toplevel)" || exit 1

for check in lint typecheck format:check test; do
  output=$(npm run --silent "$check" 2>&1)
  if [ $? -eq 0 ]; then
    echo "$check: PASS"
  else
    echo "$check: FAIL"
    echo "$output" | grep -v '^\s*$' | head -n 30 | sed 's/^/    /'
  fi
done
exit 0
