import { Splitter, jsonTokenLength } from '.';
import { diff } from "json-diff-ts";

export default class implements Splitter {
    constructor(
        private readonly chunkSize: number = 500,
        private readonly tabSize: number = 4
    ) { }

    split(text: string): string[] {
        const data: Record<string, string> = JSON.parse(text);
        let left: Record<string, string> = {};
        const result: string[] = [];
        const start = 2;
        let length = start;

        for (const [key, value] of Object.entries(data)) {
            const len = jsonTokenLength(key) + jsonTokenLength(value) + 2;

            if (length + len < this.chunkSize) {
                left[key] = value;
                length += len;
            } else {
                result.push(JSON.stringify(left));
                left = { [key]: value };
                length = len + start;
            }
        }

        if (length > start) {
            result.push(JSON.stringify(left));
        }

        return result;
    }

    join(texts: string[]): string {
        const data: Record<string, string> = {};

        for (const text of texts) {
            const chunk: Record<string, string> = JSON.parse(text);

            for (const [key, value] of Object.entries(chunk)) {
                data[key] = value;
            }
        }

        return JSON.stringify(data, null, this.tabSize);
    }

    diff(srcText: string, dstText: string): [string, string] {
        const src = JSON.parse(srcText);
        const dst = dstText ? JSON.parse(dstText) : {};
        const patch: Record<string, string> = {};
        const diffs = diff(dst, src);

        for (const diff of diffs) {
            if (diff.type === 'ADD') {
                patch[diff.key] = src[diff.key];
            } else if (diff.type === 'REMOVE') {
                delete dst[diff.key];
            }
        }

        return [JSON.stringify(dst), JSON.stringify(patch)];
    }

    merge(srcText: string, patchText: string): string {
        const src = JSON.parse(srcText);
        const patch = JSON.parse(patchText);
        Object.assign(src, patch);

        return JSON.stringify(src, null, this.tabSize);
    }
}