import { TextDocument, FormattingOptions, Range, TextEdit, Position } from "vscode";
import { JsonValue } from "./JsonValue";
import { conf } from "./config";
import { string2json } from "./parseString";

/**
 * 格式化函数
 * @param document 文档对象
 * @param range    选区 
 * @param options  格式化选项 , 目前并没什么用
 */
export function formatter(document: TextDocument, range: Range, _options: FormattingOptions): TextEdit[] | undefined {
    const list: TextEdit[] = [];
    if (range === undefined) {
        let lastLine = document.lineCount - 1;
        lastLine = lastLine < 0 ? 0 : lastLine;
        range = new Range(0, 0, lastLine, document.lineAt(lastLine).text.length);
    }
    else {
        // 默认选区计算方式有误, 会漏选最后一个字符
        range = new Range(range.start, new Position(range.end.line, range.end.character + 1));
    }

    const json = string2json(document.getText(range));

    if (json === undefined) {
        return undefined;
    }
    const jv = new JsonValue(json, "", conf.indent)
    const newText = jv.toString();
    list.push(new TextEdit(range, newText));
    return list;
};
