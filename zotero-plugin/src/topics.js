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
    const vocabularyText = [...topicCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([topic, count]) => `${topic}\t${count}`)
      .join("\n");

    return `你正在维护一个用于生物医学科研文献检索的 Topic 知识库。

下面给出了当前知识库中的 ai:topic 标签，以及每个 Topic 出现的次数。

你的任务不是建立严格的生物医学 ontology。

你的任务也不只是寻找严格的同义词。

你的核心目标是：

优化 Topic 的“科研检索粒度”。

也就是说：

减少没有必要的 Topic 碎片化，让未来查找文献高亮时更加方便，
但同时保留对实验设计、机制分析、治疗研究、细胞功能研究和受体工程等真正有价值的区别。


==================================================
核心判断问题
==================================================

对于两个或多个 Topic，不要只问：

“它们是不是完全相同的分子或实体？”

更重要的问题是：

“未来进行科研检索时，把这些 Topic 分开保存，是否能够提供明显额外的检索价值？”


如果分开保存几乎不会增加有用信息，只会制造更多零散 Topic，
则可以考虑归并。

如果分开保存能够帮助区分：

- 不同实验对象
- 不同机制节点
- 不同治疗靶点
- 不同工程化对象
- 不同细胞群体
- 不同生物学状态
- 不同来源的信号
- 不同功能问题

则应该保持独立。


==================================================
第一类：应该优先归并
==================================================

以下情况通常应该归并。


1. 单复数差异

例如：

NK-cell
NK-cells

→ NK-cells


2. 大小写、连字符、斜杠、符号或拼写形式不同

例如：

Ox-LDL
ox-LDL
oxLDL
OxLDL

→ OxLDL


3. 公认缩写和完整名称

例如：

MIF
macrophage-migration-inhibitory-factor

可以归并。


4. 同一概念的不同常用名称。


5. Topic 过度 narrow，单独保存的长期检索价值很低。

例如：

Soluble-TNF
TNF-alpha

可以归并到：

TNF-alpha


这种情况下，不需要因为 soluble TNF 在严格生物学定义上属于 TNF 的特定形式，就一定单独保留一个 Topic。

Topic 的目标是检索，而不是建立无限细分的分子本体。


==================================================
第二类：允许进行功能轴归并
==================================================

两个或多个 Topic 即使代表不同分子，
如果在科研文献、治疗研究或机制分析中通常作为一个稳定的功能轴讨论，
并且分别保存的检索收益较低，
可以归并为一个 umbrella Topic。


例如：

PD-1
PD-L1

虽然是两个不同分子，
但大量科研问题实际关注的是：

PD-1/PD-L1 checkpoint axis

因此可以归并为：

PD-1/PD-L1


例如：

TNF-alpha
TNFR1
TNFR2

在知识库检索层面，
如果这些 Topic 主要围绕 TNF signaling 共同出现，
可以归并为：

TNF/TNFR-signaling


这类归并允许创建一个新的 umbrella Topic。


==================================================
第三类：功能关系本身不足以支持归并
==================================================

“两个分子存在配体-受体关系”
并不自动意味着它们应该归并。


一个非常重要的反例是：

CXCL10
CXCR3


它们必须保持独立。


原因是：

CXCL10 在科研检索中可以代表：

- 肿瘤产生的趋化因子
- 组织趋化信号
- 肿瘤表达水平
- 患者预后
- T-cell infiltration
- inflammatory signal


而 CXCR3 可以代表：

- T-cell chemokine receptor
- T-cell migration
- receptor signaling
- GPCR engineering
- receptor expression
- adoptive T-cell therapy


因此：

CXCL10 和 CXCR3 虽然存在配体-受体关系，
但是它们代表两个具有明显独立科研价值的检索入口。

不能归并。


同样：

CXCL9
CXCL10
CXCL11

通常也应该保持独立。

它们虽然都可以作用于 CXCR3，
但不同趋化因子本身具有独立的：

- expression pattern
- tumor biology
- prognosis
- immune infiltration
- experimental relevance


所以不要简单归并成一个 CXCR3-axis。


==================================================
第四类：不要压缩具有重要独立价值的 Topic
==================================================

例如：

CAR-T-cells
T-cells

不要归并。

CAR-T cells 本身就是重要的独立研究对象。


例如：

CD8-T-cells
T-cells

通常不要归并。

CD8 T cells 是重要的实验和免疫学亚群。


例如：

T-cell-exhaustion
T-cell-dysfunction

不要因为 exhaustion 属于更广义的 dysfunction，
就简单归并。

T-cell exhaustion 本身具有明确的机制和科研检索价值。


例如：

CXCR3
CCR5

不能归并。

它们是不同受体，
具有独立的生物学功能和工程价值。


例如：

PD-1/PD-L1
CTLA-4

不能因为它们都是 immune checkpoints 就归并。


==================================================
第五类：如何决定是否创建 umbrella Topic
==================================================

优先使用当前已经存在的 Topic 作为 canonical。

但是，如果两个或多个 Topic 本身属于一个稳定、明确、常用的科研功能轴，
使用已有某一个分子作为 canonical 会造成语义偏斜，
则允许创建新的 umbrella Topic。


例如：

PD-1
PD-L1

最好使用：

PD-1/PD-L1

而不是强行：

PD-L1 → PD-1


例如：

TNF-alpha
TNFR1
TNFR2

可以使用：

TNF/TNFR-signaling


新的 umbrella Topic 必须满足：

1. 简短。

2. 清晰。

3. 能直接看懂包含哪些概念。

4. 适合作为长期科研检索入口。

5. 必须由当前已有 Topics 明确归并而来。

6. 不得凭空创造新的研究概念。

7. 不要使用过度宽泛的词。


禁止创建类似：

immune-signaling
immune-response
cell-function
tumor-biology
cancer-immunity
molecular-pathway

这种几乎没有具体检索价值的宽泛 Topic。


==================================================
第六类：检索价值优先
==================================================

最终判断标准不是 ontology 是否绝对严格。

最终判断标准是：

这个 Topic 结构是否能够让科研人员在几个月甚至几年后，
更快地找到真正相关的文献高亮。


如果两个 Topic 分开保存：

明显有助于未来检索
→ 保持独立。


如果两个 Topic 分开保存：

几乎没有额外价值，只增加词表噪声
→ 可以归并。


如果 Topic 极度 narrow：

导致每篇文章都产生一个新的 Topic，
而未来几乎不会单独搜索它
→ 应该考虑归并。


但是不要为了减少 Topic 数量而强行合并。

Topic 数量少不是目标。

高质量、稳定、好检索才是目标。


==================================================
Canonical 选择原则
==================================================

优先级如下：

1. 更常用的生物医学术语。

2. 更稳定的命名方式。

3. 更适合作为长期检索入口的表达。

4. 当前出现次数更多的表达。

5. 如果已有 Topic 都不能准确代表整个功能轴，可以创建 umbrella Topic。


==================================================
当前 Vocabulary
==================================================

格式：

Topic    出现次数


${vocabularyText}


==================================================
输出要求
==================================================

只输出真正值得归并的 groups。

完全不需要修改的 Topic 不要输出。

每个现有 Topic 最多只能归入一个 canonical。

不要为了追求减少 Topic 数量而过度归并。

优先减少无意义的碎片化，同时保护具有独立科研检索价值的概念。`;
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
