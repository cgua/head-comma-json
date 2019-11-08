import { window, Position, Range, TextEditorEdit } from "vscode";
import { conf } from "./config";
import { getHeadSpace } from "./space";
import { string2json } from "./parseString";
import { JsonValue } from "./JsonValue";

/**
 * 从命令行运行格式化程序
 * @param args 命令行参数
 */
// todo args
export function cmdFormatter(this: undefined, ...args: any[]): void {
    console.log("format arguments:", ...args);
    const editor = window.activeTextEditor!;
    if (editor === undefined) {
        window.showInformationMessage('请先激活需要格式化的文件.');
        return;
    }
    conf.update();

    const selection = editor.selection;
    const doc = editor.document;
    let stext = '';
    let start: Position;
    let end: Position;
    let isFullDoc = true;
    let spacesHead = "";

    if (selection.isEmpty) {
        stext = editor.document.getText();
        start = new Position(0, 0);
        end = new Position(doc.lineCount - 1, doc.lineAt(doc.lineCount - 1).text.length);
    }
    else {
        isFullDoc = false;
        start = selection.start;
        end = selection.end;
        stext = doc.getText(new Range(start, end));
        spacesHead = getHeadSpace(stext);
        stext = stext.replace(/(^[\s|,]+)|([\s|,]+$)/g, '');
        stext = `{${stext}}`;
    }

    const json = string2json(stext);
    if (undefined === json) {
        window.showInformationMessage('格式化失败.');
        return;
    }
    spacesHead = spacesHead.slice(0, -1 * conf.indentCount);
    const jv = new JsonValue(json, spacesHead, conf.indent);
    let str = jv.toString();
    if (!isFullDoc) {
        const tail = spacesHead.length + 1;
        str = str.slice(2, -1 * tail); // {\n --> ______}
        console.log(str);
    }

    editor.edit(function (builder: TextEditorEdit) {
        builder.delete(new Range(start, end));
        builder.insert(start, str!);
    });
};