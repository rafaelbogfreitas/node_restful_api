const environments = {};

environments.staging = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: 'staging',
  hashingSecret: 'secret',
  maxChecks: 5,
  twilio: {
    fromPhone: "+18124456386",
    accountSid: "AC6199803066b0da7ebc6411665e2c1315",
    authToken: "45e52c241b587b249e4c5c31ab16d497",
  }
};

environments.development = {
  httpPort: 3300,
  httpsPort: 3301,
  envName: 'development',
  hashingSecret: 'secret',
  maxChecks: 5,
  twilio: {
    fromPhone: "+18124456386",
    accountSid: "AC6199803066b0da7ebc6411665e2c1315",
    authToken: "45e52c241b587b249e4c5c31ab16d497",
  }
};

environments.production = {
  httpPort: 5000,
  httpsPort: 5001,
  envName: 'production',
  hashingSecret: 'secret',
  maxChecks: 5,
  twilio: {
    fromPhone: "+18124456386",
    accountSid: "AC6199803066b0da7ebc6411665e2c1315",
    authToken: "45e52c241b587b249e4c5c31ab16d497",
  }
};

const currentEnv = typeof(process.env.NODE_ENV) === "string" ? process.env.NODE_ENV.toLowerCase() : '';

const envToExport = typeof(environments[currentEnv]) === "object" ? environments[currentEnv] : environments.staging;

module.exports = envToExport;