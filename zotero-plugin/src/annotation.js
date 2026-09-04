Object.assign(ResearchHighlightAI, {
  removeGeneratedAITags(item) {
    for (const entry of item.getTags?.() || []) {
      const tag = String(entry.tag ?? "");
      if (
        tag === "ai:done" ||
        tag.startsWith("ai:role:") ||
        tag.startsWith("ai:use:") ||
        tag.startsWith("ai:topic:")
      ) {
        item.removeTag(tag);
      }
    }
  },

  removeExistingAIBlock(comment) {
    const text = String(comment ?? "");
    const index = text.lastIndexOf("[AI]");
    return index < 0 ? text.trim() : text.slice(0, index).trim();
  },

  buildAIBlock(result) {
    return [
      "[AI]",
      result.summary,
      "",
      `Role: ${result.role}`,
      `Topics: ${result.topics.join(", ")}`,
      `Use: ${result.use}`,
    ].join("\n");
  },

  applyAIResult(item, result) {
    const manualComment = this.removeExistingAIBlock(item.annotationComment || "");
    const aiBlock = this.buildAIBlock(result);
    item.annotationComment = manualComment ? `${manualComment}\n\n${aiBlock}` : aiBlock;

    this.removeGeneratedAITags(item);
    item.addTag("ai:done");

    const role = this.cleanTag(result.role);
    if (role) item.addTag(`ai:role:${role}`);

    const use = this.cleanTag(result.use);
    if (use) item.addTag(`ai:use:${use}`);

    const seen = new Set();
    for (const topic of result.topics) {
      const clean = this.cleanTag(topic);
      if (!clean || seen.has(clean)) continue;
      seen.add(clean);
      item.addTag(`ai:topic:${clean}`);
    }
  },

  async getAnnotationContext(annotation) {
    const context = {
      highlight: String(annotation.annotationText || "").trim(),
      title: "",
      abstract: "",
    };

    try {
      const attachmentID = Number(annotation.parentItemID || annotation.parentID || 0);
      const attachment = attachmentID ? await Zotero.Items.getAsync(attachmentID) : null;
      const paperID = Number(attachment?.parentItemID || attachment?.parentID || 0);
      const paper = paperID ? await Zotero.Items.getAsync(paperID) : null;

      if (paper?.isRegularItem?.()) {
        context.title = String(paper.getField("title") || "").trim();
        context.abstract = String(paper.getField("abstractNote") || "").trim();
      }
    } catch (error) {
      Zotero.debug(`[Research Highlight AI] Context lookup warning: ${error}`);
    }

    return context;
  },

  buildAnnotationPrompt(context) {
    return `
You are annotating a biomedical literature highlight for future scientific retrieval.

Return a concise Chinese scientific summary plus structured metadata.

Rules:
1. summary:
   - Chinese.
   - Preserve the scientific meaning of the highlighted text.
   - Use the paper title and abstract only as context for disambiguation.
   - Prefer one compact sentence, or two short sentences when necessary.
   - Do not invent conclusions not supported by the highlight.

2. role:
   - A short lowercase functional label describing what role this highlight plays in scientific reasoning.
   - Examples: mechanism, result, limitation, background, method, hypothesis, evidence, comparison.

3. topics:
   - 1–3 retrieval-oriented scientific topics.
   - Use the smallest sufficient number of topics; usually 1–2.
   - Use 3 only when the highlight contains three clearly independent retrieval axes.
   - Prefer concepts useful as future search/filter keys.
   - Avoid generic labels such as "tumor-biology" or "immune-signaling".
   - Keep independently useful ligand/receptor concepts separate when they serve different retrieval purposes.

4. use:
   - A short lowercase label for likely writing/research use.
   - Examples: introduction, results, discussion, methods, rationale.

Paper title:
${context.title || "(not available)"}

Paper abstract:
${context.abstract || "(not available)"}

Highlight:
${context.highlight}
`.trim();
  },

  async callGroqForAnnotation(context) {
    const response = await fetch(this.GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.getApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.getModel(),
        reasoning_effort: "none",
        temperature: 0,
        messages: [{ role: "user", content: this.buildAnnotationPrompt(context) }],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "research_highlight_annotation",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                summary: { type: "string" },
                role: { type: "string" },
                topics: {
                  type: "array",
                  minItems: 1,
                  maxItems: 3,
                  items: { type: "string" },
                },
                use: { type: "string" },
              },
              required: ["summary", "role", "topics", "use"],
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      const error = new Error(`Groq request failed: HTTP ${response.status}\n${body}`);
      error.status = response.status;
      throw error;
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (!content) throw new Error("Groq response did not contain message.content.");

    const parsed = JSON.parse(content);
    const result = {
      summary: String(parsed.summary ?? "").trim(),
      role: String(parsed.role ?? "").trim(),
      topics: Array.isArray(parsed.topics)
        ? parsed.topics.map((value) => String(value ?? "").trim()).filter(Boolean)
        : [],
      use: String(parsed.use ?? "").trim(),
    };

    if (!result.summary || !result.role || !result.use || !result.topics.length) {
      throw new Error("Groq returned an incomplete annotation result.");
    }
    return result;
  },

  async annotateItem(item) {
    if (!item?.isAnnotation?.()) return { status: "skip-not-annotation" };

    const annotationType = item.annotationType;
    if (annotationType && annotationType !== "highlight") {
      return { status: "skip-not-highlight" };
    }

    const text = String(item.annotationText || "").trim();
    if (!text) return { status: "skip-empty" };
    if (this.hasTag(item, "ai:done")) return { status: "skip-done" };

    const context = await this.getAnnotationContext(item);
    const result = await this.callGroqForAnnotation(context);
    this.applyAIResult(item, result);
    await item.saveTx();
    return { status: "done", result };
  },
});
