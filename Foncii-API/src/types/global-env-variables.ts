// Declaring env variables in the global name space to make accessing them easier
declare global {
  namespace NodeJS {
    type ProcessEnvType = keyof ProcessEnv;
    interface ProcessEnv {
      // Environment Flag
      NODE_ENV: "local" | "staging" | "production" | "test";
      // OPTIONAL - for local overriding
      LOGGER_LEVEL: "fatal" | "error" | "warn" | "info" | "debug" | "trace";
      // Data Aggregation API Keys
      YELP_FUSION_API_SECRET: string;
      GOOGLE_MAPS_API_SECRET: string;
      // Firebase / Google Service Keys
      FONCII_APP_ADMIN_SDK_CERT_SECRET: string;
      FONCII_MAPS_ADMIN_SDK_CERT_SECRET: string;
      // Database and Cloud Storage URI (Identifier not Locator) Definitions
      MONGODB_CONNECTION_SECRET: string;
      MONGODB_CONNECTION: string;
      CLOUD_STORAGE_BUCKET_URL: string;
      // Resy User API Credentials
      RESY_API_SECRET: string;
      // Apollo Studio Credentials
      APOLLO_KEY: string; // SECRET - naming required for APOLLO
      APOLLO_GRAPH_REF: string;
      APOLLO_SCHEMA_REPORTING: string;
      // API Authorization Secrets
      FONCII_SERVER_API_SECRET: string;
      API_KEY_SALT_SECRET: string;
      ENCIPHERED_SERVER_API_SECRET: string;
      // Instagram API
      INSTAGRAM_CLIENT_ID: string;
      INSTAGRAM_CLIENT_SECRET: string;
      // OpenAI API
      OPEN_AI_SECRET: string;
    }
  }
}

export {};
