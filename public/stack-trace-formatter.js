const mappedStackTraceFormatter = {
  header: mappedStackTraceHeaderFormatter,
  hasBody: () => false
};

function mappedStackTraceHeaderFormatter(o) {
  if (o.__stack) {
    return ["div", {}, ...formatStackHeader(o.message, o.__stack)];
  }
}

function formatStackHeader(message, stack) {
  return [
    ["span", {}, `Uncaught Error: ${message}`],
    [
      "table",
      {},
      ...stack
        .slice(0, __cljssm.maxLines)
        .map(({ column, line, source, name }) => {
          const longestLine = name.reduce(
            (ln, line) => Math.max(line.length, ln),
            0
          );
          const minLeftPad = name.reduce(
            (ln, line) => Math.min(ln, line.length - line.trimLeft().length),
            Infinity
          );

          name = name.map(line => line.slice(minLeftPad, line.length));

          const beforeLines = name.slice(0, Math.floor(name.length / 2));
          const afterLines = name.slice(
            Math.ceil(name.length / 2),
            name.length
          );
          const targetLine = name[Math.floor(name.length / 2)];
          const col = column - minLeftPad;
          const marker = new Array(col).fill(" ");
          marker.push("👆");

          let sample;

          if (__cljssm.mode === "expanded") {
            sample = [
              ...beforeLines,
              targetLine,
              marker.join(""),
              ...afterLines
            ].join("\n");
          } else {
            sample = targetLine.trimLeft();
          }

          const link = makeHeaderLink(source, line, column);

          const markerRow = [
            "tr",
            {},
            ["td", {}, new Array(longestLine).fill("_").join("")],
            ["td", {}, new Array(link[2].length).fill("_").join("")]
          ];

          if (__cljssm.mode === "expanded") {
            return [
              [
                "tr",
                {},
                ["td", { style: "padding: 16px 0 0;" }, sample],
                ["td", { style: "vertical-align: top;" }, link]
              ],
              markerRow
            ];
          } else {
            return [
              [
                "tr",
                {},
                ["td", {}, "at " + sample],
                ["td", {}, " in "],
                ["td", {}, link]
              ]
            ];
          }
        })
        .reduce((ret, v) => ret.concat(v), [])
    ]
  ];
}

function makeHeaderLink(source, line, column) {
  const text = `${
    source.startsWith("http")
      ? source
      : `${location.protocol}//${location.host}/${source}`
  }:${line}:${column}`;
  return ["span", { style: "color: #545454;" }, text];
}

window.devtoolsFormatters = window.devtoolsFormatters || [];
window.devtoolsFormatters.push(mappedStackTraceFormatter);
