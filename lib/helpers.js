const crypto = require("crypto");
const config = require("../config");

const hash = password => {
  if(password?.length && typeof password === "string") {
    return crypto.createHmac("sha256", config.hashingSecret).update(password).digest("hex");
  }

  return false;
}

const parseJSONToObject = (json) => {
  try {
    return JSON.parse(json);
  } catch(error) {
    console.log(`Parsing the JSON failed with error: ${error}`);
    return {};
  }
}

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
}

module.exports = {
  hash,
  parseJSONToObject,
  createRandomString,
}