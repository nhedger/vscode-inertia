import { Configuration, optimize } from 'webpack';
import { resolve } from 'path';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import { getConfigForTestScript, Mode, useEntrypoint } from './webpack.config';

export default (env: Record<string, string | boolean>) => {
    const mode = env.production === true ? 'production' : 'development';
    return [
        getConfigForWebWorkerExtension(mode),
        getConfigForWebWorkerTests(mode),
        getConfigForTestScript(mode),
    ];
};

export const getConfigForWebWorkerExtension = (mode: Mode): Configuration => {
    return {
        mode: mode,
        target: 'webworker',
        name: 'extension:webworker',
        entry: useEntrypoint('webworker'),
        output: {
            filename: 'extension.js',
            libraryTarget: 'commonjs2',
            path: resolve(__dirname, 'out', 'extension', 'web'),
        },
        resolve: {
            extensions: ['.ts', '...'],
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    exclude: [/node_modules/, /\.node.ts$/],
                    use: {
                        loader: 'ts-loader',
                        options: {
                            configFile: resolve(__dirname, 'tsconfig.web.json'),
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
            new optimize.LimitChunkCountPlugin({
                maxChunks: 1,
            }),
        ],
    };
};

export const getConfigForWebWorkerTests = (mode: Mode): Configuration => {
    return {
        mode: mode,
        target: 'webworker',
        name: 'tests:webworker',
        entry: {
            'test-runner': resolve(__dirname, 'test/runner.web.ts'),
        },
        output: {
            filename: '[name].js',
            libraryTarget: 'commonjs2',
            path: resolve(__dirname, 'out', 'tests', 'web'),
        },
        resolve: {
            extensions: ['.ts', '...'],
        },
        module: {
            exprContextCritical: false,
            rules: [
                {
                    test: /\.ts$/,
                    exclude: [/node_modules/, /\.node.ts$/],
                    use: {
                        loader: 'ts-loader',
                        options: {
                            configFile: resolve(__dirname, 'tsconfig.web.json'),
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
                cleanOnceBeforeBuildPatterns: ['test-runner.js'],
            }),
            new optimize.LimitChunkCountPlugin({
                maxChunks: 1,
            }),
        ],
    };
};
