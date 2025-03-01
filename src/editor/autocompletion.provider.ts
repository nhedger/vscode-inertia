import { pathDiff, unglob } from "@/helpers";
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

		const pagesGlob: string | undefined = workspace
			.getConfiguration("inertia")
			.get("pages");

		const firstPathSeparator: string | undefined =
			workspace.getConfiguration("inertia").get("pathSeparators", ["/"])?.[0] ??
			"/";

		if (!pagesGlob) {
			return undefined;
		}

		return workspace
			.findFiles({
				base: workspaceURI.toString(),
				baseUri: workspaceURI,
				pattern: pagesGlob,
			})
			.then((files) => {
				console.log(files);
				return files.map((uri) => {
					const base = Uri.joinPath(workspaceURI, unglob(pagesGlob));
					return new CompletionItem(
						{
							label: pathDiff(base, uri)
								.replace(/\.[^/.]+$/, "")
								.replaceAll("/", firstPathSeparator),
							description: "Inertia.js",
						},
						CompletionItemKind.Value,
					);
				});
			});
	}
}
