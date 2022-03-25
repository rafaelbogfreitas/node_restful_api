const server = require("./lib/server");
const workers = require("./lib/workers");
const cli = require("./lib/cli");
const exampleDebug = require("./lib/exampleDebuggingProblem");

require("./lib/env");

const app = {};

app.init = function () {
  debugger
  server.init();
  debugger
  workers?.init();
  debugger
  setTimeout(() => {
    cli.init();
    debugger
  }, 50);
  debugger
  let foo = 1;

  foo++;
  foo = foo * foo;

  foo = foo.toString();
  debugger
  exampleDebug.init();
  debugger
};

app.init();

module.exports = app;