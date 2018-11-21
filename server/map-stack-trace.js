const { SourceMapConsumer } = require("source-map");
const path = require("path");
const fs = require("fs");

function getSourceMapPath({ source, file }) {
  const ret = source.match(/sourceMappingURL=(.*)/);

  if (ret && ret.length === 2) {
    const [fileName] = file.split("/").reverse();
    const mapFile = ret[1];
    const mapPath = file.replace(fileName, mapFile);
    return mapPath;
  } else {
    throw new Error(`Couldn't find source map file for ${file}.`);
  }
}

function parseStackFrame(frame) {
  const parsedFrame = frame.match(/(http.*):([0-9]+):([0-9]+)/);
  if (parsedFrame && parsedFrame.length === 4) {
    const [, file, line, column] = parsedFrame;
    return { file, line: parseInt(line), column: parseInt(column) };
  } else {
    return null;
  }
}

async function _mapStackTrace(
  { file, line, column },
  excludes,
  linesInFrame,
  { publicDir }
) {
  const absFilePath = path.join(publicDir, file.match(/^http:\/\/.*\/(.*)/)[1]);
  const fileContents = fs.readFileSync(absFilePath, "utf8");
  const smPath = getSourceMapPath({ source: fileContents, file: absFilePath });
  const sm = JSON.parse(fs.readFileSync(smPath, "utf8"));

  const frame = await SourceMapConsumer.with(sm, null, consumer => {
    const frame = consumer.originalPositionFor({ line, column });
    if (!consumer.file.endsWith(".js.map")) {
      frame.source = smPath.replace(/\.js\.map$/, ".cljs");
    }
    frame._source = frame.source;
    frame.source = path.join(publicDir, frame.source);
    return frame;
  });

  const shouldInclude =
    excludes.length === 0
      ? true
      : excludes.some(regex => !regex.test(frame.source));

  if (shouldInclude) {
    const _file = fs.readFileSync(frame.source, "utf8");
    const baseLine = frame.line - 1;
    const startLine = baseLine - Math.floor(linesInFrame / 2);
    const endLine = baseLine + Math.floor(linesInFrame / 2) + 1;
    const capturedLines = _file.split("\n").slice(startLine, endLine);

    const enrichedFrame = {
      column: frame.column,
      line: frame.line,
      source: frame._source,
      name: capturedLines
    };

    return enrichedFrame;
  }
}

module.exports = async function mapStackTrace(
  { message, stack, excludes = [], linesInFrame = 3 },
  opts
) {
  const [, ...frames] = stack.split("\n");
  const parsedFrames = frames.map(parseStackFrame);
  const _excludes = excludes.map(regex => new RegExp(regex));

  const _stack = await Promise.all(
    parsedFrames.map(frame =>
      _mapStackTrace(frame, _excludes, linesInFrame, opts)
    )
  );

  return { message, stack: _stack.filter(frame => frame) };
};
