
/**
 * 获取指定数量的空白
 * @param n 数量
 */
export const getSpace = (n: number): string => {
    let str = '';
    for (let i = 0; i < n; i++) {
        str += ' ';
    }
    return str;
};

/**
 * 获取输入字符串头部空白
 * @param str 输入
 */
export function getHeadSpace(str: string): string {
    let spaces = "";
    for (let c of str) {
        if (c === ' ') {
            spaces += c;
        } else {
            break;
        }
    }
    return spaces;
}
