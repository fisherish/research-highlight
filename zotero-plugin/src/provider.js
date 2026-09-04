ResearchHighlightAI.PREFS.endpoint = "extensions.researchHighlightAI.endpoint";

Object.assign(ResearchHighlightAI, {
  PROVIDER_TEMPLATES: {
    groq: {
      label: "Groq",
      endpoint: "https://api.groq.com/openai/v1/chat/completions",
      model: "qwen/qwen3.8-27b",
      envKey: "GROQ_API_KEY",
    },
    openai: {
      label: "OpenAI",
      endpoint: "https://api.openai.com/v1/chat/completions",
      model: "gpt-4.1-mini",
      envKey: "OPENAI_API_KEY",
    },
    openrouter: {
      label: "OpenRouter",
      endpoint: "https://openrouter.ai/api/v1/chat/completions",
      model: "openai/gpt-oss-20b",
      envKey: "OPENROUTER_API_KEY",
    },
    custom: {
      label: "Custom OpenAI-compatible",
      endpoint: "",
      model: "",
      envKey: "",
    },
  },

  getProviderName() {
    const value = this.getPrefString(this.PREFS.provider, "groq").toLowerCase();
    return this.PROVIDER_TEMPLATES[value] ? value : "groq";
  },

  getProviderTemplate() {
    return this.PROVIDER_TEMPLATES[this.getProviderName()] || this.PROVIDER_TEMPLATES.groq;
  },

  getApiEndpoint() {
    const provider = this.getProviderName();
    const template = this.getProviderTemplate();
    const saved = this.getPrefString(this.PREFS.endpoint);
    if (!saved) return template.endpoint;

    if (provider !== "custom") {
      const presetEndpoints = new Set(
        Object.values(this.PROVIDER_TEMPLATES)
          .map((entry) => entry.endpoint)
          .filter(Boolean)
      );
      if (presetEndpoints.has(saved) && saved !== template.endpoint) {
        return template.endpoint;
      }
    }
    return saved;
  },

  getApiKey() {
    const provider = this.getProviderName();
    const template = this.getProviderTemplate();
    const fromPrefs = this.getPrefString(this.PREFS.apiKey);
    if (fromPrefs) return fromPrefs;

    if (template.envKey) {
      const fromEnv = String(Services.env.get(template.envKey) || "").trim();
      if (fromEnv) return fromEnv;
    }

    if (provider === "custom") return "";
    throw new Error(
      `${template.label} API key is not configured. Open Zotero Settings → Research Highlight AI and enter your API key.`
    );
  },

  getModel() {
    const provider = this.getProviderName();
    const template = this.getProviderTemplate();
    const saved = this.getPrefString(this.PREFS.model);
    if (!saved) return template.model;

    if (provider !== "custom") {
      const presetModels = new Set(
        Object.values(this.PROVIDER_TEMPLATES)
          .map((entry) => entry.model)
          .filter(Boolean)
      );
      if (presetModels.has(saved) && saved !== template.model) {
        return template.model;
      }
    }
    return saved;
  },

  buildProviderRequestBody({ prompt, schemaName, schema, maxTokens = null }) {
    const provider = this.getProviderName();
    const body = {
      model: this.getModel(),
      temperature: 0,
      messages: [{ role: "user", content: prompt }],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: schemaName,
          strict: true,
          schema,
        },
      },
    };

    if (provider === "groq") {
      body.reasoning_effort = "none";
    }
    if (provider === "openrouter") {
      body.provider = { require_parameters: true };
    }
    if (maxTokens) {
      if (provider === "openai") body.max_completion_tokens = maxTokens;
      else body.max_tokens = maxTokens;
    }
    return body;
  },

  extractChatCompletionContent(payload) {
    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content === "string") return content.trim();
    if (Array.isArray(content)) {
      return content
        .map((part) => (typeof part === "string" ? part : String(part?.text || "")))
        .join("")
        .trim();
    }
    return "";
  },

  parseStructuredJSON(text) {
    const value = String(text || "").trim();
    if (!value) throw new Error("AI response did not contain message.content.");
    try {
      return JSON.parse(value);
    } catch (_) {
      const fenced = value.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
      if (fenced) return JSON.parse(fenced[1]);
      throw new Error("AI response was not valid JSON.");
    }
  },

  async requestStructuredJSON({ prompt, schemaName, schema, maxTokens = null }) {
    const provider = this.getProviderName();
    const template = this.getProviderTemplate();
    const endpoint = this.getApiEndpoint();
    if (!endpoint) {
      throw new Error("Custom API endpoint is not configured.");
    }
    if (!this.getModel()) {
      throw new Error("Model ID is not configured.");
    }

    const headers = { "Content-Type": "application/json" };
    const apiKey = this.getApiKey();
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(
        this.buildProviderRequestBody({ prompt, schemaName, schema, maxTokens })
      ),
    });

    if (!response.ok) {
      const body = await response.text();
      const error = new Error(
        `${template.label} request failed: HTTP ${response.status}\n${body}`
      );
      error.status = response.status;
      error.provider = provider;
      error.endpoint = endpoint;
      throw error;
    }

    const payload = await response.json();
    return this.parseStructuredJSON(this.extractChatCompletionContent(payload));
  },
});
