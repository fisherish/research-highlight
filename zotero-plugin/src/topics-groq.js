Object.assign(ResearchHighlightAI, {
  TOPIC_CONSOLIDATOR_MAX_TOKENS: 800,

  async callTopicConsolidator(topicCounts) {
    return this.requestStructuredJSON({
      prompt: this.buildConsolidationPrompt(topicCounts),
      schemaName: "topic_consolidation",
      maxTokens: this.TOPIC_CONSOLIDATOR_MAX_TOKENS,
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          groups: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                canonical: { type: "string" },
                members: {
                  type: "array",
                  minItems: 2,
                  items: { type: "string" },
                },
              },
              required: ["canonical", "members"],
            },
          },
        },
        required: ["groups"],
      },
    });
  },
});
