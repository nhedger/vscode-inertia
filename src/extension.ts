import { ExtensionContext, languages } from "vscode";
import { ComponentLinkProvider } from "@/editor/component-link.provider";
import { AutocompletionProvider } from "@/editor/autocompletion.provider";

/**
 * This method is called by VS Code when the extension is activated.
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
