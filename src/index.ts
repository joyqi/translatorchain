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
import { SplitterType, diff, join, merge, split } from './splitter';

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

async function detectLanguage(chat: ChatOpenAI, langText: string): Promise<string> {
    if (langText.match(/^[A-Z][a-z]{2,}$/)) {
        return langText;
    }

    const chatPrompt = ChatPromptTemplate.fromPromptMessages([
        SystemMessagePromptTemplate.fromTemplate(
            'You are a helpful assistant that directly print the language name in English.'
        ),
        HumanMessagePromptTemplate.fromTemplate('{text}'),
    ]);

    const chain = new LLMChain({
        prompt: chatPrompt,
        llm: chat,
    });

    console.log(`Detecting language of ${langText}`);

    const { text } = await chain.call({
        text: langText
    });

    console.log(`Detected language of ${langText} is ${text}`);

    return text;
}

export async function translate<T extends SplitterType>(
    type: T['type'],
    openAIApiKey: string,
    srcFile: string,
    dstFile: string,
    srcLang: string,
    dstLang: string
): Promise<void> {
    const chat = new ChatOpenAI({
        temperature: 0,
        openAIApiKey
    });

    const chatPrompt = ChatPromptTemplate.fromPromptMessages([
        SystemMessagePromptTemplate.fromTemplate(
            'You are a helpful assistant that translates {input_language} to {output_language} in json format.'
        ),
        HumanMessagePromptTemplate.fromTemplate('{text}'),
    ]);

    const chain = new LLMChain({
        prompt: chatPrompt,
        llm: chat,
    });

    srcLang = await detectLanguage(chat, srcLang);
    dstLang = await detectLanguage(chat, dstLang);

    console.log(`Translating ${srcFile} by ${srcLang} to ${dstFile} by ${dstLang}`);

    const src = readFileSync(srcFile, 'utf-8');
    const dst = existsSync(dstFile) ? readFileSync(dstFile, 'utf-8') : '';
    const [keep, patch] = diff(type, src, dst);
    const patches = split(type, patch);
    const translated = [];
    console.log(`Translating ${patches.length} patches...`);

    for (const patch of patches) {
        const { text } = await chain.call({
            input_language: srcLang,
            output_language: dstLang,
            text: patch
        });

        translated.push(text);
        console.log(`Translated ${translated.length} patches...`);
    }

    const translatedPatch = join(type, translated);
    const translatedText = merge(type, keep, translatedPatch);

    writeFileSync(dstFile, translatedText);
}
