<p align="center">
  <img src="assets/brand/research-highlight-icon.svg" width="150" alt="Research Highlight icon" />
</p>

<h1 align="center">Research Highlight</h1>

<p align="center"><strong>Turn literature highlights into reusable research knowledge.</strong></p>

<p align="center">
  A local-first research knowledge layer for Zotero and Obsidian.
</p>

<p align="center">
  <strong>English</strong> · <a href="README.zh-CN.md">简体中文</a>
</p>

---

Researchers already decide what matters when they highlight a paper. **Research Highlight** captures that intent, adds structured AI metadata, and makes important passages retrievable across papers without forcing a second note-taking workflow.

The project is delivered through two connected plugins:

| Surface | Product module | Role |
| --- | --- | --- |
| Zotero | **Research Highlight AI** | Enrich highlights with summaries, research roles, topics, and future-use metadata |
| Obsidian | **Research Highlight Dashboard** | Search, filter, review, and reopen structured highlights across papers |

Zotero remains the source of truth. ZotLit and ZotLit Companion currently provide the synchronization layer between Zotero and Obsidian.

## What Research Highlight does

A saved highlight becomes a compact research object rather than an isolated colored sentence.

```text
Zotero highlight
    ↓
Research Highlight AI
    ↓
summary + role + topics + use
    ↓
Zotero annotation metadata
    ↓
ZotLit Companion / ZotLit
    ↓
Research Highlight Dashboard
    ↓
search · filter · review · reopen in Zotero
```

The canonical annotation remains human-readable inside Zotero:

```text
[AI]
中文 summary

Role: limitation
Topics: CAR-T cells, solid tumors, tumor microenvironment
Use: discussion
```

And the same structure is stored as portable `ai:*` tags for retrieval.

## Built for serious literature workflows

**Highlight-first.** Research Highlight starts from passages the researcher deliberately selected, rather than indiscriminately treating an entire PDF as equally important.

**Structured, not merely summarized.** Each highlight can carry a concise summary, knowledge role, topics, and likely future use.

**Zotero-native source of truth.** The project enriches existing annotations instead of creating a competing highlight database.

**Local-first.** Research metadata can remain in the user's existing Zotero and Obsidian workflow rather than requiring a proprietary cloud store.

**Provider-flexible.** Research Highlight AI currently ships provider templates for Groq, OpenAI, and OpenRouter, plus a custom OpenAI-compatible endpoint. API credentials remain local to Zotero.

**Portable by design.** The Zotero annotation data contract is intentionally inspectable and can be consumed by other compatible tools.

## Research Highlight AI for Zotero

Current capabilities include:

- automatic AI annotation of newly created text highlights;
- single-highlight AI annotation from the Zotero Reader context menu;
- batch processing for papers, attachments, or annotations;
- preservation of manual comments and translations;
- structured `summary / role / topics / use` output;
- Topic Consolidator for retrieval-oriented vocabulary cleanup;
- Groq, OpenAI, OpenRouter, and Custom OpenAI-compatible provider configuration;
- editable API endpoint, API key, and model ID;
- GitHub Release based automatic updates.

The original Groq path has been validated end-to-end in the real Zotero → ZotLit → Obsidian workflow. Newly added provider templates should be treated as beta paths until individually validated with production credentials.

See [`zotero-plugin/README.md`](zotero-plugin/README.md).

## Research Highlight Dashboard for Obsidian

The Dashboard provides two ways to work with the same research memory:

**Reader** is optimized for focused review of individual evidence. **Sticky** is optimized for scanning many highlights as a visual research board.

Current capabilities include search, Role / Use / Topic filters, sorting, Zotero deep links, live ZotLit refresh, responsive layouts, and Auto / Eye / Dark appearance modes.

Dataview is not required.

See [`obsidian-plugin/README.md`](obsidian-plugin/README.md).

## Next

The next phase focuses on:

- improving installation and first-run setup;
- validating and refining Groq, OpenAI, OpenRouter, and Custom providers;
- improving reliability and error handling across Auto, single-highlight, and Batch annotation;
- adding a safer preview and confirmation flow for Topic Consolidation;
- aligning icons, copy, and interaction details across Zotero and Obsidian;
- preparing a cleaner public distribution and update path for the Obsidian plugin;
- improving cross-paper highlight retrieval and exploring semantic retrieval, saved research views, cross-highlight synthesis, and collaborative research workflows.

See [`docs/roadmap.md`](docs/roadmap.md) for the detailed roadmap.

## Brand

The shared Research Highlight identity is used across Zotero and Obsidian. The mark combines a research document, one highlighted passage, and a compact structured-data motif.

Brand assets and usage guidance: [`docs/brand.md`](docs/brand.md).

## Architecture

```text
Zotero
├─ ZotLit Companion
└─ Research Highlight AI
          │
          │ annotation comment + ai:* tags
          ▼
      ZotLit transport
          │
          ▼
Obsidian
├─ ZotLit
└─ Research Highlight Dashboard
```

Research Highlight deliberately does **not** introduce a project-specific `highlights.json`, a second custom SQLite store, or a competing ZotLit synchronization implementation.

Detailed architecture: [`docs/architecture.md`](docs/architecture.md).

Data contract: [`docs/data-contract.md`](docs/data-contract.md).

## Installation

Installation and dependency details are documented in [`docs/installation.md`](docs/installation.md).

The Zotero plugin already has a validated GitHub Release based automatic update channel. The Obsidian plugin is currently distributed as a native plugin build while its public distribution path is prepared.

## Status

**Public beta.** The core Zotero AI annotation path, ZotLit transport, Obsidian Dashboard live refresh, and Zotero automatic updates have been validated in the real workflow.

The next phase is focused on packaging, provider validation, safer vocabulary management, consistent branding across both clients, and preparing stable public distribution.

## Repository

```text
research-highlight/
├─ assets/brand/
├─ zotero-plugin/
├─ obsidian-plugin/
├─ docs/
│  ├─ product.md
│  ├─ roadmap.md
│  ├─ brand.md
│  ├─ architecture.md
│  ├─ data-contract.md
│  └─ installation.md
├─ LICENSE
├─ README.md
└─ README.zh-CN.md
```

## License

Research Highlight is licensed under the [Apache License 2.0](LICENSE).

The license permits use, modification, distribution, and commercial use, while preserving attribution and providing an explicit patent grant.
