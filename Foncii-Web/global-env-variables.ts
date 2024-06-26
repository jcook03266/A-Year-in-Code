// Declaring env variables in the global name space to make accessing them easier
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Server
      PROD_PORT: number;
      DEV_PORT: number;

      // Client
      NEXT_PUBLIC_NODE_ENV_CUSTOM: "local" | "staging" | "production";
      NEXT_PUBLIC_FONCII_API_ENDPOINT: string;
      NEXT_PUBLIC_FONCII_API_AUTH_TOKEN: string;
      NEXT_PUBLIC_FONCII_STAGING_AUTH_CODE: string;
      NEXT_PUBLIC_FIREBASE_CONFIG_API_KEY: string;
      NEXT_PUBLIC_AMPLITUDE_API_KEY: string;
      NEXT_PUBLIC_MAPBOX_TOKEN: string;
      NEXT_PUBLIC_INSTAGRAM_CLIENT_ID: string;
    }
  }
}

export {};
