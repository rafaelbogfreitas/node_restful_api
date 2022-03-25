const app = require("./../index.js");
const assert = require("assert");
const http = require("http");
const config = require("./../config.js");

const api = {
  "app.init should start without throwing": (done) => {
    assert.doesNotThrow(() => {
      app.init(() => {
        done();
      });
    }, TypeError);
  },

  "/ping should respond to GET with 200": (done) => {
    helpers.makeGetRequest('/ping', (res) => {
      assert.equal(res.statusCode, 200);
      done();
    });
  },
  
  "/api/users should respond to GET with 400": (done) => {
    helpers.makeGetRequest('/api/users', (res) => {
      assert.equal(res.statusCode, 404);
      done();
    });
  },
  
  "A random path should respond to GET with 404": (done) => {
    helpers.makeGetRequest('/unknown/unexistent', (res) => {
      assert.equal(res.statusCode, 404);
      done();
    });
  }
};

const helpers = {
  makeGetRequest: (path, callback) => {
    const requestDetails = {
      protocol: "http:",
      hostname: "localhost",
      port: config.httpPort,
      method: "GET",
      path,
      headers: {
        "Content-Type": "application/json"
      }
    }

    const req = http.request(requestDetails, (res) => {
      callback(res);
    });

    req.end();
  }
};

module.exports = api;