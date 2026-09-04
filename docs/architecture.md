# Architecture

Research Highlight Toolkit packages an already validated Zotero-to-Obsidian research-highlight workflow into two custom plugins without replacing ZotLit.

## System overview

```text
Zotero highlight
    ↓
Research Highlight AI
    ↓
annotation comment + ai:* tags
    ↓
ZotLit Companion
    ↓
ZotLit live database
    ↓
Research Highlight Dashboard
    ↓
Reader / Sticky
```

The intended installed system is:

```text
Zotero
├─ ZotLit Companion
└─ Research Highlight AI

Obsidian
├─ ZotLit
└─ Research Highlight Dashboard
```

## Source of truth

**Zotero annotations are the source of truth.**

Research Highlight AI writes AI-derived metadata back to the Zotero annotation itself. ZotLit transports the resulting annotation state to its live database. Research Highlight Dashboard reads that live database and renders it.

The Obsidian plugin is a viewer, not a second annotation store. It must not create a competing `highlights.json`, custom SQLite database, or other shadow copy of the highlight corpus.

## Component boundaries

### 1. Research Highlight AI — Zotero plugin

Responsibilities:

- Observe newly created Zotero highlight annotations when auto-annotation is enabled.
- Skip annotations already carrying `ai:done`.
- Send highlight context to the configured AI provider.
- Preserve existing manual comments or translations.
- Append the human-readable `[AI]` block.
- Write the structured `ai:*` tags defined in `docs/data-contract.md`.
- Batch-annotate existing highlights from selected items, attachments, or annotations.
- Provide the manually invoked **Consolidate AI Topics** command.
- Store plugin settings for provider, API key, model, and auto-annotation.

Validated defaults and behavior to preserve during migration:

- Provider: Groq
- Model: `qwen/qwen3.8-27b`
- `reasoning_effort: "none"`
- Strict JSON response schema
- Batch delay: 1500 ms between requests
- Batch retries: up to 3 retries
- Retry backoff for HTTP 429 / 5xx: 5 s, 10 s, 20 s
- Topic discovery through Zotero Item APIs (`annotation.getTags()`), not SQL `LIKE` matching on tag text

The Zotero plugin must **not** contain ZotLit refresh logic and must not use `Zotero.launchURL` as part of the synchronization path.

### 2. ZotLit Companion — Zotero side

ZotLit Companion remains responsible for exposing Zotero data to ZotLit. The validated setup uses immutable read mode, watches for Zotero changes, and checkpoints the Zotero WAL as needed.

This project deliberately does not duplicate that synchronization layer.

### 3. ZotLit live database — transport/read model

ZotLit is the bridge between Zotero and Obsidian. The existing workflow has already demonstrated that the live database reflects:

- newly created highlights;
- deleted highlights;
- edited AI summaries;
- changed Role, Topic, and Use metadata.

Research Highlight Dashboard should consume this database directly rather than creating another persistence layer.

### 4. Research Highlight Dashboard — Obsidian plugin

The production plugin should use an Obsidian `ItemView` opened from a **Research Highlights** ribbon action.

At startup it should detect ZotLit through:

```js
const zotlit = this.app.plugins.plugins["zotlit"];
```

If ZotLit is missing or disabled, render a friendly in-view message instead of throwing an exception:

```text
Research Highlight Dashboard requires ZotLit.
Install or enable ZotLit, then reopen this view.
```

When ZotLit is available, the plugin should:

1. obtain `zotlit.services?.db`;
2. await `dbService.ready`;
3. read from `dbService.client`;
4. query `itemAnnotations` and materialize the prepared query with `.prepare().all()`;
5. subscribe to `dbService.on("changed", ...)`;
6. debounce rebuilds by approximately 500 ms;
7. render the Reader or Sticky view from the current live records.

The mature DataviewJS prototype already contains the core logic to migrate, including:

- `loadRecords()`
- `extractAISummary()`
- `getPaperTitle()`
- `buildZoteroLink()`
- `sortRecords()`
- `renderReader()`
- `renderSticky()`
- `toggleTopic()`

The principal migration is from `dv.container` to `this.containerEl` / `ItemView`. **Dataview is not a production dependency.**

## Dashboard UI contract

Both views share:

- search;
- Role filter;
- Use filter;
- Topic filter;
- Topic click-to-toggle behavior;
- automatic scroll to results after Topic filtering;
- sorting and ascending/descending direction;
- Zotero deep links;
- ZotLit live refresh;
- persisted view, sorting, and appearance preferences.

Appearance modes:

- **Auto** — follows Obsidian;
- **Eye** — warm low-glare mode;
- **Dark** — independent dark mode.

Reader is optimized for detailed reading and verification. Sticky is optimized for high-density scanning and idea discovery. Sticky should keep the established explicit column containers with round-robin assignment so visual order remains row-major rather than CSS-column order.

Responsive Sticky column targets:

- `>= 1120 px`: 4 columns
- `>= 560 px`: 3 columns
- `>= 360 px`: 2 columns
- narrower: 1 column

## Loose coupling through the data contract

The custom plugins do not call each other directly.

```text
Research Highlight AI
        ↓ produces
Zotero annotation comment + ai:* tags
        ↓ transported by
ZotLit
        ↓ consumed by
Research Highlight Dashboard
```

Any other producer that writes a compatible annotation comment and `ai:*` tag schema should remain usable with the Dashboard.

## Explicit non-goals

This repository does not aim to:

- reimplement ZotLit or ZotLit Companion;
- maintain a second highlights database;
- force ZotLit refreshes from the Zotero AI plugin;
- make Dataview a permanent dependency;
- tightly couple the Zotero and Obsidian plugins;
- rewrite the already working workflow before the plugin boundaries are stable.

## Development order

The recommended order is:

1. migrate the mature Dashboard prototype into the Obsidian `ItemView` plugin;
2. validate feature parity and ZotLit live refresh;
3. migrate the stable Actions & Tags workflow into the Zotero plugin;
4. package and test both plugins on a clean installation.

This order minimizes risk because the Dashboard implementation is already mature and the migration mostly changes its host environment rather than its behavior.
