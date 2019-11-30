import { workspace, WorkspaceConfiguration, window } from "vscode";
import { getSpace } from "./space";

const INDENT = "indent";
const SORT = "sort";
const ALIGN = "align";
const LINE = "maxLineLen";
const TAIL = "tailComma";

/**
 * 配置信息
 */
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

    /**
     * 更新配置
     */
    public update(): void {
        const conf = workspace.getConfiguration('HeadCommaJson');

        this.sort = this.getBool(conf,SORT,this.sort);
        this.tailComma = this.getBool(conf, TAIL, this.tailComma);

        this.align = this.getUInt(conf, ALIGN, this.align);
        this.indentCount = this.getUInt(conf, INDENT, this.indentCount);
        this.indent = getSpace(this.indentCount);
        this.lineLen = this.getUInt(conf, LINE, this.lineLen);
    }

    /**
     * 从配置读取 boolean
     * @param conf 配置
     * @param name 读取的字段的名称
     * @param def  默认值
     */
    private getBool(conf: WorkspaceConfiguration, name: string, def: boolean): boolean {
        if (conf.has(name)) {
            return conf.get(name) === true;
        }
        window.showInformationMessage("config not found:" + name);
        return def;
    }

    /**
     * 从配置读取 Integer 
     * @param conf 配置
     * @param name 读取的字段的名称
     * @param def  默认值
     */
    private getUInt(conf: WorkspaceConfiguration, name: string, def: number): number {
        if (conf.has(name)) {
            const vl = conf.get(name) as number;
            if (vl < 0) {
                window.showInformationMessage(`${name}(${vl}) < 0; ignore`);
                return def;
            }
            return vl;
        }
        window.showInformationMessage("config not found:" + name);
        return def;
    }

}

export const conf = new Config();
