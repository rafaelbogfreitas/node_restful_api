const crypto = require("crypto");
const config = require("../config");
const https = require("https");
const querystring = require("querystring");


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

module.exports = {
  hash,
  parseJSONToObject,
  createRandomString,
  sendTwilioSMS,
}