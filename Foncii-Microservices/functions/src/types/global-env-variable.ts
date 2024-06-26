// Declaring env variables in the global name space to make accessing them easier
declare global {
    namespace NodeJS {
      interface ProcessEnv {
        // Firebase / Google Service Keys
        ADMIN_SDK_CERT: string;

        // Database and Cloud Storage URI (Identifier not Locator) Definitions
        PRIMARY_DATABASE_IDENTIFIER: string;
        MONGODB_CONNECTION_URI: string;
        FONCII_CDN_URL: string;
        CLOUD_STORAGE_BUCKET_URL: string;

        // Authorization
        FONCII_SERVER_API_KEY: string;
      }
    }
}

export {};
