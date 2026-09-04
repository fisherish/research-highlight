<p align="center">
  <img src="../assets/brand/research-highlight-icon.svg" width="112" alt="Research Highlight icon" />
</p>

# Research Highlight Dashboard

Research Highlight Dashboard is the Obsidian side of Research Highlight. It lets you search and review Zotero highlights that have already been annotated and carried into Obsidian through ZotLit.

> **Status:** public beta. Current build: **v0.1.4**.

## Install

Download the latest `research-highlight-dashboard-v*.zip` from the repository's [Releases](https://github.com/fisherish/research-highlight/releases) page.

Extract it into:

```text
<your-vault>/.obsidian/plugins/
```

You should end up with:

```text
.obsidian/plugins/research-highlight-dashboard/
├─ main.js
├─ manifest.json
└─ styles.css
```

Then enable **Research Highlight Dashboard** in **Obsidian Settings → Community plugins**.

## How it fits into the workflow

```text
Zotero highlight
    ↓
Research Highlight AI
    ↓
comment + ai:* tags
    ↓
ZotLit
    ↓
Research Highlight Dashboard
```

Zotero keeps the original annotation. The Dashboard reads the ZotLit data and gives you a faster way to browse highlights across papers.

## Reader and Sticky

**Reader** is for going through highlights one by one. It keeps the paper title, Topics, AI summary, original text, and Zotero link together.

**Sticky** lays out more highlights at once, which is useful when you want to scan material around a topic without opening each paper separately.

Both views use the same search, filter, and sort controls.

## Current features

- native Obsidian `ItemView`;
- Research Highlights ribbon button and command-palette entry;
- direct ZotLit database reads;
- automatic refresh when ZotLit data changes;
- Reader and Sticky views;
- text search;
- Role, Use, and Topic filters;
- sorting and ascending / descending direction;
- Zotero annotation deep links;
- saved view and appearance settings;
- Auto, Eye, and Dark appearance modes;
- responsive Sticky columns.

## What is shown for each highlight

```text
Role / Use
Paper title
Topics
AI summary
Original highlight
Open in Zotero
```

## Requirements

- Obsidian 1.13+
- ZotLit

For the complete workflow on the Zotero side, ZotLit Companion and Research Highlight AI are also used.

## Releases

Each Dashboard release includes a ready-to-extract ZIP plus `main.js`, `manifest.json`, and `styles.css` as separate assets.

The release package is built automatically from `obsidian-plugin/manifest.json`.

## Development files

```text
obsidian-plugin/
├─ src/main.js
├─ main.js
├─ manifest.json
├─ styles.css
├─ package.json
├─ build.mjs
├─ versions.json
└─ README.md
```

`src/main.js` is the editable source. `main.js` is the runtime copy loaded by Obsidian.

See [`../docs/installation.md`](../docs/installation.md) for the complete Zotero + Obsidian setup.
