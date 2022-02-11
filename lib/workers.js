const url = require("url");
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");
const _data = require("./data");
const helpers = require("./helpers");

const workers = {
  gatherAllChecks: () => {
    console.log("Gathering checks...");
  },
  loop: () => {
    setInterval(() => {
      workers.gatherAllChecks();
    }, 1000 * 60);
  },
  init: () => {
    workers.gatherAllChecks();
    workers.loop();
  },
};

module.exports = workers;