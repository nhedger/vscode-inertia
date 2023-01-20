import {
    CompletionItem,
    CompletionItemKind,
    CompletionItemProvider,
    CompletionList,
    Position,
    ProviderResult,
    Range,
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
        const lineContentUpToCursor = document.getText(
            new Range(position.line - 1, 0, position.line, position.character)
        );

        // https://regex101.com/r/yGJ9nf/2
        const renderRegex = /\b(Inertia::render|inertia)\([\s\s]*["']$/;
        // https://regex101.com/r/0eMWiO/2
        const routeRegex =
            /Route::inertia\([\s\S]*(['"]).+\1[\s\S]*,[\s\S]*['"]$/;

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
                console.log(files);
                return files.map((uri) => {
                    const base = Uri.joinPath(workspaceURI, unglob(pagesGlob));
                    return new CompletionItem(
                        {
                            label: pathDiff(base, uri).replace(/\.[^/.]+$/, ''),
                            description: 'Inertia.js',
                        },
                        CompletionItemKind.Value
                    );
                });
            });
    }
}
