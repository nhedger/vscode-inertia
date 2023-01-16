import * as path from 'path';
import { Command, Option } from 'commander';
import { runTests as runTestsInBrowser } from '@vscode/test-web';
import { runTests as runTestsInElectron } from '@vscode/test-electron';

const cli = new Command()
    .addOption(
        new Option('-e, --env <env>', 'Environment in which to run the tests.')
            .choices(['node', 'web'])
            .default('node')
    )
    .addOption(
        new Option(
            '-b, --browser <browser>',
            'Browser to use when running tests in the web environment'
        )
            .choices(['chromium', 'firefox'])
            .default('chromium')
    )
    .addOption(
        new Option(
            '-v, --version <version>',
            'Version of VS Code to run the tests with.'
        ).default('stable')
    );

cli.parse();

const options = cli.opts();
console.log(options);

async function runTests() {
    try {
        const extensionDevelopmentPath = path.resolve(__dirname, '..');
        const extensionTestsPath = path.resolve(
            __dirname,
            'tests',
            options.env,
            'test-runner.js'
        );
        await (options.env === 'node'
            ? runTestsInElectron({
                  extensionDevelopmentPath,
                  extensionTestsPath,
                  launchArgs: ['--disable-extensions'],
                  version: options.version,
              })
            : runTestsInBrowser({
                  extensionDevelopmentPath,
                  extensionTestsPath,
                  browserType: options.browser,
                  quality: options.version,
                  printServerLog: true,
              }));
    } catch (err) {
        console.error(err);
        console.error('Failed to run tests');
        process.exit(1);
    }
}

runTests();
