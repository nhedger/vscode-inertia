import {
    CancellationToken,
    CompletionContext,
    CompletionItem,
    CompletionItemKind,
    CompletionItemProvider,
    CompletionList,
    Position,
    ProviderResult,
    TextDocument,
    Uri,
    workspace,
} from 'vscode';

import { Utils } from 'vscode-uri';

export class InertiaComponentAutocompletionProvider
    implements CompletionItemProvider
{
    provideCompletionItems(
        document: TextDocument,
        position: Position,
        token: CancellationToken,
        context: CompletionContext
    ): ProviderResult<CompletionItem[] | CompletionList<CompletionItem>> {
        const lineContentUpToCursor = document
            .lineAt(position)
            .text.slice(0, position.character);

        if (!lineContentUpToCursor.endsWith('Inertia::render("')) {
            return undefined;
        }

        const workspaceURI = workspace.getWorkspaceFolder(document.uri)?.uri;
        if (!workspaceURI) {
            return [];
        }

        // Find all files in the workspace that match the glob pattern

        return workspace
            .findFiles({
                base: workspaceURI.toString(),
                baseUri: workspaceURI,
                pattern: 'resources/js/Pages/**/*.vue',
            })
            .then((files) => {
                const getPathDifference = (base: Uri, path: Uri) => {
                    const baseParts = base.path.split('/').filter(Boolean);
                    const pathParts = path.path.split('/').filter(Boolean);
                    while (
                        baseParts.length &&
                        pathParts.length &&
                        baseParts[0] === pathParts[0]
                    ) {
                        baseParts.shift();
                        pathParts.shift();
                    }
                    return pathParts.join('/').replace(/\.[^/.]+$/, "");
                };

                return files.map((uri) => {
                    const base = Uri.joinPath(
                        workspaceURI,
                        'resources/js/Pages'
                    );
                    return new CompletionItem({
                        label: getPathDifference(base, uri),
                        description: ".vue",
                    }, CompletionItemKind.File);
                });
            });
    }
}
