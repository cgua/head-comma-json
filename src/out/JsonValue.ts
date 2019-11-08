import { simpleEscape } from "./simpleEscape";
import { conf } from "./config";

type ValueType = "simple" | "array" | "object";

export class JsonValue {
    /** 类型 */
    private readonly type: ValueType;
    /** 每次缩进的空白 */
    private readonly indent: string;
    /** 头部空白 */
    private readonly head: string;
    /** 如果 obj 是简单类型，这里会直接转为字符串 */
    private readonly value: any;

    public constructor(obj: any, head: string = "", indent: string = "    ") {
        this.head = head;
        this.indent = indent;
        [this.type, this.value] = JsonValue.getType(obj);
    }

    private static getType(obj: any): [ValueType, any] {
        if (obj instanceof Array) {
            return ["array", obj];
        }
        switch (typeof obj) {
            case "object": return ["object", obj];
            case "number":
            case "boolean":
            case "bigint": return ["simple", obj.toString()];
            case "string": return ["simple", simpleEscape(obj)];
            default: throw new Error(`unknown type:${typeof obj}`);
        }
    }

    private shortMap(map: { [k: string]: JsonValue }): string[] {
        let sk = [] as string[];
        let ck = [] as string[];
        for (let k in map) {
            if (map[k].type === "simple") {
                sk.push(k);
            } else {
                ck.push(k);
            }
        }
        sk.sort();
        ck.sort();
        return sk.concat(ck);
    }

    private objectFields(): [string[], boolean] {
        let max = 0;
        let min = Number.MAX_SAFE_INTEGER;
        let oneLine = true;
        let keys = [] as string[];
        const head = this.head + this.indent;
        const jvMap: { [k: string]: JsonValue } = {};
        for (let k in this.value) {
            max = Math.max(k.length, max);
            min = Math.min(k.length, min)
            const jv = new JsonValue(this.value[k], head, this.indent);
            oneLine = oneLine && jv.type === "simple";
            jvMap[k] = jv;
            keys.push(k);
        }
        if (conf.sort) {
            keys = this.shortMap(jvMap);
        }

        const strMap = {} as { [k: string]: string };
        if (oneLine) {
            let lineLen = this.indent.length;
            for (let k in jvMap) {
                strMap[k] = jvMap[k].toString();
                lineLen += k.length + strMap[k].length + 3; // + "":
            }
            oneLine = lineLen < conf.lineLen;
        } else {
            for (let k in jvMap) {
                strMap[k] = jvMap[k].toString();
            }
        }

        const fields: string[] = [];
        if (oneLine || max - min > conf.align) {
            for (let k of keys) {
                fields.push(`"${k}": ${strMap[k]}`)
            }
        } else {
            max += 3; // "abc": -> "":
            let isFirst = true;
            for (let k of keys) {
                if (isFirst) {
                    isFirst = false;
                    const first = Math.floor(max + conf.indentCount / 2);
                    const key = `"${k}":`.padEnd(first, " ");
                    fields.push(key + strMap[k]);
                } else {
                    const key = `"${k}":`.padEnd(max, " ");
                    fields.push(key + strMap[k]);
                }
            }
        }
        return [fields, oneLine];
    }

    private objStr(): string {
        const [valueList, oneLine] = this.objectFields()
        const head = this.head + this.indent;
        let str = "{";
        let first = true;
        for (let vl of valueList) {
            str += oneLine ? " " : "\n" + head;
            if (first) {
                first = false;
            } else {
                str += ", "
            }
            str += vl;
        }
        str += oneLine ? "}" : "\n" + this.head + "}";
        return str;
    }

    private arrStr(): string {
        let str = "[";
        let isFirst = true;
        let allSimple = true;
        let valueList: string[] = [];

        const head = this.head + this.indent;
        for (let a of this.value) {
            const jv = new JsonValue(a, head, this.indent);
            allSimple = allSimple && jv.type === "simple";
            valueList.push(jv.toString());
        }

        for (let a of valueList) {
            if (!allSimple) {
                str += "\n" + head;
            }

            if (isFirst) {
                isFirst = false;
            } else {
                str += ", ";
            }
            str += a;
        }
        str += allSimple ? "]" : "\n" + this.head + "]";
        return str;
    }

    public toString(): string {
        switch (this.type) {
            case "simple": return this.value;
            case "object": return this.objStr();
            case "array": return this.arrStr();
            default: throw new Error("unknow type:" + this.type);
        }
    }
}