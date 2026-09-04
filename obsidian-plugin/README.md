<p align="center">
  <img src="../assets/brand/research-highlight-icon.svg" width="112" alt="Research Highlight icon" />
</p>

# Research Highlight Dashboard

**The retrieval and review surface for Research Highlight.**

Research Highlight Dashboard turns structured Zotero annotations into a searchable research workspace inside Obsidian. It is designed for recovering evidence, mechanisms, methods, limitations, and ideas across papers rather than browsing notes one document at a time.

> **Status:** public beta. Current validated build: **v0.1.3**.

## Product role

Research Highlight Dashboard is the Obsidian client of the broader **Research Highlight** product.

```text
Zotero highlight
    ↓
Research Highlight AI
    ↓
structured Zotero annotation metadata
    ↓
ZotLit
    ↓
Research Highlight Dashboard
```

Zotero remains the source of truth. ZotLit is the current live data layer. Dataview is not required.

## Reader and Sticky

**Reader** is optimized for focused review of individual highlights with a clear AI-summary-first hierarchy and direct return links to Zotero.

**Sticky** is optimized for scanning a larger evidence set as a compact research board with responsive multi-column layout.

Both views share Search, Role, Use, Topic, Sort, and direction controls.

## Current capabilities

- native Obsidian `ItemView`;
- Research Highlights ribbon and command-palette entry;
- direct ZotLit live database reads;
- live refresh on ZotLit changes;
- Reader and Sticky views;
- Search, Role, Use, and Topic filtering;
- sorting and ascending / descending direction;
- Zotero annotation deep links;
- persisted view and appearance state;
- Auto, Eye, and Dark appearance modes;
- responsive Sticky columns;
- no Dataview dependency.

## Product design

The Dashboard is intentionally evidence-centric. The visual hierarchy prioritizes:

```text
Role / Use
Paper title
Topics
AI summary
Original highlight
Open in Zotero
```

This keeps the interface useful for literature synthesis rather than turning it into a generic card browser.

## Shared brand

Research Highlight Dashboard uses the same product identity as Research Highlight AI for Zotero.

Canonical brand asset:

`../assets/brand/research-highlight-icon.svg`

Brand guidance: [`../docs/brand.md`](../docs/brand.md).

## Dependency

Required:

- Obsidian 1.13+
- ZotLit

On the Zotero side, the complete workflow also uses ZotLit Companion and Research Highlight AI.

## Distribution direction

The current build is a native Obsidian plugin. A stable public distribution channel is part of the productization roadmap so Zotero and Obsidian can share a consistent install, update, and brand experience.

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
