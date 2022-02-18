const http = require("http");
const https = require("https");
const url = require("url");
const fs = require("fs");
const path = require("path");
const StringDecoder = require("string_decoder").StringDecoder;
const config = require("../config");
const { tokens, users, ping, checks, notFound } = require("./handlers");
const { parseJSONToObject } = require("./helpers");
const util = require("util");
const debug = util.debuglog("server");

let server = {};

server.options = {
  key: fs.readFileSync(path.join(__dirname, "/../https/key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "/../https/cert.pe")),
};

server.httpServer = http.createServer((req, res) => {
  server.unifiedServer(req, res);
});

server.httpsServer = https.createServer(server.options, (req, res) => {
  server.unifiedServer(req, res);
});

server.unifiedServer = (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const {pathname, query: queryStringObject} = parsedUrl;

  const trimmedPath = pathname.replace(/^\/+|\/+$/g, "");

  const method = req.method.toLowerCase();

  const headers = req.headers;

  const decoder = new StringDecoder("utf-8");
  let buffer = "";

  req.on("data", (data) => {
    buffer += decoder.write(data);
  });

  req.on("end", () => {
    buffer += decoder.end();

    const handler =
      typeof server.router[trimmedPath] !== "undefined"
        ? server.router[trimmedPath]
        : notFound;

    const data = {
      method,
      endpoint: trimmedPath,
      query: queryStringObject,
      headers,
      payload: parseJSONToObject(buffer),
    };

    handler(data, (statusCode, payload) => {
      statusCode = typeof statusCode === "number" ? statusCode : 200;
      payload = typeof payload === "object" ? payload : {};

      res.setHeader("Content-Type", "application/json");
      res.writeHead(statusCode);
      res.end(JSON.stringify(payload));

      if(statusCode === 200) {
        debug("\x1b[32m%s\x1b[0m", `${method.toUpperCase()} /${trimmedPath} ${statusCode}`);
        return;
      }

      debug("\x1b[31m%s\x1b[0m", `${method.toUpperCase()} /${trimmedPath} ${statusCode}`);
    });
  });
};

server.init = () => {
  server.httpServer.listen(config.httpPort, () => {
    console.log("\x1b[36m%s\x1b[0m",  `Http server is running on port ${config.httpPort} in ${config.envName}`);
  });
  
  server.httpsServer.listen(config.httpsPort, () => {
    console.log("\x1b[35m%s\x1b[0m",  `Https server is running on port ${config.httpPort} in ${config.envName}`);
  });
};

server.router = {
  tokens,
  users,
  ping,
  checks,
  notFound,
};

module.exports = server;