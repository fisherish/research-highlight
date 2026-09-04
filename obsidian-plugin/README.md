# Research Highlight Dashboard

Research Highlight Dashboard is the native Obsidian viewer for AI-annotated Zotero highlights transported by ZotLit.

> Status: **early development, v0.1.0 scaffold implemented.** The native `ItemView` migration is now in the repository, but it still needs an end-to-end test inside the user's real Obsidian + ZotLit environment before it should be treated as a release.

## Role in the system

```text
Zotero annotation
    ↓
ZotLit Companion
    ↓
ZotLit live database
    ↓
Research Highlight Dashboard
    ↓
Reader / Sticky
```

Zotero remains the source of truth. This plugin is a read-oriented viewer over ZotLit's live database. It does not create `highlights.json`, a custom SQLite database, or another synchronization layer.

## Dependency

ZotLit is required. Dataview is not required.

If ZotLit is missing or disabled, the view renders a friendly dependency message instead of throwing an unhandled JavaScript error.

## Current v0.1.0 implementation

The first native migration milestone now includes:

- Obsidian `ItemView` integration;
- left-ribbon **Research Highlights** action;
- command palette action: **Open Research Highlights**;
- graceful ZotLit dependency checks;
- direct ZotLit live DB access;
- `.prepare().all()` query materialization;
- ZotLit `changed` subscription with 500 ms debounce;
- Reader and Sticky views;
- Search, Role, Use, and Topic filters;
- Topic click-to-toggle and second-click-to-clear behavior;
- automatic scroll after Topic filtering;
- date / title / Role / Use sorting;
- ascending / descending direction;
- `Auto | Eye | Dark` appearance modes;
- persistence of view, sort, direction, and appearance;
- Zotero annotation deep links;
- Sticky round-robin column distribution;
- responsive 4 / 3 / 2 / 1 column targets;
- view-lifecycle cleanup for ZotLit listeners, timers, and resize observation.

The plugin still reads the same data contract documented in `../docs/data-contract.md`.

## Files

```text
obsidian-plugin/
├─ src/
│  └─ main.js
├─ main.js
├─ manifest.json
├─ styles.css
├─ package.json
├─ build.mjs
├─ versions.json
└─ README.md
```

`src/main.js` is the editable source. `main.js` is the currently built copy used by Obsidian. The build step is intentionally minimal because this first version has no third-party runtime dependencies:

```bash
npm run check
npm run build
```

## Manual development install

For a local test, create this folder inside a test vault:

```text
<Vault>/.obsidian/plugins/research-highlight-dashboard/
```

Copy these files into it:

```text
main.js
manifest.json
styles.css
```

Then reload Obsidian, enable **Research Highlight Dashboard**, make sure ZotLit is enabled, and click the **Research Highlights** ribbon icon.

Do not perform the first test in an irreplaceable main vault. The Dashboard is designed as read-only, but plugin development should still be validated in a test vault first.

## ZotLit access

The implementation keeps the proven query pattern:

```js
const rows = dbService.client.query.itemAnnotations
  .findMany({ /* relationships required by the Dashboard */ })
  .prepare()
  .all();
```

The `.prepare().all()` step is required. The previous prototype error `TypeError: rows is not iterable` came from failing to fully materialize the prepared query.

Live refresh remains:

```js
dbService.on("changed", ...)
```

with a 500 ms debounce before rebuilding the UI.

## Reader

Reader preserves the AI-first hierarchy:

```text
role / use
paper title
topics
AI summary
ORIGINAL
collapsed original preview
Show original ↓
Open in Zotero ↗
```

Page labels remain hidden from the UI. Page and annotation identifiers may still be included in the Zotero deep link.

## Sticky

Sticky uses explicit column containers with round-robin assignment so sorted visual order is horizontal:

```text
1 2 3
4 5 6
7 8 9
```

Responsive targets are:

```text
>= 1120 px  → 4 columns
>= 560 px   → 3 columns
>= 360 px   → 2 columns
narrower    → 1 column
```

A `ResizeObserver` re-renders Sticky when the pane crosses practical layout widths.

## Appearance

```text
Auto | Eye | Dark
```

- **Auto** follows Obsidian.
- **Eye** uses a warm low-glare palette independently of Obsidian's current theme.
- **Dark** forces the Dashboard dark palette independently of Obsidian's current theme.

## Next validation step

The next step is not more feature work. It is a real integration test against the existing ZotLit v2.1.1 environment:

1. load the plugin manually;
2. confirm the ribbon opens the view;
3. compare Reader / Sticky against Final v6;
4. create a Zotero highlight and confirm it appears live;
5. edit AI summary / Role / Topics / Use and confirm live refresh;
6. delete the highlight and confirm it disappears;
7. test Zotero deep-link navigation;
8. check Eye / Dark and Sticky resize behavior.

Any regression found there should be fixed before starting the Zotero plugin migration.
