import { Uri } from 'vscode';

export const pathDiff = (base: Uri, path: Uri) => {
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
    return pathParts.join('/');
};
