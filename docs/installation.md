# Installation

Research Highlight uses two plugins on the Zotero side and two on the Obsidian side:

```text
Zotero
├─ ZotLit Companion
└─ Research Highlight AI

Obsidian
├─ ZotLit
└─ Research Highlight Dashboard
```

## 1. Zotero

### Install ZotLit Companion

Install and enable ZotLit Companion in Zotero.

### Install Research Highlight AI

Open the [Research Highlight Releases](https://github.com/fisherish/research-highlight/releases) page and download the latest file named:

```text
research-highlight-ai-v*.xpi
```

In Zotero, open **Tools → Plugins**, then install the XPI.

### First setup

Open **Zotero Settings → Research Highlight AI**.

For the normal setup you only need to do three things:

1. Choose a provider: Groq, OpenAI, or OpenRouter.
2. Paste your API key.
3. Click **Test connection**.

Endpoint and Model are filled automatically. You normally do not need to open **Advanced settings**.

When the test succeeds, enable **Auto annotate new highlights** if you want new highlights to be processed automatically.

For a custom OpenAI-compatible endpoint, choose **Custom** and fill Endpoint and Model under **Advanced settings**.

## 2. Obsidian

### Install ZotLit

Install and enable ZotLit in Obsidian.

### Install Research Highlight Dashboard

Open the [Research Highlight Releases](https://github.com/fisherish/research-highlight/releases) page and download the latest file named:

```text
research-highlight-dashboard-v*.zip
```

Extract it into your vault's plugin folder:

```text
<your-vault>/.obsidian/plugins/
```

After extraction, the folder should look like this:

```text
.obsidian/plugins/research-highlight-dashboard/
├─ main.js
├─ manifest.json
└─ styles.css
```

Then open **Obsidian Settings → Community plugins**, enable **Research Highlight Dashboard**, and click **Research Highlights** in the left ribbon.

## 3. Check that it works

Create a new highlight in Zotero.

If automatic annotation is enabled, the highlight should receive an AI summary plus Role, Topics, and Use metadata. After ZotLit syncs the change, the same highlight should appear in Research Highlight Dashboard.

That is the whole setup.

## Provider notes

Groq, OpenAI, and OpenRouter come with a default Endpoint and Model. You can change them later if needed.

API keys are stored in local Zotero preferences. Custom endpoints may leave the API key empty when authentication is not required.

## Requirements

The currently validated setup uses Zotero 10, Obsidian 1.13+, ZotLit Companion, and ZotLit.
