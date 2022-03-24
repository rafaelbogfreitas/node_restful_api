const _data = require("./data");
const helpers = require("./helpers");
const config = require("../config");

const handlers = {
  _users: {
    get: (data, callback) => {
      const phone =
        typeof data.query.phone === "string" &&
        data.query.phone.trim().length > 0
          ? data.query.phone.trim()
          : false;

      console.log({ phone, data})
      if (phone) {
        const token =
          typeof data.headers.token === "string" ? data.headers.token : false;
        handlers._tokens.verifyToken(token, phone, (isTokenValid) => {
          if (isTokenValid) {
            _data.read("users", phone, (error, data) => {
              if (!error && data) {
                delete data.password;
                callback(200, data);
                return;
              }

              callback(404, {Error: "Error finding the user"});
            });
            return;
          }

          callback(403, {
            err: "Missing required token in header or token is invalid",
          });
        });

        return;
      }

      callback(404, {Error: "Missing required fields"});
    },
    post: (data, callback) => {
      const firstName =
        typeof data.payload.firstName === "string" &&
        data.payload.firstName.trim().length > 0
          ? data.payload.firstName.trim()
          : false;
      const lastName =
        typeof data.payload.lastName === "string" &&
        data.payload.lastName.trim().length > 0
          ? data.payload.lastName.trim()
          : false;
      const phone =
        typeof data.payload.phone === "string" &&
        data.payload.phone.trim().length > 10
          ? data.payload.phone.trim()
          : false;
      const password =
        typeof data.payload.password === "string" &&
        data.payload.password.trim().length > 0
          ? data.payload.password.trim()
          : false;
      const tosAgreement =
        typeof data.payload.tosAgreement === "boolean" &&
        data.payload.tosAgreement === true
          ? true
          : false;

      if (firstName && lastName && phone && password && tosAgreement) {
        _data.read("users", phone, (error, data) => {
          if (error) {
            const hashedPassword = helpers.hash(password);

            if (!hashedPassword) {
              callback(500, {Error: "Error hashing the password"});
              return;
            }

            const userObj = {
              firstName,
              lastName,
              phone,
              password: hashedPassword,
              tosAgreement,
            };

            _data.create("users", phone, userObj, (error) => {
              if (!error) {
                callback(200, userObj);
                return;
              }

              console.log(error);
              callback(500, {Err: "A error has ocurred saving a new user"});
            });
          } else {
            callback(400, {
              Error: "A user with that phone number already exists",
            });
          }
        });
      } else {
        callback(400, {Error: "Missing required fields"});
      }
    },
    put: (data, callback) => {
      const phone =
        typeof data.payload.phone === "string" &&
        data.payload.phone.trim().length > 10
          ? data.payload.phone.trim()
          : false;

      if (!phone) {
        callback(404, {Error: "Missing required fields"});
        return;
      }

      const firstName =
        typeof data.payload.firstName === "string" &&
        data.payload.firstName.trim().length > 0
          ? data.payload.firstName.trim()
          : false;
      const lastName =
        typeof data.payload.lastName === "string" &&
        data.payload.lastName.trim().length > 0
          ? data.payload.lastName.trim()
          : false;
      const password =
        typeof data.payload.password === "string" &&
        data.payload.password.trim().length > 0
          ? data.payload.password.trim()
          : false;

      if (firstName || lastName || password) {
        const token =
          typeof data.headers.token === "string" ? data.headers.token : false;

        handlers._tokens.verifyToken(token, phone, (isTokenValid) => {
          console.log({isTokenValid});
          if (isTokenValid) {
            _data.read("users", phone, (error, data) => {
              if (!error && data) {
                if (firstName) {
                  data.firstName = firstName;
                }
                if (lastName) {
                  data.lastName = lastName;
                }
                if (password) {
                  data.password = helpers.hash(password);
                }

                _data.update("users", phone, data, (error) => {
                  if (!error) {
                    callback(200, {message: "User updated successfully"});
                    return;
                  }

                  callback(400, {Error: "Error updating user"});
                });
                return;
              }
              callback(400, {Error: "User not found"});
            });
            return;
          }

          callback(403, {
            err: "Missing required token in header or token is invalid",
          });
        });
      } else {
        callback(400, {Error: "Missing required fields"});
      }
    },
    delete: (data, callback) => {
      const phone =
        typeof data.query.phone === "string" &&
        data.query.phone.trim().length > 10
          ? data.query.phone.trim()
          : false;

      if (!phone) {
        callback(404, {Error: "Missing required fields"});
        return;
      }

      const token =
        typeof data.headers.token === "string" ? data.headers.token : false;

      handlers._tokens.verifyToken(token, phone, (isTokenValid) => {
        if (isTokenValid) {
          _data.read("users", phone, (error, userData) => {
            if (!error && data) {
              _data.delete("users", phone, (error) => {
                if (!error) {
                  const userChecksTotal = userData.checks.length;
                  let deletions = 0;
                  let deletionErrors = false;

                  userData.checks.forEach((check) => {
                    deletions = deletions + 1;
                    _data.delete("checks", check, (err) => {
                      if (!err) {
                        return;
                      }

                      deletionErrors = true;
                    });
                  });

                  if (deletions === userChecksTotal && !deletionErrors) {
                    callback(200, {message: "User deleted successfully"});
                  } else {
                    callback(500, {
                      Error: "Something went wrong when deleting the checks",
                    });
                  }

                  return;
                }

                callback(400, {Error: "Error deleting the user"});
              });
              return;
            }

            callback(404, {Error: "Error finding the user"});
          });
          return;
        }

        callback(403, {
          err: "Missing required token in header or token is invalid",
        });
      });
    },
  },

  _tokens: {
    post: (data, callback) => {
      const phone =
        typeof data.payload.phone === "string" &&
        data.payload.phone.trim().length > 10
          ? data.payload.phone.trim()
          : false;
      const password =
        typeof data.payload.password === "string" &&
        data.payload.password.trim().length > 0
          ? data.payload.password.trim()
          : false;

      if (phone && password) {
        _data.read("users", phone, (error, data) => {
          if (!error && data) {
            const hashedPassword = helpers.hash(password);

            if (data.password === hashedPassword) {
              const tokenId = helpers.createRandomString(20);
              const expires = Date.now() + 1000 * 60 * 60;

              const token = {
                phone,
                tokenId,
                expires,
              };

              _data.create("tokens", tokenId, token, (err) => {
                if (!err) {
                  callback(200, token);
                  return;
                }

                callback(400, {Error: "Could not create a token"});
              });
            } else {
              callback(400, {Error: "Wrong password"});
            }
          } else {
            callback(400, {Error: "Could no find the requested users"});
          }
        });

        return;
      }

      callback(400, {Error: "Missing required fields"});
    },
    get: (data, callback) => {
      const id =
        typeof data.query.id === "string" && data.query.id.trim().length > 0
          ? data.query.id.trim()
          : false;

      if (id) {
        _data.read("tokens", id, (error, data) => {
          if (!error && data) {
            callback(200, data);
            return;
          }

          callback(404, {Error: "Error finding the token"});
        });

        return;
      }

      callback(404, {Error: "Missing required fields"});
    },
    put: (data, callback) => {
      const id =
        typeof data.payload.id === "string" && data.payload.id.trim().length > 0
          ? data.payload.id.trim()
          : false;
      const extend =
        typeof data.payload.extend === "boolean" && data.payload.extend === true
          ? true
          : false;

      if (!id || !extend) {
        callback(400, {error: "Missing required parameters"});
        return;
      }

      _data.read("tokens", id, (err, data) => {
        if (!err && data) {
          if (data.expires <= Date.now()) {
            callback(400, {err: "Token expired. Please login again."});
            return;
          }

          data.expires = Date.now() + 1000 * 60 * 60;

          _data.update("tokens", id, data, (err) => {
            if (!err) {
              callback(200, {
                message: "Token expiration extended successfully",
                data,
              });
              return;
            }

            callback(500, {err: "Failed to extend token expiration"});
          });

          return;
        }

        callback(400, {err: "Token does not exist"});
      });
    },
    delete: (data, callback) => {
      const id =
        typeof data.query.id === "string" && data.query.id.trim().length > 0
          ? data.query.id.trim()
          : false;

      if (!id) {
        callback(404, {Error: "Missing required fields"});
        return;
      }

      _data.read("tokens", id, (error, data) => {
        if (!error && data) {
          _data.delete("tokens", id, (error) => {
            if (!error) {
              callback(200, {message: "Token deleted successfully"});
              return;
            }

            callback(400, {Error: "Error deleting token"});
          });
          return;
        }

        callback(404, {Error: "Error finding token"});
      });
    },
    verifyToken: (tokenId, phone, callback) => {
      _data.read("tokens", tokenId, (err, data) => {
        if (!err && data) {
          if (data.phone === phone && data.expires >= Date.now()) {
            callback(true);
            return;
          }
          callback(false);
        } else {
          callback(false);
        }
      });
    },
  },

  _checks: {
    post: (data, callback) => {
      const protocol =
        typeof data.payload.protocol === "string" &&
        ["https", "http"].indexOf(data.payload.protocol) > -1
          ? data.payload.protocol
          : false;
      const url =
        typeof data.payload.url === "string" &&
        data.payload.url.trim().length > 0
          ? data.payload.url.trim()
          : false;
      const method =
        typeof data.payload.method === "string" &&
        ["post", "get", "put", "delete"].indexOf(data.payload.method) > -1
          ? data.payload.method
          : false;
      const successCodes =
        typeof data.payload.successCodes === "object" &&
        data.payload.successCodes instanceof Array &&
        data.payload.successCodes.length > 0
          ? data.payload.successCodes
          : false;
      const timeoutSeconds =
        typeof data.payload.timeoutSeconds === "number" &&
        data.payload.timeoutSeconds > 0 &&
        data.payload.timeoutSeconds < 6
          ? data.payload.timeoutSeconds
          : false;

      if (protocol && url && method && successCodes && timeoutSeconds) {
        const token =
          typeof data.headers.token === "string" ? data.headers.token : false;

        _data.read("tokens", token, (err, data) => {
          if (!err && data) {
            const phone = data.phone;

            _data.read("users", phone, (err, userData) => {
              if (!err && userData) {
                const checks =
                  typeof userData.checks === "object" &&
                  userData.checks instanceof Array
                    ? userData.checks
                    : [];

                if (checks.length < config.maxChecks) {
                  const checkId = helpers.createRandomString(20);
                  const checkObject = {
                    id: checkId,
                    userPhone: phone,
                    protocol,
                    url,
                    method,
                    successCodes,
                    timeoutSeconds,
                  };

                  _data.create("checks", checkId, checkObject, (err) => {
                    if (!err) {
                      userData.checks = checks;
                      userData.checks.push(checkId);

                      _data.update("users", phone, userData, (err) => {
                        if (!err) {
                          callback(200, checkObject);
                          return;
                        }
                        callback(500, {
                          Error: "Failed to update user with a new check",
                        });
                      });

                      return;
                    }

                    callback(500, {Err: "Could not create the new check"});
                  });
                  return;
                }
                callback(400, {Error: "Max amount of checks reached"});
                return;
              }

              callback(403);
            });
            return;
          }

          callback(403);
        });
      } else {
        callback(400, {Error: "Missing required inputs"});
      }
    },
    get: (data, callback) => {
      const id =
        typeof data.query.id === "string" ? data.query.id.trim() : false;

      if (id) {
        _data.read("checks", id, (err, checkData) => {
          if (!err && checkData) {
            _data.read("users", checkData.userPhone, (err, userData) => {
              if (!err && userData) {
                const token =
                  typeof data.headers.token === "string"
                    ? data.headers.token
                    : false;

                handlers._tokens.verifyToken(
                  token,
                  checkData.userPhone,
                  (isValidToken) => {
                    if (isValidToken) {
                      callback(200, checkData);
                      return;
                    }
                    callback(401, {Error: "Invalid token. Please login"});
                  }
                );

                return;
              }

              callback(404);
            });
            return;
          }

          callback(500, {Error: "Could not find a check for the given id"});
        });

        return;
      }

      callback(400, {Error: "Missing required params"});
    },
    put: (data, callback) => {
      const id =
        typeof data.query.id === "string" && data.query.id.trim().length > 20
          ? data.query.id.trim()
          : false;

      if (!id) {
        callback(404, {Error: "Missing required fields"});
        return;
      }

      const protocol =
        typeof data.payload.protocol === "string" &&
        ["https", "http"].indexOf(data.payload.protocol) > -1
          ? data.payload.protocol
          : false;
      const url =
        typeof data.payload.url === "string" &&
        data.payload.url.trim().length > 0
          ? data.payload.url.trim()
          : false;
      const method =
        typeof data.payload.method === "string" &&
        ["post", "get", "put", "delete"].indexOf(data.payload.method) > -1
          ? data.payload.method
          : false;
      const successCodes =
        typeof data.payload.successCodes === "object" &&
        data.payload.successCodes instanceof Array &&
        data.payload.successCodes.length > 0
          ? data.payload.successCodes
          : false;
      const timeoutSeconds =
        typeof data.payload.timeoutSeconds === "number" &&
        data.payload.timeoutSeconds > 0 &&
        data.payload.timeoutSeconds < 6
          ? data.payload.timeoutSeconds
          : false;

      if (protocol || url || method || successCodes || timeoutSeconds) {
        _data.read("checks", id, (err, checkData) => {
          if (!err && data) {
            const token =
              typeof data.headers.token === "string"
                ? data.headers.token
                : false;

            handlers._tokens.verifyToken(
              token,
              checkData.userPhone,
              (isValidToken) => {
                if (isValidToken) {
                  const updatableData = {
                    protocol,
                    url,
                    method,
                    successCodes,
                    timeoutSeconds,
                  };
                  Object.keys(updatableData).forEach((key) => {
                    if (updatableData[key]) {
                      checkData[key] = updatableData[key];
                    }
                  });
                  _data.update("checks", id, checkData, (err) => {
                    if (!err) {
                      callback(200, {message: "Check updated successfully"});
                      return;
                    }
                    callback(400, {Err: err});
                  });
                  return;
                }
                callback(401, {Error: "Invalid token. Please login"});
              }
            );
            return;
          }
          callback(400, {Err: "Could not find the check"});
        });
        return;
      }

      callback(400, {Err: "Missing fields to update"});
    },
    delete: (data, callback) => {
      const id =
        typeof data.query.id === "string" ? data.query.id.trim() : false;

      if (id) {
        _data.read("checks", id, (err, checkData) => {
          if (!err && checkData) {
            _data.read("users", checkData.userPhone, (err, userData) => {
              if (!err && userData) {
                const token =
                  typeof data.headers.token === "string"
                    ? data.headers.token
                    : false;

                handlers._tokens.verifyToken(
                  token,
                  checkData.userPhone,
                  (isValidToken) => {
                    if (isValidToken) {
                      _data.delete("checks", id, (err) => {
                        if (!err) {
                          userData.checks = userData.checks.filter(
                            (check) => check !== id
                          );

                          _data.update(
                            "users",
                            userData.phone,
                            userData,
                            (err) => {
                              if (!err) {
                                callback(200, {
                                  message: "Successfully deleted check",
                                });
                                return;
                              }

                              callback(400, {Error: err});
                            }
                          );
                          return;
                        }
                      });
                      return;
                    }
                    callback(401, {Error: "Invalid token. Please login"});
                  }
                );

                return;
              }

              callback(404);
            });
            return;
          }

          callback(500, {Error: "Could not find a check for the given id"});
        });

        return;
      }

      callback(400, {Error: "Missing required params"});
    },
  },

  index: (data, callback) => {
    if (data.method !== "get") {
      callback(405, undefined, "html");
      return;
    }

    const templateData = {
      "head.title": "Uptime monitoring made simple",
      "head.description": "Monitors website and alerts user with a SMS when state changes happen",
      "body.class": "index",
    };

    helpers.getTemplate("index", templateData, (err, str) => {
      if (!err && str) {
        helpers.addUniversalTemplates(str, templateData, (err, fullStr) => {
          if (!err && fullStr) {
            callback(200, fullStr, "html");
            return;
          }
          callback(500, undefined, "html");
        });
        return;
      }
      callback(500, undefined, "html");
    });
  },

  accountCreate: (data, callback) => {
    if (data.method !== "get") {
      callback(405, undefined, "html");
      return;
    }

    const templateData = {
      "head.title": "Create an Account",
      "head.description": "Signup is easy and only take a few seconds",
      "body.class": "accountCreate",
    };

    helpers.getTemplate("accountCreate", templateData, (err, str) => {
      if (!err && str) {
        helpers.addUniversalTemplates(str, templateData, (err, fullStr) => {
          if (!err && fullStr) {
            callback(200, fullStr, "html");
            return;
          }
          callback(500, undefined, "html");
        });
        return;
      }
      callback(500, undefined, "html");
    });
  },
  
  sessionCreate: (data, callback) => {
    if (data.method !== "get") {
      callback(405, undefined, "html");
      return;
    }

    const templateData = {
      "head.title": "Login to your account",
      "head.description": "Please enter your phone number and password to access your account",
      "body.class": "accountCreate",
    };

    helpers.getTemplate("sessionCreate", templateData, (err, str) => {
      if (!err && str) {
        helpers.addUniversalTemplates(str, templateData, (err, fullStr) => {
          if (!err && fullStr) {
            callback(200, fullStr, "html");
            return;
          }
          callback(500, undefined, "html");
        });
        return;
      }
      callback(500, undefined, "html");
    });
  },
  
  sessionDeleted: (data, callback) => {
    if (data.method !== "get") {
      callback(405, undefined, "html");
      return;
    }

    const templateData = {
      "head.title": "Logged out",
      "head.description": "You have been logged out of your account",
      "body.class": "sessionDeleted",
    };

    helpers.getTemplate("sessionDeleted", templateData, (err, str) => {
      if (!err && str) {
        helpers.addUniversalTemplates(str, templateData, (err, fullStr) => {
          if (!err && fullStr) {
            callback(200, fullStr, "html");
            return;
          }
          callback(500, undefined, "html");
        });
        return;
      }
      callback(500, undefined, "html");
    });
  },
  
  accountEdit: (data, callback) => {
    if (data.method !== "get") {
      callback(405, undefined, "html");
      return;
    }

    const templateData = {
      "head.title": "Account settings",
      "body.class": "accountEdit",
    };

    helpers.getTemplate("accountEdit", templateData, (err, str) => {
      if (!err && str) {
        helpers.addUniversalTemplates(str, templateData, (err, fullStr) => {
          if (!err && fullStr) {
            callback(200, fullStr, "html");
            return;
          }
          callback(500, undefined, "html");
        });
        return;
      }
      callback(500, undefined, "html");
    });
  },
  
  accountDeleted: (data, callback) => {
    if (data.method !== "get") {
      callback(405, undefined, "html");
      return;
    }

    const templateData = {
      "head.title": "Account deleted",
      "head.description": "Your account has been deleted",
      "body.class": "accountDeleted",
    };

    helpers.getTemplate("accountDeleted", templateData, (err, str) => {
      if (!err && str) {
        helpers.addUniversalTemplates(str, templateData, (err, fullStr) => {
          if (!err && fullStr) {
            callback(200, fullStr, "html");
            return;
          }
          callback(500, undefined, "html");
        });
        return;
      }
      callback(500, undefined, "html");
    });
  },

  checksCreate: (data, callback) => {
    if (data.method !== "get") {
      callback(405, undefined, "html");
      return;
    }

    const templateData = {
      "head.title": "Create a new check",
      "body.class": "checksCreate",
    };

    helpers.getTemplate("checksCreate", templateData, (err, str) => {
      if (!err && str) {
        helpers.addUniversalTemplates(str, templateData, (err, fullStr) => {
          if (!err && fullStr) {
            callback(200, fullStr, "html");
            return;
          }
          callback(500, undefined, "html");
        });
        return;
      }
      callback(500, undefined, "html");
    });
  },
 
  checksList: (data, callback) => {
    if (data.method !== "get") {
      callback(405, undefined, "html");
      return;
    }

    const templateData = {
      "head.title": "Dashboard",
      "body.class": "checksList",
    };

    helpers.getTemplate("checksList", templateData, (err, str) => {
      if (!err && str) {
        helpers.addUniversalTemplates(str, templateData, (err, fullStr) => {
          if (!err && fullStr) {
            callback(200, fullStr, "html");
            return;
          }
          callback(500, undefined, "html");
        });
        return;
      }
      callback(500, undefined, "html");
    });
  },
  
  checksEdit: (data, callback) => {
    if (data.method !== "get") {
      callback(405, undefined, "html");
      return;
    }

    const templateData = {
      "head.title": "Checks Details",
      "body.class": "checksEdit",
    };

    helpers.getTemplate("checksEdit", templateData, (err, str) => {
      if (!err && str) {
        helpers.addUniversalTemplates(str, templateData, (err, fullStr) => {
          if (!err && fullStr) {
            callback(200, fullStr, "html");
            return;
          }
          callback(500, undefined, "html");
        });
        return;
      }
      callback(500, undefined, "html");
    });
  },

  favicon: (data, callback) => {
    if (data.method !== "get") {
      callback(405);
      return;
    }

    helpers.getStaticAsset("favicon.ico", (err, data) => {
      if (!err && data) {
        callback(200, data, "favicon");
        return;
      }
      callback("Could not get favicon");
    });
  },

  public: (data, callback) => {
    if (data.method !== "get") {
      callback(405);
      return;
    }

    const trimmedAssetName = data.endpoint.replace("public/", "").trim();

    if (!trimmedAssetName.length) {
      callback(404);
      return;
    }

    helpers.getStaticAsset(trimmedAssetName, (err, data) => {
      if (!err && data) {
        let contentType = "plain";

        if (trimmedAssetName.includes(".css")) {
          contentType = "css";
        } else if (trimmedAssetName.includes(".js")) {
          contentType = "js";
        } else if (trimmedAssetName.includes(".png")) {
          contentType = "png";
        } else if (trimmedAssetName.includes(".jpg")) {
          contentType = "jpg";
        } else if (trimmedAssetName.includes(".ico")) {
          contentType = "favicon";
        }

        callback(200, data, contentType);
        return;
      }
      callback(404, "Could not get favicon");
    });
  },

  users: (data, callback) => {
    const acceptableMethods = ["get", "post", "put", "delete"];

    if (acceptableMethods.indexOf(data.method) > -1) {
      handlers._users[data.method](data, callback);
    } else {
      callback(405);
    }
  },

  tokens: (data, callback) => {
    const acceptableMethods = ["get", "post", "put", "delete"];

    if (acceptableMethods.indexOf(data.method) > -1) {
      handlers._tokens[data.method](data, callback);
    } else {
      callback(405);
    }
  },

  checks: (data, callback) => {
    const acceptableMethods = ["get", "post", "put", "delete"];

    if (acceptableMethods.indexOf(data.method) > -1) {
      handlers._checks[data.method](data, callback);
    } else {
      callback(405);
    }
  },

  exampleError: (data, callback) => {
    const err = new Error("This is an example error");
    throw err;
  },

  ping: (data, callback) => {
    callback(200);
  },

  notFound: (data, callback) => {
    callback(404);
  },
};

module.exports = handlers;
