#!/usr/bin/env bash
set -euo pipefail

printf '\n[pre-commit] Regenerating legal documents...\n'

dart run tool/generate_legal_docs.dart >/dev/null

if ! git diff --quiet --ignore-submodules --exit-code -- assets/legal docs/legal; then
  printf '\n[pre-commit] Detected legal document updates. Stage the regenerated files and retry.\n'
  git status --short -- assets/legal docs/legal || true
  exit 1
fi

untracked=$(git status --short --untracked-files=all -- assets/legal docs/legal | awk '$1 == "??"')
if [[ -n "${untracked}" ]]; then
  printf '\n[pre-commit] Found untracked generated files. Add them to the commit.\n'
  printf '%s\n' "${untracked}"
  exit 1
fi

printf '[pre-commit] Legal documents are current.\n\n'
