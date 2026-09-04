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

  async runSingleAnnotation(annotationID, force = false) {
    if (!annotationID || this.singleRunningIDs.has(annotationID)) return;
    this.singleRunningIDs.add(annotationID);

    try {
      const annotation = await Zotero.Items.getAsync(annotationID);
      if (!annotation?.isAnnotation?.()) return;

      const annotationType = annotation.annotationType;
      if (annotationType && annotationType !== "highlight") return;
      if (!String(annotation.annotationText || "").trim()) return;

      if (force && this.hasTag(annotation, "ai:done")) {
        const context = await this.getAnnotationContext(annotation);
        const result = await this.callGroqForAnnotation(context);
        this.applyAIResult(annotation, result);
        await annotation.saveTx();
        return;
      }

      await this.annotateItem(annotation);
    } catch (error) {
      Zotero.logError(error);
      this.alert(`AI 标注失败:\n${error.message || error}`);
    } finally {
      this.singleRunningIDs.delete(annotationID);
    }
  },
});
