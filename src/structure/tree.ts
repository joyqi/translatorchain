import { Tiktoken } from '@dqbd/tiktoken';
import { Structure } from '.';
import kv from "./kv";
import { flatten, unflatten } from "flat";

const delimiter = '|';

type TreeStructure = Record<string, any>;

export default class implements Structure<TreeStructure> {
    private kv = new kv();

    split(data: TreeStructure, enc: Tiktoken, chunkSize: number): TreeStructure[] {
        return this.kv.split(data, enc, chunkSize);
    }

    join(chunks: TreeStructure[]): TreeStructure {
        return this.kv.join(chunks);
    }

    diff(src: TreeStructure, dst: TreeStructure | null): [TreeStructure, TreeStructure] {
        return this.kv.diff(flatten(src, { delimiter }), flatten(dst || {}, { delimiter }));
    }

    merge(src: TreeStructure, patch: TreeStructure): TreeStructure {
        return unflatten(this.kv.merge(src, patch), { delimiter });
    }
}