#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
out_dir="${1:-$repo_root/release/dist}"
mkdir -p "$out_dir"

pdf="$repo_root/collection/HBOT-Regimen-Burden-KO/specs/1E41C3D7-66F4-C168-3A91-D951BE77CBAF.pdf"
if [[ -e "$pdf" && "${ALLOW_UNCLEARED_THIRD_PARTY_PDF:-}" != "rights-confirmed" ]]; then
  echo "BLOCKED: third-party PDF redistribution rights are not documented." >&2
  echo "Remove the PDF from the release commit, or set ALLOW_UNCLEARED_THIRD_PARTY_PDF=rights-confirmed only after documenting permission." >&2
  exit 2
fi

node -e 'const x=require(process.argv[1]); for (const o of x.objects) console.log(`${o.key}\t${o.path}`)' "$repo_root/release/objects.json" |
while IFS=$'\t' read -r key object_path; do
  tmp_tar="$out_dir/$key-v1.0.0.tar"
  object_tree="$(git -C "$repo_root" rev-parse "HEAD:$object_path")"
  if [[ "$(git -C "$repo_root" cat-file -t "$object_tree")" != "tree" ]]; then
    echo "BLOCKED: $object_path does not resolve to a Git tree at HEAD." >&2
    exit 2
  fi
  # A bare tree archive uses the build time in tar headers, while HEAD:<path>
  # embeds the containing commit ID. Anchor the tree to a deterministic
  # synthetic commit so both the embedded commit ID and tar times are stable.
  object_commit="$(
    printf '%s\n' 'Deterministic release archive' |
      env \
        GIT_AUTHOR_NAME='FAIR-DO release tooling' \
        GIT_AUTHOR_EMAIL='kgrid-developers@umich.edu' \
        GIT_AUTHOR_DATE='2000-01-01T00:00:00Z' \
        GIT_COMMITTER_NAME='FAIR-DO release tooling' \
        GIT_COMMITTER_EMAIL='kgrid-developers@umich.edu' \
        GIT_COMMITTER_DATE='2000-01-01T00:00:00Z' \
        git -C "$repo_root" commit-tree "$object_tree"
  )"
  git -C "$repo_root" archive --format=tar --prefix="$key-v1.0.0/" "$object_commit" > "$tmp_tar"
  gzip -n -9 -f "$tmp_tar"
done

cd "$out_dir"
shasum -a 256 ./*.tar.gz > SHA256SUMS
wc -c ./*.tar.gz > BYTE-SIZES.txt
