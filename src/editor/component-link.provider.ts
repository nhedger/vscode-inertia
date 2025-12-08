import {
	type PageResolver,
	getAllPagePatterns,
	locateInDocument,
	resolveComponentWithPrefix,
	unglob,
} from "@/helpers";
import {
	type DocumentLink,
	type DocumentLinkProvider,
	type ProviderResult,
	type TextDocument,
	Uri,
	window,
	workspace,
} from "vscode";

/**
 * Inertia Component Link Provider
 *
 * This definition provider adds hyperlinks to component names when using
 * Route::inertia() and Inertia::render method calls.
 */
export class ComponentLinkProvider implements DocumentLinkProvider {
	provideDocumentLinks(document: TextDocument): ProviderResult<DocumentLink[]> {
		// https://regex101.com/r/YiSfGR/7
		const helperRegex =
			/^(?!.*Route::inertia).*inertia\(\s*(['"])(?<component>.+?)(\1)/dgm;

		// https://regex101.com/r/FheqGS/5
		const renderRegex =
			/\bInertia::render\(\s*(['"])(?<component>(?:(?!\1).)*)(\1)/dgm;

		// https://regex101.com/r/3tjDRd/4
		const routesRegex =
			/\bRoute::inertia\(\s*(["']).+\1\s*,\s*(["'])(?<component>(?:(?!\2).)*)\2/dgm;

		const components = [
			...locateInDocument(helperRegex, "component", document),
			...locateInDocument(renderRegex, "component", document),
			...locateInDocument(routesRegex, "component", document),
		];

		const workspaceURI = workspace.getWorkspaceFolder(document.uri)?.uri;
		if (!workspaceURI) {
			return [];
		}

		// Find candidate components with glob
		return components.map((component) => {
			return {
				range: component.range,
			} as DocumentLink;
		});
	}

	resolveDocumentLink(link: DocumentLink): ProviderResult<DocumentLink> {
		const document = window.activeTextEditor?.document;
		if (!document) {
			return undefined;
		}

		const workspaceURI = workspace.getWorkspaceFolder(document.uri)?.uri;
		if (!workspaceURI) {
			return undefined;
		}

		const componentName = document.getText(link.range);
		const config = workspace.getConfiguration("inertia");

		// Get page resolvers for prefix-based resolution
		const pageResolvers: PageResolver[] = config.get("pageResolvers", []);
		const pathShortcuts: Record<string, string> = config.get(
			"pathShortcuts",
			{},
		);
		const prefixResolution = resolveComponentWithPrefix(
			componentName,
			pageResolvers,
			pathShortcuts,
		);

		if (prefixResolution) {
			// Handle prefix-based component resolution
			const { resolver, componentPath } = prefixResolution;

			return workspace
				.findFiles({
					base: workspaceURI.toString(),
					baseUri: workspaceURI,
					pattern: resolver.pattern,
				})
				.then((files: Uri[]) => {
					const normalizedPath = this.normalizeComponentPath(componentPath);
					const file = files.find((file: Uri) => {
						return file.path.startsWith(
							Uri.joinPath(
								workspaceURI,
								unglob(resolver.pattern),
								normalizedPath,
							).path,
						);
					});

					link.target =
						file ??
						Uri.joinPath(
							workspaceURI,
							unglob(resolver.pattern),
							normalizedPath + config.get("defaultExtension", ".vue"),
						);

					return link;
				});
		}

		// Fall back to default resolution
		const pages = "Modules/**/*";

		// Find candidate components with glob
		return workspace
			.findFiles({
				base: workspaceURI.toString(),
				baseUri: workspaceURI,
				pattern: pages,
			})
			.then((files: Uri[]) => {
				const file = files.find((file: Uri) => {
					const normalized = this.normalizeComponentPath(componentName);
					return file.path.startsWith(
						Uri.joinPath(workspaceURI, unglob(pages), normalized).path,
					);
				});

				link.target =
					file ??
					Uri.joinPath(
						workspaceURI,
						unglob(pages),
						this.normalizeComponentPath(componentName) +
							config.get("defaultExtension", ".vue"),
					);

				return link;
			});
	}

	private normalizeComponentPath(component: string): string {
		const pathSeparators: string[] | undefined = workspace
			.getConfiguration("inertia")
			.get("pathSeparators", ["/"]);

		return component.replaceAll(
			new RegExp(`[${(pathSeparators || ["/"]).join("")}]`, "g"),
			"/",
		);
	}
}
