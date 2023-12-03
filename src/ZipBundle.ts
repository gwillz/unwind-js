
import { Open as Zip } from 'unzipper';
import { Manifest, validateSourceMap } from './SourceMap';
import { readJson } from './utils';


export async function readZip(zipPath: string) {
    const directory = await Zip.file('path/to/archive.zip');

    const mapping = {} as Manifest;

    for (const file of directory.files) {
        const match = file.path.match(/.*?([^/]+\.js\.map$)/);
        if (!match) continue;

        const map = await readJson(file.path);

        validateSourceMap(map);
        mapping[map.file] = map;
    }

    return mapping;
}
