<p align="center">
  <img src="../assets/brand/research-highlight-icon.svg" width="112" alt="Research Highlight icon" />
</p>

# Research Highlight AI

Research Highlight AI is the Zotero side of Research Highlight. It takes the highlights you already make while reading and adds a short summary plus Role, Topics, and Use metadata.

> **Status:** public beta. Current build: **v0.2.2**.

## What it does

Typical use is straightforward:

1. Highlight text in the Zotero Reader.
2. Let Auto annotate it, or right-click the highlight and run AI annotation manually.
3. The plugin writes an `[AI]` block into the annotation comment and adds `ai:*` tags.
4. ZotLit can then carry the updated annotation into Obsidian for searching and review.

Existing manual comments and translations are kept.

## Output format

Comment:

```text
[AI]
中文 summary

Role: limitation
Topics: CAR-T cells, solid tumors, tumor microenvironment
Use: discussion
```

Tags:

```text
ai:done
ai:role:limitation
ai:topic:CAR-T-cells
ai:topic:solid-tumors
ai:topic:tumor-microenvironment
ai:use:discussion
```

## Current features

- automatic annotation for newly created text highlights;
- Reader context-menu annotation and re-annotation;
- Reader context-menu switch for Auto annotate;
- batch annotation for papers, attachments, or annotations;
- preservation of existing manual comments and translations;
- structured JSON output validation;
- Topic Consolidator for duplicate or near-duplicate Topics;
- sequential batch processing with retry/backoff;
- editable provider, endpoint, API key, and model settings;
- GitHub Release based automatic updates.

## Model providers

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

Endpoint and Model are editable. Custom can point to another compatible gateway or a local service. API keys are stored in Zotero preferences and are not included in the repository.

The Groq path has been tested end to end. The other provider templates are already supported and will continue to be checked with real credentials.

## Topic Consolidator

Topic Consolidator is used when the Topic list starts to fragment into multiple names for nearly the same thing.

It is intentionally conservative about merging scientifically different concepts. The next improvement is to add a preview and confirmation step before changes are applied.

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

## Build and distribution

```bash
npm run check
npm run build
```

The GitHub Actions workflow builds the XPI, creates a GitHub Release, updates `updates.json`, and feeds Zotero's automatic update channel.

For Zotero 10, install the XPI from **Tools → Plugins**.

## Next

Current work is focused on provider testing, annotation reliability, safer Topic Consolidation, and setup quality.

See [`../docs/roadmap.md`](../docs/roadmap.md).
