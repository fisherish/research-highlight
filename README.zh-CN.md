<p align="center">
  <img src="assets/brand/research-highlight-icon.svg" width="150" alt="Research Highlight icon" />
</p>

<h1 align="center">Research Highlight</h1>

<p align="center"><strong>把 Zotero 里的文献高亮整理成以后真正找得到、用得上的资料。</strong></p>

<p align="center">
  <a href="README.md">English</a> · <strong>简体中文</strong>
</p>

---

Research Highlight 是一套连接 Zotero 和 Obsidian 的文献高亮整理工具。

平时怎么读论文，不需要改。照常在 Zotero 里划高亮，Research Highlight AI 会给这段文字补上一条简短摘要，再标记它属于什么类型、讲了什么主题、以后可能用在哪里。随后这些信息通过 ZotLit 出现在 Obsidian 的 Dashboard 里，可以跨论文搜索和筛选。

它主要解决一个很实际的问题：论文读多以后，高亮会越来越多。几个月后往往只记得“我以前见过这个结论”，却想不起是哪篇文章、哪一段。

Research Highlight 直接整理你已经划下来的高亮，不要求再手工维护另一套笔记。

## 目前由两个插件组成

| 软件 | 插件 | 作用 |
| --- | --- | --- |
| Zotero | **Research Highlight AI** | 给高亮生成摘要、Role、Topics 和 Use |
| Obsidian | **Research Highlight Dashboard** | 搜索、筛选、查看这些高亮，并跳回 Zotero 原文 |

Zotero annotation 仍然保存原始内容。ZotLit Companion 和 ZotLit 负责把数据带到 Obsidian。

## 一条高亮会被整理成什么样

例如你划下一段关于 CAR-T 细胞在实体瘤中受限的文字，插件会在 annotation comment 里加入类似这样的内容：

```text
[AI]
实体瘤中的免疫抑制性微环境和浸润障碍会限制 CAR-T 细胞功能，是当前治疗效果受限的重要原因。

Role: limitation
Topics: CAR-T cells, solid tumors, tumor microenvironment
Use: discussion
```

同时会写入对应的 tags：

```text
ai:done
ai:role:limitation
ai:topic:CAR-T-cells
ai:topic:solid-tumors
ai:topic:tumor-microenvironment
ai:use:discussion
```

以后可以按“某个分子”“某类细胞”“机制”“局限”“方法”这些线索重新把它找出来，而不是只能靠记住论文标题。

## Research Highlight AI for Zotero

目前支持：

- 新建文字高亮后自动进行 AI 标注；
- 在 Zotero Reader 里右键单条高亮进行标注或重新标注；
- 对文献、PDF attachment 或 annotation 批量处理；
- 保留已有的手工 comment 和翻译；
- 输出 `summary / role / topics / use`；
- Topic Consolidator，用来合并明显重复或近似的 Topic；
- Groq、OpenAI、OpenRouter 和 Custom OpenAI-compatible provider；
- 自定义 API Endpoint、API Key 和 Model；
- 基于 GitHub Release 的自动更新。

目前 Groq 路径已经完成真实环境下的端到端验证。其他 provider 已经接入，后续会继续逐个验证兼容性。

详见 [`zotero-plugin/README.md`](zotero-plugin/README.md)。

## Research Highlight Dashboard for Obsidian

Dashboard 直接读取 ZotLit 的数据。

目前有两种查看方式：

- **Reader**：适合逐条看摘要、高亮原文和论文信息；
- **Sticky**：适合一次铺开很多条高亮，快速扫某个主题下的材料。

可以按关键词、Role、Use 和 Topic 搜索或筛选，也可以按添加时间、修改时间、论文标题等排序。每条高亮都可以直接跳回 Zotero 原位置。

在 Zotero 里新增、修改或删除高亮后，Dashboard 会跟着刷新。

详见 [`obsidian-plugin/README.md`](obsidian-plugin/README.md)。

## 数据怎么流动

```text
在 Zotero 里划高亮
        ↓
Research Highlight AI
        ↓
comment + ai:* tags
        ↓
ZotLit Companion / ZotLit
        ↓
Research Highlight Dashboard
        ↓
搜索、筛选、查看、跳回 Zotero
```

Research Highlight 不另外建立一套高亮数据库，也不重新实现 ZotLit 的同步逻辑。

## 模型配置

Zotero 插件目前提供这些 provider 模板：

```text
Groq
OpenAI
OpenRouter
Custom OpenAI-compatible
```

Endpoint、API Key 和 Model 都可以自己填写。API Key 保存在 Zotero 本地设置中，不会写进仓库。

## 安装

安装步骤和依赖见 [`docs/installation.md`](docs/installation.md)。

Zotero 插件已经有可用的 GitHub Release 和自动更新通道。Obsidian 插件目前可以作为原生插件运行，公开分发方式还在继续整理。

## 接下来会做什么

- 简化安装和首次配置；
- 继续验证不同模型供应商；
- 改善批量标注、失败重试和错误提示；
- 给 Topic Consolidator 增加预览和确认；
- 完善 Obsidian 插件的发布和更新流程；
- 增强跨论文检索，并继续探索 semantic retrieval、saved views 和跨高亮总结。

详细计划见 [`docs/roadmap.md`](docs/roadmap.md)。

## 当前状态

目前处于 **Public Beta**。

下面这条完整链路已经实际跑通：

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

Zotero 插件的 GitHub Release 和自动更新也已经验证可用。

## 仓库结构

```text
research-highlight/
├─ assets/
├─ zotero-plugin/
├─ obsidian-plugin/
├─ docs/
├─ LICENSE
├─ README.md
└─ README.zh-CN.md
```

## License

Research Highlight 使用 [Apache License 2.0](LICENSE)。
