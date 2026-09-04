# Research Highlight Toolkit

Research Highlight Toolkit packages a working research-reading workflow into two installable plugins: one for Zotero and one for Obsidian.

The goal is simple: turn Zotero highlights into AI-annotated, searchable research notes while keeping **Zotero as the source of truth** and reusing ZotLit for synchronization.

> **Status:** early development. Research Highlight Dashboard v0.1.3 has been validated in the real Obsidian + ZotLit environment. Research Highlight AI v0.1.3 installs successfully in Zotero 10; manual Batch AI Annotate, automatic annotation of newly created highlights, ZotLit/Dashboard propagation, and GitHub Release based automatic plugin updates have all been validated in the real environment.

## What problem does this solve?

A literature highlight is most useful when it can be found again by meaning rather than only by paper or page.

The workflow adds a concise Chinese AI summary plus structured Role, Topic, and Use metadata to each Zotero highlight, then exposes those annotations in an Obsidian Dashboard designed for both focused reading and high-density scanning.

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

Current v0.1.3 test build includes:

- automatic annotation of newly created highlight annotations through Zotero Notifier;
- paper title + highlighted text as AI input;
- Groq with default model `qwen/qwen3.8-27b`;
- `reasoning_effort: none` and strict JSON schema output;
- preservation of existing manual comments or translations;
- canonical `[AI]` comment block and `ai:*` tags;
- Batch AI Annotate for selected items, attachments, or annotations;
- sequential batch processing with retry/backoff;
- manually invoked Consolidate AI Topics;
- settings for API key, model, and automatic annotation;
- GitHub Actions release automation and Zotero automatic updates through `updates.json`.

The production AI annotation prompt and Topic Consolidator prompt are treated as frozen compatibility behavior and must not be rewritten during refactoring.

The development build defaults **Auto annotate new highlights** to off so it can be tested safely while the old Actions & Tags automation is still installed.

Validated in the real workflow:

- manual Batch annotation;
- automatic annotation of newly created highlights;
- Groq output and comment preservation;
- exact tag compatibility;
- ZotLit transport;
- automatic Dashboard refresh;
- GitHub Release based Zotero plugin update discovery and installation.

See [`zotero-plugin/README.md`](zotero-plugin/README.md).

### Research Highlight Dashboard — Obsidian plugin

Current validated v0.1.3 includes:

- native Obsidian `ItemView`;
- **Research Highlights** ribbon and command-palette entry;
- graceful ZotLit dependency handling;
- direct ZotLit live `itemAnnotations` reads with `.prepare().all()`;
- Reader and Sticky views;
- Search, Role, Use, and Topic filtering;
- sorting and ascending / descending direction;
- Zotero annotation deep links;
- ZotLit live refresh;
- persisted view, sorting, direction, and appearance preferences;
- responsive Sticky columns;
- Auto, Eye, and Dark appearance modes.

Dataview is no longer a production dependency.

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
│  ├─ src/
│  ├─ locale/
│  ├─ scripts/
│  ├─ manifest.json
│  ├─ bootstrap.js
│  ├─ prefs.js
│  ├─ prefs.xhtml
│  ├─ prefs.css
│  ├─ package.json
│  └─ README.md
├─ obsidian-plugin/
│  ├─ src/
│  ├─ main.js
│  ├─ manifest.json
│  ├─ package.json
│  ├─ styles.css
│  └─ README.md
├─ docs/
│  ├─ architecture.md
│  ├─ data-contract.md
│  └─ installation.md
├─ README.md
└─ .gitignore
```

## Current development sequence

1. ✅ Migrate Final v6 Dashboard into a native Obsidian plugin.
2. ✅ Validate Dashboard behavior in the real ZotLit environment.
3. ✅ Package the validated Actions & Tags behavior into Research Highlight AI.
4. ✅ Validate manual Batch AI Annotate end-to-end in the real Zotero 10 environment.
5. ✅ Validate automatic annotation of newly created highlights.
6. ✅ Validate GitHub Release based Zotero automatic updates.
7. **Next:** validate selected-item / attachment batch collection and the manual Topic Consolidator.
8. After parity is confirmed, clean up packaging and prepare stable releases.
9. Finally validate the four-plugin workflow on a clean installation.

## Installation

The target installation and current validated prototype environment are documented in [`docs/installation.md`](docs/installation.md).

## License

A repository license has not been selected yet. Add `LICENSE` once the intended distribution license is decided.
