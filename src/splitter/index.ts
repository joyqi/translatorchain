import { TiktokenModel, encoding_for_model } from '@dqbd/tiktoken';
import kv from './kv';

export type SplitterType = {
    type: 'kv',
    splitter: kv
};

function getSpliter<T extends SplitterType>(type: T['type']): T['splitter'] {
    switch (type) {
        case 'kv':
            return new kv();
        default:
            throw new Error(`Unknown splitter type: ${type}`);
    }
}

// diff(src, dst) => [keep, patch]
// split(patch) => [patch1, patch2, ...]
// translate [patch1, patch2, ...] => [translated_patch1, translated_patch2, ...]
// join([translated_patch1, translated_patch2, ...]) => translated_patch
// merge(keep, translated_patch) => translated
export interface Splitter {
    split: (text: string) => string[];
    join: (texts: string[]) => string;
    diff: (srcText: string, dstText: string) => [string, string];
    merge: (srcText: string, patchText: string) => string;
}

export function jsonTokenLength(text: string, model: TiktokenModel = 'text-davinci-003'): number {
    const enc = encoding_for_model(model);
    return enc.encode(JSON.stringify(text)).length;
}

export function split<T extends SplitterType>(type: T['type'], text: string): string[] {
    return getSpliter(type).split(text);
}

export function join<T extends SplitterType>(type: T['type'], texts: string[]): string {
    return getSpliter(type).join(texts);
}

export function diff<T extends SplitterType>(type: T['type'], srcText: string, dstText: string): [string, string] {
    return getSpliter(type).diff(srcText, dstText);
}

export function merge<T extends SplitterType>(type: T['type'], srcText: string, patchText: string): string {
    return getSpliter(type).merge(srcText, patchText);
}