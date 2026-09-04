<p align="center">
  <img src="assets/brand/research-highlight-icon.svg" width="150" alt="Research Highlight icon" />
</p>

<h1 align="center">Research Highlight</h1>

<p align="center"><strong>把文献高亮变成可重复利用的科研知识。</strong></p>

<p align="center">
  面向 Zotero 与 Obsidian 的本地优先科研知识层。
</p>

<p align="center">
  <a href="README.md">English</a> · <strong>简体中文</strong>
</p>

---

科研人员在阅读论文并划下高亮时，其实已经完成了一次最重要的信息筛选：**判断什么值得以后再看。**

**Research Highlight** 在这个动作之后继续工作。它为高亮补充结构化 AI 元数据，并把原本散落在不同论文里的重要段落变成可以跨文献检索、回顾和重新利用的科研知识。

目前项目由两个相互配合的插件组成：

| 使用端 | 模块 | 作用 |
| --- | --- | --- |
| Zotero | **Research Highlight AI** | 为高亮生成摘要、知识类型、主题和未来用途等结构化信息 |
| Obsidian | **Research Highlight Dashboard** | 跨论文搜索、筛选、回顾高亮，并快速跳回 Zotero 原文 |

Zotero 始终是数据的 **source of truth**。ZotLit Companion 与 ZotLit 目前负责 Zotero 和 Obsidian 之间的数据同步。

## Research Highlight 做什么

一条普通高亮不再只是某篇 PDF 里的一句彩色文字，而会变成一个结构化的科研信息单元：

```text
Zotero 高亮
    ↓
Research Highlight AI
    ↓
summary + role + topics + use
    ↓
Zotero annotation metadata
    ↓
ZotLit Companion / ZotLit
    ↓
Research Highlight Dashboard
    ↓
搜索 · 筛选 · 回顾 · 跳回 Zotero
```

生成的信息会直接保存在 Zotero annotation 中，人可以直接阅读：

```text
[AI]
中文 summary

Role: limitation
Topics: CAR-T cells, solid tumors, tumor microenvironment
Use: discussion
```

同时也会以统一的 `ai:*` tags 保存，用于后续检索和筛选。

## 设计理念

**从高亮开始，而不是从整篇 PDF 开始。** Research Highlight 只处理研究者主动保存的内容，不把一篇论文中的每一句话都当成同等重要的信息。

**不只是摘要，而是结构化。** 每条高亮不仅可以有简短总结，还可以获得 Role、Topics 和 Use 等长期可检索字段。

**Zotero 仍然是数据中心。** 插件直接增强已有 annotation，不建立第二套高亮数据库，也不会把用户锁在新的数据格式里。

**Local-first。** 核心科研元数据保存在用户已有的 Zotero / Obsidian 工作流中，不依赖专有云端数据库。

**模型供应商可替换。** Research Highlight AI 支持 Groq、OpenAI、OpenRouter，以及自定义 OpenAI-compatible 接口。API Key 保存在本地 Zotero preferences 中。

**数据结构可读、可迁移。** annotation comment 与 `ai:*` tags 都是明确可检查的格式，未来也可以被其他工具继续消费。

## Research Highlight AI for Zotero

当前已经实现：

- 新建高亮后自动进行 AI 标注；
- 在 Zotero Reader 中右键单条高亮进行 AI 标注或重新标注；
- 对整篇文献、PDF attachment 或 annotation 批量处理；
- 保留原有手工 comment 与翻译内容；
- 生成结构化 `summary / role / topics / use`；
- Topic Consolidator，用于减少无意义的 Topic 碎片化；
- Groq、OpenAI、OpenRouter 与 Custom OpenAI-compatible provider；
- 可编辑 API Endpoint、API Key 和 Model；
- 基于 GitHub Release 的 Zotero 自动更新。

目前 Groq 路径已经在真实的 Zotero → ZotLit → Obsidian 工作流中完成端到端验证。其他 provider 模板属于新加入的 beta 路径，仍需要分别使用真实凭证继续验证。

详见 [`zotero-plugin/README.md`](zotero-plugin/README.md)。

## Research Highlight Dashboard for Obsidian

Dashboard 为同一批科研高亮提供两种查看方式：

**Reader** 更适合逐条阅读和检查证据；**Sticky** 更适合在一个高密度视图里快速扫过大量高亮。

当前已经支持：

- 全文搜索；
- Role / Use / Topic 筛选；
- 多种排序方式；
- Zotero annotation 深链接；
- ZotLit 数据变化后的实时刷新；
- 响应式 Sticky 多列布局；
- Auto / Eye / Dark 三种显示模式。

生产版本不依赖 Dataview。

详见 [`obsidian-plugin/README.md`](obsidian-plugin/README.md)。

## 接下来

下一阶段重点包括：

- 完善安装和首次配置流程；
- 验证并优化 Groq、OpenAI、OpenRouter 和 Custom provider；
- 提高自动标注、单条标注和批量标注的稳定性与错误处理；
- 为 Topic Consolidator 增加更安全的预览与确认流程；
- 统一 Zotero 与 Obsidian 两端的图标、文案和交互细节；
- 完善 Obsidian 插件的公开分发和更新流程；
- 继续增强跨文献高亮检索，并探索 semantic retrieval、saved research views、跨高亮 synthesis 和协作式科研工作流。

详细路线图见 [`docs/roadmap.md`](docs/roadmap.md)。

## 品牌与图标

Research Highlight 在 Zotero 与 Obsidian 两端使用统一品牌。当前标志由三个核心元素组成：研究文档、一条高亮，以及结构化数据图形。

品牌资源与使用规范见 [`docs/brand.md`](docs/brand.md)。

## 架构

```text
Zotero
├─ ZotLit Companion
└─ Research Highlight AI
          │
          │ annotation comment + ai:* tags
          ▼
      ZotLit transport
          │
          ▼
Obsidian
├─ ZotLit
└─ Research Highlight Dashboard
```

Research Highlight 有意避免重新制造已经存在的基础设施，因此：

- 不创建项目专用 `highlights.json`；
- 不建立第二套 custom SQLite highlight database；
- 不在 AI 插件里重复实现 ZotLit synchronization；
- Zotero annotation 始终是核心数据记录。

详细架构见 [`docs/architecture.md`](docs/architecture.md)。

数据格式见 [`docs/data-contract.md`](docs/data-contract.md)。

## 安装

安装步骤和依赖关系见 [`docs/installation.md`](docs/installation.md)。

Zotero 插件已经具备并验证了基于 GitHub Release 的自动更新机制。Obsidian 插件目前已经是原生插件结构，后续还会继续完善公开分发方式。

## 当前状态

**Public Beta。**

以下核心链路已经在真实环境中验证：

```text
Zotero highlight
    ↓
AI annotation
    ↓
comment + ai:* tags
    ↓
ZotLit
    ↓
Obsidian Dashboard live refresh
```

Zotero 插件的 GitHub Release 自动更新链也已经跑通。

下一阶段重点是进一步完善产品包装、provider 验证、Topic 管理安全性、双端品牌一致性，以及更稳定的公开分发体验。

## 仓库结构

```text
research-highlight-toolkit/
├─ assets/brand/
├─ zotero-plugin/
├─ obsidian-plugin/
├─ docs/
│  ├─ product.md
│  ├─ roadmap.md
│  ├─ brand.md
│  ├─ architecture.md
│  ├─ data-contract.md
│  └─ installation.md
├─ LICENSE
├─ README.md
└─ README.zh-CN.md
```

## License

Research Highlight 采用 [Apache License 2.0](LICENSE)。

该许可证允许使用、修改、分发和商业使用，同时要求保留必要的版权与许可证声明，并包含明确的专利授权条款。
