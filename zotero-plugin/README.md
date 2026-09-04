# Research Highlight AI

Native Zotero 10 plugin that packages the validated Actions & Tags workflow into an installable plugin.

> Status: beta. Current build: **v0.2.0**. Manual Batch AI Annotate, automatic annotation of newly created highlights, ZotLit/Dashboard propagation, GitHub Release based automatic updates, Reader right-click single-highlight annotation, and configurable model providers are implemented.

## Current v0.2.0 scope

- provider templates for Groq, OpenAI, and OpenRouter
- editable API Endpoint, API Key, and Model fields
- Custom OpenAI-compatible Chat Completions endpoint support
- no preset Anthropic provider
- Groq default model `qwen/qwen3.8-27b`
- OpenAI template model `gpt-4.1-mini`
- OpenRouter template model `openai/gpt-oss-20b`
- strict JSON Schema structured output contract
- automatic annotation of newly created highlights through Zotero Notifier
- Reader context menu action for a single highlight
- Reader context menu switch for Auto annotate
- Batch AI Annotate for selected regular items, attachments, or annotations
- 1500 ms sequential batch delay
- up to 3 retries for HTTP 429 / 5xx with 5 / 10 / 20 s backoff
- manual Consolidate AI Topics with an 800-token output budget
- canonical `[AI]` comment and `ai:*` tag contract
- preservation of existing manual / translation comments
- Zotero Item API topic discovery via `annotation.getTags()`
- GitHub Actions release automation and Zotero automatic updates through `updates.json`

Zotero remains the source of truth. This plugin does not call ZotLit refresh APIs and does not create a separate database.

## Provider templates

The Settings pane provides these presets:

```text
Groq
  Endpoint: https://api.groq.com/openai/v1/chat/completions
  Model: qwen/qwen3.8-27b

OpenAI
  Endpoint: https://api.openai.com/v1/chat/completions
  Model: gpt-4.1-mini

OpenRouter
  Endpoint: https://openrouter.ai/api/v1/chat/completions
  Model: openai/gpt-oss-20b

Custom (OpenAI-compatible)
  Endpoint: user supplied
  Model: user supplied
```

Selecting a preset fills its endpoint and suggested model. Endpoint and Model remain editable. Custom is intended for OpenAI Chat Completions-compatible services that support JSON Schema Structured Outputs. A Custom endpoint may leave API Key blank when the local or private service does not require authentication.

The plugin intentionally does not ship an Anthropic provider preset. Users may still choose any model exposed through a compatible router or custom endpoint if they configure it themselves.

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

The same Reader context menu also exposes:

```text
开启自动标注新建高亮
关闭自动标注新建高亮
```

These Reader actions execute without blocking confirmation popups.

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

The original Groq path has been validated end-to-end. Additional provider templates should be treated as newly added v0.2.0 paths until tested with real credentials.

## Frozen annotation prompt

The AI annotation prompt is treated as frozen compatibility behavior.

Do not rewrite, shorten, expand, translate, or otherwise optimize it during refactoring. In particular:

- annotation input is paper title + highlighted text;
- the annotation prompt specifies 1–3 topics;
- no paper abstract is added;
- Auto, Batch, and Reader single-highlight annotation all use the same prompt and data contract.

## Topic Consolidator

The Topic Consolidator uses a retrieval-oriented middle-ground policy: it actively removes near-duplicate naming fragments while preserving useful distinctions between different molecules, cell states, models, mechanisms, readouts, diseases, therapies, and engineered constructs.

Its output is capped at 800 tokens to stay below the validated Groq on-demand OTPM ceiling encountered during testing.

## Settings

```text
Provider: Groq / OpenAI / OpenRouter / Custom
API Endpoint: editable
API Key: editable
Model: editable
Auto annotate new highlights: on/off
```

The API key is stored locally in Zotero preferences and is never included in this repository. Provider-specific environment variables are accepted as fallbacks for Groq (`GROQ_API_KEY`), OpenAI (`OPENAI_API_KEY`), and OpenRouter (`OPENROUTER_API_KEY`).

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
- 开启/关闭自动标注新建高亮

## Build

```bash
npm run check
npm run build
```

The build script uses only Python's standard library and writes:

```text
dist/research-highlight-ai-0.2.0.xpi
```

For Zotero 10, install the XPI from **Tools → Plugins**. Future versions are delivered through the validated GitHub Release based update channel.
