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
const replacer: (chr: string) => string = (chr) => {
    return special[chr]
        || '\\u' + ('0000' + chr.charCodeAt(0).toString(16)).slice(-4);
};

/**
 * 转义字符串
 * @param str 待转义的字符串 
 */
export const simpleEscape = (obj: string): string => {
    return '"' + obj.replace(/[\x00-\x1f\\"]/g, replacer) + '"';
};
