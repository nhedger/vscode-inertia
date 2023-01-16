import { ExtensionContext, languages } from 'vscode';
import { InertiaComponentLinkProvider } from './providers/inertiaComponentLink.provider';

/**
 * This method is called by VS Code when the extension is activated.
 */
export const activate = async (context: ExtensionContext) => {
    console.log('Inertia VS Code Extension is active.');

    const definitionProvider = languages.registerDocumentLinkProvider(
        { scheme: 'file', language: 'php', pattern: '**/*.php' },
        new InertiaComponentLinkProvider()
    );

    context.subscriptions.push(definitionProvider);
};

/**
 * This method is called by VS Code when the extension is deactivated.
 */
export const deactivate = () => {
    console.log('Inertia VS Code Extension is deactivated.');
};
