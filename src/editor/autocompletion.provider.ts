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
		const pathShortcuts: Record<string, string> = config.get(
			"pathShortcuts",
			{},
		);

		const completionPromises: Thenable<CompletionItem[]>[] = [];

		// 1. Process configured patterns (Legacy & Page Resolvers)
		const pagePatterns = getAllPagePatterns(workspace);
		if (pagePatterns.length > 0) {
			completionPromises.push(
				...pagePatterns.map(({ pattern, prefix }) =>
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
				),
			);
		}

		// 2. Process Implicit Modules (Modules/**/*)
		const modulesPattern = "Modules/**/*";
		completionPromises.push(
			workspace
				.findFiles({
					base: workspaceURI.toString(),
					baseUri: workspaceURI,
					pattern: modulesPattern,
				})
				.then((files: Uri[]) => {
					return files.flatMap((uri) => {
						const base = Uri.joinPath(workspaceURI, "Modules");
						const relativePath = pathDiff(base, uri);

						// Check for Module structure: Module/Pages/Path
						const match = relativePath.match(/^([^/]+)\/Pages\/(.+)$/);

						let finalPath = relativePath
							.replace(/\.[^/.]+$/, "")
							.replaceAll("/", firstPathSeparator);
						let description = "Inertia.js";

						const items: CompletionItem[] = [];

						if (match) {
							const [, module, path] = match;
							const componentPath = path
								.replace(/\.[^/.]+$/, "")
								.replaceAll("/", firstPathSeparator);
							finalPath = `${module}:${componentPath}`;
							description = `Inertia.js (${module} Module)`;

							items.push(
								new CompletionItem(
									{
										label: finalPath,
										description: description,
									},
									CompletionItemKind.Value,
								),
							);

							// Add shortcuts
							for (const [shortcut, moduleName] of Object.entries(
								pathShortcuts,
							)) {
								if (moduleName === module) {
									items.push(
										new CompletionItem(
											{
												label: `${shortcut}:${componentPath}`,
												description: `Inertia.js (${shortcut} -> ${module})`,
											},
											CompletionItemKind.Value,
										),
									);
								}
							}
						} else {
							// Only add if it's not a module page (to avoid clutter if it is)
							// Or just add it as a fallback?
							// If it matched the module structure, we added the Module:Path version.
							// We might not want the raw path unless it's not in a Pages folder.
							if (!match) {
								items.push(
									new CompletionItem(
										{
											label: finalPath,
											description: description,
										},
										CompletionItemKind.Value,
									),
								);
							}
						}

						return items;
					});
				}),
		);

		return Promise.all(completionPromises).then((completionArrays) => {
			// Flatten the arrays of completion items
			return completionArrays.flat();
		});
	}
}
