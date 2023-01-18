import {
    DocumentLink,
    DocumentLinkProvider,
    ProviderResult,
    TextDocument,
    Uri,
    workspace,
} from 'vscode';
import { locateInDocument } from '../utils/locateInDocument';
import { unglob } from '../utils/unglob';

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
            'inertia\\(\\s*([\'"])(?<component>.+)(\\1)\\s*(?:,[\\s\\S]*?)?\\)',
            'gmd'
        );

        // https://regex101.com/r/3eqwp0/1
        const renderRegex = new RegExp(
            'Inertia::render\\(\\s*([\'"])(?<component>.+)(\\1)\\s*(?:,[\\s\\S]*?)?\\)',
            'gmd'
        );

        // https://regex101.com/r/3tjDRd/1
        const routesRegex = new RegExp(
            'Route::inertia\\(\\s*(["\']).+\\1\\s*,\\s*(["\'])(?<component>.+)\\2\\s*(?:,[\\s\\S]*?)?\\)',
            'gmd'
        );

        const components = [
            ...locateInDocument(helperRegex, 'component', document),
            ...locateInDocument(renderRegex, 'component', document),
            ...locateInDocument(routesRegex, 'component', document),
        ];

        const workspaceURI = workspace.getWorkspaceFolder(document.uri)?.uri;
        if (!workspaceURI) {
            return [];
        }

        const pages: string | undefined = workspace
            .getConfiguration('inertia')
            .get('pages');

        // Handle deprecated setting
        const pagesFolder: string | undefined = workspace
            .getConfiguration('inertia')
            .get('pagesFolder');

        if (pages === undefined || pagesFolder === undefined) {
            return undefined;
        }

        return components.map((component) => {
            return {
                target: Uri.joinPath(
                    workspaceURI,
                    pagesFolder ?? unglob(pages),
                    `${component.value}.vue`
                ),
                range: component.range,
            } as DocumentLink;
        });
    }
}
