
import * as path from 'path';
import { RawSourceMap } from "source-map";
import { readJson, checkType, checkNumber } from './utils';


export type Manifest = Record<string, RawSourceMap>;


/**
 * Read a manifest file and source maps.
 * 
 * This assumes the manifest has a relative path to the respective source maps.
 * 
 * @todo Should we be extracting the 'jsPath' from the map _value_ instead of
 * the _key_?
 */
export async function readManifest(mapPath: string): Promise<Manifest> {
    const json = await readJson(mapPath);
    const rootPath = path.dirname(mapPath);
    
    const mapping = {} as Manifest;
    
    for (let key in json) {
        const match = key.match(/.*?(([^/]+\.js)\.map$)/);
        //                          1 2        2      1
        // 1. mapPath
        // 2. jsPath
        
        if (!match) continue;
        const [_, mapPath, jsPath] = match;
        
        // Read source map.
        const map = await readJson(path.resolve(rootPath, mapPath));
        
        // Validate source map.
        validateSourceMap(map);
        mapping[jsPath] = map;
    }
    
    return mapping;
}


// ts 3.7
// Then we can change readJson() to return unknown.
// export function validateSourceMap(map: any): asserts map is RawSourceMap {
export function validateSourceMap(map: any) {
    checkType(map, "file", "string");
    checkNumber(map, "version");
    // checkType(map, "names", "string[]");
    checkType(map, "mappings", "string");
    checkType(map, "sources", "string[]");
}
