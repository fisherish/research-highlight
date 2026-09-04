Object.assign(ResearchHighlightAI, {
  async collectTopicAnnotations() {
    const annotationIDs = await Zotero.DB.columnQueryAsync(`
      SELECT ia.itemID
      FROM itemAnnotations ia
      LEFT JOIN deletedItems di ON di.itemID = ia.itemID
      WHERE di.itemID IS NULL
    `);
    return annotationIDs.length ? await Zotero.Items.getAsync(annotationIDs) : [];
  },

  collectTopicVocabulary(annotations) {
    const counts = new Map();
    for (const annotation of annotations) {
      if (!annotation?.isAnnotation?.()) continue;
      for (const entry of annotation.getTags?.() || []) {
        const tagName = String(entry.tag || "").trim();
        if (!tagName.startsWith(this.TOPIC_PREFIX)) continue;
        const topic = tagName.slice(this.TOPIC_PREFIX.length).trim();
        if (!topic) continue;
        counts.set(topic, (counts.get(topic) || 0) + 1);
      }
    }
    return counts;
  },

  buildConsolidationPrompt(topicCounts) {
    const vocabulary = [...topicCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([topic, count]) => `${topic}\t${count}`)
      .join("\n");

    return `
You are consolidating AI-generated biomedical literature topics for a researcher's long-term retrieval system.

Your goal is NOT to build a strict molecular ontology.

Primary criterion:
"Will keeping these topics separate provide obvious value for future scientific retrieval?"

Merge when:
- spelling/capitalization variants are the same retrieval concept;
- singular/plural variants have no useful retrieval distinction;
- abbreviations and full names are effectively the same retrieval concept;
- closely related signaling labels have little value as separate filters;
- a carefully chosen umbrella topic improves retrieval without becoming vague.

Examples of acceptable consolidation:
- NK-cell -> NK-cells
- MDSC -> MDSCs
- Ox-LDL / ox-LDL / oxLDL -> OxLDL
- CRISPR-Cas9 -> CRISPR/Cas9
- TGFβ -> TGF-β
- PD1 + PDL1 -> PD-1/PD-L1
- TNF-alpha + TNFR1 + TNFR2 -> TNF/TNFR-signaling

Important counterexample:
- DO NOT merge CXCL10 and CXCR3.
  CXCL10 is useful for ligand-expression retrieval.
  CXCR3 is independently useful for receptor engineering, migration, and trafficking retrieval.

Do NOT create broad garbage umbrella topics such as:
- immune-signaling
- tumor-biology

Be conservative. Return only merge groups that have clear retrieval value.

Each merge group:
- "canonical": final topic name; it may be a new useful umbrella topic.
- "members": existing topic names that should be replaced by canonical.
  Include all source members that should be replaced.

Current topic vocabulary with annotation counts:
${vocabulary}
`.trim();
  },

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

  validateGroups(result, knownTopics) {
    const groups = Array.isArray(result?.groups) ? result.groups : [];
    const usedMembers = new Set();
    const validated = [];

    for (const group of groups) {
      const canonical = String(group?.canonical || "").trim();
      const members = Array.isArray(group?.members)
        ? [...new Set(group.members
            .map((value) => String(value || "").trim())
            .filter((value) => knownTopics.has(value)))]
        : [];

      if (!canonical || members.length < 2) continue;
      if (members.some((member) => usedMembers.has(member))) continue;
      for (const member of members) usedMembers.add(member);
      validated.push({ canonical, members });
    }
    return validated;
  },

  async applyTopicGroups(annotations, groups) {
    const replacement = new Map();
    for (const group of groups) {
      for (const member of group.members) replacement.set(member, group.canonical);
    }

    let annotationsChanged = 0;
    let topicTagsReplaced = 0;

    for (const annotation of annotations) {
      if (!annotation?.isAnnotation?.()) continue;

      const currentTopics = (annotation.getTags?.() || [])
        .map((entry) => String(entry.tag || "").trim())
        .filter((tag) => tag.startsWith(this.TOPIC_PREFIX))
        .map((tag) => tag.slice(this.TOPIC_PREFIX.length));

      const additions = new Set();
      const removals = [];
      for (const topic of currentTopics) {
        const canonical = replacement.get(topic);
        if (!canonical || canonical === topic) continue;
        removals.push(topic);
        additions.add(canonical);
      }
      if (!removals.length) continue;

      for (const topic of removals) {
        annotation.removeTag(`${this.TOPIC_PREFIX}${topic}`);
        topicTagsReplaced++;
      }
      for (const topic of additions) {
        const clean = this.cleanTag(topic);
        if (clean) annotation.addTag(`${this.TOPIC_PREFIX}${clean}`);
      }

      await annotation.saveTx();
      annotationsChanged++;
    }
    return { annotationsChanged, topicTagsReplaced };
  },

  async runTopicConsolidator() {
    if (this.consolidatorRunning) {
      this.alert("Consolidate AI Topics is already running.");
      return;
    }

    this.consolidatorRunning = true;
    try {
      const annotations = await this.collectTopicAnnotations();
      const topicCounts = this.collectTopicVocabulary(annotations);
      if (!topicCounts.size) {
        this.alert("No ai:topic:* tags were found.");
        return;
      }

      const result = await this.callTopicConsolidator(topicCounts);
      const groups = this.validateGroups(result, new Set(topicCounts.keys()));
      const topicTagsScanned = [...topicCounts.values()].reduce((sum, value) => sum + value, 0);

      if (!groups.length) {
        this.alert([
          `Topic tags scanned: ${topicTagsScanned}`,
          `Unique topics: ${topicCounts.size}`,
          "No safe synonym merges found.",
        ].join("\n"));
        return;
      }

      const stats = await this.applyTopicGroups(annotations, groups);
      const mergeLines = groups.map((group) => `${group.members.join(", ")} -> ${group.canonical}`);
      this.alert([
        `Topic tags scanned: ${topicTagsScanned}`,
        `Unique topics: ${topicCounts.size}`,
        `Merge groups: ${groups.length}`,
        `Annotations changed: ${stats.annotationsChanged}`,
        `Topic tags replaced: ${stats.topicTagsReplaced}`,
        "",
        ...mergeLines,
      ].join("\n"));
    } catch (error) {
      Zotero.logError(error);
      this.alert(`Consolidate AI Topics failed:\n${error.message || error}`);
    } finally {
      this.consolidatorRunning = false;
    }
  },
});
