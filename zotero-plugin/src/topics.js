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

你的任务也不是尽可能减少 Topic 数量。

你的核心目标是：

只消除那些几乎没有独立科研检索价值的命名碎片，
同时最大限度保留不同分子、细胞、状态、模型、机制、治疗方式、实验读出和疾病背景之间的区别。

==================================================
总原则：默认不合并
==================================================

请采用非常保守的策略。

如果你不能非常确定两个 Topic 在未来科研检索中应当被视为同一个入口，
就不要合并。

宁可保留一些冗余 Topic，
也不要把有独立科研价值的概念错误压缩到一起。

输出 0 个 merge groups 完全可以接受。

“相关”“属于同一路径”“经常共同出现”“存在上下游关系”“存在父子类关系”
都不足以支持归并。

只有当分开保存几乎不会提供额外检索价值时，才考虑合并。

==================================================
优先允许归并的情况
==================================================

以下情况通常可以归并：

1. 单复数差异。

例如：
NK-cell
NK-cells
→ NK-cells

2. 大小写、连字符、斜杠、希腊字母、符号或拼写形式差异。

例如：
Ox-LDL
ox-LDL
oxLDL
OxLDL
→ OxLDL

3. 公认缩写和完整名称，且确实指向同一概念。

例如：
MIF
macrophage-migration-inhibitory-factor
→ MIF

4. 同一实体的不同常用命名。

5. 极度 narrow 的同一实体表述，且 narrow 版本几乎没有独立检索价值。

例如：
Soluble-TNF
TNF-alpha
可以考虑归并到 TNF-alpha。

==================================================
高风险关系：默认保持独立
==================================================

以下关系即使高度相关，也默认不要归并：

- 总类 与 亚型
- 细胞类型 与 细胞状态
- 细胞类型 与 phenotype
- 细胞类型 与 marker
- 分子 与 通路
- 通路 与 下游 readout
- 受体 与 配体
- 受体 与 receptor engineering construct
- 信号通路 与 DREADD / CAR / transgene 等工程化工具
- 生物学状态 与 诱导该状态的模型
- 疾病 与 微环境
- 微环境 与 其中出现的细胞或分子
- 治疗方式 与 治疗反应/耐药
- broad process 与 具体 effector function
- broad process 与 具体 cytokine / metabolite / enzyme / pathway

一个简单判断方法：

如果科研人员未来可能单独搜索其中任意一个 Topic，
那么它们就应该保持独立。

==================================================
明确禁止的过度归并实例
==================================================

以下示例必须保持独立，不要归并：

CD8+-T-cell-dysfunction
CD8+-T-cell-exhaustion

原因：dysfunction 与 exhaustion 不是同义词，exhaustion 是具有独立机制和实验定义的状态。

CAR-T-cells
CAR-T-cell-therapy

原因：一个是工程化细胞对象，一个是治疗方式，未来检索用途不同。

Gαs-signaling
Gαs-GPCRs
Gnas-PKA-axis
Gαs-DREADD
pCREB-induction

原因：它们分别代表信号类别、受体类别、具体轴、工程工具和实验读出，不能压缩成一个 Topic。

MDSCs
G-MDSC

原因：G-MDSC 是具有独立实验与生物学价值的亚群，不应被总类吞并。

macrophages
macrophage-phenotype
macrophage-markers

原因：细胞对象、表型问题和标志物问题是不同检索入口。

T-cell-activation
CD8+-T-cell-cytotoxicity

原因：activation 与 cytotoxicity 是不同功能问题。

immune-checkpoint
anti-PD-1-resistance

原因：检查点概念与特定治疗耐药问题具有明显独立检索价值。

T-cell-exhaustion
LCMV-chronic-infection-model
OT-1-transgenic-mice

原因：生物学状态和实验模型必须分开保存。

inflammation
PGE2
IL-10
IL-2
JAK-STAT-signaling
ROS/NO
ARG1
metabolic-reprogramming

原因：广义炎症不能吸收具体细胞因子、代谢物、酶、通路和代谢状态。

Tumor-microenvironment
bone-marrow-microenvironment
AML

原因：不同微环境和疾病背景是独立检索轴。

==================================================
配体-受体关系通常不足以支持归并
==================================================

CXCL10
CXCR3

必须保持独立。

CXCL10 可用于检索：
- tumor-derived chemokine
- tissue chemotactic signal
- tumor expression
- prognosis
- T-cell infiltration

CXCR3 可用于检索：
- T-cell chemokine receptor
- T-cell migration
- receptor signaling
- GPCR engineering
- receptor expression

同样：

CXCL9
CXCL10
CXCL11

通常也应该彼此独立。

不要因为它们共同作用于 CXCR3 就归并成 CXCR3-axis。

==================================================
功能轴归并：只作为极少数例外
==================================================

功能轴归并不是默认策略，只能在非常明确的情况下使用。

只有同时满足以下条件时，才可以把不同实体归并成 umbrella Topic：

1. 这些成员在生物医学文献中长期、稳定地作为一个固定功能轴共同命名。
2. 未来大多数检索场景确实会把它们作为一个整体查找。
3. 分别保留成员几乎不会增加有用的科研检索信息。
4. umbrella Topic 必须具体、稳定、容易理解。
5. 不能跨越“分子 / 细胞 / 状态 / 模型 / 疾病 / readout / 工程工具”等不同语义类型强行归并。

允许的典型例子：

PD-1
PD-L1
→ PD-1/PD-L1

这是因为 PD-1/PD-L1 是长期稳定、广泛使用的 checkpoint axis 表达。

但是不要把这条规则泛化到所有有上下游关系的分子。

TNF-alpha
TNFR1
TNFR2

只有当当前知识库中的这些 Topic 明显主要作为一个整体的 TNF/TNFR signaling axis 使用，
而不是分别用于 TNF ligand、TNFR1、TNFR2 的独立机制检索时，
才可以考虑归并为 TNF/TNFR-signaling。

如果存在明显独立检索价值，就保持分开。

==================================================
禁止 broad Topic 吸收 specific Topic
==================================================

以下 broad Topic 不能作为“吸尘器”吞并具体概念：

inflammation
immune-checkpoint
tumor-microenvironment
T-cell-activation
T-cell-exhaustion
macrophages
MDSCs
immune-signaling
immune-response
cell-function
tumor-biology
cancer-immunity
molecular-pathway

如果一个 canonical 明显比成员更宽泛，
而成员本身有独立科研意义，
则不要归并。

==================================================
Canonical 选择原则
==================================================

如果确实需要归并，优先级如下：

1. 更常用的生物医学术语。
2. 更稳定的命名方式。
3. 更适合作为长期检索入口的表达。
4. 当前出现次数更多的表达。
5. 新建 umbrella Topic 仅限非常明确、稳定的固定功能轴。

==================================================
最终判定问题
==================================================

对每个候选 merge group，在输出前必须依次问：

1. 这些 Topic 是否实际上只是同一概念的不同命名？
   如果是，可以归并。

2. 如果不是同一概念，它们是否属于一个极其稳定、固定命名的功能轴？
   如果不是，不要归并。

3. 如果未来科研人员单独搜索任意一个成员，是否可能得到不同且有用的结果？
   如果是，不要归并。

4. canonical 是否会比成员更宽泛，从而丢失实验对象、机制节点、状态、模型、疾病或 readout 信息？
   如果会，不要归并。

5. 是否只是因为这些 Topic 相关、上下游、共现或属于同一主题而想合并？
   如果是，不要归并。

只有全部通过后才输出该 group。

==================================================
当前 Vocabulary
==================================================

格式：

Topic    出现次数

${vocabularyText}

==================================================
输出要求
==================================================

只输出高度确定、真正值得归并的 groups。

完全不需要修改的 Topic 不要输出。

每个现有 Topic 最多只能归入一个 canonical。

不要为了减少 Topic 数量而制造 umbrella Topic。

宁可少合并，也不要错合并。

如果没有高置信度归并，返回空 groups。`;
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
