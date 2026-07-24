# 06 — Manage local projects and offline resilience

**What to build:** A Knitter can rename, duplicate, and delete local Pattern Projects, understand storage/private-mode risks, recover from quota failures without losing the in-memory chart, and reopen projects after the cached app shell loads offline.

**Blocked by:** 05 — Export PDF and PNG chart packages

**Status:** ready-for-agent

- [ ] Project library supports rename, duplicate, and delete
- [ ] Yarn Inventory remains available across projects on the same device
- [ ] QuotaExceededError and private-mode/storage-loss cases show actionable warnings
- [ ] A failed save does not destroy the previous complete project or current in-memory chart
- [ ] Offline reload of the app shell still opens previously saved local projects
- [ ] Browser journey from create through export and reopen passes on phone, tablet, and desktop viewports
