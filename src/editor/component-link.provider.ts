import { locateInDocument, unglob } from "@/helpers";
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

		const pages: string | undefined = workspace
			.getConfiguration("inertia")
			.get("pages");

		// Handle deprecated setting
		const pagesFolder: string | undefined = workspace
			.getConfiguration("inertia")
			.get("pagesFolder");

		if (pages === undefined || pagesFolder === undefined) {
			return undefined;
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

		const pages: string | undefined = workspace
			.getConfiguration("inertia")
			.get("pages");

		// Handle deprecated setting
		const pagesFolder: string | undefined = workspace
			.getConfiguration("inertia")
			.get("pagesFolder");

		if (pages === undefined || pagesFolder === undefined) {
			return undefined;
		}

		// Find candidate components with glob
		return workspace
			.findFiles({
				base: workspaceURI.toString(),
				baseUri: workspaceURI,
				pattern: pages,
			})
			.then((files) => {
				const path = document.getText(link.range);

				const file = files.find((file: Uri) => {
					const normalized = this.normalizeComponentPath(path);
					return file.path.startsWith(
						Uri.joinPath(workspaceURI, unglob(pages), normalized).path,
					);
				});

				link.target =
					file ??
					Uri.joinPath(
						workspaceURI,
						unglob(pages),
						this.normalizeComponentPath(path) +
							workspace
								.getConfiguration("inertia")
								.get("defaultExtension", ".vue"),
					);

				return link;
			});
	}

	private normalizeComponentPath(component: string): string {
		const pathSeparators: string[] | undefined = workspace
			.getConfiguration("inertia")
			.get("pathSeparators", ["/"]);

		return component.replaceAll(
			new RegExp(`[${pathSeparators.join("")}]`, "g"),
			"/",
		);
	}
}
