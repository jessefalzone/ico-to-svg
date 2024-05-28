#!/usr/bin/env node

import meow from 'meow';
import { processIcons } from './index.js';

function onFatalError(error) {
    console.error(error);
}

(async function main() {
    process.on('uncaughtException', onFatalError);
    process.on('unhandledRejection', onFatalError);

    const cli = meow(
        `
  Usage
  $ i2s [--output | -o] <icon_or_directory> ...

  Options
    --output, -o An optional output path; will be created if it doesn't exist.

  Example
    $ i2s oneIcon.ico /some/more/icons --output /path/to/output
`,
        {
            importMeta: import.meta,
            flags: {
                output: {
                    type: 'string',
                    shortFlag: 'o',
                    default: './svg',
                },
            },
        }
    );

    if (!cli.input.at(0)) {
        throw new Error(
            'An image source is required.  See `i2s --help` for usage.'
        );
    }

    processIcons(cli.input, cli.flags.output);
})().catch(onFatalError);
