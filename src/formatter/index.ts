import json from './json';

export type FormatterType = {
    type: 'json',
    formatter: json
};

export interface Formatter {
    unmarshal: (text: string) => any;
    marshal: (data: any) => string;
}

function getFormatter<T extends FormatterType>(type: T['type']): T['formatter'] {
    switch (type) {
        case 'json':
            return new json();
        default:
            throw new Error(`Unknown formatter type: ${type}`);
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
    data: Parameters<T['formatter']['marshal']>[0]
) {
    return getFormatter(type).marshal(data);
}