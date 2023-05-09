import { Formatter } from ".";

export default class implements Formatter {
    unmarshal(text: string): any {
        return text ? JSON.parse(text) : null;
    }

    marshal(data: any, indent: number): string {
        return JSON.stringify(data, null, indent);
    }
}