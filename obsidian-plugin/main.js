const { ItemView, Plugin } = require("obsidian");

const VIEW_TYPE = "research-highlight-dashboard";
const STORAGE = {
  view: "research-highlights-view-mode",
  sort: "research-highlights-sort-mode",
  direction: "research-highlights-sort-direction",
  appearance: "research-highlights-appearance",
};

function status(root, title, detail) {
  root.empty();
  const box = root.createDiv({ cls: "rh-status" });
  box.createEl("h3", { text: title });
  box.createEl("p", { text: detail });
}

function extractAISummary(comment) {
  const text = String(comment ?? "");
  const pattern = /(?:\[AI\]|\(AI\)|（AI）)/gi;
  let match;
  let end = -1;
  while ((match = pattern.exec(text)) !== null) end = match.index + match[0].length;
  return end < 0 ? "" : text.slice(end).split(/\bRole:\s*/i)[0].trim();
}

function getPaperTitle(paper) {
  if (!paper) return "Untitled";
  const row = (paper.itemData ?? []).find(
    (entry) => entry.fieldsCombined?.fieldName === "title"
  );
  return String(row?.itemDataValue?.value ?? paper.key ?? "Untitled");
}

function buildZoteroLink(row) {
  const attachmentKey = row.parentAttachment?.item_itemID?.key;
  const annotationKey = row.item?.key;
  const libraryID = Number(row.parentAttachment?.item_parentItemID?.libraryID);
  if (!attachmentKey || !annotationKey || libraryID !== 1) return "";

  const params = new URLSearchParams({ annotation: annotationKey });
  if (row.pageLabel) params.set("page", String(row.pageLabel));
  return `zotero://open/library/items/${attachmentKey}?${params}`;
}

function countValues(values) {
  const counts = new Map();
  for (const value of values) {
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

function noteAccent(color) {
  const value = String(color ?? "").trim();
  return /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(value) ? value : "#d7b24a";
}

async function mountDashboard(root, app) {
  root.empty();

  const zotlit = app.plugins?.plugins?.zotlit;
  if (!zotlit) {
    status(
      root,
      "ZotLit is required",
      "Research Highlight Dashboard requires ZotLit. Install or enable ZotLit, then reopen this view."
    );
    return () => root.empty();
  }

  const dbService = zotlit.services?.db;
  if (!dbService) {
    status(root, "ZotLit database unavailable", "ZotLit is loaded, but its database service is unavailable.");
    return () => root.empty();
  }

  try {
    await dbService.ready;
  } catch (error) {
    console.error("[Research Highlight Dashboard] ZotLit database failed to initialize", error);
    status(root, "ZotLit database failed to initialize", "Check ZotLit, then reopen this view.");
    return () => root.empty();
  }

  if (dbService.state !== "ready") {
    status(root, "ZotLit database is not ready", "Wait until ZotLit finishes loading, then reopen this view.");
    return () => root.empty();
  }

  const appRoot = root.createDiv({ cls: "rh-app" });
  const validSort = new Set(["dateAdded", "dateModified", "title", "role", "use"]);
  const state = {
    query: "",
    role: "",
    use: "",
    topic: "",
    view: localStorage.getItem(STORAGE.view) || "reader",
    sort: localStorage.getItem(STORAGE.sort) || "dateAdded",
    direction: localStorage.getItem(STORAGE.direction) || "desc",
    appearance: localStorage.getItem(STORAGE.appearance) || "auto",
  };

  if (!new Set(["reader", "sticky"]).has(state.view)) state.view = "reader";
  if (!validSort.has(state.sort)) state.sort = "dateAdded";
  if (!new Set(["asc", "desc"]).has(state.direction)) state.direction = "desc";
  if (!new Set(["auto", "eye", "dark"]).has(state.appearance)) state.appearance = "auto";

  let records = [];
  let controls = null;
  let resultsEl = null;
  let countEl = null;
  let statsEl = null;
  let liveTimer = null;
  let resizeTimer = null;
  let stickyBreakpoint = null;

  function applyAppearance() {
    appRoot.classList.remove("rh-appearance-eye", "rh-appearance-dark");
    if (state.appearance !== "auto") appRoot.classList.add(`rh-appearance-${state.appearance}`);
  }

  function loadRecords() {
    const rows = dbService.client.query.itemAnnotations
      .findMany({
        where: { item: { deletedItem: false } },
        with: {
          item: {
            columns: { key: true, libraryID: true, dateAdded: true, dateModified: true },
            with: {
              itemTags: {
                columns: {},
                with: { tag: { columns: { name: true } } },
              },
            },
          },
          parentAttachment: {
            columns: { itemID: true, parentItemID: true },
            with: {
              item_itemID: { columns: { key: true } },
              item_parentItemID: {
                columns: { itemID: true, key: true, libraryID: true },
                with: {
                  itemData: {
                    columns: {},
                    with: {
                      fieldsCombined: {
                        columns: { fieldName: true },
                        where: { fieldName: { eq: "title" } },
                      },
                      itemDataValue: { columns: { value: true } },
                    },
                  },
                },
              },
            },
          },
        },
      })
      .prepare()
      .all();

    const output = [];
    for (const row of rows) {
      const text = String(row.text ?? "").trim();
      const annotation = row.item;
      const attachment = row.parentAttachment;
      const paper = attachment?.item_parentItemID;
      if (!text || !annotation || !attachment || !paper) continue;

      const tags = (annotation.itemTags ?? [])
        .map((itemTag) => String(itemTag?.tag?.name ?? "").trim())
        .filter(Boolean);
      const roleTag = tags.find((tag) => tag.startsWith("ai:role:"));
      const useTag = tags.find((tag) => tag.startsWith("ai:use:"));
      const topics = tags
        .filter((tag) => tag.startsWith("ai:topic:"))
        .map((tag) => tag.slice("ai:topic:".length));

      output.push({
        aiDone: tags.includes("ai:done"),
        title: getPaperTitle(paper),
        text,
        summary: extractAISummary(row.comment),
        color: String(row.color ?? ""),
        date: String(annotation.dateAdded ?? ""),
        modified: String(annotation.dateModified ?? ""),
        link: buildZoteroLink(row),
        role: roleTag ? roleTag.slice("ai:role:".length) : "",
        use: useTag ? useTag.slice("ai:use:".length) : "",
        topics,
      });
    }
    return output;
  }

  function filteredRecords() {
    const q = state.query.trim().toLowerCase();
    return records.filter((record) => {
      if (state.role && record.role !== state.role) return false;
      if (state.use && record.use !== state.use) return false;
      if (state.topic && !record.topics.includes(state.topic)) return false;
      if (!q) return true;
      const haystack = [record.title, record.text, record.summary, record.role, record.use, ...record.topics]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  function sortedRecords(input) {
    const output = [...input];
    const direction = state.direction === "asc" ? 1 : -1;
    const textCmp = (a, b) => String(a ?? "").localeCompare(String(b ?? ""), undefined, { sensitivity: "base", numeric: true });
    output.sort((a, b) => {
      let result = 0;
      if (state.sort === "dateAdded") result = (Date.parse(a.date) || 0) - (Date.parse(b.date) || 0);
      else if (state.sort === "dateModified") result = (Date.parse(a.modified) || 0) - (Date.parse(b.modified) || 0);
      else if (state.sort === "title") result = textCmp(a.title, b.title);
      else if (state.sort === "role") result = textCmp(a.role, b.role);
      else if (state.sort === "use") result = textCmp(a.use, b.use);
      if (result !== 0) return result * direction;
      return (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0);
    });
    return output;
  }

  function makeSelect(parent, values, label, selected, counts, cls = "rh-select") {
    const select = parent.createEl("select", { cls });
    select.createEl("option", { text: label, value: "" });
    for (const value of values) {
      const suffix = counts ? ` (${counts.get(value) ?? 0})` : "";
      select.createEl("option", { text: `${value}${suffix}`, value });
    }
    if (selected && values.includes(selected)) select.value = selected;
    return select;
  }

  function updateDirectionOptions(select) {
    select.empty();
    const isDate = state.sort === "dateAdded" || state.sort === "dateModified";
    const options = isDate
      ? [["desc", "Newest → Oldest"], ["asc", "Oldest → Newest"]]
      : [["asc", "A → Z"], ["desc", "Z → A"]];
    for (const [value, text] of options) select.createEl("option", { text, value });
    select.value = state.direction;
  }

  function addChip(parent, text, cls) {
    if (!text) return;
    parent.createEl("span", { text, cls });
  }

  function toggleTopic(topic) {
    state.topic = state.topic === topic ? "" : topic;
    if (controls?.topic) controls.topic.value = state.topic;
    renderResults();
    requestAnimationFrame(() => (resultsEl.firstElementChild || countEl)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function renderReader(list) {
    const reader = resultsEl.createDiv({ cls: "rh-reader" });
    for (const record of list) {
      const card = reader.createDiv({ cls: "rh-card" });
      const top = card.createDiv({ cls: "rh-card-top" });
      const meta = top.createDiv({ cls: "rh-meta" });
      addChip(meta, record.role || "unclassified", "rh-chip");
      addChip(meta, record.use, "rh-chip");
      if (record.link) {
        const open = top.createEl("a", { text: "Open in Zotero ↗", cls: "rh-open" });
        open.href = record.link;
      }

      card.createDiv({ text: record.title, cls: "rh-title" });
      if (record.topics.length) {
        const topics = card.createDiv({ cls: "rh-topics" });
        for (const topic of record.topics) {
          const el = topics.createEl("button", { text: topic, cls: `rh-topic${state.topic === topic ? " rh-topic-active" : ""}` });
          el.addEventListener("click", () => toggleTopic(topic));
        }
      }

      if (record.aiDone && record.summary) {
        const ai = card.createDiv({ cls: "rh-ai" });
        ai.createEl("span", { text: "AI", cls: "rh-ai-label" });
        ai.appendText(record.summary);
      }

      card.createDiv({ text: "ORIGINAL", cls: "rh-original-label" });
      const wrap = card.createDiv({ cls: "rh-highlight-wrap" });
      const original = wrap.createDiv({ text: record.text, cls: "rh-highlight" });
      const collapse = record.text.length > 180 || (record.text.match(/\n/g) ?? []).length >= 3;
      if (collapse) {
        original.addClass("rh-highlight-collapsed");
        const button = wrap.createEl("button", { text: "Show original ↓", cls: "rh-expand" });
        button.addEventListener("click", () => {
          const expanded = !original.hasClass("rh-highlight-collapsed");
          original.toggleClass("rh-highlight-collapsed", expanded);
          button.setText(expanded ? "Show original ↓" : "Hide original ↑");
        });
      }
    }
  }

  function stickyColumnCount() {
    const width = Math.max(0, resultsEl?.getBoundingClientRect?.().width || appRoot.getBoundingClientRect().width);
    if (width >= 1120) return 4;
    if (width >= 560) return 3;
    if (width >= 360) return 2;
    return 1;
  }

  function renderSticky(list) {
    const grid = resultsEl.createDiv({ cls: "sn-grid" });
    const breakpoint = stickyColumnCount();
    stickyBreakpoint = breakpoint;
    const columnCount = Math.min(breakpoint, Math.max(1, list.length));
    grid.style.setProperty("--sn-columns", String(columnCount));
    const columns = Array.from({ length: columnCount }, () => grid.createDiv({ cls: "sn-column" }));

    list.forEach((record, index) => {
      const note = columns[index % columnCount].createDiv({ cls: "sn-note" });
      note.style.setProperty("--note-accent", noteAccent(record.color));
      note.createDiv({ cls: "sn-note-accent" });
      const inner = note.createDiv({ cls: "sn-note-inner" });
      const head = inner.createDiv({ cls: "sn-note-head" });
      const meta = head.createDiv({ cls: "sn-meta" });
      addChip(meta, record.role || "unclassified", "sn-meta-chip");
      addChip(meta, record.use, "sn-meta-chip");
      if (record.link) {
        const open = head.createEl("a", { text: "Open ↗", cls: "sn-open" });
        open.href = record.link;
      }
      inner.createDiv({ text: record.title, cls: "sn-title" });

      if (record.topics.length) {
        const topics = inner.createDiv({ cls: "sn-topics" });
        for (const topic of record.topics) {
          const el = topics.createEl("button", { text: topic, cls: `sn-topic${state.topic === topic ? " sn-topic-active" : ""}` });
          el.addEventListener("click", () => toggleTopic(topic));
        }
      }

      if (record.aiDone && record.summary) {
        const ai = inner.createDiv({ cls: "sn-ai" });
        ai.createEl("span", { text: "AI", cls: "sn-ai-label" });
        ai.appendText(record.summary);
      }

      inner.createDiv({ text: "ORIGINAL", cls: "sn-original-label" });
      inner.createDiv({ text: record.text, cls: "sn-highlight" });
      if (record.text.length > 120 || record.title.length > 88) {
        const footer = inner.createDiv({ cls: "sn-footer" });
        const button = footer.createEl("button", { text: "Show original ↓", cls: "sn-expand" });
        button.addEventListener("click", () => {
          const expanded = note.hasClass("sn-note-expanded");
          note.toggleClass("sn-note-expanded", !expanded);
          button.setText(expanded ? "Show original ↓" : "Hide original ↑");
        });
      }
    });
  }

  function renderResults() {
    if (!resultsEl) return;
    resultsEl.empty();
    appRoot.toggleClass("rh-mode-reader", state.view === "reader");
    appRoot.toggleClass("rh-mode-sticky", state.view === "sticky");
    controls.reader.toggleClass("rh-view-active", state.view === "reader");
    controls.sticky.toggleClass("rh-view-active", state.view === "sticky");
    if (statsEl) statsEl.style.display = state.view === "reader" ? "grid" : "none";

    const list = sortedRecords(filteredRecords());
    countEl.setText(list.length === records.length ? `${list.length} highlights` : `${list.length} of ${records.length} highlights`);
    if (!list.length) {
      resultsEl.createDiv({ text: "No highlights match the current filters.", cls: "rh-empty" });
      return;
    }
    if (state.view === "reader") {
      stickyBreakpoint = null;
      renderReader(list);
    } else {
      renderSticky(list);
    }
  }

  function rebuild({ preserveFilters = true } = {}) {
    records = loadRecords();
    if (!preserveFilters) Object.assign(state, { query: "", role: "", use: "", topic: "" });
    appRoot.empty();
    applyAppearance();

    const roles = [...new Set(records.map((r) => r.role).filter(Boolean))].sort();
    const uses = [...new Set(records.map((r) => r.use).filter(Boolean))].sort();
    const topics = [...new Set(records.flatMap((r) => r.topics))].sort();
    const roleCounts = countValues(records.map((r) => r.role));
    const useCounts = countValues(records.map((r) => r.use));
    const topicCounts = countValues(records.flatMap((r) => r.topics));

    if (state.role && !roles.includes(state.role)) state.role = "";
    if (state.use && !uses.includes(state.use)) state.use = "";
    if (state.topic && !topics.includes(state.topic)) state.topic = "";

    const headerShell = appRoot.createDiv({ cls: "rh-header-shell" });
    const header = headerShell.createDiv({ cls: "rh-header" });
    const top = header.createDiv({ cls: "rh-header-top" });
    const search = top.createEl("input", { cls: "rh-search" });
    search.type = "search";
    search.placeholder = "Search highlights, papers, topics...";
    search.value = state.query;
    const switcher = top.createDiv({ cls: "rh-view-switch" });
    const reader = switcher.createEl("button", { text: "Reader", cls: "rh-view-btn" });
    const sticky = switcher.createEl("button", { text: "Sticky", cls: "rh-view-btn" });

    const filters = header.createDiv({ cls: "rh-filter-row" });
    const role = makeSelect(filters, roles, "All roles", state.role, roleCounts);
    const use = makeSelect(filters, uses, "All uses", state.use, useCounts);
    const topic = makeSelect(filters, topics, `All topics (${topics.length})`, state.topic, topicCounts);

    const sortRow = header.createDiv({ cls: "rh-sort-row" });
    const sort = sortRow.createEl("select", { cls: "rh-sort-select" });
    for (const [value, text] of [
      ["dateAdded", "Sort by: Date added"], ["dateModified", "Sort by: Date modified"],
      ["title", "Sort by: Paper title"], ["role", "Sort by: Role"], ["use", "Sort by: Use"],
    ]) sort.createEl("option", { value, text });
    sort.value = state.sort;
    const direction = sortRow.createEl("select", { cls: "rh-sort-select" });
    updateDirectionOptions(direction);
    const appearance = sortRow.createEl("select", { cls: "rh-sort-select" });
    for (const [value, text] of [["auto", "Appearance: Auto"], ["eye", "Appearance: Eye"], ["dark", "Appearance: Dark"]]) {
      appearance.createEl("option", { value, text });
    }
    appearance.value = state.appearance;

    statsEl = appRoot.createDiv({ cls: "rh-stats" });
    for (const [value, label] of [
      [records.length, "Highlights"], [new Set(records.map((r) => r.title)).size, "Papers"],
      [topics.length, "Topics"], [records.filter((r) => r.aiDone).length, "AI annotated"],
    ]) {
      const stat = statsEl.createDiv({ cls: "rh-stat" });
      stat.createEl("span", { text: String(value), cls: "rh-stat-value" });
      stat.createEl("span", { text: label, cls: "rh-stat-label" });
    }

    countEl = appRoot.createDiv({ cls: "rh-count" });
    resultsEl = appRoot.createDiv({ cls: "rh-results" });
    controls = { search, role, use, topic, sort, direction, appearance, reader, sticky };

    search.addEventListener("input", () => { state.query = search.value; renderResults(); });
    role.addEventListener("change", () => { state.role = role.value; renderResults(); });
    use.addEventListener("change", () => { state.use = use.value; renderResults(); });
    topic.addEventListener("change", () => { state.topic = topic.value; renderResults(); });
    sort.addEventListener("change", () => {
      state.sort = sort.value;
      localStorage.setItem(STORAGE.sort, state.sort);
      updateDirectionOptions(direction);
      renderResults();
    });
    direction.addEventListener("change", () => {
      state.direction = direction.value;
      localStorage.setItem(STORAGE.direction, state.direction);
      renderResults();
    });
    appearance.addEventListener("change", () => {
      state.appearance = appearance.value;
      localStorage.setItem(STORAGE.appearance, state.appearance);
      applyAppearance();
    });
    reader.addEventListener("click", () => {
      if (state.view === "reader") return;
      state.view = "reader";
      localStorage.setItem(STORAGE.view, state.view);
      renderResults();
    });
    sticky.addEventListener("click", () => {
      if (state.view === "sticky") return;
      state.view = "sticky";
      localStorage.setItem(STORAGE.view, state.view);
      renderResults();
    });

    renderResults();
  }

  rebuild({ preserveFilters: false });

  const unsubscribe = dbService.on("changed", () => {
    if (liveTimer) clearTimeout(liveTimer);
    liveTimer = setTimeout(() => {
      liveTimer = null;
      try { rebuild({ preserveFilters: true }); }
      catch (error) { console.error("[Research Highlight Dashboard] Live refresh failed", error); }
    }, 500);
  });

  const resizeObserver = new ResizeObserver(() => {
    if (state.view !== "sticky") return;
    const nextBreakpoint = stickyColumnCount();
    if (nextBreakpoint === stickyBreakpoint) return;
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resizeTimer = null;
      if (stickyColumnCount() !== stickyBreakpoint) renderResults();
    }, 120);
  });
  resizeObserver.observe(root);

  return () => {
    try { unsubscribe?.(); } catch (_) {}
    if (liveTimer) clearTimeout(liveTimer);
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeObserver.disconnect();
    root.empty();
  };
}

class ResearchHighlightsView extends ItemView {
  constructor(leaf) {
    super(leaf);
    this.cleanupDashboard = null;
  }
  getViewType() { return VIEW_TYPE; }
  getDisplayText() { return "Research Highlights"; }
  getIcon() { return "highlighter"; }

  async onOpen() {
    this.cleanupDashboard?.();
    this.contentEl.addClass("research-highlight-dashboard-view");
    // Obsidian themes may apply higher-specificity padding to .view-content.
    // Force this ItemView flush to the top so sticky controls cannot leave a leak strip.
    this.contentEl.style.setProperty("padding-top", "0", "important");
    try {
      this.cleanupDashboard = await mountDashboard(this.contentEl, this.app);
    } catch (error) {
      console.error("[Research Highlight Dashboard] Failed to render", error);
      status(this.contentEl, "Dashboard failed to render", "Check the developer console for details.");
    }
  }

  async onClose() {
    this.cleanupDashboard?.();
    this.cleanupDashboard = null;
    this.contentEl.removeClass("research-highlight-dashboard-view");
    this.contentEl.style.removeProperty("padding-top");
    this.contentEl.empty();
  }
}

module.exports = class ResearchHighlightDashboardPlugin extends Plugin {
  async onload() {
    this.registerView(VIEW_TYPE, (leaf) => new ResearchHighlightsView(leaf));
    this.addRibbonIcon("highlighter", "Research Highlights", () => this.activateView());
    this.addCommand({ id: "open-research-highlights", name: "Open Research Highlights", callback: () => this.activateView() });
  }

  async onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE);
  }

  async activateView() {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      leaf = this.app.workspace.getLeaf("tab");
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    await this.app.workspace.revealLeaf(leaf);
  }
};
