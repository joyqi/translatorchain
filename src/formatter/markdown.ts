import { Formatter } from ".";
import { marked } from 'marked';

const PREFIX = 'p_';

type Links = {
    [key: string]: { href: string | null; title: string | null };
};

export default class implements Formatter {
    private links: Links = {};

    private codes: Record<string, string> = {};

    unmarshal(text: string): any {
        const tokens = marked.lexer(text);
        const result: Record<string, string> = {};

        if (tokens.links) {
            for (const [key, link] of Object.entries(tokens.links)) {
                this.links[key] = { href: link.href, title: link.title };
            }
        }

        for (const [i, token] of tokens.entries()) {
            const isCode = token.type === 'code';
            const key = PREFIX + i;
            result[key] = isCode ? '' : token.raw;
            
            if (isCode) {
                this.codes[key] = token.raw;
            }
        }

        return result;
    }

    marshal(data: any, indent: number): string {
        let links = '';

        if (this.links) {
            for (const [key, link] of Object.entries(this.links)) {
                const suffix = link.title ? ` "${link.title}"` : '';
                links += `[${key}]: ${link.href}${suffix}\n`;
            }
        }

        for (const [key, code] of Object.entries(this.codes)) {
            data[key] = code;
        }

        return Object.values(data).join('') + links;
    }
}