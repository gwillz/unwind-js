
import { SourceMapConsumer, RawSourceMap } from 'source-map';
import { readManifest } from './SourceMap';


export async function rebase(map: RawSourceMap, line: number, column: number) {
    const consumer = await SourceMapConsumer.with(map, null, c => c);
    return consumer.originalPositionFor({ line, column });
}

async function main() {
    // File args: unwind-js <file> <query>
    const [manifestFile, query] = process.argv.slice(2);
    
    // Parse query.
    const match = /([^/]+):(\d+):(\d+)/.exec(query);
    if (!match) {
        console.error(`query must match "filename:line:column"`);
        return;
    }
    
    // Load manifest file.
    const maps = await readManifest(manifestFile);
    
    // Extract query properties.
    const [_, filename, lineString, columnString] = match;
    const lineNumber = parseInt(lineString);
    const columnNumber = parseInt(columnString);
    
    // Find the bundled file.
    const map = maps[filename];
    if (!map) {
        console.error(`Bundle file [${filename}] not found in maps.`);
        return;
    }
    
    // Do the whirlwind.
    const original = await rebase(map, lineNumber, columnNumber);
    
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
