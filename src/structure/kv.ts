import { Tiktoken } from '@dqbd/tiktoken';
import { Structure, jsonTokenLength } from '.';
import { addedDiff, deletedDiff } from 'deep-object-diff';

type KVStructure = Record<string, string>;

export default class implements Structure<KVStructure> {
    private keys: string[] = [];

    split(data: KVStructure, enc: Tiktoken, chunkSize: number): KVStructure[] {
        let left: KVStructure = {};
        const result: KVStructure[] = [];
        const start = 2;
        let length = start;

        for (const [key, value] of Object.entries(data)) {
            const len = jsonTokenLength(key, enc) + jsonTokenLength(value, enc) + 2;

            if (length + len < chunkSize) {
                left[key] = value;
                length += len;
            } else {
                result.push(left);
                left = { [key]: value };
                length = len + start;
            }
        }

        if (length > start) {
            result.push(left);
        }

        return result;
    }

    join(chunks: KVStructure[]): KVStructure {
        const data: KVStructure = {};

        for (const chunk of chunks) {
            for (const [key, value] of Object.entries(chunk)) {
                data[key] = value;
            }
        }

        return data;
    }

    diff(src: KVStructure, dst: KVStructure | null): [KVStructure, KVStructure] {
        if (dst === null) {
            dst = {};
        }

        this.keys = Object.keys(src);
        const patch = addedDiff(dst, src) as KVStructure;
        const deletedDiffs = deletedDiff(dst, src) as KVStructure;

        for (const key of Object.keys(deletedDiffs)) {
            delete dst[key];
        }

        return [dst, patch];
    }

    merge(src: KVStructure, patch: KVStructure): KVStructure {
        const result: KVStructure = {};
        Object.assign(src, patch);

        for (const key of this.keys) {
            result[key] = src[key];
        }

        return result;
    }
}