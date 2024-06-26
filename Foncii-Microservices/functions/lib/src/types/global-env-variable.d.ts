declare global {
    namespace NodeJS {
        interface ProcessEnv {
            ADMIN_SDK_CERT: string;
            DATABASE_URL: string;
            FONCII_CDN_URL: string;
            CLOUD_STORAGE_BUCKET_URL: string;
            FONCII_SERVER_API_KEY: string;
        }
    }
}
export {};
