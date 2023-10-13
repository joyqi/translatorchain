import { Formatter } from ".";

export default class implements Formatter {
    unmarshal(text: string): any {
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        const data: Record<string, string> = {};
        let key = '';

        lines.forEach((line, i) => {
            if (i % 2 === 0) {
                key = line;
            } else {
                data[key] = line;
            }
        });

        return data;
    }

    marshal(data: any, indent: number): string {
        const lines = Object.entries(data).map(([key, value]) => `${key}\n${value}`);
        return lines.join('\n\n');
    }
}