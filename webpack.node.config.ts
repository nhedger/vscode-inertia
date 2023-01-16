import { Configuration } from 'webpack';
import { parse, resolve } from 'path';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import { glob } from 'glob';
import nodeExternals from 'webpack-node-externals';
import { getConfigForTestScript, Mode, useEntrypoint } from './webpack.config';

export default (env: Record<string, string | boolean>) => {
    const mode = env.production === true ? 'production' : 'development';
    return [
        getConfigForNodeExtension(mode),
        getConfigForNodeTests(mode),
        getConfigForTestScript(mode),
    ];
};

export const getConfigForNodeExtension = (mode: Mode): Configuration => {
    return {
        mode: mode,
        target: 'node',
        name: 'extension:node',
        entry: useEntrypoint('node'),
        devtool: 'source-map',
        output: {
            filename: 'extension.js',
            libraryTarget: 'commonjs2',
            path: resolve(__dirname, 'out', 'extension', 'node'),
            devtoolModuleFilenameTemplate: 'file:///[absolute-resource-path]',
        },
        resolve: {
            extensions: ['.ts', '...'],
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    exclude: [/node_modules/, /\.webworker.ts$/],
                    use: {
                        loader: 'ts-loader',
                        options: {
                            configFile: resolve(
                                __dirname,
                                'tsconfig.node.json'
                            ),
                        },
                    },
                },
            ],
        },
        externals: {
            vscode: 'commonjs vscode',
        },
        plugins: [
            new CleanWebpackPlugin({
                cleanOnceBeforeBuildPatterns: ['extension.js'],
            }),
        ],
    };
};

export const getConfigForNodeTests = (mode: Mode): Configuration => {
    return {
        mode: mode,
        target: 'node',
        name: 'tests:node',
        devtool: 'source-map',
        entry: {
            'test-runner': resolve(__dirname, 'test/runner.node.ts'),
            ...glob
                .sync(
                    resolve(
                        __dirname,
                        'test/suite/**/?(!(*.webworker)).test.ts'
                    )
                )
                .reduce(function (
                    entries: Record<string, string>,
                    path: string
                ) {
                    entries['test-suite/' + parse(path).name] = path;
                    return entries;
                },
                {}),
        },
        output: {
            filename: '[name].js',
            libraryTarget: 'commonjs2',
            path: resolve(__dirname, 'out', 'tests', 'node'),
        },
        resolve: {
            extensions: ['.ts', '...'],
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    exclude: [/node_modules/, /\.webworker.ts$/],
                    use: {
                        loader: 'ts-loader',
                        options: {
                            configFile: resolve(
                                __dirname,
                                'tsconfig.node.json'
                            ),
                        },
                    },
                },
            ],
        },
        externals: [{ vscode: 'commonjs vscode' }, nodeExternals()],
        externalsPresets: {
            node: true,
        },
        plugins: [
            new CleanWebpackPlugin({
                cleanOnceBeforeBuildPatterns: [
                    'test-runner.js',
                    'test-suite/**',
                ],
            }),
        ],
    };
};
