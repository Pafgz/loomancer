# Domain Docs

How engineering skills should consume this repository's domain documentation.

## Before exploring

Read:

- `CONTEXT.md` at the repository root when it exists
- ADRs under `docs/adr/` that affect the area being changed

Missing domain files are created lazily when domain terms or durable decisions are resolved.

## Layout

This is a single-context repository:

```text
/
├── CONTEXT.md
├── docs/adr/
└── src/
```

## Vocabulary

Use terms as defined in `CONTEXT.md`. If a required concept is absent, reconsider the wording or record the gap for domain modeling.

## ADR conflicts

Surface any conflict with an existing ADR explicitly rather than silently overriding it.
