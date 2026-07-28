#!/usr/bin/env bash
# Install agent skill packs into the Cloud Agent VM home directory.
# Idempotent — safe to re-run on every environment update.
set -euo pipefail

SKILLS_DIR="${HOME}/.cursor/skills"
PACKS_DIR="${HOME}/.cursor/skill-packs"
REPO_SKILLS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/skills"

mkdir -p "${SKILLS_DIR}" "${PACKS_DIR}"

log() { printf 'cloud-skills: %s\n' "$*"; }

ensure_bun() {
  export PATH="${HOME}/.bun/bin:${PATH}"
  if command -v bun >/dev/null 2>&1; then
    return 0
  fi
  log "installing bun"
  curl -fsSL https://bun.sh/install | bash
  export PATH="${HOME}/.bun/bin:${PATH}"
  command -v bun >/dev/null 2>&1 || {
    echo "cloud-skills: bun install failed" >&2
    exit 1
  }
}

clone_or_update() {
  local url="$1"
  local dest="$2"
  if [[ -d "${dest}/.git" ]]; then
    log "updating $(basename "${dest}")"
    git -C "${dest}" fetch --depth 1 origin
    local branch
    branch="$(git -C "${dest}" rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)"
    git -C "${dest}" reset --hard "origin/${branch}" 2>/dev/null \
      || git -C "${dest}" reset --hard origin/main 2>/dev/null \
      || git -C "${dest}" reset --hard origin/master
  else
    log "cloning $(basename "${dest}")"
    rm -rf "${dest}"
    git clone --single-branch --depth 1 "${url}" "${dest}"
  fi
}

# Link every directory that contains SKILL.md into ~/.cursor/skills/<name>.
# Nested category folders (e.g. engineering/grill-me) are flattened by skill folder name.
link_skill_tree() {
  local source_root="$1"
  local prefix="${2:-}"
  while IFS= read -r -d '' skill_md; do
    local skill_dir skill_name dest
    skill_dir="$(dirname "${skill_md}")"
    skill_name="$(basename "${skill_dir}")"
    dest="${SKILLS_DIR}/${prefix}${skill_name}"
    rm -rf "${dest}"
    ln -sfn "${skill_dir}" "${dest}"
  done < <(find "${source_root}" -type f -name SKILL.md -print0)
}

# Project-vendored skills are the source of truth for Cloud Agents.
install_repo_skills() {
  if [[ ! -d "${REPO_SKILLS_DIR}" ]]; then
    echo "cloud-skills: repo skills missing at ${REPO_SKILLS_DIR}" >&2
    exit 1
  fi
  link_skill_tree "${REPO_SKILLS_DIR}"
  log "repo .cursor/skills linked from ${REPO_SKILLS_DIR}"
}

install_gstack() {
  local dest="${PACKS_DIR}/gstack"
  clone_or_update "https://github.com/garrytan/gstack.git" "${dest}"
  ensure_bun
  log "building gstack (browse binary + skill docs)"
  (
    cd "${dest}"
    # Non-interactive. Sibling Claude links land under skill-packs/ and are ignored;
    # Cursor discovers nested SKILL.md files via the whole-repo link below.
    ./setup --no-prefix --no-team --no-plan-tune-hooks -q
  )
  # Whole-repo link matches local Cursor layout (skills + browse binaries).
  rm -rf "${SKILLS_DIR}/gstack"
  ln -sfn "${dest}" "${SKILLS_DIR}/gstack"
  log "gstack linked"
}

main() {
  log "installing into ${SKILLS_DIR}"
  install_repo_skills
  if [[ "${CLOUD_SKILLS_SKIP_GSTACK:-0}" == "1" ]]; then
    log "skipping gstack (CLOUD_SKILLS_SKIP_GSTACK=1)"
  else
    install_gstack
  fi
  log "done ($(find "${SKILLS_DIR}" -mindepth 1 -maxdepth 1 | wc -l | tr -d ' ') entries in ${SKILLS_DIR})"
}

main "$@"
