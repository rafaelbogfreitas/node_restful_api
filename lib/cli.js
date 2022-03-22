const readline = require("readline");
const util = require("util");
const os = require("os");
const v8 = require("v8");
const debug = util.debuglog("cli");
const events = require("events");
const config = require("../config");
const { read } = require("fs");

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

e.on("more checks info", (str) => {
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
      console.log("You asked for listUsers");
    },
    moreUserInfo: (str) => {
      console.log(`You asked for listUsers ${str}`);
    },
    listChecks: (str) => {
      console.log(`You asked for listChecks ${str}`);
    },
    moreCheckInfo: (str) => {
      console.log(`You asked for moreCheckInfo ${str}`);
    },
    listLogs: () => {
      console.log("You asked for listLogs");
    },
    moreLogInfo: (str) => {
      console.log(`You asked for moreLogInfo ${str}`);
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
        "more checks info",
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