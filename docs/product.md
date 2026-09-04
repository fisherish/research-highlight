# Research Highlight — Product Positioning

## Product thesis

**Research Highlight turns literature highlights into reusable research knowledge.**

Researchers already invest attention when they highlight a paper. The product adds structure at that moment without forcing a second note-taking workflow, then makes those highlights searchable and reusable across papers.

The product is designed as a research knowledge layer rather than a personal note-taking script.

## Product architecture

Research Highlight is one product with two current clients:

- **Research Highlight AI for Zotero** — capture and enrichment layer.
- **Research Highlight Dashboard for Obsidian** — retrieval and review layer.

Zotero remains the source of truth. ZotLit and ZotLit Companion currently provide the synchronization layer between Zotero and Obsidian.

## Core promise

1. **Capture without workflow change.** Keep highlighting inside Zotero.
2. **Structure automatically.** AI adds a concise summary plus Role, Topics, and Use metadata.
3. **Retrieve across papers.** Search and filter by concepts rather than by paper alone.
4. **Stay in control.** Local-first metadata, user-supplied API credentials, and provider choice.
5. **Avoid lock-in.** The data contract lives in Zotero annotations and can be consumed by other compatible tools.

## Initial target users

The first product wedge is researchers who read a large amount of technical literature and repeatedly need to recover evidence, mechanisms, methods, limitations, and experimental ideas from old papers.

Strong early-fit groups include:

- biomedical and life-science researchers;
- graduate students and postdocs;
- clinician-scientists;
- R&D scientists in biotech and pharma;
- research teams already using Zotero and Obsidian.

## Current differentiators

### Highlight-first, not document-chat-first

The product starts from the information a researcher intentionally selected as worth keeping. This produces a smaller, higher-signal knowledge layer than indexing every sentence of every PDF.

### Structured metadata instead of generic summaries

Each highlight is transformed into a compact research object with a summary, knowledge role, topics, and likely future use.

### Zotero-native source of truth

The product enriches existing Zotero annotations rather than creating a parallel highlight database.

### Provider-flexible AI

Current provider templates include Groq, OpenAI, and OpenRouter, plus a custom OpenAI-compatible endpoint. Users can choose cost, latency, privacy, and model quality independently of the product.

### Local-first foundation

The current product can operate without a proprietary cloud database. This is useful for researchers working with unpublished or sensitive material and creates a clear trust story.

## Product language

Preferred product name:

**Research Highlight**

Current modules:

- **Research Highlight AI** — Zotero plugin
- **Research Highlight Dashboard** — Obsidian plugin

Primary tagline:

> **Turn literature highlights into reusable research knowledge.**

Secondary message:

> Highlight in Zotero. Research Highlight structures what matters and makes it retrievable when you need it again.

Avoid positioning the product as a personal script, a one-off workflow, or a collection of utilities. The public narrative should describe a coherent research knowledge product.

## Commercial path

The current release is a local-first beta. A commercial product can grow without invalidating that foundation.

### Core / Personal

- Zotero AI enrichment
- Obsidian Dashboard
- local-first storage
- BYOK model providers
- structured tags and filters
- batch annotation
- topic consolidation

### Pro opportunities

- semantic search across highlights
- saved research views and collections
- citation-ready evidence packs
- reusable annotation profiles for different research domains
- richer topic management and vocabulary curation
- automatic synthesis across selected highlights
- direct export into writing workflows

### Team opportunities

- shared taxonomies and controlled vocabularies
- collaborative highlight collections
- team research spaces
- shared evidence boards
- organization-wide search
- permission and audit controls
- optional managed model gateway

These are roadmap opportunities, not claims about currently shipped functionality.

## Business model direction

A plausible model is **open/local core + paid Pro and Team layers**.

The local plugin workflow lowers adoption friction and establishes trust. Paid value should come from capabilities that become substantially more useful with coordination, indexing, automation, or hosted infrastructure rather than by artificially restricting basic annotation.

## Product principles

1. Researcher intent is higher signal than indiscriminate document ingestion.
2. Every generated field should improve retrieval or reuse.
3. The source record should remain inspectable and portable.
4. AI providers should be replaceable.
5. Local-first should remain a supported deployment mode.
6. New features should reduce retrieval friction, not add another maintenance burden.
