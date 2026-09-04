# Research Highlight AI

Native Zotero 10 plugin that packages the validated Actions & Tags workflow into an installable plugin.

> Status: beta. Current test build: **v0.1.5**. Manual Batch AI Annotate, automatic annotation of newly created highlights, ZotLit/Dashboard propagation, GitHub Release based automatic updates, and Reader right-click single-highlight annotation are implemented.

## Current v0.1.5 scope

- Groq provider with user-supplied API key
- default model `qwen/qwen3.8-27b`
- `reasoning_effort: none`
- strict JSON schema output
- automatic annotation of newly created highlights through Zotero Notifier
- Reader context menu action for a single highlight
- Batch AI Annotate for selected regular items, attachments, or annotations
- 1500 ms sequential batch delay
- up to 3 retries for HTTP 429 / 5xx with 5 / 10 / 20 s backoff
- conservative manual Consolidate AI Topics
- canonical `[AI]` comment and `ai:*` tag contract
- preservation of existing manual / translation comments
- Zotero Item API topic discovery via `annotation.getTags()`
- GitHub Actions release automation and Zotero automatic updates through `updates.json`

Zotero remains the source of truth. This plugin does not call ZotLit refresh APIs and does not create a separate database.

## Reader single-highlight action

Right-click one text highlight inside the Zotero Reader:

```text
AI 标注此高亮
```

The command uses the same annotation pipeline and the same frozen prompt as Auto annotate and Batch AI Annotate.

If the selected highlight already has `ai:done`, the menu changes to:

```text
重新 AI 标注此高亮
```

Re-annotation replaces only the generated `[AI]` block and generated `ai:*` tags. Existing manual comments or translations remain preserved.

## Validated integration status

The following paths have been tested successfully in the real environment:

```text
New Zotero highlight
    ↓
Research Highlight AI automatic annotation
    ↓
Zotero annotation comment + ai:* tags
    ↓
ZotLit Companion
    ↓
ZotLit live database
    ↓
Research Highlight Dashboard
```

and:

```text
GitHub version bump
    ↓
GitHub Actions build/release
    ↓
updates.json
    ↓
Zotero update discovery
    ↓
plugin update installation
```

Validated behavior includes manual Batch annotation, automatic annotation, comment preservation, tag compatibility, ZotLit transport, Dashboard live refresh, and Zotero automatic update discovery/install.

## Frozen annotation prompt

The AI annotation prompt is treated as frozen compatibility behavior.

Do not rewrite, shorten, expand, translate, or otherwise optimize it during refactoring. In particular:

- annotation input is paper title + highlighted text;
- the annotation prompt specifies 1–3 topics;
- no paper abstract is added;
- Auto, Batch, and Reader single-highlight annotation all use the same prompt and data contract.

## Topic Consolidator

The Topic Consolidator is intentionally conservative. Its default is to keep Topics separate unless the merge is high-confidence and would not remove a useful independent retrieval entry. Related molecules, models, states, pathways, readouts, cell subsets, or therapeutic concepts are not merged merely because they occur in the same biological story.

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

Library item context menu:

- Batch AI Annotate Highlights

Zotero Reader annotation context menu:

- AI 标注此高亮
- 重新 AI 标注此高亮, when `ai:done` already exists

## Build

```bash
npm run check
npm run build
```

The build script uses only Python's standard library and writes:

```text
dist/research-highlight-ai-0.1.5.xpi
```

For Zotero 10, install the XPI from **Tools → Plugins**. Future versions are delivered through the validated GitHub Release based update channel.
