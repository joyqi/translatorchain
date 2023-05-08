import { Tiktoken, TiktokenModel, encoding_for_model } from '@dqbd/tiktoken';
import KV from './kv';
import Tree from './tree';

export type StructureType = {
    type: 'kv',
    structure: KV
} | {
    type: 'tree',
    structure: Tree
};

// diff(src, dst) => [keep, patch]
// split(patch) => [patch1, patch2, ...]
// translate [patch1, patch2, ...] => [translated_patch1, translated_patch2, ...]
// join([translated_patch1, translated_patch2, ...]) => translated_patch
// merge(keep, translated_patch) => translated
export interface Structure<T extends any> {
    split: (data: T, enc: Tiktoken, chunkSize: number) => T[];
    join: (chunks: T[]) => T;
    diff: (src: T, dst: T | null) => [T, T];
    merge: (src: T, patch: T) => T;
}

function getSpliter<T extends StructureType>(type: T['type']): T['structure'] {
    switch (type) {
        case 'kv':
            return new KV();
        case 'tree':
            return new Tree();
        default:
            throw new Error(`Unknown structure type: ${type}`);
    }
}

export function detectStructureType(data: any): StructureType['type'] {
    if (typeof data !== 'object') {
        throw new Error('Data must be an object');
    }

    for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'object') {
            return 'tree';
        }
    }

    return 'kv';
}

export function jsonTokenLength(text: string, enc: Tiktoken): number {
    return enc.encode(JSON.stringify(text)).length;
}

export function split<T extends StructureType>(
    type: T['type'],
    data: Parameters<T['structure']['split']>[0],
    enc: Parameters<T['structure']['split']>[1],
    chunkSize: Parameters<T['structure']['split']>[2]
) {
    return getSpliter(type).split(data, enc, chunkSize);
}

export function join<T extends StructureType>(
    type: T['type'],
    chunks: Parameters<T['structure']['join']>[0]
) {
    return getSpliter(type).join(chunks);
}

export function diff<T extends StructureType>(
    type: T['type'],
    src: Parameters<T['structure']['diff']>[0],
    dst: Parameters<T['structure']['diff']>[1]
) {
    return getSpliter(type).diff(src, dst);
}

export function merge<T extends StructureType>(
    type: T['type'],
    src: Parameters<T['structure']['merge']>[0],
    patch: Parameters<T['structure']['merge']>[1]
) {
    return getSpliter(type).merge(src, patch);
}