const _data = require("./data");
const helpers = require("./helpers");

const handlers = {
  _users: {
    get: (data, callback) => {
      const phone = typeof (data.query.phone) === "string" && data.query.phone.trim().length > 0 ? data.query.phone.trim() : false;
      
      if(phone) {
        _data.read("users", phone, (error, data) => {
          if(!error && data) {
            delete data.password
            callback(200, data);
            return
          }
          
          callback(404, { Error: "Error finding the user" });
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
    },
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

  ping: (data, callback) => {
    callback(200);
  },

  notFound: (data, callback) => {
    callback(404);
  },
};

module.exports = handlers;