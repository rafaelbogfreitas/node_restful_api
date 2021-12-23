const environments = {};

environments.staging = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: 'staging'
};

environments.development = {
  httpPort: 3300,
  httpsPort: 3301,
  envName: 'development'
};

environments.production = {
  httpPort: 5000,
  httpsPort: 5001,
  envName: 'production'
};

const currentEnv = typeof(process.env.NODE_ENV) === "string" ? process.env.NODE_ENV.toLowerCase() : '';

const envToExport = typeof(environments[currentEnv]) === "object" ? environments[currentEnv] : environments.staging;

module.exports = envToExport;