const server = require("./lib/server");
const workers = require("./lib/workers");
const cli = require("./lib/cli");

require("./lib/env");

const app = {};

app.init = function(callback = () => {}) {
  server.init();
  workers?.init();

  setTimeout(() => {
    cli.init();
    callback();
  }, 50)
};

if(require.main === module) {
  app.init();
}

module.exports = app;