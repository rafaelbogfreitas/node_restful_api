const path = require("path");
const fs = require("fs");
const zlib = require("zlib");

const lib = {
  baseDir: path.join(__dirname, "../.logs/"),

  append: (fileName, string, callback) => {
    fs.open(`${lib.baseDir}${fileName}.log`, "a", (err, fileDescriptor) => {
      if(!err && fileDescriptor) {
        fs.appendFile(fileDescriptor, `${string}\n`, (err) => {
          if(!err) {
            fs.close(fileDescriptor, (err) => {
              if(!err) {
                callback(false);
                return;
              }
              callback("Error closing the file");
            })
            return;
          }
          callback("Error appending the file");
        })
        return;
      }
      callback("Could not open file for appending");
    })
  },

  list: (includeCompressedLogs, callback) => {
    fs.readdir(lib.baseDir, (err, data) => {
      if(!err && data) {
        let trimmedFileNames = [];

        data.forEach(fileName => {
          if(fileName.indexOf(".log") > -1) {
            trimmedFileNames.push(fileName.replace(".log", ""));
          }

          if(fileName.indexOf(".gz.b64") > -1 && includeCompressedLogs) {
            trimmedFileNames.push(fileName.replace(".gz.b64", ""));
          }

          callback(false, trimmedFileNames);
        });

        return;
      }
      callback(err, data);
    })
  },

  compress: (logId, newFileId, callback) => {
    const sourceFileName = `${logId}.log`;
    const destFileName = `${newFileId}.gz.b64`;

    fs.readFile(`${lib.baseDir}${sourceFileName}`, "utf-8", (err, inputStr) => {
      if(!err && inputStr) {
        zlib.gzip(inputStr, (err, buffer) => {
          if(!err && buffer) {
            fs.open(`${lib.baseDir}${destFileName}`, "wx", (err, fileDescriptor) => {
              if(!err && fileDescriptor) {
                fs.writeFile(fileDescriptor, buffer.toString("base64"), (err) => {
                  if(!err) {
                    fs.close(fileDescriptor, (err) => {
                      if(!err) {
                        callback(false);
                        return;
                      }
                      callback(err);
                    });
                  }
                  callback(err);
                })
                return;
              }
              callback(err);
            });
            return;
          }
          callback(err);
        });
        return;
      }
      callback(err);
    })
  },

  decompress:(fileId, callback) => {
    const fileName = `${fileId}.gz.b64`;

    fs.readFile(`${lib.baseDir}${fileName}`, "utf-8", (err, str) => {
      if(!err && str) {
        const inputBuffer = Buffer.from(str, "base64");
        zlib.unzip(inputBuffer, (err, outputBuffer) => {
          if(!err && outputBuffer) {
            callback(false, outputBuffer.toString());
            return;
          }
          callback(err);
        });

        return;
      }
      callback(err);
    });
  },

  truncate: (logId, callback) => {
    fs.truncate(`${lib.baseDir}${logId}.log`, (err) => {
      if(!err) {
        callback(false);
        return;
      }
      callback(err);
    })
  }
};

module.exports = lib;