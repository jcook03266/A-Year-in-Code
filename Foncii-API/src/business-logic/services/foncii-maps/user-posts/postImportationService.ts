// Dependencies
// Types
import { FMIntegrationProviders } from "../../../../types/common";

// Logging
import logger from "../../../../foncii-toolkit/debugging/debugLogger";

// Integrations
import InstagramIntegrationService from "./integrations/instagram-api/instagramIntegrationService";

// Utilities
import {
  currentDateAsISOString,
  currentDateAsMSTime,
  getMSTimeFromDateString,
  getObjectKeyForValue,
} from "../../../../foncii-toolkit/utilities/convenienceUtilities";

/**
 * A modular service layer for interfacing with the different
 * integration providers Foncii Maps uses to import posts and
 * map them to our expected data shapes.
 */
export default class PostImportationService {
  // Properties
  // The integration credential to import posts with, passed when this class is first instantiated.
  private integrationCredential: FMIntegrationCredential;

  // Services
  // Importation Providers / Strategies, with lazily injected integration credential
  private Integrations = {
    instagram: (integrationCredential: FMIntegrationCredential) =>
      new InstagramIntegrationService(integrationCredential),
  };

  constructor(integrationCredential: FMIntegrationCredential) {
    this.integrationCredential = integrationCredential;
  }

  // Provider selector implemented via strategy pattern
  /**
   * This method imports the user's unique posts using the integration credential used to instantiate this service (if valid)
   * as well as fetches posts from other sources (e.g. the database), de-duplicates and joins these
   * posts together into a mutually exclusive set, validates that they comply with expected post
   * behavior, sends off any pending media uploads, and returns them.
   *
   * @returns -> A processed and validated unique collection of the user's imported posts from
   * the specified provider + posts from other sources.
   */
  async importPosts({
    useAuxillaryService = true,
    classificationEnabled = true,
    isFirstImport = false,
  }: {
    useAuxillaryService?: boolean;
    classificationEnabled?: boolean;
    isFirstImport?: boolean;
  }): Promise<Boolean> {
    const provider = this.integrationCredential.provider,
      isIntegrationCredentialValid =
        PostImportationService.isIntegrationCredentialValid(
          this.integrationCredential
        );

    if (!isIntegrationCredentialValid) {
      logger.warn(
        `The integration provided is invalid, please generate a new one. 
            ID: ${
              this.integrationCredential.id
            } Current Time: ${currentDateAsISOString()}
            User ID: ${this.integrationCredential.userID}, provider: ${
          this.integrationCredential.provider
        }
            Expiration Date: ${
              this.integrationCredential.staleDate
            } Last Updated: ${this.integrationCredential.lastUpdated}
            `
      );

      return false;
    }

    switch (provider) {
      case FMIntegrationProviders.Instagram:
        return await this.Integrations.instagram(
          this.integrationCredential
        ).import({ useAuxillaryService, classificationEnabled, isFirstImport });
      default:
        // Not supported
        return false;
    }
  }

  /**
   * @async
   * @param args
   *
   * @returns -> Newly created integration credential if the provisioning was successful,
   * null otherwise.
   */
  static async provisionIntegrationCredential(args: {
    userID: string;
    provider: FMIntegrationProviders;
    authToken: string;
    redirectURI: string;
  }) {
    switch (args.provider) {
      case FMIntegrationProviders.Instagram:
        return await InstagramIntegrationService.provisionCredential(args);
      default:
        logger.warn(
          `Provisioning integration credentials with ${getObjectKeyForValue(
            FMIntegrationProviders,
            args.provider
          )} is not supported yet.`
        );
        return null;
    }
  }

  /**
   * @async
   * @param provider
   * @param integrationCredential
   *
   * @returns -> Refreshed integration credential if the refresh was successful,
   * null otherwise.
   */
  static async refreshIntegrationCredentialFor(
    provider: FMIntegrationProviders,
    integrationCredential: FMIntegrationCredential
  ) {
    switch (provider) {
      case FMIntegrationProviders.Instagram:
        return await InstagramIntegrationService.refreshCredential(
          integrationCredential
        );
      default:
        logger.warn(
          `Refreshing integration credentials with ${getObjectKeyForValue(
            FMIntegrationProviders,
            provider
          )} is not supported yet.`
        );
        return null;
    }
  }

  // Helper Methods
  /**
   * Determines whether or not the credential is valid based on its expiration status.
   *
   * @param integrationCredential
   *
   * @returns -> True if the credential isn't stale (hasn't expired), false otherwise (expired and unusable)
   */
  static isIntegrationCredentialValid(
    integrationCredential: FMIntegrationCredential
  ) {
    return (
      currentDateAsMSTime() <
      getMSTimeFromDateString(integrationCredential.staleDate)
    );
  }
}
