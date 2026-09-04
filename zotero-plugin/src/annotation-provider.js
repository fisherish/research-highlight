Object.assign(ResearchHighlightAI, {
  async callGroqForAnnotation(context) {
    const parsed = await this.requestStructuredJSON({
      prompt: this.buildAnnotationPrompt(context),
      schemaName: "research_highlight_annotation",
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
    });

    const result = {
      summary: String(parsed.summary ?? "").trim(),
      role: String(parsed.role ?? "").trim(),
      topics: Array.isArray(parsed.topics)
        ? parsed.topics.map((value) => String(value ?? "").trim()).filter(Boolean)
        : [],
      use: String(parsed.use ?? "").trim(),
    };

    if (!result.summary || !result.role || !result.use || !result.topics.length) {
      throw new Error("AI returned an incomplete annotation result.");
    }
    return result;
  },
});
