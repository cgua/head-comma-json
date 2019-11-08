import { jsonc } from "jsonc";
import { window } from "vscode";

/**
 * 将字符串格式化成 json
 * @param str 要格式化的字符串
 */
export const string2json = (str: string): JSON | undefined => {
    let json: JSON | undefined;

    try {
        json = jsonc.parse(str);
    }
    catch (e) {
        window.showInformationMessage('无法解析当前文件.');
        console.error(e.toString());
        return undefined;
    }
    return json;
};