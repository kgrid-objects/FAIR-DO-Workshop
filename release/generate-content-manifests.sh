#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
revision="${1:-HEAD}"
out_dir="${2:-$repo_root/release/manifests}"
mkdir -p "$out_dir"

node -e 'const x=require(process.argv[1]); for (const o of x.objects) console.log(`${o.key}\t${o.exactObjectRoot}`)' "$repo_root/release/content-policy.json" |
while IFS=$'\t' read -r key object_root; do
  manifest="$out_dir/$key.files.sha256"
  git -C "$repo_root" ls-tree -r --name-only "$revision" -- "$object_root" |
  while IFS= read -r file_path; do
    digest="$(git -C "$repo_root" show "$revision:$file_path" | shasum -a 256 | awk '{print $1}')"
    relative_path="${file_path#"$object_root"/}"
    printf '%s  %s\n' "$digest" "$relative_path"
  done > "$manifest"
done
