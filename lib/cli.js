const readline = require("readline");
const  childProcess = require("child_process");
const util = require("util");
const os = require("os");
const v8 = require("v8");
const debug = util.debuglog("cli");
const events = require("events");
const config = require("../config");
const { read } = require("fs");
const _data = require("../lib/data.js");
const _logs = require("../lib/logs.js");
const helpers = require("./helpers.js");

class _events extends events {}
const e = new _events();

e.on("man", (str) => {
  cli.responders.help();
});

e.on("help", (str) => {
  cli.responders.help();
});

e.on("exit", (str) => {
  cli.responders.exit();
});

e.on("stats", (str) => {
  cli.responders.stats();
});

e.on("list users", (str) => {
  cli.responders.listUsers();
});

e.on("more user info", (str) => {
  cli.responders.moreUserInfo(str);
});

e.on("list checks", (str) => {
  cli.responders.listChecks(str);
});

e.on("more check info", (str) => {
  cli.responders.moreCheckInfo(str);
});

e.on("list logs", (str) => {
  cli.responders.listLogs(str);
});

e.on("more log info", (str) => {
  cli.responders.moreLogInfo(str);
});

const cli = {
  init() {
    console.log("\x1b[34m%s\x1b[0m",  `CLI is running`);
    
    const _interface = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: "",
    });

    _interface.prompt();

    _interface.on("line", (str) => {
      cli.processInput(str);
      _interface.prompt();
    });

    _interface.on("close", () => {
      process.exit(0);
    });
  },

  responders: {
    help: () => {
      const commands = {
        "exit" : "Kill the CLI adn the application",
        "man" : "Show this help page",
        "help" : "Alias of the 'man' command",
        "stats" : "Get statistics on the underlying operating system and resoucer utils",
        "list users" : "Show a list of all the registered (undeleted) users in the system",
        "more user info --{userId}" : "Show the details of a specific user",
        "list checks --up --down" : "Show a list of all the active checks in the system",
        "more checks info --{checkId}" : "Show details of a specific check",
        "list logs" : "Show a list of all the log files available to be read (compressed and uncompressed)",
        "more log info --{fileName}" : "Show details of a specific log file",
      };

      cli.header("CLI MANUAL");

      cli.table(commands);
    },

    exit: () => {
      process.exit(0);
    },

    stats: () => {
      const stats = {
        "Load Average": os.loadavg().join(' '),
        "CPU Count": os.cpus().length,
        "Free Memory": os.freemem(),
        "Current Malloced Memory": v8.getHeapStatistics().malloced_memory,
        "Peak Malloced Memory": v8.getHeapStatistics().peak_malloced_memory,
        "Allocated Heap Usage (%)": Math.round((v8.getHeapStatistics().used_heap_size / v8.getHeapStatistics().total_heap_size) * 100),
        "Available Heap Allocated (%)": Math.round((v8.getHeapStatistics().total_heap_size / v8.getHeapStatistics().heap_size_limit) * 100),
        "Uptime": os.uptime() + " seconds",
      };

      cli.header("System Statistics");
      cli.table(stats);
    },

    listUsers: () => {
      _data.list("users", (err, userIds) => {
        if(!err && userIds && userIds.length > 0) {
          cli.verticalSpace();

          userIds.forEach(id => {
            _data.read('users', id, (err, userData) => {
              if(!err && userData) {
                let line = `Name: ${userData.firstName} ${userData.lastName} Phone: ${userData.phone} Checks: `;
                const numberOfChecks = typeof userData.checks === "object" && userData.checks instanceof Array ? userData.checks.length  : 0;

                line += numberOfChecks;

                console.log(line);
                cli.verticalSpace();
              }
            })
          })
        }
      });
    },

    moreUserInfo: (str) => {
      const arr = str.split("--");
      const userId = typeof arr[1] === "string" && arr[1].trim().length > 0 ? arr[1].trim() : false;

      if(userId) {
        _data.read("users", userId, (err, userData) => {
          if(!err && userData) {
            delete userData.hashdPassword;
            cli.verticalSpace();
            console.dir(userData, { colors: true });
          }
        })
      }
    },

    listChecks: (str) => {
      _data.list("checks", (err, checkIds) => {
        if(!err && checkIds) {
          cli.verticalSpace();
          checkIds.forEach(id => {
            _data.read("checks", id, (err, checkData) => {
              const includeCheck = false;
              const lowerString = str.toLowerCase();

              const state = typeof(checkData.state) === "string" ? checkData.state : "down";
              const stateOrUnknown = typeof(checkData.state) === "string" ? checkData.state : "unknown";

              if(lowerString.indexOf(`--${state}`) > -1 || (lowerString.indexOf('--down') === -1 && lowerString.indexOf("--up") === -1)) {
                const line = `ID: ${checkData.id} ${checkData.method.toUpperCase()} ${checkData.protocol}://${checkData.url} State: ${stateOrUnknown}`;
                console.log(line);
                cli.verticalSpace();
              }
            })
          })
        }
      })
    },

    moreCheckInfo: (str) => {
      const arr = str.split("--");
      const checkId = typeof arr[1] === "string" && arr[1].trim().length > 0 ? arr[1].trim() : false;
      
      if(checkId) {
        _data.read("checks", checkId, (err, checkData) => {
          if(!err && checkData) {
            cli.verticalSpace();
            console.dir(checkData, { colors: true });
          }
        })
      }
    },

    listLogs: () => {
      const ls = childProcess.spawn("ls", ['./.logs/']);
      ls.stdout.on('data', (dataObj) => {
        const dataStr = dataObj.toString();
        const logFileNames = dataStr.split("\n");

        cli.verticalSpace();
        logFileNames.forEach((logFileName) => {
          if(typeof logFileName  === "string" && logFileName.length > 0 && logFileName.indexOf('-') > -1) {
            console.log(logFileName.trim().split(".")[0]);
          }
          cli.verticalSpace();
        });
      });
    },
    
    moreLogInfo: (str) => {
      const arr = str.split("--");
      const logName = typeof arr[1] === "string" && arr[1].trim().length > 0 ? arr[1].trim() : false;
      
      if(logName) {
        cli.verticalSpace();
        _logs.decompress(logName, (err, stringData) => {
          if(!err && stringData) {
            const arr = stringData.split("\n");
            arr.forEach(jsonString => {
              const logObject = helpers.parseJSONToObject(jsonString);

              if(logObject && JSON.stringify(logObject) !== "{}") {
                console.dir(logObject, { colors: true });
                cli.verticalSpace();
              }
            });
          }
        });
      }
    },
  },

  centered(str) {
    str = (typeof str === "string" && str.trim().length > 0) ? str.trim() : '';

    const width = process.stdout.columns;
    const leftPadding = Math.floor((width - str.length) / 2);

    let line = "";

    for(let i = 0; i < leftPadding; i++) {
      line += " ";
    }

    line += str;
    console.log(line);
  },

  horizontalLine(lines = 1) {
    const width = process.stdout.columns * lines;
    let line = "";

    for(let i = 0; i < width; i++) {
      line += "-";
    }

    console.log(line);
  },

  verticalSpace(lines) {
    lines = typeof(lines) === "number" && lines > 0 ? lines : 1;

    for(let i = 0; i < lines; i++) {
      console.log("");
    }
  },
  
  header(title) {
    cli.horizontalLine();
    cli.centered(title);
    cli.horizontalLine();
    cli.verticalSpace(2);
  },

  table(data) {
    for(const key in data) {
      let line = `\x1b[34m${key}\x1b[0m`;
      const value = data[key];
      const padding = 60 - line.length;

      for(let i = 0; i < padding; i++) {
        line += ' ';
      }

      line += value;
      console.log(line);
      cli.verticalSpace();
    }
    
    cli.verticalSpace();
    cli.horizontalLine(1);
  },

  processInput(str) {
    str = (typeof str === "string" && str.trim().length > 0) ? str.trim() : false;

    if(str) {
      const uniqueInputs = [
        "man",
        "help",
        "exit",
        "stats",
        "list users",
        "more user info",
        "list checks",
        "more check info",
        "list logs",
        "more log info",
      ];

      let matchFound = false;
      let counter = 0;

      uniqueInputs.some((input) => {
        if(str.toLowerCase().indexOf(input) > -1) {
          matchFound = true;

          e.emit(input, str);
          return true;
        }
      });

      if(!matchFound) {
        console.log("Sorry, try again");
      }
    }

  }
};

module.exports = cli;