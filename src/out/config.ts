import { workspace, WorkspaceConfiguration, window } from "vscode";
import { getSpace } from "./space";

const INDENT = "indent";
const SORT = "sort";
const ALIGN = "align";
const LINE = "maxLineLen";
const TAIL = "tailComma";

class Config {
    /** 是否需要排队 */
    public sort: boolean = false;
    /** 每次需要缩进的空格 */
    public indent: string = "    ";
    /** 缩进的空格数 */
    public indentCount = 4;
    /** 当键名长度差距在多少以内进行对齐 */
    public align = 6;
    /** 最大单行长度 */
    public lineLen = 80;
    /** 是否将逗号放在句尾 */
    public tailComma = true;

    public update(): void {
        const conf = workspace.getConfiguration('HeadCommaJson');
        this.updateSort(conf);
        this.align = this.getUInt(conf, ALIGN, this.align);
        this.indentCount = this.getUInt(conf, INDENT, this.indentCount);
        this.indent = getSpace(this.indentCount);
        this.lineLen = this.getUInt(conf, LINE, this.lineLen);
        this.tailComma = this.getBool(conf, TAIL, this.tailComma);
    }

    private getBool(conf: WorkspaceConfiguration, name: string, def: boolean): boolean {
        if (conf.has(name)) {
            return conf.get(name) === true;
        }
        window.showInformationMessage("config not found:" + name);
        return def;
    }

    private updateSort(conf: WorkspaceConfiguration): void {
        if (conf.has(SORT)) {
            this.sort = conf.get(SORT) === true;
            return;
        }
        window.showInformationMessage("sort config not found");
    }

    private getUInt(conf: WorkspaceConfiguration, name: string, defaultValue: number): number {
        if (conf.has(name)) {
            const vl = conf.get(name) as number;
            if (vl < 0) {
                window.showInformationMessage(`${name}(${vl}) < 0; ignore`);
                return defaultValue;
            }
            return vl;
        }
        window.showInformationMessage("config not found:" + name);
        return defaultValue;
    }

}

export const conf = new Config();