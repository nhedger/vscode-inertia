import { Configuration } from 'webpack';
import { resolve } from 'path';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import { existsSync } from 'fs';
import {
    getConfigForNodeExtension,
    getConfigForNodeTests,
} from './webpack.node.config';
import {
    getConfigForWebWorkerExtension,
    getConfigForWebWorkerTests,
} from './webpack.web.config';

export type Mode = 'development' | 'production' | 'none' | undefined;

export default (env: Record<string, string | boolean>) => {
    const mode = env.production === true ? 'production' : 'development';
    return [
        getConfigForNodeExtension(mode),
        getConfigForNodeTests(mode),
        getConfigForWebWorkerExtension(mode),
        getConfigForWebWorkerTests(mode),
        getConfigForTestScript(mode),
    ];
};

export const getConfigForTestScript = (mode: Mode): Configuration => {
    return {
        mode: mode,
        target: 'node',
        name: 'extension:test-script',
        entry: {
            'test-script': resolve(__dirname, 'test/test-script.ts'),
        },
        output: {
            filename: '[name].js',
            libraryTarget: 'commonjs2',
            path: resolve(__dirname, 'out'),
        },
        resolve: {
            extensions: ['.ts', '...'],
        },
        module: {
            exprContextCritical: false,
            rules: [
                {
                    test: /\.ts$/,
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
            'vscode': 'commonjs vscode',
            '@vscode/test-electron': 'commonjs @vscode/test-electron',
            '@vscode/test-web': 'commonjs @vscode/test-web',
        },
        plugins: [
            new CleanWebpackPlugin({
                cleanOnceBeforeBuildPatterns: ['test-script.js'],
            }),
        ],
    };
};

export const useEntrypoint = (platform: 'node' | 'webworker') => {
    const universal = resolve(__dirname, 'src', `extension.ts`);
    const platformSpecific = resolve(
        __dirname,
        'src',
        `extension.${platform}.ts`
    );
    return existsSync(platformSpecific) ? platformSpecific : universal;
};
