import {
    DocumentLink,
    DocumentLinkProvider,
    ProviderResult,
    TextDocument,
    Uri,
    workspace,
} from 'vscode';
import { locateInDocument } from '../utils/locateInDocument';

/**
 * Inertia Component Link Provider
 *
 * This definition provider adds hyperlinks to component names when using
 * Route::inertia() and Inertia::render method calls.
 */
export class InertiaComponentLinkProvider implements DocumentLinkProvider {
    provideDocumentLinks(
        document: TextDocument
    ): ProviderResult<DocumentLink[]> {
        // https://regex101.com/r/e38QDW/1
        const helperRegex = new RegExp(
            'inertia\\(\\s*([\'"])(?<component>.+)(\\1)\\s*\\)',
            'gmd'
        );

        // https://regex101.com/r/4Bge9d/1
        const renderRegex = new RegExp(
            'Inertia::render\\(\\s*([\'"])(?<component>.+)(\\1)\\s*\\)',
            'gmd'
        );

        // https://regex101.com/r/DKkafv/1
        const routesRegex = new RegExp(
            'Route::inertia\\(\\s*(["\']).+\\1\\s*,\\s*(["\'])(?<component>.+)\\2\\s*\\)',
            'gmd'
        );

        const components = [
            ...locateInDocument(helperRegex, 'component', document),
            ...locateInDocument(renderRegex, 'component', document),
            ...locateInDocument(routesRegex, 'component', document),
        ];

        console.log(components);

        const workspaceURI = workspace.getWorkspaceFolder(document.uri)?.uri;
        if (!workspaceURI) {
            return [];
        }

        const pagesFolder = workspace
            .getConfiguration('inertia')
            .get('pagesFolder', 'resources/js/Pages');

        return components.map((component) => {
            return {
                target: Uri.joinPath(
                    workspaceURI,
                    pagesFolder,
                    `${component.value}.vue`
                ),
                range: component.range,
            } as DocumentLink;
        });
    }
}
