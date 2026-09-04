# Research Highlight AI

Native Zotero 10 plugin that packages the already validated Actions & Tags workflow into an installable plugin.

> Status: early development. Current test build: **v0.1.0**.

## Current v0.1.0 scope

- Groq provider with user-supplied API key
- default model `qwen/qwen3.8-27b`
- `reasoning_effort: none`
- strict JSON schema output
- automatic annotation of newly created highlights through Zotero Notifier
- Batch AI Annotate for selected regular items, attachments, or annotations
- 1500 ms sequential batch delay
- up to 3 retries for HTTP 429 / 5xx with 5 / 10 / 20 s backoff
- manual Consolidate AI Topics
- exact `[AI]` comment and `ai:*` tag contract
- preservation of existing manual / translation comments
- Zotero Item API topic discovery via `annotation.getTags()`

Zotero remains the source of truth. This plugin does not call ZotLit refresh APIs and does not create a separate database.

## Safety during migration from Actions & Tags

`Auto annotate new highlights` defaults to **off** in v0.1.0.

Keep it off while the old Actions & Tags `Create Annotation` action is still active. Otherwise both automations may start an API request for the same newly created highlight before either one has written `ai:done`.

Recommended migration test:

1. install the plugin;
2. enter the Groq API key in Zotero Settings → Research Highlight AI;
3. leave Auto annotate off;
4. test **Batch AI Annotate Highlights** on one known highlight that does not have `ai:done`;
5. compare the generated comment and tags with the old Actions & Tags output;
6. disable the old Actions & Tags auto action;
7. enable Auto annotate in Research Highlight AI;
8. create a new highlight and verify the same output schema.

## Settings

```text
Provider: Groq
API Key: user supplied
Model: qwen/qwen3.8-27b
Auto annotate new highlights: on/off
```

The API key is stored locally in Zotero preferences. If the preference is empty, `GROQ_API_KEY` is accepted as a migration fallback. No API key is included in this repository.

## Data contract

Canonical comment:

```text
[AI]
中文 summary

Role: limitation
Topics: CAR-T cells, solid tumors, tumor microenvironment
Use: discussion
```

Canonical tags:

```text
ai:done
ai:role:limitation
ai:topic:CAR-T-cells
ai:topic:solid-tumors
ai:topic:tumor-microenvironment
ai:use:discussion
```

See `../docs/data-contract.md` for compatibility rules.

## Menus

Tools menu:

- Batch AI Annotate Highlights
- Consolidate AI Topics

The library item context menu also exposes Batch AI Annotate Highlights.

## Build

```bash
npm run check
npm run build
```

The build script uses only Python's standard library and writes:

```text
dist/research-highlight-ai-0.1.0.xpi
```

For Zotero 10, install the XPI from **Tools → Plugins**.
