import { Range, type TextDocument, type Uri } from "vscode";

/**
 * Interface for page resolver configuration
 */
export interface PageResolver {
	prefix: string;
	pattern: string;
}

/**
 * Computes the difference between two paths
 */
export const pathDiff = (base: Uri, path: Uri) => {
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

/**
 * Returns the static part of a glob pattern
 *
 * This helper will return the static part of a given glob pattern. This means
 * that it will return everything before a glob character is encountered.
 *
 * For example, given the following glob pattern: `resources/js/Pages/*.vue`
 * the function will return `resources/js/Pages/`.
 */
export const unglob = (glob: string): string => {
	const regex = /^(.*?)([*[{].*|$)/;
	const match = glob.match(regex);
	return match ? match[1] : "";
};

/**
 * Locates a pattern in a document an returns the range of all occurences.
 */
export const locateInDocument = (
	pattern: RegExp,
	group: string,
	document: TextDocument,
): { value: string; range: Range }[] => {
	const results: { value: string; range: Range }[] = [];

	while (true) {
		const match = pattern.exec(document.getText());
		if (!match) break;
		if (match.groups?.[group] && match.indices?.groups?.[group]) {
			results.push({
				value: match.groups?.[group],
				range: new Range(
					document.positionAt(match.indices.groups[group][0]),
					document.positionAt(match.indices.groups[group][1]),
				),
			});
		}
	}

	return results;
};

/**
 * Resolves a component name with prefix to its actual file path
 */
export const resolveComponentWithPrefix = (
	componentName: string,
	pageResolvers: PageResolver[],
): { resolver: PageResolver; componentPath: string } | null => {
	// Check if component has a prefix (format: "Prefix:ComponentPath")
	const prefixMatch = componentName.match(/^([^:]+):(.+)$/);

	if (!prefixMatch) {
		return null;
	}

	const [, prefix, componentPath] = prefixMatch;
	const resolver = pageResolvers.find((r) => r.prefix === prefix);

	if (!resolver) {
		return null;
	}

	return { resolver, componentPath };
};

/**
 * Gets all configured page patterns (both legacy and new resolver-based)
 */
export const getAllPagePatterns = (workspace: {
	getConfiguration: (section: string) => {
		get: (key: string, defaultValue?: unknown) => unknown;
	};
}): { pattern: string; prefix?: string }[] => {
	const config = workspace.getConfiguration("inertia");
	const patterns: { pattern: string; prefix?: string }[] = [];

	// Add legacy pages pattern if configured
	const legacyPages = config.get("pages") as string | undefined;
	if (legacyPages) {
		patterns.push({ pattern: legacyPages });
	}

	// Add new page resolvers
	const pageResolvers = config.get("pageResolvers", []) as PageResolver[];
	for (const resolver of pageResolvers) {
		patterns.push({ pattern: resolver.pattern, prefix: resolver.prefix });
	}

	return patterns;
};
