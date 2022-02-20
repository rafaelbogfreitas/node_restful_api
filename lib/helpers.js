const crypto = require("crypto");
const config = require("../config");
const https = require("https");
const querystring = require("querystring");
const path = require("path");
const fs = require("fs");


const hash = password => {
  if(password?.length && typeof password === "string") {
    return crypto.createHmac("sha256", config.hashingSecret).update(password).digest("hex");
  }

  return false;
};

const parseJSONToObject = (json) => {
  try {
    return JSON.parse(json);
  } catch(error) {
    console.log(`Parsing the JSON failed with error: ${error}`);
    return {};
  }
};

const createRandomString = (strLength) => {
  strLength = (typeof strLength === "number") && strLength > 0 ? strLength : false;

  if(strLength) {
    const possibleChars = "abcdefghijlmnopqrstuvxyz";
    let str = "";

    for(let char in possibleChars) {
      str += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
    };

    return str;
  } else {
    return "";
  }
};

const sendTwilioSMS = (phone, msg, callback) => {
  phone = (typeof phone === "string") && phone.length >= 10 ? phone.trim() : false;
  msg = (typeof msg === "string") && msg.length > 0 && msg.length <= 1600 ? msg.trim() : false;

  if(phone && msg) {
    const payload = {
      From: config.twilio.fromPhone,
      To: `+55${phone}`,
      Body: msg,
    }
    console.log(payload);
    const stringifiedPayload = querystring.stringify(payload);

    const requestDetails = {
      protocol: "https:",
      hostname: "api.twilio.com",
      method: "POST",
      path: `/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`,
      auth: `${config.twilio.accountSid}:${config.twilio.authToken}`,
      headers: {
        "Content-type": "application/x-www-form-urlencoded",
        "Content-length": Buffer.byteLength(stringifiedPayload),
      },
      
    };

    const req = https.request(requestDetails, (res) => {
      const { statusCode } = res;

      if(statusCode === 200 || statusCode === 201) {
        callback(false);
        return;
      }

      callback(`Status code returned was: ${res.statusCode}`);
    });

    req.on("error", (err) => {
      callback(err);
    });

    req.write(stringifiedPayload);

    req.end();

    return;
  }
  
  callback("Given parameters were missing or invalid");
};

const getTemplate = (template, data, callback) => {
  template = typeof template === "string" && template.length > 0 ? template : false;
  data = typeof data === "object" && data !== null ? data : {};

  if(template) {
    const templatePath = path.join(__dirname, `/../templates/${template}.html`);

    fs.readFile(templatePath, "utf8", (err, templateStr) => {
      if(!err && templateStr) {
        const finalStr = interpolate(templateStr, data);
        callback(false, finalStr);
        return;
      }
      callback("No template found");
    });
    return;
  }

  callback("Template invalid");
};

const addUniversalTemplates = (str, data, callback) => {
  str = typeof str === "string" && str.length > 0 ? str : "";
  data = typeof data === "object" && data !== null ? data : {};

  getTemplate('_header', data, (err, headerStr) => {
    if(!err && headerStr) {
      getTemplate('_footer', data, (err, footerStr) => {
        if(!err && footerStr) {
          const fullStr = `${headerStr}${str}${footerStr}`;
          callback(false, fullStr);
          return;
        }

        callback("Cannot find footer template");
      });
      return;
    }
    callback("Cannot find header template");
  })

}

const interpolate = (str, data) => {
  str = typeof str === "string" && str.length > 0 ? str : "";
  data = typeof data === "object" && data !== null ? data : {};

  for(let keyName in config.templateGlobals) {
    if(config.templateGlobals.hasOwnProperty(keyName)) {
      data[`global.${keyName}`] = config.templateGlobals[keyName];
    }
  }

  for(let key in data) {
    if(data.hasOwnProperty(key) && typeof(data[key]) === "string") {
      const replace = data[key];
      const find = `{${key}}`;

      str = str.replace(find, replace);
    }
  }

  return str;
};

module.exports = {
  hash,
  parseJSONToObject,
  createRandomString,
  sendTwilioSMS,
  getTemplate,
  addUniversalTemplates,
}