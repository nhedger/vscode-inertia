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
    return match ? match[1] : '';
};
