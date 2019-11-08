
export const getSpace = (n: number): string => {
    let str = '';
    for (let i = 0; i < n; i++) {
        str += ' ';
    }
    return str;
};

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
