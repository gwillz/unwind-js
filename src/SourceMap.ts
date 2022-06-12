
import * as path from 'path';
import { RawSourceMap } from "source-map";
import { readJson, checkType, checkNumber } from './utils';


export type Manifest = Record<string, RawSourceMap>;


/**
 * Read a manifest file and source maps.
 * 
 * This assumes the manifest has a relative path to the respective source maps.
 */
export async function readManifest(mapPath: string): Promise<Manifest> {
    const json = await readJson(mapPath);
    const rootPath = path.dirname(mapPath);
    
    const mapping = {} as Manifest;
    
    for (let key in json) {
        const match = key.match(/.*?([^/]+\.js\.map$)/);

        if (!match) continue;
        const [_, mapPath] = match;

        // Read source map.
        const map = await readJson(path.resolve(rootPath, mapPath));
        
        // Validate source map.
        validateSourceMap(map);
        mapping[map.file] = map;
    }
    
    return mapping;
}


export function validateSourceMap(map: unknown): asserts map is RawSourceMap {
    checkType(map, "file", "string");
    checkNumber(map, "version");
    // checkType(map, "names", "string[]");
    checkType(map, "mappings", "string");
    checkType(map, "sources", "string[]");
}
