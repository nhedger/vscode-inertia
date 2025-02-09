var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __moduleCache = /* @__PURE__ */ new WeakMap();
var __toCommonJS = (from) => {
	var entry = __moduleCache.get(from),
		desc;
	if (entry) return entry;
	entry = __defProp({}, "__esModule", { value: true });
	if ((from && typeof from === "object") || typeof from === "function")
		__getOwnPropNames(from).map(
			(key) =>
				!__hasOwnProp.call(entry, key) &&
				__defProp(entry, key, {
					get: () => from[key],
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
				}),
		);
	__moduleCache.set(from, entry);
	return entry;
};
var __export = (target, all) => {
	for (var name in all)
		__defProp(target, name, {
			get: all[name],
			enumerable: true,
			configurable: true,
			set: (newValue) => (all[name] = () => newValue),
		});
};

// src/extension.ts
var exports_extension = {};
__export(exports_extension, {
	deactivate: () => deactivate,
	activate: () => activate,
});
module.exports = __toCommonJS(exports_extension);

// src/editor/autocompletion.provider.ts
var import_vscode2 = require("vscode");

// src/helpers.ts
var import_vscode = require("vscode");
var pathDiff = (base, path) => {
	const baseParts = base.fsPath.split(/[\/\\]/).filter(Boolean);
	const pathParts = path.fsPath.split(/[\/\\]/).filter(Boolean);
	while (
		baseParts.length &&
		pathParts.length &&
		baseParts[0] === pathParts[0]
	) {
		baseParts.shift();
		pathParts.shift();
	}
	return pathParts.join("/");
};
var unglob = (glob) => {
	const regex = /^(.*?)([*[{].*|$)/;
	const match = glob.match(regex);
	return match ? match[1] : "";
};
var locateInDocument = (pattern, group, document) => {
	const results = [];
	while (true) {
		const match = pattern.exec(document.getText());
		if (!match) break;
		if (match.groups?.[group] && match.indices?.groups?.[group]) {
			results.push({
				value: match.groups?.[group],
				range: new import_vscode.Range(
					document.positionAt(match.indices.groups[group][0]),
					document.positionAt(match.indices.groups[group][1]),
				),
			});
		}
	}
	return results;
};

// src/editor/autocompletion.provider.ts
class AutocompletionProvider {
	provideCompletionItems(document, position) {
		const lineContentUpToCursor = document.getText(
			new import_vscode2.Range(
				position.line - 1,
				0,
				position.line,
				position.character,
			),
		);
		const renderRegex = /\b(Inertia::render|inertia)\([\s\s]*["']$/;
		const routeRegex = /Route::inertia\([\s\S]*(['"]).+\1[\s\S]*,[\s\S]*['"]$/;
		if (
			!renderRegex.test(lineContentUpToCursor) &&
			!routeRegex.test(lineContentUpToCursor)
		) {
			return;
		}
		const workspaceURI = import_vscode2.workspace.getWorkspaceFolder(
			document.uri,
		)?.uri;
		if (!workspaceURI) {
			return [];
		}
		const pagesGlob = import_vscode2.workspace
			.getConfiguration("inertia")
			.get("pages");
		const firstPathSeparator =
			import_vscode2.workspace
				.getConfiguration("inertia")
				.get("pathSeparators", ["/"])?.[0] ?? "/";
		if (!pagesGlob) {
			return;
		}
		return import_vscode2.workspace
			.findFiles({
				base: workspaceURI.toString(),
				baseUri: workspaceURI,
				pattern: pagesGlob,
			})
			.then((files) => {
				console.log(files);
				return files.map((uri) => {
					const base = import_vscode2.Uri.joinPath(
						workspaceURI,
						unglob(pagesGlob),
					);
					return new import_vscode2.CompletionItem(
						{
							label: pathDiff(base, uri)
								.replace(/\.[^/.]+$/, "")
								.replaceAll("/", firstPathSeparator),
							description: "Inertia.js",
						},
						import_vscode2.CompletionItemKind.Value,
					);
				});
			});
	}
}

// src/editor/component-link.provider.ts
var import_vscode3 = require("vscode");

class ComponentLinkProvider {
	provideDocumentLinks(document) {
		const helperRegex =
			/^(?!.*Route::inertia).*inertia\(\s*(['"])(?<component>.+?)(\1)/dgm;
		const renderRegex =
			/\bInertia::render\(\s*(['"])(?<component>(?:(?!\1).)*)(\1)/dgm;
		const routesRegex =
			/\bRoute::inertia\(\s*(["']).+\1\s*,\s*(["'])(?<component>(?:(?!\2).)*)\2/dgm;
		const components = [
			...locateInDocument(helperRegex, "component", document),
			...locateInDocument(renderRegex, "component", document),
			...locateInDocument(routesRegex, "component", document),
		];
		const workspaceURI = import_vscode3.workspace.getWorkspaceFolder(
			document.uri,
		)?.uri;
		if (!workspaceURI) {
			return [];
		}
		const pages = import_vscode3.workspace
			.getConfiguration("inertia")
			.get("pages");
		const pagesFolder = import_vscode3.workspace
			.getConfiguration("inertia")
			.get("pagesFolder");
		if (pages === undefined || pagesFolder === undefined) {
			return;
		}
		return components.map((component) => {
			return {
				range: component.range,
			};
		});
	}
	resolveDocumentLink(link) {
		const document = import_vscode3.window.activeTextEditor?.document;
		if (!document) {
			return;
		}
		const workspaceURI = import_vscode3.workspace.getWorkspaceFolder(
			document.uri,
		)?.uri;
		if (!workspaceURI) {
			return;
		}
		const pages = import_vscode3.workspace
			.getConfiguration("inertia")
			.get("pages");
		const pagesFolder = import_vscode3.workspace
			.getConfiguration("inertia")
			.get("pagesFolder");
		if (pages === undefined || pagesFolder === undefined) {
			return;
		}
		return import_vscode3.workspace
			.findFiles({
				base: workspaceURI.toString(),
				baseUri: workspaceURI,
				pattern: pages,
			})
			.then((files) => {
				const path = document.getText(link.range);
				const file = files.find((file2) => {
					const normalized = this.normalizeComponentPath(path);
					return file2.path.startsWith(
						import_vscode3.Uri.joinPath(workspaceURI, unglob(pages), normalized)
							.path,
					);
				});
				link.target =
					file ??
					import_vscode3.Uri.joinPath(
						workspaceURI,
						unglob(pages),
						this.normalizeComponentPath(path) +
							import_vscode3.workspace
								.getConfiguration("inertia")
								.get("defaultExtension", ".vue"),
					);
				return link;
			});
	}
	normalizeComponentPath(component) {
		const pathSeparators = import_vscode3.workspace
			.getConfiguration("inertia")
			.get("pathSeparators", ["/"]);
		return component.replaceAll(
			new RegExp(`[${pathSeparators.join("")}]`, "g"),
			"/",
		);
	}
}

// src/extension.ts
var import_vscode4 = require("vscode");
var activate = async (context) => {
	console.log("Inertia VS Code Extension is active.");
	const definitionProvider =
		import_vscode4.languages.registerDocumentLinkProvider(
			{ scheme: "file", language: "php", pattern: "**/*.php" },
			new ComponentLinkProvider(),
		);
	const autocompletionProvider =
		import_vscode4.languages.registerCompletionItemProvider(
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
var deactivate = () => {
	console.log("Inertia VS Code Extension is deactivated.");
};
