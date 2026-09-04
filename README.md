# Research Highlight Toolkit

A two-plugin workflow for turning Zotero highlights into an AI-annotated, searchable research dashboard in Obsidian.

## Architecture

```text
Zotero highlight
    ↓
Research Highlight AI (Zotero plugin)
    ↓
AI summary + ai:* tags written back to the annotation
    ↓
ZotLit Companion
    ↓
ZotLit live database
    ↓
Research Highlight Dashboard (Obsidian plugin)
    ↓
Reader / Sticky views, search, filters, sorting, appearance modes
```

## Components

### 1. Zotero plugin: Research Highlight AI

Responsibilities:
- Automatically annotate newly created highlights with AI
- Generate a concise Chinese summary
- Generate `Role`, `Topics`, and `Use`
- Write the results back to Zotero annotation comments and tags
- Batch-annotate existing highlights
- Consolidate topic vocabulary for retrieval
- Provide settings for API key, model, and auto-annotation

Dependency:
- ZotLit Companion

### 2. Obsidian plugin: Research Highlight Dashboard

Responsibilities:
- Read ZotLit live data directly
- Display Reader and Sticky views
- Search highlights, papers, and topics
- Filter by Role, Use, and Topic
- Sort by time, title, Role, or Use, ascending or descending
- Open the original Zotero annotation directly
- Support Auto, Eye, and Dark appearance modes

Dependency:
- ZotLit

Dataview is not intended to be a production dependency. The current DataviewJS dashboard is the working prototype that will be migrated into a native Obsidian `ItemView`.

## Data contract

The Zotero plugin and Obsidian plugin communicate through Zotero annotation fields transported by ZotLit. The core schema is:

```text
[AI]
中文 summary

Role: mechanism
Topics: CXCR3, T-cell-migration
Use: discussion
```

Tags:

```text
ai:done
ai:role:mechanism
ai:topic:CXCR3
ai:topic:T-cell-migration
ai:use:discussion
```

See `docs/data-contract.md` for the full contract.

## Repository layout

```text
research-highlight-toolkit/
├─ zotero-plugin/
├─ obsidian-plugin/
├─ docs/
├─ README.md
└─ .gitignore
```

## Development plan

1. Migrate the current Dashboard prototype into an Obsidian plugin.
2. Migrate the stable Actions & Tags AI workflow into a Zotero plugin.
3. Add dependency detection for ZotLit / ZotLit Companion.
4. Package the plugins for manual installation.
5. Validate a clean install on another machine.

## Status

Early development. The underlying workflow has already been validated in daily use; this repository is for packaging the proven workflow into two installable plugins.

## License

TBD.
