## Agent skills

### Issue tracker

Issues and specs are tracked as local Markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Triage uses the default canonical label vocabulary. See `docs/agents/triage-labels.md`.

### Domain docs

Domain documentation uses a single-context layout. See `docs/agents/domain.md`.

## Cursor Cloud specific instructions

Cloud Agents do not see laptop-global skills under `~/.cursor/skills`. This repo installs them on the VM via `.cursor/environment.json` → `.cursor/install-cloud-skills.sh` into `~/.cursor/skills/` (impeccable, gstack, Matt Pocock skills, Addy Osmani agent-skills).

First cloud boot after a skill-pack change can take several minutes (gstack build). Prefer saving a Cloud Agent environment snapshot from the [dashboard](https://cursor.com/dashboard/cloud-agents) so later runs reuse the checkpoint.
