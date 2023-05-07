import { Tiktoken, TiktokenModel, encoding_for_model } from '@dqbd/tiktoken';
import KV from './kv';
import Tree from './tree';

export type SplitterType = {
    type: 'kv',
    splitter: KV
} | {
    type: 'tree',
    splitter: Tree
};

// diff(src, dst) => [keep, patch]
// split(patch) => [patch1, patch2, ...]
// translate [patch1, patch2, ...] => [translated_patch1, translated_patch2, ...]
// join([translated_patch1, translated_patch2, ...]) => translated_patch
// merge(keep, translated_patch) => translated
export interface Splitter<T extends any> {
    split: (data: T, enc: Tiktoken, chunkSize: number) => T[];
    join: (chunks: T[]) => T;
    diff: (src: T, dst: T | null) => [T, T];
    merge: (src: T, patch: T) => T;
}

function getSpliter<T extends SplitterType>(type: T['type']): T['splitter'] {
    switch (type) {
        case 'kv':
            return new KV();
        case 'tree':
            return new Tree();
        default:
            throw new Error(`Unknown splitter type: ${type}`);
    }
}

export function jsonTokenLength(text: string, enc: Tiktoken): number {
    return enc.encode(JSON.stringify(text)).length;
}

export function split<T extends SplitterType>(
    type: T['type'],
    data: Parameters<T['splitter']['split']>[0],
    enc: Parameters<T['splitter']['split']>[1],
    chunkSize: Parameters<T['splitter']['split']>[2]
) {
    return getSpliter(type).split(data, enc, chunkSize);
}

export function join<T extends SplitterType>(
    type: T['type'],
    chunks: Parameters<T['splitter']['join']>[0]
) {
    return getSpliter(type).join(chunks);
}

export function diff<T extends SplitterType>(
    type: T['type'],
    src: Parameters<T['splitter']['diff']>[0],
    dst: Parameters<T['splitter']['diff']>[1]
) {
    return getSpliter(type).diff(src, dst);
}

export function merge<T extends SplitterType>(
    type: T['type'],
    src: Parameters<T['splitter']['merge']>[0],
    patch: Parameters<T['splitter']['merge']>[1]
) {
    return getSpliter(type).merge(src, patch);
}