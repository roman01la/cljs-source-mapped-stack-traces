importScripts("source-map.js");

sourceMap.SourceMapConsumer.initialize({
  "lib/mappings.wasm": "mappings.wasm"
});

self.onmessage = event => mapStackTrace(event.data);

const cfetch = (() => {
  let _cache = new Map();
  return {
    clearCache: () => _cache.clear(),
    fetch: (url, type) => {
      if (!_cache.has(url)) {
        _cache.set(url, fetch(url).then(r => r.json()));
      }
      return _cache.get(url);
    }
  };
})();

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

function _mapStackTrace({ file, line, column }, excludes, linesInFrame) {
  let filePath;
  return fetch(file)
    .then(r => r.text())
    .then(source => getSourceMapPath({ source, file }))
    .then(path => {
      filePath = path.replace(/\.js\.map$/, ".cljs");
      return cfetch.fetch(path, "json");
    })
    .then(sm =>
      sourceMap.SourceMapConsumer.with(sm, null, consumer => {
        const frame = consumer.originalPositionFor({ line, column });

        if (!consumer.file.endsWith(".js.map")) {
          frame.source = filePath;
        }

        return frame;
      })
    )
    .then(frame => {
      const shouldInclude =
        excludes.length === 0
          ? true
          : excludes.some(regex => !regex.test(frame.source));
      if (shouldInclude) {
        return fetch(frame.source)
          .then(r => r.text())
          .then(file => ({ source: frame.source, file, frame }));
      }
    })
    .then(eframe => {
      if (eframe) {
        const { source, file, frame } = eframe;
        const baseLine = frame.line - 1;
        const startLine = baseLine - Math.floor(linesInFrame / 2);
        const endLine = baseLine + Math.floor(linesInFrame / 2) + 1;
        const capturedLines = file.split("\n").slice(startLine, endLine);

        const enrichedFrame = {
          column: frame.column,
          line: frame.line,
          source,
          name: capturedLines
        };
        return enrichedFrame;
      }
    });
}

function mapStackTrace({ message, stack, excludes = [], linesInFrame = 3 }) {
  const [, ...frames] = stack.split("\n");
  const parsedFrames = frames.map(parseStackFrame);
  const _excludes = excludes.map(regex => new RegExp(regex));

  cfetch.clearCache();

  Promise.all(
    parsedFrames.map(frame => _mapStackTrace(frame, _excludes, linesInFrame))
  )
    .then(stack => stack.filter(frame => frame))
    .then(stack => self.postMessage({ message, stack }))
    .catch(console.error);
}
