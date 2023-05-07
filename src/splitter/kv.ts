import { Splitter, jsonTokenLength } from '.';
import { addedDiff, deletedDiff } from 'deep-object-diff';

export default class implements Splitter<Record<string, string>> {
    split(data: Record<string, string>, chunkSize = 500): Record<string, string>[] {
        let left: Record<string, string> = {};
        const result: Record<string, string>[] = [];
        const start = 2;
        let length = start;

        for (const [key, value] of Object.entries(data)) {
            const len = jsonTokenLength(key) + jsonTokenLength(value) + 2;

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

    join(chunks: Record<string, string>[]): Record<string, string> {
        const data: Record<string, string> = {};

        for (const chunk of chunks) {
            for (const [key, value] of Object.entries(chunk)) {
                data[key] = value;
            }
        }

        return data;
    }

    diff(src: Record<string, string>, dst: Record<string, string> | null): [Record<string, string>, Record<string, string>] {
        if (dst === null) {
            dst = {};
        }

        const patch: Record<string, string> = {};
        const addedDiffs = addedDiff(dst, src) as Record<string, string>;

        for (const [key, value] of Object.entries(addedDiffs)) {
            patch[key] = value;
        }

        const deletedDiffs = deletedDiff(dst, src) as Record<string, string>;

        for (const key of Object.keys(deletedDiffs)) {
            delete dst[key];
        }

        return [dst, patch];
    }

    merge(src: Record<string, string>, patch: Record<string, string>): Record<string, string> {
        Object.assign(src, patch);
        return src;
    }
}