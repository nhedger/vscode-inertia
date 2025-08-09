import {
	type PageResolver,
	getAllPagePatterns,
	pathDiff,
	unglob,
} from "@/helpers";
import {
	CompletionItem,
	CompletionItemKind,
	type CompletionItemProvider,
	type CompletionList,
	type Position,
	type ProviderResult,
	Range,
	type TextDocument,
	Uri,
	workspace,
} from "vscode";

export class AutocompletionProvider implements CompletionItemProvider {
	provideCompletionItems(
		document: TextDocument,
		position: Position,
	): ProviderResult<CompletionItem[] | CompletionList<CompletionItem>> {
		const lineContentUpToCursor = document.getText(
			new Range(position.line - 1, 0, position.line, position.character),
		);

		// https://regex101.com/r/yGJ9nf/2
		const renderRegex = /\b(Inertia::render|inertia)\([\s\s]*["']$/;
		// https://regex101.com/r/0eMWiO/2
		const routeRegex = /Route::inertia\([\s\S]*(['"]).+\1[\s\S]*,[\s\S]*['"]$/;

		if (
			!renderRegex.test(lineContentUpToCursor) &&
			!routeRegex.test(lineContentUpToCursor)
		) {
			return undefined;
		}

		const workspaceURI = workspace.getWorkspaceFolder(document.uri)?.uri;
		if (!workspaceURI) {
			return [];
		}

		const config = workspace.getConfiguration("inertia");
		const firstPathSeparator: string | undefined =
			config.get("pathSeparators", ["/"])?.[0] ?? "/";

		// Get all page patterns (both legacy and new resolvers)
		const pagePatterns = getAllPagePatterns(workspace);

		if (pagePatterns.length === 0) {
			// Fall back to legacy single pattern if no patterns found
			const pagesGlob: string | undefined = config.get("pages");
			if (!pagesGlob) {
				return undefined;
			}
			pagePatterns.push({ pattern: pagesGlob });
		}

		// Create completion items for all patterns
		const completionPromises = pagePatterns.map(({ pattern, prefix }) =>
			workspace
				.findFiles({
					base: workspaceURI.toString(),
					baseUri: workspaceURI,
					pattern: pattern,
				})
				.then((files: Uri[]) => {
					return files.map((uri) => {
						const base = Uri.joinPath(workspaceURI, unglob(pattern));
						const componentPath = pathDiff(base, uri)
							.replace(/\.[^/.]+$/, "")
							.replaceAll("/", firstPathSeparator);

						// Add prefix if this pattern has one
						const finalPath = prefix
							? `${prefix}:${componentPath}`
							: componentPath;

						return new CompletionItem(
							{
								label: finalPath,
								description: prefix
									? `Inertia.js (${prefix} Module)`
									: "Inertia.js",
							},
							CompletionItemKind.Value,
						);
					});
				}),
		);

		return Promise.all(completionPromises).then((completionArrays) => {
			// Flatten the arrays of completion items
			return completionArrays.flat();
		});
	}
}
