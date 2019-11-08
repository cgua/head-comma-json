import { JsonValue } from "../out/JsonValue";

describe("json value", function () {

    function test(str: string, trim: boolean = false) {
        const obj = JSON.parse(str);
        const jv = new JsonValue(obj);
        let res = jv.toString();
        if (trim) {
            str = str.replace(/[ \n]/g, "");
            res = res.replace(/[ \n]/g, "");
        }
        if (str !== res) {
            console.log(str);
            for (let i = 0; i < str.length; i++) {
                if (str[i] !== res[i]) {
                    throw new Error(`input:\n${str}\noutput:\n${res}\ndiff:\n${res.slice(i)}`);
                }
            }
        }
    }

    it("1", function () {
        test(`{ "a": 1}`);
    });

    it("2", function () {
        test(`[
    { "a": 1}
]`);
    });

    it("obj", function () {
        test(`{
    "a": { "aa": 11 , "bb": 22}
    , "b": 2
}`);
    });

    it("arr", function () {
        test(`{
    "a": ["aa", 11, "bb", 22]
    , "b": 2
}`);
    });

    it("complex", function () {
        const obj = require("../test-res/a.json");
        test(JSON.stringify(obj), true);
    });

});
