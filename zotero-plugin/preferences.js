window.ResearchHighlightAIPrefs = {
  PREFS: {
    provider: "extensions.researchHighlightAI.provider",
    endpoint: "extensions.researchHighlightAI.endpoint",
    apiKey: "extensions.researchHighlightAI.apiKey",
    model: "extensions.researchHighlightAI.model",
    autoAnnotate: "extensions.researchHighlightAI.autoAnnotate",
  },

  presets: {
    groq: {
      endpoint: "https://api.groq.com/openai/v1/chat/completions",
      model: "qwen/qwen3.8-27b",
    },
    openai: {
      endpoint: "https://api.openai.com/v1/chat/completions",
      model: "gpt-4.1-mini",
    },
    openrouter: {
      endpoint: "https://openrouter.ai/api/v1/chat/completions",
      model: "openai/gpt-oss-20b",
    },
  },

  init() {
    if (this.initialized) return;
    this.initialized = true;

    this.provider = document.getElementById("research-highlight-ai-provider");
    this.apiKey = document.getElementById("research-highlight-ai-api-key");
    this.endpoint = document.getElementById("research-highlight-ai-endpoint");
    this.model = document.getElementById("research-highlight-ai-model");
    this.autoAnnotate = document.getElementById("research-highlight-ai-auto-annotate");
    this.testButton = document.getElementById("research-highlight-ai-test");
    this.advancedToggle = document.getElementById("research-highlight-ai-advanced-toggle");
    this.advancedPanel = document.getElementById("research-highlight-ai-advanced-panel");

    const providerName = this.getProviderName();
    this.provider.value = providerName;
    this.normalizePresetFields(providerName);

    this.apiKey.value = this.getPrefString(this.PREFS.apiKey);
    this.endpoint.value = this.getPrefString(this.PREFS.endpoint, this.presets[providerName]?.endpoint || "");
    this.model.value = this.getPrefString(this.PREFS.model, this.presets[providerName]?.model || "");
    this.autoAnnotate.checked = this.getPrefBool(this.PREFS.autoAnnotate, false);

    this.setAdvancedVisible(providerName === "custom");

    this.provider.addEventListener("command", () => this.onProviderChanged());
    this.apiKey.addEventListener("input", () => this.setPref(this.PREFS.apiKey, this.apiKey.value));
    this.endpoint.addEventListener("input", () => this.setPref(this.PREFS.endpoint, this.endpoint.value));
    this.model.addEventListener("input", () => this.setPref(this.PREFS.model, this.model.value));
    this.autoAnnotate.addEventListener("command", () => this.setPref(this.PREFS.autoAnnotate, Boolean(this.autoAnnotate.checked)));
    this.testButton.addEventListener("command", () => void this.testConnection());
    this.advancedToggle.addEventListener("command", () => this.setAdvancedVisible(this.advancedPanel.hidden));
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

  setPref(key, value) {
    Zotero.Prefs.set(key, value, true);
  },

  getProviderName() {
    const value = this.getPrefString(this.PREFS.provider, "groq").toLowerCase();
    return value === "openai" || value === "openrouter" || value === "custom" ? value : "groq";
  },

  normalizePresetFields(providerName) {
    const preset = this.presets[providerName];
    if (!preset) return;

    const knownEndpoints = new Set(Object.values(this.presets).map((entry) => entry.endpoint));
    const knownModels = new Set(Object.values(this.presets).map((entry) => entry.model));
    const savedEndpoint = this.getPrefString(this.PREFS.endpoint);
    const savedModel = this.getPrefString(this.PREFS.model);

    if (!savedEndpoint || (knownEndpoints.has(savedEndpoint) && savedEndpoint !== preset.endpoint)) {
      this.setPref(this.PREFS.endpoint, preset.endpoint);
    }
    if (!savedModel || (knownModels.has(savedModel) && savedModel !== preset.model)) {
      this.setPref(this.PREFS.model, preset.model);
    }
  },

  onProviderChanged() {
    const providerName = String(this.provider.value || "groq");
    this.setPref(this.PREFS.provider, providerName);

    const preset = this.presets[providerName];
    if (preset) {
      this.endpoint.value = preset.endpoint;
      this.model.value = preset.model;
      this.setPref(this.PREFS.endpoint, preset.endpoint);
      this.setPref(this.PREFS.model, preset.model);
      this.setAdvancedVisible(false);
    } else {
      this.setAdvancedVisible(true);
    }
    this.clearStatus();
  },

  setAdvancedVisible(visible) {
    this.advancedPanel.hidden = !visible;
    const l10nID = visible
      ? "research-highlight-ai-prefs-advanced-hide"
      : "research-highlight-ai-prefs-advanced-show";
    document.l10n?.setAttributes(this.advancedToggle, l10nID);
  },

  clearStatus() {
    const status = document.getElementById("research-highlight-ai-test-status");
    if (!status) return;
    status.removeAttribute("data-l10n-id");
    status.textContent = "";
    status.className = "research-highlight-ai-test-status";
  },

  setStatusL10n(id, state = "") {
    const status = document.getElementById("research-highlight-ai-test-status");
    if (!status) return;
    status.textContent = "";
    status.className = `research-highlight-ai-test-status ${state}`.trim();
    document.l10n?.setAttributes(status, id);
  },

  setStatusText(text, state = "") {
    const status = document.getElementById("research-highlight-ai-test-status");
    if (!status) return;
    status.removeAttribute("data-l10n-id");
    status.textContent = String(text || "");
    status.className = `research-highlight-ai-test-status ${state}`.trim();
  },

  async testConnection() {
    if (this.testing) return;

    const provider = String(this.provider.value || "groq");
    const endpoint = String(this.endpoint.value || "").trim();
    const model = String(this.model.value || "").trim();
    const apiKey = String(this.apiKey.value || "").trim();

    this.setPref(this.PREFS.provider, provider);
    this.setPref(this.PREFS.endpoint, endpoint);
    this.setPref(this.PREFS.model, model);
    this.setPref(this.PREFS.apiKey, apiKey);

    if (!endpoint || !model) {
      this.setStatusL10n("research-highlight-ai-prefs-test-missing-config", "error");
      return;
    }
    if (provider !== "custom" && !apiKey) {
      this.setStatusL10n("research-highlight-ai-prefs-test-missing-key", "error");
      return;
    }

    this.testing = true;
    this.testButton.disabled = true;
    this.setStatusL10n("research-highlight-ai-prefs-testing", "testing");

    const body = {
      model,
      temperature: 0,
      messages: [{ role: "user", content: "Return JSON with ok set to true." }],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "connection_test",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: { ok: { type: "boolean" } },
            required: ["ok"],
          },
        },
      },
    };

    if (provider === "groq") body.reasoning_effort = "none";
    if (provider === "openrouter") body.provider = { require_parameters: true };
    if (provider === "openai") body.max_completion_tokens = 32;
    else body.max_tokens = 32;

    const headers = { "Content-Type": "application/json" };
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const text = (await response.text()).replace(/\s+/g, " ").trim();
        throw new Error(`HTTP ${response.status}${text ? `: ${text.slice(0, 180)}` : ""}`);
      }

      const payload = await response.json();
      const rawContent = payload?.choices?.[0]?.message?.content;
      const content = Array.isArray(rawContent)
        ? rawContent.map((part) => typeof part === "string" ? part : String(part?.text || "")).join("")
        : rawContent;
      const parsed = typeof content === "string" ? JSON.parse(content) : null;
      if (!parsed || parsed.ok !== true) throw new Error("Unexpected response format");

      this.setStatusL10n("research-highlight-ai-prefs-test-success", "success");
    } catch (error) {
      this.setStatusText(String(error?.message || error), "error");
    } finally {
      this.testing = false;
      this.testButton.disabled = false;
    }
  },
};
