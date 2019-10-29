
import { RawSourceMap } from 'source-map';
import { readManifest, validateSourceMap } from './SourceMap';
import { tuple, readJson } from './utils';
import { rebase } from './index';


type Mode = "manifest" | "map";

const NAME = "unwind-js";


function help(log = console.log) {
    log(`${NAME}: [-manifest <path> | -map <path>] <filename:line:column>`);
    log("");
    log("https://github.com/gwillz/unwind-js");
    log("");
}


function parseMode(mode: string) {
    const match = /-(?:manifest|map)/.exec(mode);
    if (!match) return null;
    
    return match[1] as Mode;
}


function parseQuery(query: string) {
    const match = /([^/]+):(\d+):(\d+)/.exec(query);
    if (!match) return null;
    
    // Extract query properties.
    const [_, bundlePath, lineString, columnString] = match;
    const lineNumber = parseInt(lineString);
    const columnNumber = parseInt(columnString);
    
    return tuple(bundlePath, lineNumber, columnNumber);
}


function getArgs() {
    // File args: unwind-js -manifest|map <file> <query>
    const [modeString, manifestPath, queryString] = process.argv.slice(2);
    
    if (!modeString || !manifestPath || !queryString) {
        help();
        return null;
    }
    
    const mode = parseMode(modeString);
    if (!mode) {
        console.error(`${NAME}: Please specify one of -manifest or -map.`);
        console.error("");
        help(console.error);
        return null;
    }
    
    const query = parseQuery(queryString);
    if (!query) {
        console.error(`${NAME}: Query must match "filename:line:column"`);
        console.error("");
        help(console.error);
        return null;
    }
    
    const [bundlePath, line, column] = query;
    return tuple(mode, manifestPath, bundlePath, line, column);
}


async function getMap(mode: Mode, sourcePath: string, bundlePath: string) {
    // Read the manifest file and associated maps.
    if (mode === "manifest") {
        const maps = await readManifest(sourcePath);
        
        // Find the bundled file.
        return maps[bundlePath];
    }
    // Read the map file.
    else {
        const map = await readJson(sourcePath);
        validateSourceMap(map);
        return map as RawSourceMap;
    }
}


async function main() {
    // Parse args.
    const args = getArgs();
    if (!args) return;
    
    const [mode, sourcePath, bundlePath, line, column] = args;
    
    // Get map, from manifest or other.
    const map = await getMap(mode, sourcePath, bundlePath);
    
    if (!map && mode === "manifest") {
        console.error(`${NAME}: Bundle file [${bundlePath}] not found in [${sourcePath}].`);
        return;
    }
    
    // Do the whirlwind.
    const original = await rebase(map, line, column);
    
    if (!original) {
        const query = `${bundlePath}:${line}:${column}`;
        console.error(`${NAME}: Could not find a mapping for [${query}].`);
        return;
    }
    
    // Bam.
    console.log("file:", original.source);
    console.log("line:", original.line);
    console.log("column:", original.column);
}


if (require.main === module) {
    require('source-map-support').install();
    process.on('unhandledRejection', console.error);
    main();
}
