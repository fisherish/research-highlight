Object.assign(ResearchHighlightAI, {
  readerContextMenuHandler: null,
  singleRunningIDs: new Set(),

  getReaderAnnotation(reader, annotationKey) {
    try {
      const attachment = Zotero.Items.get(reader?.itemID);
      if (!attachment || !annotationKey) return null;
      return Zotero.Items.getByLibraryAndKey(attachment.libraryID, annotationKey) || null;
    } catch (error) {
      Zotero.debug(`[Research Highlight AI] Reader annotation lookup warning: ${error}`);
      return null;
    }
  },

  registerReaderContextMenu() {
    if (this.readerContextMenuHandler) return;

    this.readerContextMenuHandler = (event) => {
      const { reader, params, append } = event || {};
      const ids = Array.isArray(params?.ids) ? params.ids : [];
      if (ids.length !== 1 || typeof append !== "function") return;

      const annotation = this.getReaderAnnotation(reader, ids[0]);
      if (!annotation?.isAnnotation?.()) return;

      const annotationType = annotation.annotationType;
      if (annotationType && annotationType !== "highlight") return;
      if (!String(annotation.annotationText || "").trim()) return;

      const alreadyDone = this.hasTag(annotation, "ai:done");
      append({
        label: alreadyDone ? "重新 AI 标注此高亮" : "AI 标注此高亮",
        onCommand: () => void this.runSingleAnnotation(annotation.id, alreadyDone),
      });

      const autoAnnotate = this.getPrefBool(this.PREFS.autoAnnotate, false);
      append({
        label: autoAnnotate ? "关闭自动标注新建高亮" : "开启自动标注新建高亮",
        onCommand: () => this.toggleAutoAnnotateFromReader(),
      });
    };

    Zotero.Reader.registerEventListener(
      "createAnnotationContextMenu",
      this.readerContextMenuHandler,
      this.id
    );
  },

  unregisterReaderContextMenu() {
    if (!this.readerContextMenuHandler) return;
    try {
      Zotero.Reader.unregisterEventListener(
        "createAnnotationContextMenu",
        this.readerContextMenuHandler
      );
    } catch (error) {
      Zotero.debug(`[Research Highlight AI] Reader menu cleanup warning: ${error}`);
    }
    this.readerContextMenuHandler = null;
  },

  toggleAutoAnnotateFromReader() {
    const current = this.getPrefBool(this.PREFS.autoAnnotate, false);
    Zotero.Prefs.set(this.PREFS.autoAnnotate, !current, true);
  },

  async runSingleAnnotation(annotationID, force = false) {
    if (!annotationID || this.singleRunningIDs.has(annotationID)) return;
    this.singleRunningIDs.add(annotationID);

    try {
      const annotation = await Zotero.Items.getAsync(annotationID);
      if (!annotation?.isAnnotation?.()) return;

      const annotationType = annotation.annotationType;
      if (annotationType && annotationType !== "highlight") return;
      if (!String(annotation.annotationText || "").trim()) return;

      await this.annotateItem(annotation, { force });
    } catch (error) {
      Zotero.logError(error);
      Zotero.debug(`[Research Highlight AI] Reader annotation failed: ${error}`);
    } finally {
      this.singleRunningIDs.delete(annotationID);
    }
  },
});
