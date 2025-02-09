import { AutocompletionProvider } from "@/editor/autocompletion.provider";
import { ComponentLinkProvider } from "@/editor/component-link.provider";
import { type ExtensionContext, languages } from "vscode";

/**
 * This method is called by VS Code when the extension is activated.
 *
 */
export const activate = async (context: ExtensionContext) => {
	console.log("Inertia VS Code Extension is active.");

	const definitionProvider = languages.registerDocumentLinkProvider(
		{ scheme: "file", language: "php", pattern: "**/*.php" },
		new ComponentLinkProvider(),
	);

	const autocompletionProvider = languages.registerCompletionItemProvider(
		{
			scheme: "file",
			language: "php",
			pattern: "**/*.php",
		},
		new AutocompletionProvider(),
		...["'", '"'],
	);

	context.subscriptions.push(definitionProvider, autocompletionProvider);
};

/**
 * This method is called by VS Code when the extension is deactivated.
 */
export const deactivate = () => {
	console.log("Inertia VS Code Extension is deactivated.");
};
