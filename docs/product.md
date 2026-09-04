# Research Highlight — Product Positioning

## Product thesis

**Research Highlight turns literature highlights into reusable research knowledge.**

Researchers already invest attention when they highlight a paper. Research Highlight adds structure at that moment without forcing a second note-taking workflow, then makes those highlights easier to retrieve and reuse across papers.

The project is designed as a coherent research knowledge product rather than a collection of personal scripts.

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

The first users are researchers who read a large amount of technical literature and repeatedly need to recover evidence, mechanisms, methods, limitations, and experimental ideas from old papers.

Strong early-fit groups include:

- biomedical and life-science researchers;
- graduate students and postdocs;
- clinician-scientists;
- R&D scientists in biotech and pharma;
- researchers already using Zotero and Obsidian.

## Current differentiators

### Highlight-first, not document-chat-first

The product starts from the information a researcher intentionally selected as worth keeping. This creates a smaller, higher-signal knowledge layer than treating every sentence of every PDF as equally important.

### Structured metadata instead of generic summaries

Each highlight becomes a compact research object with a summary, knowledge role, topics, and likely future use.

### Zotero-native source of truth

Research Highlight enriches existing Zotero annotations rather than creating a parallel highlight database.

### Provider-flexible AI

Current provider templates include Groq, OpenAI, and OpenRouter, plus a custom OpenAI-compatible endpoint. Users can choose model quality, latency, cost, and privacy independently of the product.

### Local-first foundation

The current workflow does not require a proprietary cloud database. This keeps the system inspectable and gives researchers control over their literature data.

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

Avoid positioning the project as a personal script, a one-off workflow, or a loose bundle of utilities. The public narrative should describe one coherent research product.

## Current product direction

The immediate goal is not commercialization. The current goal is to make Research Highlight:

- reliable enough for daily research use;
- easy to install and configure;
- understandable without developer knowledge;
- visually and conceptually consistent across Zotero and Obsidian;
- portable and provider-flexible;
- suitable for broader public use and feedback.

Future directions may include semantic retrieval, richer research views, synthesis across selected highlights, collaborative workflows, or optional hosted services. Whether any of those become commercial offerings is intentionally left open.

Commercial potential is a **future option**, not the current product identity.

## Product principles

1. Researcher intent is higher signal than indiscriminate document ingestion.
2. Every generated field should improve retrieval or reuse.
3. The source record should remain inspectable and portable.
4. AI providers should be replaceable.
5. Local-first should remain a supported deployment mode.
6. New features should reduce retrieval friction, not create another maintenance burden.
7. Product quality comes before monetization design.
