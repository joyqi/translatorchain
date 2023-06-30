import { Formatter } from ".";
import { marked } from 'marked';

const PREFIX = 'p_';

type Links = {
    [key: string]: { href: string | null; title: string | null };
};

export default class implements Formatter {
    private links: Links = {};

    unmarshal(text: string): any {
        const tokens = marked.lexer(text);
        const result: Record<string, string> = {};

        if (tokens.links) {
            this.links = tokens.links;
        }

        for (const [i, token] of tokens.entries()) {
            result[PREFIX + i] = token.raw;
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

        return Object.values(data).join('') + links;
    }
}