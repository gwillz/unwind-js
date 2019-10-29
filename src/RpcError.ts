
import { SourceMapConsumer } from 'source-map';
import { Manifest } from './SourceMap';
import { checkType, checkNumber } from './utils';


export interface RpcErrorStack {
    name: string;
    message: string;
    frames: RpcErrorFrame[];
}

export interface RpcErrorFrame {
    fileName: string;
    functionName: string;
    lineNumber?: number;
    columnNumber?: number;
    isNative?: boolean;
}

export class RpcError {
    
    stack: RpcErrorStack;
    
    /**
     * This doesn't guarantee the validity of the 'stack' object.
     * Use parse().
     **/
    constructor(stack: any) {
        this.stack = stack;
    }
    
    public static parse(stack: any): RpcError {
        const error = new RpcError(stack);
        error.validate();
        return error;
    }
    
    public validate() {
        checkType(this.stack, "name", "string");
        checkType(this.stack, "message", "string");
        checkType(this.stack, "frames", "object[]");
        
        for (let frame of this.stack.frames) {
            checkType(frame, "fileName", "string");
            checkType(frame, "functionName", "string");
            
            if (!frame.isNative) {
                checkNumber(frame, "columnNumber");
                checkNumber(frame, "lineNumber");
            }
        }
    }
    
    public async rebase(maps: Manifest) {
        
        let rebaseCount = 0;
        
        for (let frame of this.stack.frames) {
            const map = maps[frame.fileName];
            
            // Not found, skip.
            if (!map) continue;
            
            // Is native, skip.
            if (frame.isNative) continue;
            
            // Missing line number or column. This should be caught by
            // validate() and is mostly to satisfy type-checking.
            if (!frame.lineNumber || !frame.columnNumber) continue;
            
            // Do the whirlwind.
            const consumer = await SourceMapConsumer.with(map, null, c => c);
            
            const original = consumer.originalPositionFor({
                line: frame.lineNumber,
                column: frame.columnNumber,
            })
            
            // Replace the data.
            frame.fileName = original.source || "??";
            frame.functionName = original.name || "<??>";
            frame.lineNumber = original.line || 0;
            frame.columnNumber = original.column || 0;
            
            rebaseCount++;
        }
        
        // Not a single frame could be rebased.
        // A partial remapping is still useful, but this - this is bad.
        if (rebaseCount == 0) {
            throw new Error("The error stack could not be rebased.");
        }
    }
    
    /**
     * Return a V8 formatted string.
     * https://v8.dev/docs/stack-trace-api
     * 
     * I'm sure there's a library somewhere for doing this properly.
     * 
     * @todo Missing support for: native, constructor, eval, methods.
     */
    public format() {
        const { name, message, frames } = this.stack;
        
        let out = `${name}: ${message}\n`;
        
        for (let frame of frames) {
            const { functionName, fileName, lineNumber, columnNumber } = frame;
            out += `   at ${functionName} (${fileName}:${lineNumber}:${columnNumber})\n`;
        }
        
        return out;
    }
}
