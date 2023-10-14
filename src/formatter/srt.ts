import { Formatter } from ".";

export default class implements Formatter {
    unmarshal(text: string): any {
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        const data: Record<string, string> = {};
        let key = '';
        let seq = 0;

        lines.forEach((line, i) => {
            if (i % 3 === 0) {
                seq = parseInt(line);
            } else if (i % 3 === 1) {
                key = line;
            } else {
                data[seq + '|' + key] = line;
            }
        });

        return data;
    }

    marshal(data: any, indent: number): string {
        const lines = Object.entries(data).map(([key, value]) => {
            const [seq, k] = key.split('|');
            return `${seq}\n${k}\n${value}`;
        });

        return lines.join('\n\n');
    }
}