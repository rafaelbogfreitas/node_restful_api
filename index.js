const server = require("./lib/server");
const workers = require("./lib/workers");
require("./lib/env");

const app = {};

app.init = function () {
  server.init();
  workers?.init();
};

app.init();

module.exports = app;