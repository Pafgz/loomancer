# Issue tracker: Local Markdown

Issues and specs (also called PRDs) for this repo live as Markdown files in `.scratch/`.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`
- The spec is `.scratch/<feature-slug>/spec.md`
- Implementation issues are one file per ticket at `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`
- Triage state is recorded as a `Status:` line near the top of each issue
- Comments and conversation history append under a `## Comments` heading

## Publishing and fetching

- To publish an issue or spec, create the corresponding file under `.scratch/<feature-slug>/`.
- To fetch a ticket, read the referenced file or issue number from that feature directory.

## Wayfinding operations

- **Map:** `.scratch/<effort>/map.md`
- **Child ticket:** `.scratch/<effort>/issues/NN-<slug>.md`
- **Type:** a `Type:` line records `research`, `prototype`, `grilling`, or `task`
- **Status:** a `Status:` line records `open`, `claimed`, or `resolved`
- **Blocking:** a `Blocked by: NN, NN` line lists dependencies; a ticket is unblocked when each dependency is resolved
- **Frontier:** open, unblocked, unclaimed tickets ordered by number
- **Claim:** set `Status: claimed` before starting work
- **Resolve:** append the answer under `## Answer`, set `Status: resolved`, and add a linked gist to the map's `Decisions so far`
