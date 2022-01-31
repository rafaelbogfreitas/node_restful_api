const { setUncaughtExceptionCaptureCallback } = require("process");
const _data = require("./data");
const helpers = require("./helpers");

const handlers = {
  _users: {
    get: (data, callback) => {
      const phone = typeof (data.query.phone) === "string" && data.query.phone.trim().length > 0 ? data.query.phone.trim() : false;
      
      if(phone) {
        const token = (typeof data.headers.token === "string") ? data.headers.token : false;

        handlers._tokens.verifyToken(token, phone, (isTokenValid) => {
          if(isTokenValid) {
            _data.read("users", phone, (error, data) => {
              if(!error && data) {
                delete data.password
                callback(200, data);
                return
              }
              
              callback(404, { Error: "Error finding the user" });
            });
            return
          }

          callback(403, { err: "Missing required token in header or token is invalid" });
        });
       
        
        return;
      }
      
      callback(404, { Error: "Missing required fields" });
    },
    post: (data, callback) => {
      const firstName = (typeof data.payload.firstName === "string" && data.payload.firstName.trim().length > 0) ? data.payload.firstName.trim() : false;
      const lastName = (typeof data.payload.lastName === "string" && data.payload.lastName.trim().length > 0) ? data.payload.lastName.trim() : false;
      const phone = (typeof data.payload.phone === "string" && data.payload.phone.trim().length > 10) ? data.payload.phone.trim() : false;
      const password = (typeof data.payload.password === "string" && data.payload.password.trim().length > 0) ? data.payload.password.trim() : false;
      const tosAgreement = (typeof data.payload.tosAgreement === "boolean" && data.payload.tosAgreement === true) ? true : false;
      console.log({
        firstName,
        lastName,
        phone,
        password,
        tosAgreement
      });
      if(firstName && lastName && phone && password && tosAgreement) {
        _data.read("users", phone, (error, data) => {
          if(error) {
            const hashedPassword = helpers.hash(password);
            
            if(!hashedPassword) {
              callback(500, { Error: "Error hashing the password" });
              return
            }
            
            const userObj = {
              firstName,
              lastName,
              phone,
              password: hashedPassword,
              tosAgreement
            };
            
            _data.create("users", phone, userObj, (error) => {
              if(!error) {
                callback(200);
                return
              }
              
              console.log(error);
              callback(500, { Err: "A error has ocurred saving a new user" })
            });
          } else {
            callback(400, { Error: "A user with that phone number already exists"})
          }
        });
      } else {
        callback(400, { Error: "Missing required fields" });
      }
    },
    put: (data, callback) => {
      const phone = typeof (data.payload.phone) === "string" && data.payload.phone.trim().length > 10 ? data.payload.phone.trim() : false;

      if(!phone) {
        callback(404, { Error: "Missing required fields" });
        return
      }

      const firstName = (typeof data.payload.firstName === "string" && data.payload.firstName.trim().length > 0) ? data.payload.firstName.trim() : false;
      const lastName = (typeof data.payload.lastName === "string" && data.payload.lastName.trim().length > 0) ? data.payload.lastName.trim() : false;
      const password = (typeof data.payload.password === "string" && data.payload.password.trim().length > 0) ? data.payload.password.trim() : false;

      if(firstName || lastName || password) {
        const token = (typeof data.headers.token === "string") ? data.headers.token : false;

        handlers._tokens.verifyToken(token, phone, (isTokenValid) => {
          console.log({isTokenValid})
          if(isTokenValid) {
            _data.read("users", phone, (error, data) => {
              if(!error && data) {
                if(firstName) {
                  data.firstName = firstName;
                }
                if(lastName) {
                  data.lastName = lastName;
                }
                if(password) {
                  data.password = helpers.hash(password);
                }
    
                _data.update("users", phone, data, (error) => {
                  if(!error) {
                    callback(200, { message: "User updated successfully" });
                    return
                  }
    
                  callback(400, { Error: "Error updating user" });
                });
                return
              }
              callback(400, { Error: "User not found" });
            });
            return
          }

          callback(403, { err: "Missing required token in header or token is invalid" });
        });
      } else {
        callback(400, { Error: "Missing required fields" });
      }

    },
    delete: (data, callback) => {
      const phone = typeof (data.query.phone) === "string" && data.query.phone.trim().length > 10 ? data.query.phone.trim() : false;

      if(!phone) {
        callback(404, { Error: "Missing required fields" });
        return
      }

      const token = (typeof data.headers.token === "string") ? data.headers.token : false;
      
      handlers._tokens.verifyToken(token, phone, (isTokenValid) => {
        if(isTokenValid) {
          _data.read("users", phone, (error, data) => {
            if(!error && data) {
              _data.delete("users", phone, (error) => {
                if(!error) {
                  callback(200, { message: "User deleted successfully" });
                  return
                }
        
                callback(400, { Error: "Error deleting the user" });
              });
              return
            }
            
            callback(404, { Error: "Error finding the user" });
          });
          return
        }

        callback(403, { err: "Missing required token in header or token is invalid" });
      });
    },
  },

  _tokens: {
    post: (data, callback) => {
      const phone = (typeof data.payload.phone === "string" && data.payload.phone.trim().length > 10) ? data.payload.phone.trim() : false;
      const password = (typeof data.payload.password === "string" && data.payload.password.trim().length > 0) ? data.payload.password.trim() : false;
      console.log({ phone, password })
      if(phone && password) {
        _data.read("users", phone, (error, data) => {
          if(!error && data) {
            const hashedPassword = helpers.hash(password);

            if(data.password === hashedPassword) {
              const tokenId = helpers.createRandomString(20);
              const expires = Date.now() + 1000 * 60 * 60;
              console.log({ tokenId })
              const token = {
                phone,
                tokenId,
                expires,
              };

              _data.create("tokens", tokenId, token, (error) => {
                console.log({error})
                if(!error) {
                  callback(200, { message: "Token created", data: token });
                  return
                }

                callback(400, { Error: "Could not create a token" });
              });

            } else {
              callback(400, { Error: "Wrong password" });
            }
          } else {
            callback(400, { Error: "Could no find the requested users" });
          }
        });

        return
      }

      callback(400, { Error: "Missing required fields" });
    },
    get: (data, callback) => {
      const id = typeof (data.query.id) === "string" && data.query.id.trim().length > 0 ? data.query.id.trim() : false;
      
      if(id) {
        _data.read("tokens", id, (error, data) => {
          if(!error && data) {
            callback(200, data);
            return
          }
          
          callback(404, { Error: "Error finding the token" });
        });
        
        return;
      }
      
      callback(404, { Error: "Missing required fields" });
    },
    put: (data, callback) => {
      const id = typeof (data.payload.id) === "string" && data.payload.id.trim().length > 0 ? data.payload.id.trim() : false;
      const extend = typeof (data.payload.extend) === "boolean" && data.payload.extend === true ? true : false;

      if(!id || !extend) {
        callback(400, { error: "Missing required parameters" });
        return
      }

      _data.read("tokens", id, (err, data) => {
        if(!err && data) {
          if(data.expires <= Date.now()) {
            callback(400, { err: "Token expired. Please login again." });
            return
          }

          data.expires = Date.now() + 1000 * 60 * 60;

          _data.update("tokens", id, data, (err) => {
            if(!err) {
              callback(200, { message: "Token expiration extended successfully", data });
              return
            }

            callback(500, { err: "Failed to extend token expiration" });
          });

          return
        }

        callback(400, { err: "Token does not exist" });
      })

    },
    delete: (data, callback) => {
      const id = typeof (data.query.id) === "string" && data.query.id.trim().length > 0 ? data.query.id.trim() : false;

      if(!id) {
        callback(404, { Error: "Missing required fields" });
        return
      }

      _data.read("tokens", id, (error, data) => {
        if(!error && data) {
          _data.delete("tokens", id, (error) => {
            if(!error) {
              callback(200, { message: "Token deleted successfully" });
              return
            }
    
            callback(400, { Error: "Error deleting token" });
          });
          return
        }
        
        callback(404, { Error: "Error finding token" });
      });
    },
    verifyToken: (tokenId, phone, callback) => {
      _data.read("tokens", tokenId, (err, data) => {
        if(!err && data) {
          if(data.phone === phone && data.expires >= Date.now()) {
            callback(true);
            return
          }
          callback(false);
        } else {
          callback(false);
        }
      })
    }
  },

  users: (data, callback) => {
    const acceptableMethods = [
      'get',
      'post',
      'put',
      'delete'
    ];

    if(acceptableMethods.indexOf(data.method) > -1) {
      handlers._users[data.method](data, callback);
    } else {
      callback(405);
    }
  },
  
  tokens: (data, callback) => {
    const acceptableMethods = [
      'get',
      'post',
      'put',
      'delete'
    ];

    if(acceptableMethods.indexOf(data.method) > -1) {
      handlers._tokens[data.method](data, callback);
    } else {
      callback(405);
    }
  },

  ping: (data, callback) => {
    callback(200);
  },

  notFound: (data, callback) => {
    callback(404);
  },
};

module.exports = handlers;