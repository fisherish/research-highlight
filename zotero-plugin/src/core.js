var ResearchHighlightAI = {
  id: null,
  version: null,
  rootURI: null,
  notifierID: null,
  menuIDs: [],
  autoQueue: [],
  autoQueuedIDs: new Set(),
  autoQueueRunning: false,
  batchRunning: false,
  consolidatorRunning: false,

  PREFS: {
    provider: "extensions.researchHighlightAI.provider",
    apiKey: "extensions.researchHighlightAI.apiKey",
    model: "extensions.researchHighlightAI.model",
    autoAnnotate: "extensions.researchHighlightAI.autoAnnotate",
  },

  GROQ_ENDPOINT: "https://api.groq.com/openai/v1/chat/completions",
  DEFAULT_MODEL: "qwen/qwen3.8-27b",
  BATCH_DELAY_MS: 1500,
  MAX_RETRIES: 3,
  RETRY_DELAYS_MS: [5000, 10000, 20000],
  TOPIC_PREFIX: "ai:topic:",

  init({ id, version, rootURI }) {
    this.id = id;
    this.version = version;
    this.rootURI = rootURI;
  },

  async startup() {
    try {
      Zotero.PreferencePanes.register({
        pluginID: this.id,
        label: "Research Highlight AI",
        src: this.rootURI + "prefs.xhtml",
        scripts: [this.rootURI + "preferences.js"],
        stylesheets: [this.rootURI + "prefs.css"],
      });
    } catch (error) {
      Zotero.logError(error);
      Zotero.debug(`[Research Highlight AI] Preference pane registration failed: ${error}`);
    }

    for (const window of Zotero.getMainWindows()) this.addToWindow(window);

    try {
      this.registerMenus();
    } catch (error) {
      Zotero.logError(error);
      Zotero.debug(`[Research Highlight AI] Menu registration failed: ${error}`);
    }

    try {
      this.registerNotifier();
    } catch (error) {
      Zotero.logError(error);
      Zotero.debug(`[Research Highlight AI] Notifier registration failed: ${error}`);
    }

    Zotero.debug(`[Research Highlight AI] Ready ${this.version}`);
  },

  async shutdown() {
    if (this.notifierID) {
      Zotero.Notifier.unregisterObserver(this.notifierID);
      this.notifierID = null;
    }

    for (const menuID of this.menuIDs) {
      try {
        Zotero.MenuManager.unregisterMenu(menuID);
      } catch (error) {
        Zotero.debug(`[Research Highlight AI] Menu cleanup warning: ${error}`);
      }
    }
    this.menuIDs = [];

    for (const window of Zotero.getMainWindows()) this.removeFromWindow(window);
    this.autoQueue = [];
    this.autoQueuedIDs.clear();
    this.autoQueueRunning = false;
  },

  addToWindow(window) {
    try {
      window.MozXULElement?.insertFTLIfNeeded("research-highlight-ai.ftl");
    } catch (error) {
      Zotero.debug(`[Research Highlight AI] Fluent registration warning: ${error}`);
    }
  },

  removeFromWindow(window) {
    try {
      window.document
        ?.querySelector('link[href="research-highlight-ai.ftl"]')
        ?.remove();
    } catch (_) {}
  },

  registerMenus() {
    const toolsMenuID = Zotero.MenuManager.registerMenu({
      menuID: "research-highlight-ai-tools",
      pluginID: this.id,
      target: "main/menubar/tools",
      menus: [
        {
          menuType: "menuitem",
          l10nID: "research-highlight-ai-menu-batch",
          onCommand: () => void this.runBatchFromCurrentSelection(),
        },
        {
          menuType: "menuitem",
          l10nID: "research-highlight-ai-menu-consolidate",
          onCommand: () => void this.runTopicConsolidator(),
        },
      ],
    });

    const itemMenuID = Zotero.MenuManager.registerMenu({
      menuID: "research-highlight-ai-item-context",
      pluginID: this.id,
      target: "main/library/item",
      menus: [
        {
          menuType: "menuitem",
          l10nID: "research-highlight-ai-menu-batch",
          onShowing: (_event, context) => {
            context.setVisible(Boolean(context.items?.length));
          },
          onCommand: (_event, context) => void this.runBatch(context.items || []),
        },
      ],
    });

    this.menuIDs.push(toolsMenuID, itemMenuID);
  },

  registerNotifier() {
    const observer = {
      notify: async (event, type, ids) => {
        if (event !== "add" || type !== "item") return;
        if (!this.getPrefBool(this.PREFS.autoAnnotate, false)) return;

        Zotero.debug(`[Research Highlight AI] Auto annotate received add:item for ${ids?.length || 0} item(s)`);

        try {
          const items = ids?.length ? await Zotero.Items.getAsync(ids) : [];
          for (const item of items || []) {
            if (!item?.isAnnotation?.()) continue;
            const annotationType = item.annotationType;
            if (annotationType && annotationType !== "highlight") continue;
            this.enqueueAutoAnnotation(item.id);
          }
        } catch (error) {
          Zotero.logError(error);
        }
      },
    };

    this.notifierID = Zotero.Notifier.registerObserver(observer, ["item"]);
  },

  enqueueAutoAnnotation(itemID) {
    if (!itemID || this.autoQueuedIDs.has(itemID)) return;
    this.autoQueuedIDs.add(itemID);
    this.autoQueue.push(itemID);
    if (!this.autoQueueRunning) void this.processAutoQueue();
  },

  async processAutoQueue() {
    if (this.autoQueueRunning) return;
    this.autoQueueRunning = true;

    try {
      while (this.autoQueue.length) {
        const itemID = this.autoQueue.shift();
        this.autoQueuedIDs.delete(itemID);
        await this.sleep(250);

        try {
          const item = await Zotero.Items.getAsync(itemID);
          if (item) await this.annotateItem(item);
        } catch (error) {
          Zotero.logError(error);
        }
      }
    } finally {
      this.autoQueueRunning = false;
    }
  },

  getPrefString(key, fallback = "") {
    const value = Zotero.Prefs.get(key, true);
    if (value === undefined || value === null || value === false) return fallback;
    return String(value).trim();
  },

  getPrefBool(key, fallback = false) {
    const value = Zotero.Prefs.get(key, true);
    return typeof value === "boolean" ? value : fallback;
  },

  getApiKey() {
    const fromPrefs = this.getPrefString(this.PREFS.apiKey);
    if (fromPrefs) return fromPrefs;

    const fromEnv = String(Services.env.get("GROQ_API_KEY") || "").trim();
    if (fromEnv) return fromEnv;

    throw new Error(
      "Groq API key is not configured. Open Zotero Settings → Research Highlight AI and enter your API key."
    );
  },

  getModel() {
    return this.getPrefString(this.PREFS.model, this.DEFAULT_MODEL) || this.DEFAULT_MODEL;
  },

  cleanTag(value) {
    return String(value ?? "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[;,]+/g, "")
      .slice(0, 80);
  },

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  hasTag(item, tagName) {
    return (item.getTags?.() || []).some(
      (entry) => String(entry.tag ?? "") === tagName
    );
  },

  alert(message) {
    Services.prompt.alert(null, "Research Highlight AI", String(message));
  },
};
