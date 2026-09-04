# Installation

> **Status:** early development. Research Highlight AI and Research Highlight Dashboard are not yet packaged as installable releases. This document describes the intended final installation and the currently validated dependency stack.

## Final installation model

The finished workflow is designed to require only these four plugins:

```text
Zotero
├─ ZotLit Companion
└─ Research Highlight AI

Obsidian
├─ ZotLit
└─ Research Highlight Dashboard
```

ZotLit and ZotLit Companion remain required because this project does not reimplement the Zotero-to-Obsidian synchronization layer.

## Validated prototype environment

The working prototype has been validated with:

- Zotero 10
- Actions & Tags 2.6.1 for the current pre-plugin AI automation
- ZotLit Companion installed on the Zotero side
- Obsidian 1.13.7
- ZotLit v2.1.1
- DataviewJS only as the current Dashboard prototype host

Dataview and Actions & Tags are development/prototype dependencies, not intended final dependencies after the two custom plugins are packaged.

## Target Zotero setup

### 1. Install ZotLit Companion

Install and enable ZotLit Companion in Zotero.

The validated configuration uses ZotLit Companion to:

- detect the Zotero database automatically;
- read in immutable mode;
- watch for database changes;
- checkpoint the Zotero WAL when required by the existing ZotLit workflow.

Do not add custom refresh scripts to Research Highlight AI.

### 2. Install Research Highlight AI

Once packaged, install the Research Highlight AI Zotero plugin.

Configure:

```text
Provider: Groq
API Key: <your own key>
Model: qwen/qwen3.8-27b
Auto annotate new highlights: on/off
```

No real API key should ever be committed to this repository or bundled into a release.

The plugin should expose:

- automatic annotation of new highlights;
- **Batch Annotate Existing Highlights**;
- **Consolidate AI Topics**;
- settings for provider, API key, model, and auto-annotation.

## Target Obsidian setup

### 1. Install ZotLit

Install and enable ZotLit in Obsidian and ensure it is connected to ZotLit Companion.

Research Highlight Dashboard consumes ZotLit's live database directly.

### 2. Install Research Highlight Dashboard

Once packaged, install and enable Research Highlight Dashboard.

The plugin should add a left-ribbon action named **Research Highlights**. Clicking it opens the Dashboard `ItemView`.

If ZotLit is missing or disabled, the view should display:

```text
Research Highlight Dashboard requires ZotLit.
Install or enable ZotLit, then reopen this view.
```

It should not throw an unhandled JavaScript error.

## Expected end-to-end behavior

A clean installation should satisfy the following checks:

1. Create a Zotero highlight.
2. Research Highlight AI annotates it when auto-annotation is enabled.
3. The annotation comment retains any existing manual content and gains an `[AI]` block.
4. The annotation receives `ai:done`, `ai:role:*`, `ai:topic:*`, and `ai:use:*` tags.
5. ZotLit Companion / ZotLit propagate the updated annotation state.
6. Research Highlight Dashboard displays the highlight without manual refresh.
7. Editing the AI summary or structured tags in Zotero updates the Dashboard.
8. Deleting the Zotero highlight removes it from the Dashboard.
9. **Open in Zotero** resolves back to the original annotation using the Zotero deep link.

## What should not be installed or configured

The production workflow should not require:

- Dataview;
- a custom `highlights.json` file;
- a project-specific SQLite database;
- custom ZotLit refresh code in Research Highlight AI;
- `Zotero.launchURL` as a synchronization mechanism.

## Current development workflow

Until packaged releases exist, continue using the already validated prototypes:

- Zotero: Actions & Tags implementation of auto annotation, batch annotation, and topic consolidation;
- Obsidian: the selected Final v6 DataviewJS Dashboard prototype.

The first packaging milestone is to migrate the Final v6 Dashboard into a native Obsidian `ItemView` while preserving its behavior and ZotLit live-database access.
