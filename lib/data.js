const fs = require("fs");
const path = require("path");
const { parseJSONToObject } = require("./helpers");

const lib = {
  baseDir: path.join(__dirname, "/../.data/"),

  makePath(dir, file) {
    return `${lib.baseDir}${dir}/${file}.json`;
  },

  create: function (dir, file, data, callback) {
    fs.open(lib.makePath(dir, file), 'wx', (error, fileDescriptor) => {
      if(!error && fileDescriptor) {
        const stringData = JSON.stringify(data, null, '\t');

        fs.writeFile(fileDescriptor, stringData, (error) => {
          if(!error) {
            fs.close(fileDescriptor, (error) => {
              if(!error) {
                callback(false);
              } else {
                callback("Error closing new file");
              }
            });
          } else {
            callback("Could not write a file");
          }
        });
      } else {
        callback("Could not create a new file");
      }
    });
  },

  read: function (dir, file, callback) {
    fs.readFile(lib.makePath(dir, file), 'utf-8', (error, data) => {
      if(!error && data) {
        const parsedData = parseJSONToObject(data);
        callback(false, parsedData);
        return;
      }
      callback(error, data);
    });
  },
  
  update: function (dir, file, data, callback) {
    fs.open(lib.makePath(dir, file), 'r+', (error, fileDescriptor) => {
      if(!error && fileDescriptor) {
        const stringData = JSON.stringify(data);
        fs.ftruncate(fileDescriptor, (err) => {
          if(!err) {
            fs.writeFile(fileDescriptor, stringData, (err) => {
              if(!err) {
                fs.close(fileDescriptor, (err) => {
                  if(!err) {
                    callback(false);
                  } else {
                    callback('There was an error when closing the file');
                  }
                });
              } else {
                callback('Error writing to file');
              }
            });
          }
        });
      } else {
        callback('Could not open this file');
      }
    });
  },

  delete(dir, file, callback) {
    fs.unlink(lib.makePath(dir, file), (err) => {
      if(!err) {
        callback(false);
      } else {
        callback('Error deleting the file');
      }
    })
  },

  list: (dir, callback) => {
    fs.readdir(`${lib.baseDir}/dir`, { encoding: "utf-8" }, (err, files) => {
      if(!err && files.length) {
        const trimmedFiles = files.map(file => file.replace(".json", ""));
        callback(false, trimmedFiles);
        return;
      }
      callback(err, files);
    });
  }

};

module.exports = lib;