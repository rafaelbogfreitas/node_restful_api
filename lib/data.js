const fs = require("fs");
const path = require("path");

const lib = {
  baseDir: path.join(__dirname, "/../.data/"),

  makePath(dir, file) {
    return `${this.baseDir}${dir}/${file}.json`;
  },

  create: function (dir, file, data, callback) {
    fs.open(this.makePath(dir, file), 'wx', (error, fileDescriptor) => {
      if(!error && fileDescriptor) {
        const stringData = JSON.stringify(data);

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
    fs.readFile(this.makePath(dir, file), 'utf-8', (error, data) => {
      callback(error, data);
    });
  },
  
  update: function (dir, file, data, callback) {
    fs.open(this.makePath(dir, file), 'r+', (error, fileDescriptor) => {
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
    fs.unlink(this.makePath(dir, file), (err) => {
      if(!err) {
        callback(false);
      } else {
        callback('Error deleting the file');
      }
    })
  }

};

module.exports = lib;