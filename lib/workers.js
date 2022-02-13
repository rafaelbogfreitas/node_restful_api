const url = require("url");
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");
const _data = require("./data");
const helpers = require("./helpers");

const workers = {
  gatherAllChecks: () => {
    _data.list("checks", (err, checks) => {
      if(!err && checks.length) {
        checks.forEach(check => {
          _data.read("checks", check, (err, originalCheck) => {
            if(!err && originalCheck) {
              workers.validateCheckData(originalCheck);
              return;
            }
            console.log(`Could not find the check ${check}`);
          });
        });
        return;
      }
      console.log("No checks found");
    });

    console.log("Gathering checks...");
  },
  validateCheckData: (checkData) => {
    checkData = (typeof checkData === "object" && originalCheck) ? checkData : {};
    checkData.id = typeof (checkData.id) === "string" && checkData.id.trim().length > 20 ? checkData.id.trim() : false;
    checkData.userPhone = typeof (checkData.userPhone) === "string" && checkData.userPhone.trim().length > 10 ? checkData.userPhone.trim() : false;
    checkData.protocol = (typeof checkData.protocol === "string" && ["https", "http"].indexOf(checkData.protocol) > -1) ? checkData.protocol : false;
    checkData.url = (typeof checkData.url === "string" && checkData.url.trim().length > 0) ? checkData.url.trim() : false;
    checkData.method = (typeof checkData.method === "string" && ["post", "get", "put", "delete"].indexOf(checkData.method) > -1) ? checkData.method : false;
    checkData.successCodes = (typeof checkData.successCodes === "object" && checkData.successCodes instanceof Array && checkData.successCodes.length > 0) ? checkData.successCodes : false;
    checkData.timeoutSeconds = (typeof checkData.timeoutSeconds === "number" && checkData.timeoutSeconds > 0 && checkData.timeoutSeconds < 6) ? checkData.timeoutSeconds : false;

    checkData.state = (typeof checkData.state === "string" && ["up", "down"].indexOf(checkData.state) > -1) ? checkData.state : "down";
    checkData.lasChecked === "number" && checkData.lasChecked > 0 ? checkData.lasChecked : false;

    if(
      checkData.id &&
      checkData.userPhone &&
      checkData.protocol &&
      checkData.url &&
      checkData.method &&
      checkData.successCodes &&
      checkData.timeoutSeconds
    ) {
      workers.performCheck(checkData);
      return;
    }
    console.log("Error: one of the checks isn't formatted properly");
  },
  performCheck: (checkData) => {

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