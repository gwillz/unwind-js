
# unwind-js

This really just wraps up [Mozilla's 'source map'](https://github.com/mozilla/source-map) package into a command line interface.


### Command line usage

```sh

# Install globally.
npm install -g unwind-js

# Map file rebasing.
unwind-js -map ./path/to/index.js.map index.js:1:23456
# => file: MyComponent.tsx
# => line: 101
# => column: 32

# Manifest file.
unwind-js -manifest ./path/to/manifest.json vendors.js:1:23456
```


### API usage

This package also provides an `RpcError` model for moving errors over a JSON API.

Given a payload:

```json
{
    "name": "Error",
    "message": "I broke",
    "frames": [
        {
            "lineNumber": 2,
            "columnNumber": 12345,
            "fileName": "0.ab8a8bc44.js",
            "functionName": "Yc"
        },
        {
            "fileName": "[native code]",
            "functionName": "parse",
            "isNative": true
        },
        ...
    ]
}
```

Use the `RpcError` class to parse and rebase.

```ts
import { RpcError } from 'unwind-js/RpcError';

app.post("/errors", async (req, res, next) => {
    try {
        // Parse the body, will throw errors for invalid payloads.
        const error = RpcError.parse(req.body);
        
        // Rebase into the original maps.
        // Will throw if no frames could be rebased.
        await error.rebase();
        
        // Prints the stack trace in V8 format.
        // https://v8.dev/docs/stack-trace-api
        console.log(error.format());
    }
    catch (error) {
        next(error);
    }
});
```

Or use the the `rebase()` function to interactively rebase frames.

```ts
import { URLSearchParams } from 'url';
import { rebase } from 'unwind-js';

app.get("/errors/:filename", async (req, res, next) => {
    // Parse request.
    const query = new URLSearchParams(req.query);
    const filename = req.params.filename;
    const line = query.get("line");
    const column = query.get("column");
    
    // Rebase. Returns a 'MappedPosition' object.
    const original = await rebase(filename, line, column);
    
    // Print.
    res.send(`
        filename: ${original.name}
        column: ${original.column}
        line: ${original.line}
    `);
});
```


### TODO

- Add a client-side interface for parsing native errors and forming the `RpcError` payload.
  - requires 'error-stack-parser'
- Rename to 'whirlwind' ?
