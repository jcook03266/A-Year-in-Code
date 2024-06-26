// External
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

// Logging
import logger from "../../../foncii-toolkit/debugging/debugLogger";

/**
 * Google Secrets helper
 */
class SecretUtils {
  private static SECRET_PREFIX = "secret__";
  private static instance: SecretUtils;
  private readonly secretClient: SecretManagerServiceClient;

  private constructor() {
    this.secretClient = new SecretManagerServiceClient();
  }

  static getInstance(): SecretUtils {
    if (!SecretUtils.instance) {
      SecretUtils.instance = new SecretUtils();
    }
    return SecretUtils.instance;
  }

  static isSecret(maybeSecret: string): boolean {
    return maybeSecret.startsWith(SecretUtils.SECRET_PREFIX);
  }

  async fetchSecret({
    secretName,
    envNameKey,
  }: {
    secretName: string | undefined;
    envNameKey: string;
  }): Promise<string | undefined> {
    if (!secretName) {
      throw new Error(`secret name was undefined! Env Name Key: ${envNameKey}`);
    }

    if (!SecretUtils.isSecret(secretName)) {
      return undefined;
    }

    secretName = secretName.split(SecretUtils.SECRET_PREFIX)[1];

    const secretPath = `projects/${process.env.PROJECT_ID}/secrets/${secretName}/versions/latest`;
    const [version] = await this.secretClient.accessSecretVersion({
      name: secretPath,
    });
    const value = version.payload?.data?.toString();

    if (!value) {
      throw new Error(`secret could not retreived: ${secretName}`);
    }
    return value;
  }

  /**
   * Convicience method to prefetch secrets at service start time
   * @param envNameKeys all env keys to fetch secrets for
   */
  async replaceEnvSecretsWithValues(
    envNameKeys: NodeJS.ProcessEnvType[]
  ): Promise<void> {
    const promises = envNameKeys.map(async (envNameKey) => {
      const newVal = await this.fetchSecret({
        secretName: process.env[envNameKey],
        envNameKey: envNameKey.toString(),
      });
      if (newVal) {
        process.env[envNameKey] = newVal;
      } else {
        logger.info(`Skipping requested secret ${envNameKey}`);
      }
    });
    await Promise.all(promises);
  }
}

export default SecretUtils;
