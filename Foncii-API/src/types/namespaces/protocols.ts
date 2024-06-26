// Dependencies
// Types
import { FMIntegrationProviders } from "../common";

// Services
import FonciiMapsPostService from "../../business-logic/services/foncii-maps/user-posts/fmPostService";

/** Protocols to implement for the FMIntegrationService */
export interface FMIntegrationServiceProtocol extends FonciiMapsPostService {
  // Properties
  /**
   * Modular data point for accessing the integration's
   * endpoint functionalities.
   */
  integrationCredential: FMIntegrationCredential;

  /** The provider this service represents */
  provider?: FMIntegrationProviders;

  /**
   * Generates a new Foncii Maps Integration Credential using the provided data
   *
   * @static
   * @async
   * @param userID
   * @param provider
   * @param authToken
   * @param redirectURI -> Optional, used when generating Instagram credentials
   *
   * @returns -> A valid credential, or null if the credential could not be provisioned.
   */
  provisionCredential?({
    userID,
    provider,
    authToken,
    redirectURI,
  }: {
    userID: string;
    provider: FMIntegrationProviders;
    authToken: string;
    redirectURI: string;
  }): Promise<FMIntegrationCredential | null>;

  /**
   * Validates and refreshes the provided integration credential's access token, and
   * updates the rest of the fields as needed including the expiration (stale) date.
   *
   * @static
   * @async
   * @param integrationCredential
   *
   * @returns -> A valid credential, or null if the credential could not be refreshed.
   */
  refreshCredential?(
    integrationCredential: FMIntegrationCredential
  ): Promise<FMIntegrationCredential | null>;

  /**
   * Standard import method for the integration service, resolve any third-party mappings within this method.
   *
   * @async
   * @param withAuxillaryService -> Triggers some auxillary (supporting) import service logic (if any) to add an extra step to the import pipeline
   * @param isFirstImport -> Triggers any special logic for first imports
   *
   * @returns -> True if the import was successful, false otherwise.
   */
  import({
    useAuxillaryService,
    classificationEnabled,
    isFirstImport,
  }: {
    useAuxillaryService?: boolean;
    classificationEnabled?: boolean;
    isFirstImport?: boolean;
  }): Promise<Boolean>;
}
