// Loaders
import dotenv from "dotenv";

// Logging
import logger from "../../../foncii-toolkit/debugging/debugLogger";

// Local
import SecretUtils from "./googleSecrets";

/**
 * Wrapper around env and secrets to ensure secrets are set correctly and securely
 */
class Flags {
  public static async loadFlags() {
    // Note: The 'test' ENV flag is automatically set when running npx jest to
    // run testing suite. [Do not remove]
    if (
      !process.env.NODE_ENV ||
      process.env.NODE_ENV == "local" ||
      process.env.NODE_ENV == "test"
    ) {
      dotenv.config();
      dotenv.config({ path: `.env.local`, override: true });
    }

    logger.info(`Prefetching secrets...`);
    const secretsFactory = SecretUtils.getInstance();
    await secretsFactory.replaceEnvSecretsWithValues([
      "YELP_FUSION_API_SECRET",
      "GOOGLE_MAPS_API_SECRET",
      "FONCII_APP_ADMIN_SDK_CERT_SECRET",
      "FONCII_MAPS_ADMIN_SDK_CERT_SECRET",
      "MONGODB_CONNECTION_SECRET",
      "RESY_API_SECRET",
      "APOLLO_KEY",
      "FONCII_SERVER_API_SECRET",
      "API_KEY_SALT_SECRET",
      "ENCIPHERED_SERVER_API_SECRET",
      "INSTAGRAM_CLIENT_SECRET",
      "OPEN_AI_SECRET",
    ]);
  }
}

export default Flags;
