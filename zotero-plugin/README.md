<p align="center">
  <img src="../assets/brand/research-highlight-icon.svg" width="112" alt="Research Highlight icon" />
</p>

# Research Highlight AI

**The capture and enrichment layer for Research Highlight.**

Research Highlight AI turns Zotero highlights into structured research objects that are easier to recover and reuse across papers. It adds concise summaries plus Role, Topics, and Use metadata while preserving Zotero as the source of truth.

> **Status:** public beta. Current build: **v0.2.1**.

## Product role

Research Highlight AI is the Zotero client of the broader **Research Highlight** product.

```text
Highlight in Zotero
    ↓
Research Highlight AI
    ↓
summary + role + topics + use
    ↓
Zotero annotation comment + ai:* tags
    ↓
ZotLit transport
    ↓
Research Highlight Dashboard
```

The plugin does not create a parallel highlight database and does not call ZotLit refresh APIs.

## Core experience

Research Highlight AI is designed to stay close to normal reading behavior:

- create a highlight and let Auto annotate process it;
- right-click a highlight for single-item AI annotation or re-annotation;
- batch-process a selected paper, attachment, or annotation set;
- consolidate near-duplicate Topics when the vocabulary grows.

Existing manual comments and translations are preserved.

## Structured research metadata

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

This contract is intentionally human-readable and portable.

## Model providers

Research Highlight AI is provider-flexible rather than tied to a single model vendor.

Current templates:

```text
Groq
  Endpoint: https://api.groq.com/openai/v1/chat/completions
  Suggested model: qwen/qwen3.8-27b

OpenAI
  Endpoint: https://api.openai.com/v1/chat/completions
  Suggested model: gpt-4.1-mini

OpenRouter
  Endpoint: https://openrouter.ai/api/v1/chat/completions
  Suggested model: openai/gpt-oss-20b

Custom OpenAI-compatible
  Endpoint: user supplied
  Model: user supplied
```

Endpoint and Model remain editable. Custom endpoints can be used for compatible gateways or local services. The plugin intentionally does not ship an Anthropic preset.

API credentials are stored locally in Zotero preferences and are never included in this repository.

## Current capabilities

- automatic annotation of newly created text highlights;
- Reader context-menu annotation and re-annotation;
- Reader context-menu switch for Auto annotate;
- Batch AI Annotate for regular items, attachments, or annotations;
- structured JSON output validation;
- preservation of manual comments and translations;
- retrieval-oriented Topic Consolidator;
- sequential batch processing with retry/backoff;
- editable provider, endpoint, API key, and model settings;
- shared Research Highlight product icon packaged in the XPI;
- GitHub Release based automatic updates.

The original Groq path has been validated end-to-end in the real Zotero → ZotLit → Obsidian workflow. Additional provider templates are beta paths until individually validated with production credentials.

## Annotation behavior

Auto, Batch, and Reader single-highlight annotation share the same production annotation logic and data contract.

The current production annotation prompt is treated as compatibility-sensitive behavior. Refactoring should not silently rewrite it or add extra paper context such as the abstract.

## Topic Consolidator

The Topic Consolidator is designed to reduce vocabulary fragmentation without flattening scientifically useful distinctions.

It can consolidate near-duplicate naming variants while preserving meaningful differences between molecules, cell states, models, mechanisms, readouts, diseases, therapies, and engineered constructs.

## Shared brand

Research Highlight AI uses the same product identity as Research Highlight Dashboard for Obsidian.

Canonical brand asset:

`../assets/brand/research-highlight-icon.svg`

The same vector mark is also packaged as `zotero-plugin/icon.svg`.

Brand guidance: [`../docs/brand.md`](../docs/brand.md).

## Menus

Tools menu:

- Batch AI Annotate Highlights
- Consolidate AI Topics

Library item context menu:

- Batch AI Annotate Highlights

Zotero Reader annotation context menu:

- AI 标注此高亮
- 重新 AI 标注此高亮
- 开启 / 关闭自动标注新建高亮

Reader actions run without blocking success popups.

## Build and distribution

```bash
npm run check
npm run build
```

The GitHub Actions release pipeline builds the XPI, creates a tagged GitHub Release, updates `updates.json`, and feeds Zotero's automatic update channel.

For Zotero 10, install the XPI from **Tools → Plugins**.

## Product direction

Research Highlight AI is not positioned as a one-off personal automation. It is one part of a broader research knowledge product focused on structured retrieval, local-first control, provider choice, and a smoother literature workflow.

The current priority is reliability and usability for researchers. Broader collaboration or commercial directions may be explored later, but they are not part of the current product promise.

See [`../docs/product.md`](../docs/product.md) for the current product principles and direction.
