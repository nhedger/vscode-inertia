# Visual Studio Code extension for Inertia.js

This extension brings Inertia.js support to Visual Studio Code.

## Features

|                   Hyperlinks                    |                    Autocompletion                    |
| :---------------------------------------------: | :--------------------------------------------------: |
| <img src=".github/hyperlink.png" width="370" /> | <img src=".github/autocompletion.png" width="370" /> |
|       Adds hyperlinks to component names        |     Provides autocompletion for component names      |

## Configuration

### `inertia.pages`

The `inertia.pages` setting must be a glob pattern that matches the components
that should appear in the auto-completion dialog. This pattern is resolved
relative to your workspace's root folder.

The extension also uses this pattern to determine the root folder of your
components, which in turn is used to generate the hyperlinks to your page
components.

Here a some common patterns for different project types:

| Project type    | Pattern                       |
| --------------- | ----------------------------- |
| Laravel + Vue   | `resources/js/Pages/**/*.vue` |
| Laravel + React | `resources/js/Pages/**/*.tsx` |

### `inertia.defaultExtension`

When the extension generates hyperlinks to components that do not yet exist on
the filesystem, it cannot guess which file extension to use because the glob
pattern declared in `inertia.pages` may contain multiple file extensions. The
extension uses this setting to creates hyperlinks with the correct file
extension.

| Project type | Pattern |
| ------------ | ------- |
| Vue          | `.vue`  |
| React        | `.tsx`  |

# License

This VS Code extension is open source software released under the
[MIT License](./LICENSE.md).
