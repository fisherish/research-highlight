# Research Highlight AI

Research Highlight AI is the planned Zotero plugin for converting newly created or existing Zotero highlights into structured, retrieval-friendly AI annotations.

It packages behavior that has already been validated in Zotero 10 through Actions & Tags 2.6.1.

> **Status:** early development. The native Zotero plugin has not yet been implemented in this repository.

## Role in the system

```text
Zotero highlight
    ↓
Research Highlight AI
    ↓
annotation comment + ai:* tags
    ↓
ZotLit Companion
```

Zotero remains the source of truth.

Research Highlight AI writes results back to the Zotero annotation. It does not maintain a separate highlight database and does not directly control ZotLit synchronization.

## Planned features

### Automatic AI annotation

When enabled, the plugin should react to newly created highlight annotations and:

1. ignore non-highlight annotations;
2. skip any annotation already tagged `ai:done`;
3. read the highlight text and relevant item context;
4. call the configured Groq chat-completions endpoint;
5. request structured output using a strict JSON schema;
6. preserve any existing manual comment or translation;
7. append an `[AI]` block;
8. replace stale AI Role / Topic / Use tags;
9. add the current AI tags;
10. save with `await item.saveTx()`.

Validated defaults:

```text
Provider: Groq
Model: qwen/qwen3.8-27b
reasoning_effort: none
```

The output schema is documented in `../docs/data-contract.md`.

Canonical comment example:

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

## Batch Annotate Existing Highlights

The native plugin should retain the already validated batch workflow.

Expected behavior:

- accepts a selected regular item, attachment, or annotation;
- collects highlight annotations beneath the selection;
- skips `ai:done`;
- processes requests sequentially;
- uses `DELAY_MS = 1500` between requests;
- uses `MAX_RETRIES = 3`;
- retries HTTP 429 and 5xx responses with 5 s / 10 s / 20 s backoff;
- preserves existing manual comments or translations;
- replaces stale AI Role / Topic / Use tags with the current result;
- saves each annotation;
- reports final processed / skipped / failed statistics.

The plugin should favor predictable, low-rate sequential processing over aggressive concurrency.

## Consolidate AI Topics

**Consolidate AI Topics** is a manually invoked maintenance command. It should never run automatically when a highlight is created.

Its purpose is to merge low-value duplicate or synonymous Topic labels when doing so improves future research retrieval.

The decision criterion is not strict biological identity. It is whether keeping two Topics separate provides meaningful future search value.

Acceptable examples:

```text
Soluble-TNF → TNF-alpha
PD1 + PDL1 → PD-1/PD-L1
TNF-alpha + TNFR1 + TNFR2 → TNF/TNFR-signaling
```

Do not merge independently useful retrieval axes such as:

```text
CXCL10
CXCR3
```

Avoid broad umbrella labels such as `immune-signaling` or `tumor-biology`.

### Topic discovery implementation

The validated implementation reads annotations first and then uses the Zotero Item API to inspect tags:

```js
const annotationIDs =
    await Zotero.DB.columnQueryAsync(
        `
        SELECT ia.itemID
        FROM itemAnnotations ia
        LEFT JOIN deletedItems di
            ON di.itemID = ia.itemID
        WHERE di.itemID IS NULL
        `
    );

const annotations =
    annotationIDs.length
        ? await Zotero.Items.getAsync(annotationIDs)
        : [];
```

Then each annotation is inspected through:

```js
annotation.getTags()
```

Do not replace this with SQL `LIKE` / `substr` matching of `ai:topic:*` text. That approach was unreliable in the validated Actions & Tags environment.

## Settings

Planned settings:

```text
Provider: Groq
API Key: user supplied
Model: qwen/qwen3.8-27b
Auto annotate new highlights: on/off
```

No real API key belongs in source control, examples, fixtures, releases, or logs.

The prototype currently reads `GROQ_API_KEY` from the environment. The native plugin may move key storage into Zotero plugin preferences, but it must keep the credential local and out of the repository.

## ZotLit Companion dependency

ZotLit Companion is a prerequisite for the complete Research Highlight Toolkit workflow, but Research Highlight AI should remain loosely coupled to it.

The plugin should not:

- call ZotLit refresh APIs;
- implement WAL synchronization itself;
- create a second sync database;
- use `Zotero.launchURL` to force synchronization.

Its job ends when the Zotero annotation has been saved correctly.

## Non-goals

This plugin is not intended to:

- replace ZotLit Companion;
- provide an Obsidian UI;
- maintain its own highlight cache;
- automatically collapse every biologically related topic into one vocabulary term;
- rewrite the proven prompts and workflow before feature parity is established.

## Migration strategy

The first Zotero-plugin milestone should be behavioral parity with the validated Actions & Tags workflow rather than architectural novelty.

Recommended sequence:

1. implement settings and provider client;
2. implement annotation parsing / writing helpers;
3. implement auto-annotation of new highlights;
4. implement Batch Annotate Existing Highlights;
5. implement Consolidate AI Topics;
6. verify comment preservation and exact `ai:*` compatibility;
7. package and test on a clean Zotero installation.

Development of this plugin is intentionally scheduled after the Obsidian Dashboard migration because the Dashboard prototype is currently the lower-risk packaging target.
