import { ChatOpenAI } from 'langchain/chat_models/openai';
import {
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate,
} from 'langchain/prompts';
import { LLMChain } from 'langchain/chains';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { StructureType, detectStructureType, getStructure } from './structure';
import { FormatterType, detectFormatterType, getFormatter } from './formatter';
import { Tiktoken, TiktokenModel, encoding_for_model } from '@dqbd/tiktoken';
import ora from 'ora';
import languageEncoding from 'detect-file-encoding-and-language';
import detectIndent from 'detect-indent';

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

function getEncModel(modelName: string): Tiktoken {
    if (modelName.match(/^gpt\-3\.5\-turbo\-[0-9]{4}$/)) {
        modelName = 'gpt-3.5-turbo-0301';
    } else if (modelName.match(/^gpt\-3\.5\-turbo\-16k(\-[0-9]{4})?$/)) {
        modelName = 'gpt-3.5-turbo';
    } else if (modelName.match(/^gpt\-4(\-[0-9]{4})?$/)) {
        modelName = 'gpt-4';
    }

    return encoding_for_model(modelName as TiktokenModel);
}

export async function translate<T extends StructureType, F extends FormatterType>(
    type: T['type'] | 'auto',
    format: F['type'] | 'auto',
    openAIApiKey: string,
    model: string,
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
    const enc = getEncModel(model);

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
    const srcIndent = Math.max(2, detectIndent(srcText).amount);
    const dstIndent = existsSync(dstFile) ? Math.max(2, detectIndent(dstText).amount) : srcIndent;
    const fmt = getFormatter(format);
    const src = fmt.unmarshal(srcText);
    const dst = fmt.unmarshal(dstText);

    if (type === 'auto') {
        type = detectStructureType(src);
    }

    const structure = getStructure(type);
    const [keep, patch] = structure.diff(src, dst);
    const chunks = structure.split(patch, enc, chunkSize);
    const translated = [];

    console.table({
        'Model': model,
        'Format': format,
        'Structure': type,
        'Source File': srcFile + ` (encoding:${srcEnc} indent:${srcIndent})`,
        'Destination File': dstFile + ` (encoding:${dstEnc} indent:${dstIndent})`,
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
    const translatedPatch = structure.join(translated);
    const translatedData = structure.merge(keep, translatedPatch);

    writeFileSync(dstFile, fmt.marshal(translatedData, dstIndent));
}
