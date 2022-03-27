const server = require("./lib/server");
const workers = require("./lib/workers");
const cli = require("./lib/cli");
const cluster = require("cluster");
const os = require("os");

require("./lib/env");

const app = {};

app.init = function(callback = () => {}) {
  if(cluster.isPrimary) {
    workers?.init();
  
    setTimeout(() => {
      cli.init();
      callback();
    }, 50);

    os.cpus().forEach(() => {
      cluster.fork()
    });

    return;
  }
  
  server.init();
};

if(require.main === module) {
  app.init();
}

module.exports = app;