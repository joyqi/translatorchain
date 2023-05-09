import { extname } from 'path';
import json from './json';
import yaml from './yaml';

export type FormatterType = {
    type: 'json',
    formatter: json
} | {
    type: 'yaml',
    formatter: yaml
};

export interface Formatter {
    unmarshal: (text: string) => any;
    marshal: (data: any, indent: number) => string;
}

function getFormatter<T extends FormatterType>(type: T['type']): T['formatter'] {
    switch (type) {
        case 'json':
            return new json();
        case 'yaml':
            return new yaml();
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
        default:
            throw new Error(`Unknown file extension: ${ext}`);
    }
}

export function unmarshal<T extends FormatterType>(
    type: T['type'],
    text: Parameters<T['formatter']['unmarshal']>[0]
) {
    return getFormatter(type).unmarshal(text);
}

export function marshal<T extends FormatterType>(
    type: T['type'],
    data: Parameters<T['formatter']['marshal']>[0],
    indent: Parameters<T['formatter']['marshal']>[1]
) {
    return getFormatter(type).marshal(data, indent);
}