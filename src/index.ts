import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import {
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate,
} from 'langchain/prompts';
import { LLMChain } from 'langchain/chains';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { StructureType, detectStructureType, diff, join, merge, split } from './structure';
import { FormatterType, unmarshal, marshal, detectFormatterType } from './formatter';
import { TiktokenModel, encoding_for_model } from '@dqbd/tiktoken';
import ora from 'ora';
import languageEncoding from 'detect-file-encoding-and-language';

yargs(hideBin(process.argv))
    .command('tc [file]', 'Translate formated file', (yargs) => {
        return yargs.positional('file', {
            describe: 'File to translate',
            type: 'string',
            default: 'lang.json',
        });
    })
    .option('key', {
        alias: 'k',
        type: 'string',
        description: 'OpenAI API key',
    }).parse();

// Build the chat model
function buildChain(chat: ChatOpenAI, systemMessage: string): LLMChain {
    const chatPrompt = ChatPromptTemplate.fromPromptMessages([
        SystemMessagePromptTemplate.fromTemplate(systemMessage),
        HumanMessagePromptTemplate.fromTemplate('{text}'),
    ]);

    return new LLMChain({
        prompt: chatPrompt,
        llm: chat,
    });
}

// Rephrasing the language name from user input
async function rephraseLanguage(chat: ChatOpenAI, langText: string): Promise<string> {
    if (langText.match(/^[A-Z][a-z]{2,}(-[A-Z][a-z]{2,})?$/)) {
        return langText;
    } else if (langText === 'auto') {
        return 'any language';
    }

    const chain = buildChain(chat, 'You are a helpful assistant that directly print the language name in English.');
    const spinner = ora(`Detecting ${langText}`).start();

    const { text } = await chain.call({
        text: langText
    });

    spinner.succeed(`Detected ${text}`);

    return text;
}

// Rephrasing the prompt text from user input
async function rephrasePrompt(chat: ChatOpenAI, promptText: string | null): Promise<string> {
    if (!promptText) {
        return '';
    }

    const chain = buildChain(chat, 'You are a helpful assistant that writes the summarize of the text, rephrasing it in English as the second half of the following sentence: {input}.');
    const spinner = ora(`Detecting ${promptText}`).start();

    const { text } = await chain.call({
        input: 'This input data is about',
        text: promptText
    });

    spinner.succeed(`Detected ${text}`);

    return text;
}

async function detectFile(file: string): Promise<[BufferEncoding, string]> {
    const {encoding, language} = await languageEncoding(file);
    let enc: BufferEncoding = 'utf8';
    let lang = 'auto';

    switch (encoding) {
        case 'latin1':
            enc = 'latin1';
            break;
        case 'UTF-8':
            enc = 'utf8';
            break;
        case 'UTF-16LE':
            enc = 'utf16le';
            break;
        default:
            throw new Error(`Unsupported encoding ${encoding}`);
    }

    if (language) {
        lang = language.replace(/(^|\-)([a-z])/g, (...matches) => matches[2].toUpperCase());
    }

    return [enc, lang];
}

export async function translate<T extends StructureType, F extends FormatterType>(
    type: T['type'] | 'auto',
    format: F['type'] | 'auto',
    openAIApiKey: string,
    model: TiktokenModel,
    prompt: string | null,
    srcFile: string,
    dstFile: string,
    srcLang: string,
    dstLang: string,
    chunkSize: number
): Promise<void> {
    const chat = new ChatOpenAI({
        temperature: 0,
        openAIApiKey,
        modelName: model,
    });

    const chain = buildChain(chat, 'You are a helpful assistant that translates json formatted data from {input_language} to {output_language}. {prompt}');
    const enc = encoding_for_model(model);

    if (format === 'auto') {
        format = detectFormatterType(srcFile);
    }

    const [srcEnc, srcLangAuto] = await detectFile(srcFile);
    const [dstEnc] = existsSync(dstFile) ? await detectFile(dstFile) : [srcEnc];

    srcLang = await rephraseLanguage(chat, srcLang === 'auto' ? srcLangAuto : srcLang);
    dstLang = await rephraseLanguage(chat, dstLang);
    prompt = await rephrasePrompt(chat, prompt);

    const srcText = readFileSync(srcFile, srcEnc);
    const dstText = existsSync(dstFile) ? readFileSync(dstFile, dstEnc) : '';
    const src = unmarshal(format, srcText);
    const dst = unmarshal(format, dstText);

    if (type === 'auto') {
        type = detectStructureType(src);
    }

    const [keep, patch] = diff(type, src, dst);
    const chunks = split(type, patch, enc, chunkSize);
    const translated = [];

    console.table({
        'Model': model,
        'Format': format,
        'Structure': type,
        'Source File': srcFile + ` (${srcEnc})`,
        'Destination File': dstFile + ` (${dstEnc})`,
        'Source Language': srcLang,
        'Destination Language': dstLang,
        'Chunk Size': chunkSize,
        'Chunks': chunks.length,
    });

    const spinner = ora('Start translating').start();

    for (const chunk of chunks) {
        spinner.text = `Translating ${translated.length + 1}/${chunks.length} chunks`;

        const { text } = await chain.call({
            input_language: srcLang,
            output_language: dstLang,
            prompt,
            text: JSON.stringify(chunk)
        });

        translated.push(JSON.parse(text));
    }

    spinner.succeed(`Translated ${chunks.length} chunks`);
    const translatedPatch = join(type, translated);
    const translatedData = merge(type, keep, translatedPatch);

    writeFileSync(dstFile, marshal(format, translatedData));
}
