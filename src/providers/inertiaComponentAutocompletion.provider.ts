import {
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

import { pathDiff } from '../utils/path';
import { unglob } from '../utils/unglob';

export class InertiaComponentAutocompletionProvider
    implements CompletionItemProvider
{
    provideCompletionItems(
        document: TextDocument,
        position: Position
    ): ProviderResult<CompletionItem[] | CompletionList<CompletionItem>> {
        const lineContentUpToCursor = document
            .lineAt(position)
            .text.slice(0, position.character);

        if (
            !/(Inertia::render|inertia)\(["']$/.test(lineContentUpToCursor) &&
            !/Route::inertia\((['"]).+\1\s*,\s*['"]$/.test(
                lineContentUpToCursor
            )
        ) {
            return undefined;
        }

        const workspaceURI = workspace.getWorkspaceFolder(document.uri)?.uri;
        if (!workspaceURI) {
            return [];
        }

        const pagesGlob: string | undefined = workspace
            .getConfiguration('inertia')
            .get('pages');

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
                return files.map((uri) => {
                    const base = Uri.joinPath(workspaceURI, unglob(pagesGlob));
                    return new CompletionItem(
                        {
                            label: pathDiff(base, uri).replace(/\.[^/.]+$/, ''),
                            description: 'Inertia.js',
                        },
                        CompletionItemKind.File
                    );
                });
            });
    }
}
