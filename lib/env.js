const fs = require("fs");

const processEnvVariables = data => {
  const variablesArray = data.split("\n");

  variablesArray.forEach(variable => {
    if(variable) {
      const [key, value] = variable.split("=");
      if(key && !value) {
        throw new SyntaxError(`You must enter a value for ${key}`);
      }
      process.env[key] = value;
    }
  });
};

const getEnvContent = () => {
  fs.readFile(".env", "utf-8", (err, data) => {
    if(!err) {
      processEnvVariables(data);
      return;
    }
    throw new Error("You must add a .env file with the right variables to the root of the project");
  });
};

getEnvContent();