import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { existsSync } from "fs";
import { translate } from ".";

const argv = yargs(hideBin(process.argv))
    .option('key', {
        alias: 'k',
        type: 'string',
        description: 'OpenAI API key',
        demandOption: true,
        default: process.env.OPENAI_API_KEY
    })
    .option('output', {
        alias: 'o',
        type: 'string',
        demandOption: true,
        description: 'Output file path',
    })
    .option('type', {
        alias: 't',
        type: 'string',
        description: 'The type of the file splitter',
        choices: ['kv'],
        demandOption: true,
        default: 'kv'
    })
    .option('format', {
        alias: 'f',
        type: 'string',
        description: 'The type of the file formatter',
        choices: ['json'],
        demandOption: true,
        default: 'json'
    })
    .option('src', {
        alias: 's',
        type: 'string',
        description: 'Source language',
        demandOption: true,
        default: 'auto'
    })
    .option('dst', {
        alias: 'd',
        type: 'string',
        description: 'Destination language',
        demandOption: true,
        default: 'English'
    })
    .option('chunk', {
        alias: 'c',
        type: 'number',
        description: 'Chunk size',
        demandOption: true,
        default: 500
    })
    .check((argv) => {
        const filePaths = argv._;
        if (filePaths.length !== 1) {
            throw new Error("You must provide exactly one file path.");
        } else if (!existsSync(filePaths[0] as string)) {
            throw new Error(`Source file ${filePaths[0]} does not exist.`);
        } else {
            return true;
        }
    })
    .argv;

(async () => {
    const { key, format, output, type, src, dst, chunk, _ } = await argv;
    translate(
        type as any,
        format as any,
        key as string,
        _[0] as string,
        output as string,
        src as string,
        dst as string,
        chunk
    );
})();