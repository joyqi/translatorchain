import { Formatter } from ".";

export default class implements Formatter {
    input(text: string): any {
        return text ? JSON.parse(text) : null;
    }

    output(data: any): string {
        return JSON.stringify(data, null, 4);
    }
}