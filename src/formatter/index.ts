import { extname } from 'path';
import json from './json';
import yaml from './yaml';
import markdown from './markdown';
import srt from './srt';

export type FormatterType = {
    type: 'json',
    formatter: json
} | {
    type: 'yaml',
    formatter: yaml
} | {
    type: 'markdown',
    formatter: markdown
} | {
    type: 'srt',
    formatter: srt
};

export interface Formatter {
    unmarshal: (text: string) => any;
    marshal: (data: any, indent: number) => string;
}

export function getFormatter<T extends FormatterType>(type: T['type']): T['formatter'] {
    switch (type) {
        case 'json':
            return new json();
        case 'yaml':
            return new yaml();
        case 'markdown':
            return new markdown();
        case 'srt':
            return new srt();
        default:
            throw new Error(`Unknown formatter type: ${type}`);
    }
}

export function detectFormatterType(fileName: string): FormatterType['type'] {
    const ext = extname(fileName);

    switch (ext) {
        case '.json':
            return 'json';
        case '.yaml':
        case '.yml':
            return 'yaml';
        case '.md':
        case '.markdown':
            return 'markdown';
        case '.srt':
            return 'srt';
        default:
            throw new Error(`Unknown file extension: ${ext}`);
    }
}
