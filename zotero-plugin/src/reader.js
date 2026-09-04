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
    const next = !current;
    Zotero.Prefs.set(this.PREFS.autoAnnotate, next, true);
    this.alert(next ? "已开启自动标注新建高亮。" : "已关闭自动标注新建高亮。");
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
        const oldAIBlock = String(annotation.annotationComment || "").slice(
          String(annotation.annotationComment || "").lastIndexOf("[AI]")
        );
        const context = await this.getAnnotationContext(annotation);
        const result = await this.callGroqForAnnotation(context);
        this.applyAIResult(annotation, result);
        await annotation.saveTx();

        const newAIBlock = String(annotation.annotationComment || "").slice(
          String(annotation.annotationComment || "").lastIndexOf("[AI]")
        );
        this.alert(
          oldAIBlock === newAIBlock
            ? "重新标注已执行，但模型返回结果与上次相同。"
            : "重新标注完成。"
        );
        return;
      }

      const outcome = await this.annotateItem(annotation);
      if (outcome?.status === "done") {
        this.alert("AI 标注完成。");
      }
    } catch (error) {
      Zotero.logError(error);
      this.alert(`AI 标注失败:\n${error.message || error}`);
    } finally {
      this.singleRunningIDs.delete(annotationID);
    }
  },
});
