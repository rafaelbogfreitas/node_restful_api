const server = require("./lib/server");
const workers = require("./lib/workers");
const cli = require("./lib/cli");

require("./lib/env");

const app = {};

app.init = function () {
  server.init();
  workers?.init();

  setTimeout(() => {
    cli.init();
  }, 50)
};

app.init();

module.exports = app;