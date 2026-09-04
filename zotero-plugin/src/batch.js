Object.assign(ResearchHighlightAI, {
  async getAnnotationsFromItem(sourceItem) {
    if (!sourceItem) return [];
    if (sourceItem.isAnnotation?.()) return [sourceItem];

    if (sourceItem.isAttachment?.()) {
      if (sourceItem.getAnnotations) return (await sourceItem.getAnnotations()) || [];

      const annotationIDs = await Zotero.DB.columnQueryAsync(
        `SELECT ia.itemID FROM itemAnnotations ia WHERE ia.parentItemID = ?`,
        [sourceItem.id]
      );
      return annotationIDs.length ? await Zotero.Items.getAsync(annotationIDs) : [];
    }

    if (sourceItem.isRegularItem?.()) {
      const attachmentIDs = sourceItem.getAttachments?.() || [];
      const attachments = attachmentIDs.length
        ? await Zotero.Items.getAsync(attachmentIDs)
        : [];
      const result = [];
      for (const attachment of attachments) {
        result.push(...(await this.getAnnotationsFromItem(attachment)));
      }
      return result;
    }

    return [];
  },

  async annotateWithRetry(annotation) {
    let lastError = null;

    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await this.annotateItem(annotation);
      } catch (error) {
        lastError = error;
        const status = Number(error?.status || 0);
        const retryable = status === 429 || (status >= 500 && status <= 599);
        if (!retryable || attempt >= this.MAX_RETRIES) throw error;

        const delay = this.RETRY_DELAYS_MS[
          Math.min(attempt, this.RETRY_DELAYS_MS.length - 1)
        ];
        await this.sleep(delay);
      }
    }

    throw lastError;
  },

  async runBatchFromCurrentSelection() {
    const pane = Zotero.getActiveZoteroPane?.();
    const selected = pane?.getSelectedItems?.() || [];
    return this.runBatch(selected);
  },

  async runBatch(selected) {
    if (this.batchRunning) {
      this.alert("Batch AI Annotate is already running.");
      return;
    }
    if (!selected?.length) {
      this.alert("Select one or more Zotero items, attachments, or annotations first.");
      return;
    }

    this.batchRunning = true;
    try {
      const annotationMap = new Map();
      for (const sourceItem of selected) {
        const annotations = await this.getAnnotationsFromItem(sourceItem);
        for (const annotation of annotations) {
          if (annotation?.isAnnotation?.()) annotationMap.set(annotation.id, annotation);
        }
      }

      const annotations = [...annotationMap.values()];
      const counts = { total: annotations.length, done: 0, skippedDone: 0, skippedOther: 0, failed: 0 };

      for (let index = 0; index < annotations.length; index++) {
        try {
          const outcome = await this.annotateWithRetry(annotations[index]);
          if (outcome.status === "done") counts.done++;
          else if (outcome.status === "skip-done") counts.skippedDone++;
          else counts.skippedOther++;
        } catch (error) {
          counts.failed++;
          Zotero.logError(error);
        }

        if (index < annotations.length - 1) await this.sleep(this.BATCH_DELAY_MS);
      }

      this.alert([
        "Batch AI Annotate finished",
        `Total: ${counts.total}`,
        `Annotated: ${counts.done}`,
        `Already done: ${counts.skippedDone}`,
        `Other skipped: ${counts.skippedOther}`,
        `Failed: ${counts.failed}`,
      ].join("\n"));
    } catch (error) {
      Zotero.logError(error);
      this.alert(`Batch AI Annotate failed:\n${error.message || error}`);
    } finally {
      this.batchRunning = false;
    }
  },
});
