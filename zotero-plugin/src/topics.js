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

你的任务不是建立严格的生物医学 ontology，也不是尽可能减少 Topic 数量。

你的目标是优化 Topic 的科研检索粒度：

- 主动减少没有必要的命名碎片和近重复 Topic；
- 同时保留对实验设计、机制分析、治疗研究、细胞功能、疾病背景和受体工程真正有价值的区别。

==================================================
核心判断：检索结果是否会明显不同
==================================================

对于两个 Topic，不要只问它们在严格定义上是否完全相同。

更重要的问题是：

“未来检索文献高亮时，把它们分开保存，是否通常会得到明显不同、且有用的一组信息？”

如果答案是否定的，且两个 Topic 指向基本相同的研究对象或概念，可以归并。

如果答案是肯定的，应该保持独立。

请采用适度保守的策略，而不是极端保守。

不要因为存在一点语义差异就拒绝所有归并；
但也不要仅因为两个 Topic 相关、上下游、经常共现或属于同一大主题就归并。

==================================================
应该积极考虑归并的情况
==================================================

1. 单复数差异。

例如：
NK-cell
NK-cells
→ NK-cells

2. 大小写、连字符、斜杠、希腊字母、符号或拼写形式不同。

例如：
Ox-LDL
ox-LDL
oxLDL
OxLDL
→ OxLDL

3. 公认缩写和完整名称，且指向同一概念。

例如：
MIF
macrophage-migration-inhibitory-factor
→ MIF

4. 同一实体或同一生物学概念的常用命名变体。

5. 同一核心概念的轻微措辞差异。

如果附加词只是描述性措辞，并没有形成独立的实验对象、状态、功能、模型、治疗问题或 readout，可以考虑归并。

例如，一个 Topic 只是另一个 Topic 的冗余命名版本，分开搜索通常不会带来新的科研信息，就可以合并。

6. 极度 narrow 的同一实体表述，且 narrow 版本几乎没有独立检索价值。

例如：
Soluble-TNF
TNF-alpha
可以考虑归并到 TNF-alpha。

==================================================
功能轴归并：允许，但要有稳定科研语义
==================================================

不同实体并不意味着绝对不能归并。

如果几个 Topic 在生物医学研究中长期、稳定地作为一个固定功能轴共同讨论，而且分别保存的检索收益较低，可以创建 umbrella Topic。

典型例子：

PD-1
PD-L1
→ PD-1/PD-L1

TNF-alpha
TNFR1
TNFR2

在确实主要用于整体 TNF/TNFR signaling 检索时，可以考虑：

→ TNF/TNFR-signaling

但不要把这条规则泛化到所有配体-受体、上下游分子或同一路径成员。

==================================================
以下关系通常应该保持独立
==================================================

如果下面的区别会明显改变未来的检索用途，通常不要归并：

- 总类 与 具有重要实验意义的亚型
- 细胞类型 与 细胞状态
- 细胞类型 与 phenotype / marker
- 分子 与 通路
- 通路 与 下游 readout
- 受体 与 配体
- 受体 与 engineering construct
- 信号通路 与 DREADD / CAR / transgene 等工程工具
- 生物学状态 与 诱导该状态的实验模型
- 疾病 与 微环境
- 不同解剖或组织微环境
- 治疗方式 与 治疗反应或耐药
- broad process 与 具体 effector function
- broad process 与 具体 cytokine / metabolite / enzyme / pathway

==================================================
重要边界实例
==================================================

以下这些归并过度，应该保持独立：

CD8+-T-cell-dysfunction
CD8+-T-cell-exhaustion

CAR-T-cells
CAR-T-cell-therapy

Gαs-signaling
Gαs-GPCRs
Gnas-PKA-axis
Gαs-DREADD
pCREB-induction

MDSCs
G-MDSC

macrophages
macrophage-phenotype
macrophage-markers

T-cell-activation
CD8+-T-cell-cytotoxicity

immune-checkpoint
anti-PD-1-resistance

T-cell-exhaustion
LCMV-chronic-infection-model
OT-1-transgenic-mice

inflammation
PGE2
IL-10
IL-2
JAK-STAT-signaling
ROS/NO
ARG1
metabolic-reprogramming

Tumor-microenvironment
bone-marrow-microenvironment
AML

这些例子的共同原因不是它们彼此无关，而是分开检索能够保留明显不同的科研信息。

==================================================
配体-受体关系本身不足以支持归并
==================================================

CXCL10
CXCR3

应该保持独立。

CXCL10 可以用于检索肿瘤或组织产生的趋化信号、表达水平、预后和免疫浸润；
CXCR3 可以用于检索 T-cell migration、receptor signaling、receptor expression 和 GPCR engineering。

同样：

CXCL9
CXCL10
CXCL11

通常也应彼此独立，因为不同趋化因子的表达、生物学和实验意义可以不同。

==================================================
避免 broad Topic 成为“吸尘器”
==================================================

不要让宽泛 Topic 自动吞并具体且有独立检索价值的概念。

例如：

inflammation
immune-checkpoint
tumor-microenvironment
T-cell-activation
T-cell-exhaustion
macrophages
MDSCs

都不应该仅因为语义上更宽泛，就把相关的具体分子、状态、模型或功能全部吸收进去。

==================================================
Canonical 选择原则
==================================================

如果决定归并，优先选择：

1. 更常用的生物医学术语；
2. 更稳定的命名方式；
3. 更适合作为长期检索入口的表达；
4. 当前出现次数更多的表达；
5. 如果现有 Topic 都不能准确代表一个稳定功能轴，可以创建简短、明确的 umbrella Topic。

==================================================
最终判定
==================================================

对每个候选 group，综合判断：

1. 是否属于同一实体、同一概念或高度重叠的检索入口？
2. 分开保存是否真的能带来明显额外的科研检索价值？
3. 归并后是否会丢失重要的实验对象、机制节点、状态、模型、疾病、治疗问题或 readout 信息？
4. 如果不是同一概念，是否存在稳定、常用、明确的功能轴表达？

如果 1 较强、2 较弱、3 为否，可以积极归并。

如果 2 或 3 明显成立，则保持独立。

不要要求绝对同义才允许合并，但也不要把“相关”当作“应该合并”。

==================================================
当前 Vocabulary
==================================================

格式：

Topic    出现次数

${vocabularyText}

==================================================
输出要求
==================================================

只输出值得归并的 groups。

完全不需要修改的 Topic 不要输出。

每个现有 Topic 最多只能归入一个 canonical。

优先减少近重复和无意义碎片，同时保护真正有独立科研检索价值的概念。

不要为了追求更少的 Topic 数量而强行合并。`;
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
        max_tokens: 800,
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
          "No high-confidence merges found.",
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