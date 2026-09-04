Object.assign(ResearchHighlightAI, {
  TOPIC_CONSOLIDATOR_MAX_TOKENS: 600,

  async callTopicConsolidator(topicCounts) {
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
        max_tokens: this.TOPIC_CONSOLIDATOR_MAX_TOKENS,
        messages: [{ role: "user", content: this.buildConsolidationPrompt(topicCounts) }],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "topic_consolidation",
            strict: true,
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
                      members: { type: "array", minItems: 2, items: { type: "string" } },
                    },
                    required: ["canonical", "members"],
                  },
                },
              },
              required: ["groups"],
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
    return JSON.parse(payload?.choices?.[0]?.message?.content || '{"groups":[]}');
  },
});
