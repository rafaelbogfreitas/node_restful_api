const http = require("http");
const url = require("url");
const StringDecoder = require("string_decoder").StringDecoder;
const config = require("./config")

const server = http.createServer((req, res) => {
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
      typeof router[trimmedPath] !== "undefined"
        ? router[trimmedPath]
        : handlers.notFound;

    const data = {
      method,
      endpoint: trimmedPath,
      query: queryStringObject,
      headers,
      payload: buffer,
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
});

server.listen(config.port, () => {
  console.log(`Server is running on port ${config.port} in ${config.envName}`);
});

const handlers = {
  sample: (data, callback) => {
    callback(406, {
      name: "Sample handler",
    });
  },
  notFound: (data, callback) => {
    callback(404);
  },
};

const router = {
  sample: handlers.sample,
  notFound: handlers.notFound,
};
