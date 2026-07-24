# Local-first Pattern Project architecture

Knit-Pro's first release keeps Pattern Projects, source photos, Colorwork Charts, and Yarn Inventory entirely on the knitter's device. A worker-based image-to-chart engine and IndexedDB repository are enough for the focused image-to-pattern loop, so the MVP deliberately avoids accounts, sync, and server-side image processing.

## Status

accepted

## Considered Options

- Local-first browser/PWA with IndexedDB and a worker pipeline
- Backend-hosted processing with synced projects
- Native mobile app first

## Consequences

- Privacy can be verified: photos and charts never leave the device for the MVP.
- Share, save-as, HEIC decode, and installability must be capability-detected enhancements.
- Later sync or accounts will need an explicit migration and a new ADR.
