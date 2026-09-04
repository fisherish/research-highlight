# Privacy

Research Highlight is designed around a local-first research workflow.

## What stays local

Research Highlight stores its structured metadata in the user's existing Zotero annotations and Zotero preferences. The Obsidian Dashboard reads the synchronized annotation data through ZotLit.

Research Highlight does not currently require a proprietary Research Highlight cloud database.

API keys entered into Research Highlight AI are stored locally in Zotero preferences and are not committed to this repository.

## What is sent to an AI provider

When AI annotation is requested, the configured model provider receives the information needed for that request.

For the current highlight annotation workflow, that includes:

- paper title;
- selected highlight text;
- the product's annotation prompt and structured-output schema.

The current annotation workflow does not add the paper abstract.

Topic Consolidation sends the current `ai:topic` vocabulary and topic counts to the configured provider.

## Provider responsibility

Research Highlight supports multiple model providers and custom compatible endpoints. Data handling, logging, retention, training, and regional processing depend on the provider selected by the user.

Users handling confidential, unpublished, regulated, or otherwise sensitive research material should review the selected provider's terms and data controls before enabling AI processing.

## Local or private endpoints

The Custom OpenAI-compatible option can be used with compatible private gateways or local services. A Custom endpoint may operate without an API key when the service does not require one.

## Telemetry

Research Highlight does not currently include product analytics or telemetry.

If telemetry is added in the future, it should be documented here before release and should not silently collect research content.

## Product principle

Research content should remain inspectable and portable, and model-provider choice should remain replaceable.
