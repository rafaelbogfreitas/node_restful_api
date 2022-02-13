const environments = {};

environments.staging = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: 'staging',
  hashingSecret: 'secret',
  maxChecks: 5,
  twilio: {
    fromPhone: process.env.FROM_PHONE,
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
  }
};

environments.development = {
  httpPort: 3300,
  httpsPort: 3301,
  envName: 'development',
  hashingSecret: 'secret',
  maxChecks: 5,
  twilio: {
    fromPhone: process.env.FROM_PHONE,
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
  }
};

environments.production = {
  httpPort: 5000,
  httpsPort: 5001,
  envName: 'production',
  hashingSecret: 'secret',
  maxChecks: 5,
  twilio: {
    fromPhone: process.env.FROM_PHONE,
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
  }
};

const currentEnv = typeof(process.env.NODE_ENV) === "string" ? process.env.NODE_ENV.toLowerCase() : '';

const envToExport = typeof(environments[currentEnv]) === "object" ? environments[currentEnv] : environments.staging;

module.exports = envToExport;