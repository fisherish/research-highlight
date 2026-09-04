var ResearchHighlightAI;

function log(message) {
  Zotero.debug(`[Research Highlight AI] ${message}`);
}

function install() {
  log("Installed");
}

async function startup({ id, version, rootURI }) {
  log(`Starting ${version}`);
  await Zotero.initializationPromise;
  await Zotero.unlockPromise;
  await Zotero.uiReadyPromise;
  for (const script of [
    "core.js",
    "provider.js",
    "annotation.js",
    "annotation-provider.js",
    "reader.js",
    "batch.js",
    "topics.js",
    "topics-groq.js",
  ]) {
    Services.scriptloader.loadSubScript(rootURI + "src/" + script);
  }
  ResearchHighlightAI.init({ id, version, rootURI });
  await ResearchHighlightAI.startup();
  ResearchHighlightAI.registerReaderContextMenu();
}

function onMainWindowLoad({ window }) {
  ResearchHighlightAI?.addToWindow(window);
}

function onMainWindowUnload({ window }) {
  ResearchHighlightAI?.removeFromWindow(window);
}

async function shutdown(data, reason) {
  if (reason === APP_SHUTDOWN) return;
  log("Shutting down");
  ResearchHighlightAI?.unregisterReaderContextMenu();
  await ResearchHighlightAI?.shutdown();
  ResearchHighlightAI = undefined;
}

function uninstall() {
  // Keep user preferences on uninstall so an accidental reinstall does not
  // silently discard the locally stored API key and settings.
}
