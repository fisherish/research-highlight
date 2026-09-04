# Research Highlight Dashboard

Research Highlight Dashboard is the planned native Obsidian plugin for browsing AI-annotated Zotero highlights through ZotLit's live database.

It is a packaging of an already mature DataviewJS prototype, not a new synchronization system.

> **Status:** early development. The selected migration baseline is the working **Final v6** Dashboard prototype.

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

Zotero remains the source of truth. This plugin is a read-oriented viewer over ZotLit's live data.

## Required dependency

Research Highlight Dashboard requires ZotLit.

At startup, the plugin should check:

```js
const zotlit =
    this.app.plugins.plugins["zotlit"];
```

If ZotLit is missing or disabled, render this message inside the view:

```text
Research Highlight Dashboard requires ZotLit.
Install or enable ZotLit, then reopen this view.
```

Do not throw an unhandled JavaScript exception.

Dataview is **not** intended to be a production dependency.

## Obsidian integration

The production plugin should use an Obsidian `ItemView`.

Planned UX:

- left ribbon action: **Research Highlights**;
- clicking the ribbon opens or reveals the Dashboard view;
- plugin content renders into `this.containerEl`;
- view state and appearance preferences persist locally.

The migration should preserve the current behavior rather than redesigning the UI.

## ZotLit live database access

The working prototype obtains ZotLit's database service and waits until it is ready:

```js
const dbService =
    zotlit.services?.db;

await dbService.ready;
```

Records are read directly from the ZotLit client:

```js
const db = dbService.client;

const rows =
    db.query
      .itemAnnotations
      .findMany({ /* ... */ })
      .prepare()
      .all();
```

The `.prepare().all()` materialization step is required. A previous prototype bug produced:

```text
TypeError: rows is not iterable
```

when the prepared query was not fully materialized.

The plugin should subscribe to ZotLit database changes:

```js
dbService.on("changed", ...)
```

and debounce UI rebuilds by approximately 500 ms.

This live-update behavior is part of the feature contract. The validated workflow already updates correctly when a Zotero highlight is created, deleted, or when its AI summary / Role / Topics / Use metadata changes.

## Core logic to migrate

The mature prototype already contains the core functional units:

- `loadRecords()`
- `extractAISummary()`
- `getPaperTitle()`
- `buildZoteroLink()`
- `sortRecords()`
- `renderReader()`
- `renderSticky()`
- `toggleTopic()`

The main architectural change is:

```text
dv.container
    ↓
this.containerEl / ItemView
```

The goal of the first implementation milestone is feature parity, not a rewrite.

## Shared controls

Reader and Sticky share:

- Search
- Role filter
- Use filter
- Topic filter
- Sort by
- Asc / Desc
- Topic click toggle
- click the active Topic again to clear it
- automatic scroll to results after Topic filtering
- Zotero deep links
- ZotLit live refresh
- persistence of the last selected view
- persistence of sorting
- persistence of appearance mode

## Appearance modes

The established modes are:

```text
Auto | Eye | Dark
```

- **Auto** follows Obsidian's appearance.
- **Eye** uses the existing warm low-glare palette.
- **Dark** is the Dashboard's independent dark mode.

The current UI is considered substantially complete. Avoid unnecessary visual redesign during migration.

## Reader view

Reader is optimized for detailed reading, filtering, and verification.

Information hierarchy:

```text
role / use
paper title
topics
AI summary
ORIGINAL
short original-text preview
Show original ↓
Open in Zotero ↗
```

The AI summary is primary. Original highlight text is secondary and collapsed by default.

Page labels are intentionally omitted from the visible UI because Zotero deep links already provide direct annotation navigation. Page / annotation parameters may still be retained internally when building the deep link.

## Sticky view

Sticky is optimized for dense scanning, comparison, and idea discovery.

It uses the same AI-first information hierarchy as Reader but with a denser card layout and a roughly one-line original-text preview.

The old CSS-columns layout was replaced because it produced column-major visual reading order:

```text
1 4 7
2 5 8
3 6 9
```

The established implementation uses explicit column containers with round-robin distribution so visual order follows:

```text
1 2 3
4 5 6
7 8 9
```

Responsive targets:

```text
>= 1120 px  → 4 columns
>= 560 px   → 3 columns
>= 360 px   → 2 columns
narrower    → 1 column
```

Desktop Obsidian should preferentially retain 3 or 4 columns. With only a few highlights, cards should spread horizontally rather than filling the first column downward before using later columns.

## UI style

The existing design direction is intentionally restrained:

- Apple-inspired
- clean
- light shadows
- modest corner radius
- segmented Reader / Sticky control
- pill-style expand/collapse controls
- pill-style Open in Zotero action
- consistent hover / focus behavior for selects
- no excessive decoration

Controls must reserve enough width for their labels and must not allow text to overflow.

## Zotero deep links

The Dashboard should continue constructing Zotero links that target the original annotation, for example using the attachment key plus annotation and optional page parameters.

The visible UI does not need to show page numbers for this to work.

## Data contract

The Dashboard consumes the annotation schema documented in `../docs/data-contract.md`:

```text
[AI]
中文 summary

Role: ...
Topics: ...
Use: ...
```

and:

```text
ai:done
ai:role:*
ai:topic:*
ai:use:*
```

It should tolerate missing AI data, unknown tags, and future additive `ai:*` fields.

## Non-goals

This plugin must not:

- reimplement ZotLit;
- create `highlights.json`;
- create a custom SQLite highlight database;
- require Dataview in production;
- write back AI metadata to Zotero as part of the initial release;
- redesign the mature Reader / Sticky UI before migration parity is reached.

## Recommended first milestone

1. scaffold the native Obsidian plugin;
2. create the `ItemView` and ribbon action;
3. detect ZotLit gracefully;
4. port `loadRecords()` and live-change handling;
5. port Reader / Sticky rendering and styles from Final v6;
6. preserve filters, sort, appearance, deep links, and stored UI state;
7. verify create / edit / delete live updates against Zotero;
8. package for manual installation and test in a clean vault.

This is the recommended first implementation target for the repository because it has the most complete existing source and the smallest behavioral migration surface.
