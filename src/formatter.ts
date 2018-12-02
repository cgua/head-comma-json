import { TextDocument, FormattingOptions, Range, TextEdit, window, workspace, TextEditorEdit, Position } from "vscode";
import { jsonc } from 'jsonc';

/**
 * 格式化中间项目
 */
interface IParseMiddleObject {
    /** 是否需要格式化 */
    isNeedParse: boolean;
    /** 内容 */
    content: any;
}

/**
 * 直接替换的字符
 */
const special: { [k: string]: string } = {
    '\b': '\\b',
    '\t': '\\t',
    '\n': '\\n',
    '\f': '\\f',
    '\r': '\\r',
    '"': '\\"',
    '\\': '\\\\'
};

/**
 * 将特殊字符替换为转义之后的字符串
 * @param chr 待替换的字符
 */
const _escape: (chr: string) => string = (chr) => {
    return special[chr]
        || '\\u' + ('0000' + chr.charCodeAt(0).toString(16)).slice(-4);
};

/**
 * 转义字符串
 * @param str 待转义的字符串 
 */
const escape: (str: string) => string = (obj) => {
    return '"' + obj.replace(/[\x00-\x1f\\"]/g, _escape) + '"';
};

/**
 * 将 json 转成字符串的函数  
 * 中间格式如下  
 * [  
 * 1. {b:nonull    , value:object}   需要再次格式化
 * 1. {b:undefined , value:string} 不需要再次格式化  
 * 1. {b:nonull    , value:object}  
 * 1. {b:undefined , value:string}  
 * 1. {b:nonull    , value:object}  
 * 
 * ]  
 * @param list       待转换的对象列表
 * @param confIndent 设置的缩进
 * @param indent [ indent="" ] 当前缩进
 */
const json2string: (list: IParseMiddleObject[], confIndent: string, indent?: string) => string
    = (list, confIndent, indent = '') => {
        indent += confIndent;
        let isFinished: boolean = true;
        const nl: IParseMiddleObject[] = [];
        for (let o of list) {
            if (o.isNeedParse === false) {
                nl.push(o);
            }
            else {
                const trg = o.content;
                let j = 0;
                const keys: string[] = [];
                for (const k in trg) {
                    keys.push(k);
                }
                if (getIsSort()) {
                    keys.sort();
                }

                for (let k of keys) {
                    const v = (<any>trg)[k];
                    const idot = j === 0 ? indent + '  ' : indent + ', ';
                    //　如果是数组则不输出键名
                    const pre = trg instanceof Array ? idot : idot + '"' + k + '" : ';
                    j++;
                    switch (typeof v) {
                        case 'boolean':
                            nl.push({ isNeedParse: false, content: pre + v });
                            break;
                        case 'number':
                            nl.push({ isNeedParse: false, content: pre + v });
                            break;
                        case 'string':
                            nl.push({ isNeedParse: false, content: pre + escape(v) });
                            break;
                        case 'object':
                            isFinished = false;
                            if (v instanceof Array) { // v is array
                                nl.push({ isNeedParse: false, content: pre + '[' });
                                nl.push({ isNeedParse: true, content: v });
                                nl.push({ isNeedParse: false, content: indent + ']' });
                            }
                            else { // v is json object
                                nl.push({ isNeedParse: false, content: pre + '{' });
                                nl.push({ isNeedParse: true, content: v });
                                nl.push({ isNeedParse: false, content: indent + '}' });
                            }
                            break;
                        default: console.error('unknow type.'); break;
                    }
                }

            }
        }
        if (isFinished) {
            let str = '';
            for (let i of nl) {
                str += i.content + '\n';
            }
            return str;
        }
        else {
            return json2string(nl, confIndent, indent);
        }
    };

/**
 * 将字符串格式化成 json
 * @param str 要格式化的字符串
 */
const string2json: (str: string) => undefined | JSON = (str: string) => {
    let json: JSON | undefined;

    try {
        // json = JSON.parse(str);
        json = jsonc.parse(str);
    }
    catch (e) {
        window.showInformationMessage('无法解析当前文件.');
        console.error(e.toString());
        return undefined;
    }
    return json;
};

const getIsSort: () => boolean = () => {
    const conf = workspace.getConfiguration('HeadCommaJson');
    const sortConf = (conf.has('sort') ? conf.get('sort') : true)!;
    return sortConf === true;
}

const getSpace: (n: number) => string = (n) => {
    let str = '';
    for (let i = 0; i < n; i++) {
        str += ' ';
    }
    return str;
}

/**
 * 从设置中获取缩进
 */
const getIndentConfig: () => number = () => {
    const conf = workspace.getConfiguration('HeadCommaJson');
    const indentConf = (conf.has('indent') ? conf.get('indent') : 4)!;
    let indentCount = parseInt(indentConf.toString());
    return isNaN(indentCount) ? 4 : indentCount < 0 ? 4 : indentCount;
};

const getStringIndent: (str: string) => number = (str) => {
    let i = 0;
    for (const c of str) {
        if (c === ' ') {
            i++;
        }
        else {
            break;
        }
    }
    return Math.floor(i / getIndentConfig());
};

/**
 * 格式化函数
 * @param document 文档对象
 * @param range    选区 
 * @param options  格式化选项 , 目前并没什么用
 */
const formatter: (document: TextDocument, range: Range, options: FormattingOptions) => TextEdit[] | undefined
    = (document, range, options) => {
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
        const newText = '{\n' + json2string([{ isNeedParse: true, content: json }], getSpace(getIndentConfig())) + '\n}\n';
        list.push(new TextEdit(range, newText));
        return list;
    };

/**
 * 从命令行运行格式化程序
 * @param args 命令行参数
 */
// todo args
const cmdFormatter: (...args: any[]) => void = (...args) => {
    console.log(args);
    const editor = window.activeTextEditor!;
    if (editor === undefined) {
        window.showInformationMessage('请先激活需要格式化的文件.');
        return;
    }
    const selection = editor.selection;
    const doc = editor.document;
    const indent = getIndentConfig();

    let stext = '';
    let start: Position;
    let end: Position;
    let isFullDoc = true;
    let strIndent = 0;

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
        strIndent = getStringIndent(stext);
        stext = stext.replace(/(^[\s|,]+)|([\s|,]+$)/g, '');
        stext = `{${stext}}`;
    }

    const json = string2json(stext);
    if (undefined === json) {
        window.showInformationMessage('格式化失败.');
        return;
    }
    let str = json2string([{ isNeedParse: true, content: json }], getSpace(indent), getSpace(strIndent));
    if (isFullDoc) {
        str = '{\n' + str + '\n}\n';
    }

    editor.edit(function (builder: TextEditorEdit) {
        builder.delete(new Range(start, end));
        builder.insert(start, str!);
    });

};

export { formatter, cmdFormatter };