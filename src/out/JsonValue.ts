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
            case "bigint":
            case "boolean":
            case "number":
                return ["simple", obj.toString()];
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
        let maxKeyLen = 0;
        let minKeyLen = Number.MAX_SAFE_INTEGER;
        let oneLine = true;
        let keys = [] as string[];
        const head = this.head + this.indent;
        const jsonValueMap: { [k: string]: JsonValue } = {};
        for (let k in this.value) {
            maxKeyLen = Math.max(k.length, maxKeyLen);
            minKeyLen = Math.min(k.length, minKeyLen)
            const jv = new JsonValue(this.value[k], head, this.indent);
            jsonValueMap[k] = jv;
            keys.push(k);
        }

        if (conf.sort) {
            keys = this.shortMap(jsonValueMap);
        }

        const kvStrMap = {} as { [k: string]: string };
        const headLen = this.indent.length + 3 | 0; // + "":
        let total = 0 | 0;
        for (let k in jsonValueMap) {
            const jv = jsonValueMap[k]
            const str = jv.toString();
            total += headLen + str.length + k.length | 0;
            const nowarp = jv.type === "simple";
            oneLine = oneLine && nowarp;
            kvStrMap[k] = str;
        }
        oneLine = oneLine && total < conf.lineLen;

        const fields: string[] = [];
        if (oneLine || maxKeyLen - minKeyLen > conf.align) {
            for (let k of keys) {
                fields.push(`"${k}": ${kvStrMap[k]}`)
            }
        } else {
            maxKeyLen += 3; // "abc": -> "":
            const headComma = !conf.tailComma;
            for (let i = 0; i < keys.length; i++) {
                const k = keys[i];
                if (headComma && i === 0) {
                    const first = Math.floor(maxKeyLen + conf.indentCount / 2);
                    const key = `"${k}":`.padEnd(first, " ");
                    fields.push(key + kvStrMap[k]);
                } else {
                    const key = `"${k}":`.padEnd(maxKeyLen, " ");
                    fields.push(key + kvStrMap[k]);
                }
            }
        }
        return [fields, oneLine];
    }

    private object2string(): string {
        const [valueList, oneLine] = this.objectFields()
        const crHead = "\n" + this.head + this.indent;
        let str = "{";
        if (conf.tailComma) {
            const max = valueList.length - 1;
            for (var i = 0; i < valueList.length; i++) {
                str += oneLine ? " " : crHead;
                str += valueList[i] + (i === max ? "" : ",");
            }
        } else {
            for (var i = 0, l = valueList.length; i < l; i++) {
                str += oneLine ? " " : crHead;
                str += (i === 0 ? "" : ",") + valueList[i];
            }
        }
        str += oneLine ? "}" : "\n" + this.head + "}";
        return str;
    }

    private array2string(): string {
        let oneLine = true;
        let valueList: string[] = [];
        const head = this.head + this.indent;
        const headLen = head.length | 0;
        for (let a of this.value) {
            const jv = new JsonValue(a, head, this.indent);
            const vl = jv.toString();
            const nowarp = jv.type === "simple" || (vl.length + headLen) < conf.lineLen;
            oneLine = oneLine && nowarp;
            valueList.push(jv.toString());
        }
        let str = "[" + this.concatArrayValue(valueList, head, oneLine);
        str += oneLine ? "]" : "\n" + this.head + "]";
        return str;
    }

    /**
     * 连接数组元素的字段
     * @param arr  字段列表
     * @param head 头部空白
     * @param oneLine 是否单行
     */
    public concatArrayValue(arr: string[], head: string, oneLine: boolean): string {
        let str = "";
        const crHead = "\n" + head;
        if (conf.tailComma) {
            const max = arr.length - 1;
            for (var i = 0, l = arr.length; i < l; i++) {
                if (!oneLine) str += crHead
                str += arr[i] + (i === max ? "" : ",");
            }
        } else {
            for (var i = 0, l = arr.length; i < l; i++) {
                (oneLine) || (str += crHead)
                str += (i === 0 ? "" : ", ") + arr[i];
            }
        }
        return str;
    }


    public toString(): string {
        switch (this.type) {
            case "simple": return this.value;
            case "object": return this.object2string();
            case "array": return this.array2string();
            default: throw new Error("unknow type:" + this.type);
        }
    }
}