
import { RawSourceMap, SourceMapConsumer } from 'source-map';

export async function rebase(map: RawSourceMap, line: number, column: number) {
    const consumer = await SourceMapConsumer.with(map, null, c => c);
    return consumer.originalPositionFor({ line, column });
}
