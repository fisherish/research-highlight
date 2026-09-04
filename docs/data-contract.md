# Data Contract v1

Research Highlight AI and Research Highlight Dashboard are intentionally loosely coupled. Their shared interface is the Zotero annotation itself: a human-readable `[AI]` block in the annotation comment plus structured `ai:*` tags.

ZotLit / ZotLit Companion transport that state between Zotero and Obsidian.

## 1. Annotation comment format

AI output is appended after any existing manual comment, translation, or other user-authored content.

Canonical example:

```text
[AI]
中文 summary

Role: limitation
Topics: CAR-T cells, solid tumors, tumor microenvironment
Use: discussion
```

The fields are:

- first line: literal marker `[AI]`;
- summary: concise Chinese summary intended for fast retrieval and reading;
- `Role`: how the highlight functions in the paper or the user's research reasoning;
- `Topics`: comma-separated human-readable topic labels;
- `Use`: likely downstream research use.

The displayed Topics line may contain spaces and punctuation for readability. The corresponding topic tags use normalized payloads.

## 2. Preserve manual content

A producer must not overwrite existing manual comments or translations.

When AI output is added or regenerated, the intended behavior is:

```text
existing manual / translated content

[AI]
...
```

If an existing AI block is being regenerated, the implementation may replace the previous AI block, but unrelated manual content must remain intact.

## 3. Structured tag schema

The structured metadata contract is:

```text
ai:done
ai:role:<role>
ai:topic:<topic>
ai:use:<use>
```

Example:

```text
ai:done
ai:role:limitation
ai:topic:CAR-T-cells
ai:topic:solid-tumors
ai:topic:tumor-microenvironment
ai:use:discussion
```

An annotation may have multiple `ai:topic:*` tags and normally one current `ai:role:*` and one current `ai:use:*` tag.

### `ai:done`

`ai:done` is the completion marker used by the validated workflow.

Producers use it to avoid reprocessing an already annotated highlight. Consumers may use it as evidence that the AI annotation pass completed successfully.

It is **not** a schema-version tag.

### `ai:role:*`

Stores the normalized Role value.

Example:

```text
ai:role:limitation
```

### `ai:topic:*`

Stores one normalized topic per tag.

Example:

```text
ai:topic:CAR-T-cells
ai:topic:solid-tumors
```

Topic vocabulary is deliberately open-ended. Consumers must not depend on a fixed list of topics.

### `ai:use:*`

Stores the normalized Use value.

Example:

```text
ai:use:discussion
```

## 4. Tag normalization

The validated Zotero workflow applies the following `cleanTag` behavior to generated tag payloads:

```text
trim
whitespace → hyphen
remove comma / semicolon
maximum 80 characters
```

Equivalent JavaScript behavior:

```js
String(value ?? "")
  .trim()
  .replace(/\s+/g, "-")
  .replace(/[;,]+/g, "")
  .slice(0, 80);
```

This normalization applies to generated Role, Topic, and Use payloads before prefixing them with `ai:role:`, `ai:topic:`, or `ai:use:`.

## 5. Producer rules

A compatible producer should:

1. process highlight annotations only when appropriate;
2. preserve user-authored comment content;
3. write the `[AI]` block in the documented format;
4. remove stale AI Role / Topic / Use tags before replacing them;
5. add the current `ai:role:*`, `ai:topic:*`, and `ai:use:*` tags;
6. add `ai:done` only after a successful AI result is ready to save;
7. save the Zotero annotation transactionally, e.g. with `await item.saveTx()`;
8. leave unrelated Zotero tags untouched.

The current Research Highlight AI design uses Groq with model `qwen/qwen3.8-27b`, `reasoning_effort: "none"`, and a strict JSON response schema, but those provider details are not part of the interoperability contract.

## 6. Consumer rules

A compatible consumer should:

- tolerate annotations without AI output;
- tolerate unknown non-`ai:*` tags;
- tolerate future unknown `ai:*` tags;
- identify Role, Topic, and Use by their prefixes rather than tag order;
- support multiple topic tags;
- not require a fixed Topic vocabulary;
- not assume a particular ordering of tags;
- treat the `[AI]` comment block as human-readable content and the `ai:*` tags as structured metadata;
- remain read-only with respect to the source annotation unless an explicit future editing feature is designed.

Research Highlight Dashboard should therefore continue to work with any producer that emits this schema, not only Research Highlight AI.

## 7. Topic consolidation rules

Topic consolidation is a manual vocabulary-maintenance operation. Its goal is retrieval quality, not ontological purity.

The governing question is:

> When searching the literature later, is there meaningful value in keeping these Topics separate?

Reasonable consolidations include:

```text
Soluble-TNF → TNF-alpha
PD1 + PDL1 → PD-1/PD-L1
TNF-alpha + TNFR1 + TNFR2 → TNF/TNFR-signaling
```

Do not merge independently useful retrieval axes merely because they are biologically linked. For example:

```text
CXCL10
CXCR3
```

should remain separate because ligand-expression searches and receptor-engineering / migration searches have distinct retrieval value.

Avoid broad low-information umbrella topics such as:

```text
immune-signaling
tumor-biology
```

The validated Topic Consolidator discovers topic tags by loading annotation items and calling `annotation.getTags()`. It should not depend on SQL `LIKE` / `substr` matching of `ai:topic:*` text.

## 8. Compatibility and evolution

Data Contract v1 is intentionally small.

Backward-compatible evolution should be additive wherever possible. New consumers should ignore fields or `ai:*` prefixes they do not understand. New producers should continue emitting the v1 fields while the contract is in use.

Breaking changes should require an explicit future contract version rather than silently changing the meaning of the existing prefixes.
