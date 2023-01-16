# Inertia.js VS Code Extension

This extension brings Inertia.js support to Visual Studio Code.

## Component hyperlinks

![](.github/hyperlink.png)

This extension adds hyperlinks to the name of your components inside
`Inertia::render` and `Route::inertia` method calls. This allows you to easily
navigate to the corresponding component using `CTRL+click`.

Use it to:

-   Quickly navigate to existing components
-   Create missing components on the fly

Vue components are resolved in `resources/js/Pages` by default but you can
customize this path with the `inertia.pagesFolder` setting.
