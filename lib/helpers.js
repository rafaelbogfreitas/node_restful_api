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

module.exports = {
  hash,
  parseJSONToObject,
}