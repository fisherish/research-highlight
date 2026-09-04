# Research Highlight AI

Native Zotero 10 plugin that packages the validated Actions & Tags workflow into an installable plugin.

> Status: early development. Current test build: **v0.1.3**. Manual Batch AI Annotate has been validated end-to-end in the real Zotero 10 + ZotLit + Obsidian environment. Auto annotation is being re-tested after the v0.1.3 preference fix.

## Current v0.1.3 scope

- Groq provider with user-supplied API key
- default model `qwen/qwen3.8-27b`
- `reasoning_effort: none`
- strict JSON schema output
- automatic annotation of newly created highlights through Zotero Notifier
- Batch AI Annotate for selected regular items, attachments, or annotations
- 1500 ms sequential batch delay
- up to 3 retries for HTTP 429 / 5xx with 5 / 10 / 20 s backoff
- manual Consolidate AI Topics
- canonical `[AI]` comment and `ai:*` tag contract
- preservation of existing manual / translation comments
- Zotero Item API topic discovery via `annotation.getTags()`

Zotero remains the source of truth. This plugin does not call ZotLit refresh APIs and does not create a separate database.

## Validated integration status

The following manual Batch path has been tested successfully in the real environment:

```text
Research Highlight AI
    ↓
Zotero annotation comment + ai:* tags
    ↓
ZotLit Companion
    ↓
ZotLit live database
    ↓
Research Highlight Dashboard
```

Validated behavior:

- Groq request succeeds;
- Chinese summary is generated normally;
- existing manual comment / translation content is preserved;
- `ai:done`, `ai:role:*`, `ai:topic:*`, and `ai:use:*` remain compatible with the original schema;
- ZotLit transports the saved changes without custom refresh logic;
- Research Highlight Dashboard updates automatically from the live DB.

## v0.1.3 auto-annotation fix

The v0.1.2 auto-annotation toggle appeared enabled in the preference pane but the runtime read the wrong preference branch. Plugin preferences are stored with full keys such as:

```text
extensions.researchHighlightAI.autoAnnotate
```

Zotero's `Zotero.Prefs.get()` prefixes non-global keys with `extensions.zotero.`. v0.1.3 therefore reads plugin preferences with `global=true`:

```js
Zotero.Prefs.get(key, true)
```

This applies to Auto annotate, API Key, and Model preference reads. The environment variable `GROQ_API_KEY` remains only as a migration fallback.

## Topic-generation adjustment

The migration handoff did not preserve the exact historical Actions & Tags prompt byte-for-byte. The reconstructed prompt allowed 1–5 topics, and v0.1.2 could therefore generate five topics for a short highlight.

v0.1.3 intentionally tightens this behavior:

- 1–3 topics maximum;
- use the smallest sufficient number;
- usually 1–2 topics;
- use 3 only when the highlight has three clearly independent retrieval axes.

The strict JSON schema is also capped at `maxItems: 3`.

Before a stable release, the prompt should be compared against the user's still-installed historical Actions & Tags script so any remaining prompt differences can be frozen deliberately rather than guessed.

## Installation fix retained from v0.1.2

The v0.1.0 and v0.1.1 XPIs were rejected before plugin startup because `applications.zotero.update_url` was missing from `manifest.json`. Zotero reported the generic “may be incompatible” installation error. The current build retains the update URL and the Zotero 10 compatibility range `10.0` through `10.0.*`.

## Safety during migration from Actions & Tags

`Auto annotate new highlights` defaults to **off**.

Keep it off while the old Actions & Tags `Create Annotation` action is still active. Otherwise both automations may start an API request for the same newly created highlight before either one has written `ai:done`.

Recommended migration test:

1. install the plugin;
2. enter the Groq API key in Zotero Settings → Research Highlight AI;
3. leave Auto annotate off;
4. test **Batch AI Annotate Highlights** on one known highlight that does not have `ai:done`;
5. compare the generated comment and tags with the old Actions & Tags output;
6. disable the old Actions & Tags auto action;
7. enable Auto annotate in Research Highlight AI;
8. close the settings pane and create a new highlight;
9. verify the same output schema and ZotLit/Dashboard live update.

Steps 1 through 5 have been validated successfully in the real environment.

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
dist/research-highlight-ai-0.1.3.xpi
```

For Zotero 10, install the XPI from **Tools → Plugins**.
