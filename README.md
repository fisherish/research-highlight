# Research Highlight Toolkit

Research Highlight Toolkit packages a working research-reading workflow into two installable plugins: one for Zotero and one for Obsidian.

The goal is simple: turn Zotero highlights into AI-annotated, searchable research notes while keeping **Zotero as the source of truth** and reusing ZotLit for synchronization.

> **Status:** early development. The underlying workflow is already validated in daily use, but the two custom plugins are not yet packaged as releases.

## What problem does this solve?

A literature highlight is most useful when it can be found again by meaning rather than only by paper or page.

The current workflow adds a concise Chinese AI summary plus structured Role, Topic, and Use metadata to each Zotero highlight, then exposes those annotations in an Obsidian Dashboard designed for both focused reading and high-density scanning.

The project is converting that proven prototype into a clean four-plugin installation.

## Final workflow

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

Final installed components:

```text
Zotero
├─ ZotLit Companion
└─ Research Highlight AI

Obsidian
├─ ZotLit
└─ Research Highlight Dashboard
```

**ZotLit and ZotLit Companion are prerequisites.** This repository deliberately does not reimplement their synchronization layer.

There is no project-specific `highlights.json`, no custom highlight SQLite database, and no ZotLit refresh logic inside the AI plugin.

## Components

### Research Highlight AI — Zotero plugin

Planned responsibilities:

- automatically annotate new highlight annotations;
- preserve existing manual comments or translations;
- append a human-readable `[AI]` block;
- write `ai:done`, `ai:role:*`, `ai:topic:*`, and `ai:use:*` tags;
- batch-annotate historical highlights;
- manually consolidate low-value duplicate / synonymous Topic labels;
- expose settings for Groq API key, model, and automatic annotation.

Validated model default:

```text
qwen/qwen3.8-27b
```

See [`zotero-plugin/README.md`](zotero-plugin/README.md).

### Research Highlight Dashboard — Obsidian plugin

Planned responsibilities:

- use an Obsidian `ItemView` opened from a **Research Highlights** ribbon action;
- detect ZotLit and fail gracefully when it is unavailable;
- read ZotLit's live `itemAnnotations` data directly;
- preserve the mature Reader and Sticky views;
- provide Search, Role, Use, and Topic filtering;
- provide sorting and ascending / descending direction;
- open the original Zotero annotation through a deep link;
- refresh from ZotLit database change events;
- persist view, sorting, and appearance preferences.

Dataview is only the host of the current working prototype and is **not** intended to be a production dependency.

See [`obsidian-plugin/README.md`](obsidian-plugin/README.md).

## Data contract

The two custom plugins do not call each other directly. They communicate through Zotero annotation state transported by ZotLit.

Canonical comment block:

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

This loose coupling means another producer can feed the Dashboard as long as it emits the same compatible schema.

See [`docs/data-contract.md`](docs/data-contract.md).

## Architecture principles

1. **Zotero is the source of truth.**
2. **ZotLit owns synchronization and the live read model.**
3. **Research Highlight AI produces annotation metadata.**
4. **Research Highlight Dashboard consumes that metadata.**
5. **No competing highlight store is introduced.**
6. **The two custom plugins remain coupled only through the data contract.**

See [`docs/architecture.md`](docs/architecture.md).

## Repository layout

```text
research-highlight-toolkit/
├─ zotero-plugin/
│  └─ README.md
├─ obsidian-plugin/
│  └─ README.md
├─ docs/
│  ├─ architecture.md
│  ├─ data-contract.md
│  └─ installation.md
├─ README.md
└─ .gitignore
```

Implementation scaffolding (`src/`, manifests, package files, styles) will be added when each plugin migration begins rather than creating unused boilerplate up front.

## Development order

The recommended sequence is:

1. migrate the mature Final v6 Dashboard prototype into a native Obsidian `ItemView`;
2. verify feature parity and ZotLit live updates;
3. migrate the validated Zotero Actions & Tags automation into Research Highlight AI;
4. package both plugins for manual installation;
5. validate a clean install on another machine.

The Obsidian plugin comes first because its working source is already mature and the migration surface is comparatively small.

## Installation

The target installation and current validated prototype environment are documented in [`docs/installation.md`](docs/installation.md).

## License

A repository license has not been selected yet. Add `LICENSE` once the intended distribution license is decided.
