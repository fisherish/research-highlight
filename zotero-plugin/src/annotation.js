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
    };

    try {
      const attachmentID = Number(annotation.parentItemID || annotation.parentID || 0);
      const attachment = attachmentID ? await Zotero.Items.getAsync(attachmentID) : null;
      const paperID = Number(attachment?.parentItemID || attachment?.parentID || 0);
      const paper = paperID ? await Zotero.Items.getAsync(paperID) : null;

      if (paper?.isRegularItem?.()) {
        context.title = String(paper.getField("title") || "").trim();
      }
    } catch (error) {
      Zotero.debug(`[Research Highlight AI] Context lookup warning: ${error}`);
    }

    return context;
  },

  buildAnnotationPrompt(context) {
    const title = context.title || "";
    const highlight = context.highlight || "";

    return `你正在协助维护一个生物医学科研文献高亮知识库.

这些高亮来自科研人员在阅读论文时主动保存的, 认为未来可能有价值的段落.

知识库的目标是让这些零散高亮在未来能够被快速检索, 重新理解, 并用于科研写作, 机制分析, 实验设计和研究思路整理.

你的任务是根据当前高亮, 提炼它最值得长期保存的信息, 并赋予简洁, 稳定, 便于检索的结构化标注.

论文标题:

${title}

高亮原文:

${highlight}

请生成:

summary:

用中文 1-2 句话概括最值得保存的核心信息, 以高亮中明确陈述的事实和关系为依据.

role:

background / mechanism / method / result / limitation /

definition / hypothesis / application / other

topics:

提取 1-3 个最有检索价值的英文主题词, 优先具体的分子、细胞、通路、模型和关键生物学概念.

use:

introduction / discussion / method / idea / figure / none

关注这段高亮本身最有长期检索价值的信息.

role 表示它是什么类型的知识, use 表示未来最可能怎么使用.`;
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
