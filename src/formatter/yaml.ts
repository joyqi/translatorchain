import { load, dump } from "js-yaml";
import { Formatter } from ".";

export default class implements Formatter {
    unmarshal(text: string): any {
        return text ? load(text) : null;
    }

    marshal(data: any, indent: number): string {
        return dump(data, { indent });
    }
}