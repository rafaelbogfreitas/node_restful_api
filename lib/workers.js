const url = require("url");
const https = require("https");
const http = require("http");
const _data = require("./data");
const helpers = require("./helpers");
const _logs = require("./logs");

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
    checkData = (typeof checkData === "object" && checkData) ? checkData : {};
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
    const { protocol, url: checkUrl, method, timeoutSeconds } = checkData;

    let checkOutcome = {
      error: false,
      responseCode: false,
    };

    let outcomeSent = false;

    const composedUrl = `${protocol}://${checkUrl}`;
    const parsedUrl = url.parse(composedUrl, true);
    const hostname = parsedUrl.hostname;
    const path = parsedUrl.path;

    const requestDetaisl = {
      protocol: `${protocol}:`,
      hostname,
      method: method.toUpperCase(),
      path,
      timeoutSeconds: timeoutSeconds * 1000,
    };

    const moduleToUse = protocol === "http" ? http : https;

    const req = moduleToUse.request(requestDetaisl, (res) => {
      const status = res.statusCode;

      checkOutcome.responseCode = status;

      if(!outcomeSent) {
        workers.processCheckoutOutcome(checkData, checkOutcome);
        outcomeSent = true;
      }
    });
    
    req.on("error", (err) => {
      checkOutcome.error = {
        error: true,
        value: err,
      };
      
      if(!outcomeSent) {
        workers.processCheckoutOutcome(checkData, checkOutcome);
        outcomeSent = true;
      }
    });

    req.on("timeout", (_) => {
      checkOutcome.error = {
        error: true,
        value: timeout,
      };
      
      if(!outcomeSent) {
        workers.processCheckoutOutcome(checkData, checkOutcome);
        outcomeSent = true;
      }
    });

    req.end();
  },

  processCheckoutOutcome: (checkData, outcome) => {
    const state = !outcome.error && outcome.responseCode && checkData.successCodes.indexOf(outcome.responseCode) > -1 ? "up" : "down";

    const alertUser = (checkData.lastChecked && checkData.state !== state);

    const lastChecked = Date.now();
    workers.log(checkData, outcome, state, alertUser, lastChecked);

    const newCheckData = {
      ...checkData,
      state,
      lastChecked,
    };


    _data.update("checks", newCheckData.id, newCheckData, (err) => {
      if(!err) {
        if(alertUser) {
          workers.alerUserToStatusChange(newCheckData);
        } else {
          console.log("Check has not changed. User no alerted");
        }
        return;
      }
      console.log(`Error updating check: ${checkData.id}`);
    });
  },

  alerUserToStatusChange: ({ userPhone, method, protocol, url, state }) => {
    const msg = `Status alert: your check for ${method.toUpperCase()} ${protocol}://${url} is currently "${state}"`;
    helpers.sendTwilioSMS(userPhone, msg, (err) => {
      if(!err) {
        console.log("User alerted successfully");
        return;
      }
      console.log(`Error sending SMS to user. Error: ${err}`);
    });
  },

  log: (originalCheckData, checkOutcome, state, alertWarranted, timeOffCheck) => {
    const logData = {
      check: originalCheckData,
      outcome: checkOutcome,
      state,
      alert: alertWarranted,
      time: timeOffCheck
    };

    const logString = JSON.stringify(logData);

    const logFileName =  originalCheckData.id;
    _logs.append(logFileName, logString, (err) => {
      if(!err) {
        console.log("Logging to file successfully");
        return;
      }

      console.log("Logging to file failed");
    })
  },

  rotateLogs: () => {
    _logs.list(false,  (err, logs) => {
      if(!err && logs) {
        logs.forEach(log => {
          const logId = log.replace(".log", "");
          const newFileId = `${logId}-${Date.now()}`;

          _logs.compress(logId, newFileId, (err) => {
            if(!err) {
              _logs.truncate(logId, (err) => {
                if(!err) {
                  console.log("Successfully truncate file");
                  return;
                }
                console.log("Error truncating the file");
              })
              return;
            }
            console.log("Error compressing the file");
          })
        });

        return;
      }
      console.log("Could not find any logs to rotate");
    });
  },
  
  loop: () => {
    setInterval(() => {
      workers.gatherAllChecks();
    }, 1000 * 60);
  },
  
  logRotationLoop: () => {
    setInterval(() => {
      workers.rotateLogs();
    }, 1000 * 60 * 60 * 24);
  },

  init: () => {
    workers.gatherAllChecks();
    workers.loop();
    workers.rotateLogs();
    workers.logRotationLoop();
  },
};

module.exports = workers;