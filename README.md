<p align="center">
  <img src="assets/brand/research-highlight-icon.svg" width="150" alt="Research Highlight icon" />
</p>

<h1 align="center">Research Highlight</h1>

<p align="center"><strong>Make the highlights you save in Zotero easier to find and reuse later.</strong></p>

<p align="center">
  <strong>English</strong> · <a href="README.zh-CN.md">简体中文</a>
</p>

---

Research Highlight is a set of tools for people who read papers in Zotero and use Obsidian to organize research notes.

You keep reading and highlighting in Zotero as usual. Research Highlight AI adds a short summary and a few useful fields to each highlight: what kind of information it is, what it is about, and where you might use it later. Those annotations then appear in the Obsidian Dashboard through ZotLit, where they can be searched and filtered across papers.

The main problem is simple: once you have read enough papers, highlights pile up. Months later, you may remember that you saw a useful result or mechanism somewhere, but not which paper or which paragraph it came from.

Research Highlight works with the highlights you already make. It does not ask you to maintain a second note system by hand.

## Two plugins

| App | Plugin | What it does |
| --- | --- | --- |
| Zotero | **Research Highlight AI** | Adds a summary, Role, Topics, and Use to highlights |
| Obsidian | **Research Highlight Dashboard** | Searches, filters, reviews, and reopens those highlights in Zotero |

The original annotation stays in Zotero. ZotLit Companion and ZotLit carry the data into Obsidian.

## What a highlight looks like after annotation

For example, a highlight about limitations of CAR-T cells in solid tumors may get a comment like this:

```text
[AI]
The immunosuppressive tumor microenvironment and poor infiltration can limit CAR-T cell function in solid tumors.

Role: limitation
Topics: CAR-T cells, solid tumors, tumor microenvironment
Use: discussion
```

The plugin also adds matching tags:

```text
ai:done
ai:role:limitation
ai:topic:CAR-T-cells
ai:topic:solid-tumors
ai:topic:tumor-microenvironment
ai:use:discussion
```

This makes it possible to find the passage later by topic, molecule, cell type, mechanism, method, or limitation, instead of relying on memory of the paper title.

## Research Highlight AI for Zotero

Current features:

- automatic AI annotation for newly created text highlights;
- right-click annotation and re-annotation in the Zotero Reader;
- batch processing for papers, PDF attachments, or annotations;
- preservation of existing manual comments and translations;
- structured `summary / role / topics / use` output;
- Topic Consolidator for obvious duplicate or near-duplicate Topics;
- Groq, OpenAI, OpenRouter, and Custom OpenAI-compatible providers;
- editable API Endpoint, API Key, and Model;
- GitHub Release based automatic updates.

The Groq path has been tested end to end in the real Zotero → ZotLit → Obsidian workflow. The other providers are already wired in and will continue to be tested one by one.

See [`zotero-plugin/README.md`](zotero-plugin/README.md).

## Research Highlight Dashboard for Obsidian

The Dashboard reads ZotLit data directly.

It currently has two views:

- **Reader** for going through highlights one at a time with the summary and original text together;
- **Sticky** for laying out many highlights at once and scanning material around a topic.

You can search by text, filter by Role, Use, or Topic, and sort by dates or paper title. Each highlight can open the original annotation in Zotero.

When highlights are added, changed, or deleted in Zotero, the Dashboard refreshes with the new data.

See [`obsidian-plugin/README.md`](obsidian-plugin/README.md).

## Quick install

First install the two sync plugins: **ZotLit Companion** in Zotero and **ZotLit** in Obsidian.

Then open [Releases](https://github.com/fisherish/research-highlight/releases) and download:

```text
research-highlight-ai-v*.xpi
research-highlight-dashboard-v*.zip
```

In Zotero, open **Tools → Plugins** and install the XPI.

For Obsidian, extract the Dashboard ZIP into:

```text
<your-vault>/.obsidian/plugins/
```

Then enable **Research Highlight Dashboard** in **Settings → Community plugins**.

### First setup in Zotero

Open **Zotero Settings → Research Highlight AI**.

For a normal setup you only need to:

1. choose Groq, OpenAI, or OpenRouter;
2. paste your API key;
3. click **Test connection**.

Endpoint and Model are filled automatically. Most users do not need Advanced settings.

After the test succeeds, turn on **Auto annotate new highlights** if you want new highlights processed automatically.

See [`docs/installation.md`](docs/installation.md) for the full setup.

## How the data moves

```text
Highlight in Zotero
        ↓
Research Highlight AI
        ↓
comment + ai:* tags
        ↓
ZotLit Companion / ZotLit
        ↓
Research Highlight Dashboard
        ↓
search, filter, review, reopen in Zotero
```

Research Highlight does not create another highlight database and does not reimplement ZotLit's sync layer.

## Next

- keep testing the supported model providers;
- improve batch annotation, retries, and error messages;
- add preview and confirmation to Topic Consolidation;
- keep improving the Obsidian update path;
- improve cross-paper search and continue exploring semantic retrieval, saved views, and cross-highlight summaries.

See [`docs/roadmap.md`](docs/roadmap.md) for the detailed roadmap.

## Status

**Public Beta.**

This full path has already been tested in a real setup:

```text
Zotero highlight
    ↓
AI annotation
    ↓
comment + ai:* tags
    ↓
ZotLit
    ↓
Obsidian Dashboard live refresh
```

The Zotero GitHub Release and automatic update flow have also been verified.

## Repository

```text
research-highlight/
├─ assets/
├─ zotero-plugin/
├─ obsidian-plugin/
├─ docs/
├─ LICENSE
├─ README.md
└─ README.zh-CN.md
```

## License

Research Highlight is licensed under the [Apache License 2.0](LICENSE).
