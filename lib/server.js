const http = require("http");
const https = require("https");
const url = require("url");
const fs = require("fs");
const path = require("path");
const StringDecoder = require("string_decoder").StringDecoder;
const config = require("../config");
const { parseJSONToObject } = require("./helpers");
const util = require("util");
const debug = util.debuglog("server");

const {
  index,
  accountCreate,
  accountEdit,
  accountDeleted,
  sessionCreate,
  sessionDeleted,
  checksList,
  checksCreate,
  checksEdit,
  tokens,
  users,
  favicon,
  public,
  ping,
  checks,
  notFound,
} = require("./handlers");

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
      payload: buffer ? parseJSONToObject(buffer) : {},
    };

    handler(data, (statusCode, payload, contentType = "json") => {
      statusCode = typeof statusCode === "number" ? statusCode : 200;
      
      let payloadString;

      if(contentType === "json") {
        res.setHeader("Content-Type", "application/json");
        payload = typeof payload === "object" ? payload : {};
        payloadString = JSON.stringify(payload);
      }
      
      if(contentType === "html") {
        res.setHeader("Content-Type", "text/html");
        payloadString = typeof payload === "string" ? payload : "";
      }

      if(contentType === "favicon") {
        res.setHeader("Content-Type", "image/x-icon");
        payloadString = typeof payload === "string" ? payload : "";
      }

      if(contentType === "png") {
        res.setHeader("Content-Type", "image/png");
        payloadString = typeof payload === "string" ? payload : "";
      }

      if(contentType === "jpg") {
        res.setHeader("Content-Type", "image/jpeg");
        payloadString = typeof payload === "string" ? payload : "";
      }

      if(contentType === "css") {
        res.setHeader("Content-Type", "text/css");
        payloadString = typeof payload === "string" ? payload : "";
      }
      
      if(contentType === "plain") {
        res.setHeader("Content-Type", "text/plain");
        payloadString = typeof payload === "string" ? payload : "";
      }

      res.writeHead(statusCode);
      res.write(payloadString);
      res.end();

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
    console.log("\x1b[35m%s\x1b[0m",  `Https server is running on port ${config.httpsPort} in ${config.envName}`);
  });
};

server.router = {
  "": index,
  "account/create": accountCreate,
  "account/edit": accountEdit,
  "account/deleted": accountDeleted,
  "session/create": sessionCreate,
  "session/deleted": sessionDeleted,
  "checks/all": checksList,
  "checks/create": checksCreate,
  "checks/edit": checksEdit,
  "api/tokens": tokens,
  "api/users": users,
  "api/checks": checks,
  "favicon.ico": favicon,
  "public": public,
  ping,
  notFound,
};

module.exports = server;