import json from './json';

export type FormatterType = {
    type: 'json',
    formatter: json
};

export interface Formatter {
    input: (text: string) => any;
    output: (data: any) => string;
}

function getFormatter<T extends FormatterType>(type: T['type']): T['formatter'] {
    switch (type) {
        case 'json':
            return new json();
        default:
            throw new Error(`Unknown formatter type: ${type}`);
    }
}

export function formatInput<T extends FormatterType>(
    type: T['type'],
    text: Parameters<T['formatter']['input']>[0]
) {
    return getFormatter(type).input(text);
}

export function formatOutput<T extends FormatterType>(
    type: T['type'],
    data: Parameters<T['formatter']['output']>[0]
) {
    return getFormatter(type).output(data);
}