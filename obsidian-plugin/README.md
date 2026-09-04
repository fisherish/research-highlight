# Research Highlight Dashboard

Native Obsidian `ItemView` for browsing AI-annotated Zotero highlights through ZotLit.

> Status: early development. Current validated test build: **v0.1.3**.

## Dependency

ZotLit is required. Dataview is not required. Zotero remains the source of truth.

## Current implementation

- Research Highlights ribbon and command-palette entry
- direct ZotLit live DB reads via `.prepare().all()`
- ZotLit `changed` subscription with 500 ms debounce
- Reader and Sticky views
- Search, Role, Use, Topic filters and sorting
- Zotero annotation deep links
- Auto / Eye / Dark appearance
- responsive Sticky columns
- lifecycle cleanup for listeners and timers

## Validated fixes through v0.1.3

- Sticky `Show original` no longer collapses immediately after expansion. The resize observer now re-renders only when the responsive column-count breakpoint changes.
- The Dashboard forces its own `ItemView` top padding to zero so Obsidian theme rules cannot leave a transparent strip above the sticky controls.
- The sticky control bar now sits inside an opaque sticky shell, preventing scrolled highlight cards from showing through the transparent corner area around the rounded header.

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
