import { Tiktoken } from '@dqbd/tiktoken';
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

export function getStructure<T extends StructureType>(type: T['type']): T['structure'] {
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
