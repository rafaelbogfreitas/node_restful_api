const http = require("http");
const https = require("https");
const url = require("url");
const fs = require("fs");
const path = require("path");
const StringDecoder = require("string_decoder").StringDecoder;
const config = require("../config");
const { tokens, users, ping, checks, notFound } = require("./handlers");
const { parseJSONToObject } = require("./helpers");

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

      console.log(`Request received with payload: ${buffer}`);
    });
  });
};

server.init = () => {
  server.httpServer.listen(config.httpPort, () => {
    console.log(
      `Http server is running on port ${config.httpPort} in ${config.envName}`
    );
  });

  server.httpsServer.listen(config.httpsPort, () => {
    console.log(
      `Https server is running on port ${config.httpsPort} in ${config.envName}`
    );
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