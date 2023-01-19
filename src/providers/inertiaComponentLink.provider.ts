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
        // https://regex101.com/r/YiSfGR/2
        const helperRegex = new RegExp(
            '^(?!Route::)inertia\\(\\s*([\'"])(?<component>.+)(\\1)\\s*(?:,[\\s\\S]*?)?\\)',
            'gmd'
        );

        // https://regex101.com/r/3eqwp0/2
        const renderRegex = new RegExp(
            '\\bInertia::render\\(\\s*([\'"])(?<component>.+)(\\1)\\s*(?:,[\\s\\S]*?)?\\)',
            'gmd'
        );

        // https://regex101.com/r/3tjDRd/2
        const routesRegex = new RegExp(
            '\\bRoute::inertia\\(\\s*(["\']).+\\1\\s*,\\s*(["\'])(?<component>.+)\\2\\s*(?:,[\\s\\S]*?)?\\)',
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

        // Find candidate components with glob
        return workspace
            .findFiles({
                base: workspaceURI.toString(),
                baseUri: workspaceURI,
                pattern: pages,
            })
            .then((files) => {
                return components.map((component) => {
                    const file = files.find((file: Uri) => {
                        return file.path.startsWith(
                            Uri.joinPath(
                                workspaceURI,
                                unglob(pages),
                                component.value
                            ).path
                        );
                    });

                    return {
                        target: Uri.joinPath(
                            workspaceURI,
                            unglob(pages),
                            component.value +
                                workspace
                                    .getConfiguration('inertia')
                                    .get('defaultExtension', '.vue')
                        ),
                        range: component.range,
                    } as DocumentLink;
                });
            })
            .then((links) => {
                return links.filter((link) => link.target);
            });
    }
}
