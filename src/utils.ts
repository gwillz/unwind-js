
import * as fs from 'fs';


type Types =
    "string" | "number" | "boolean" | "object" | "array" |
    "string[]" | "number[]" | "object[]";



export function tuple<T extends any[]> (...data: T) {
    return data;
}


/**
 * Promisified fs.readFile.
 */
export async function readFile(filePath: string) {
    return new Promise<string>((resolve, reject) => {
        fs.readFile(filePath, 'utf-8', (error, data) => {
            if (error) reject(error);
            else resolve(data);
        })
    });
}


export async function readJson(jsonPath: string): Promise<any> {
    return JSON.parse(await readFile(jsonPath));
}


/**
 * No type checking, just
 */
export function checkPresent(json: any, ...fields: string[]) {
    for (let field of fields) {
        if (json[field] === undefined) {
            throw new Error(`Expecting field "${field}"`);
        }
    }
}


/**
 * Limited type checking.
 * Just JSON things like string, number, boolean, objects, arrays.
 */
export function checkType(map: any, field: any, type: Types) {
    const item = map[field];
    const actual = typeof item;

    if (actual === "undefined") {
        throw new Error(`Expecting field "${field}"`);
    }

    else if (actual === "object") {
        // object is object, hurrah.
        if (type === "object") {
            return;
        }

        // Must be an array now.
        if (item.constructor.name !== "Array") {
            toss();
        }

        // Could be a generic array.
        if (type === "array") {
            return;
        }

        // Explicit array types are a little expensive.
        const [_, subType] = /(\w+)\[\]/.exec(type + "")!;

        for (let subItem of item) {
            if (typeof subItem !== subType) {
                toss();
            }
        }
    }

    // Standard type checks.
    else if (actual !== type) {
        toss();
    }

    function toss() {
        throw new Error(`Expecting type "${type}" at "${field}"`);
    }
}


export function checkNumber(map: any, field: any) {

    const item = parseFloat(map[field]);

    // Test for NaN.
    if (item !== item) {
        throw new Error(`Expected number at "${field}"`);
    }
}
