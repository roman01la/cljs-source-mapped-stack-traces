const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const mapStackTrace = require("./map-stack-trace");

const _args = process.argv
  .slice(2, process.argv.length)
  .reduce((ret, item, idx) => {
    if (idx % 2 === 0) {
      ret.push([item]);
    } else {
      ret[ret.length - 1].push(item);
    }
    return ret;
  }, [])
  .reduce((ret, [key, val]) => {
    ret[key.replace(/^--/, "")] = Number.isNaN(parseInt(val))
      ? val
      : parseInt(val);
    return ret;
  }, {});

const args = {
  port: 5555,
  ..._args
};

const cors = (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", ["*"]);
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS,POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  next();
};

const runtime = fs
  .readFileSync(path.join(__dirname, "map-stack-trace.runtime.js"), "utf8")
  .replace("{PORT}", args.port);

const server = express();

server.use(cors);
server.use(bodyParser.json());

server.get("/runtime", (req, res) => {
  res.setHeader("Content-Type", "application/javascript");
  res.send(runtime);
});

server.post("/map-stack-trace", cors, async (req, res) => {
  const data = await mapStackTrace(req.body.data, {
    publicDir:
      "/Users/romanliutikov/projects/source-map-stack-trace/resources/public"
  });

  console.log(data);

  res.json({ data });
});

server.listen(args.port, () => {
  console.log(`Server started at http://localhost:${args.port}`);
  console.log(
    `Add the following script to your HTML page to connect to the server:
    <script src="http://localhost:${args.port}/runtime"></script>`
  );
});
