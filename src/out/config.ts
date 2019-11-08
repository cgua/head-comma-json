import { workspace, WorkspaceConfiguration, window } from "vscode";
import { getSpace } from "./space";

const INDENT = "indent";
const SORT = "sort";
const ALIGN = "align";
const LINE = "maxLineLen";

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

    public update(): void {
        const conf = workspace.getConfiguration('HeadCommaJson');
        this.updateSort(conf);
        this.align = this.getUInt(conf, ALIGN, this.align);
        this.indentCount = this.getUInt(conf, INDENT, this.indentCount);
        this.indent = getSpace(this.indentCount);
        this.lineLen = this.getUInt(conf, LINE, this.lineLen);
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
        window.showInformationMessage("indent config not found");
        return defaultValue;
    }

}

export const conf = new Config();