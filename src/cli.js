#!/usr/bin/env node

import { program, Option } from 'commander';
import { makeIcons } from './index.js';

function onFatalError(error) {
    console.error(error);
}

(async function main() {
    process.on('uncaughtException', onFatalError);
    process.on('unhandledRejection', onFatalError);

    program.name('i2s').description('Converts .ico icons to SVGs.');

    program
        .argument('<icons...>', 'One or more icons or paths')
        .addOption(
            new Option('-o, --output [output]', 'Output directory').default(
                './svg'
            )
        )
        .showHelpAfterError('(add --help for usage information)');

    program.parse();
    makeIcons(program.args, program.opts().output);
})().catch(onFatalError);
