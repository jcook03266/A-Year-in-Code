// Dependencies
// Types
import { FMIntegrationProviders } from "../../../types/common";

// Inheritance
import UpdatableModel from "../../shared/protocols/updatableModel";

// Services
import { DatabaseServiceAdapter } from "../../../business-logic/services/database/databaseService";

// Utilities
import {
  currentDateAsMSTime,
  getMSTimeFromDateString,
} from "../../../foncii-toolkit/utilities/convenienceUtilities";
import { UnitsOfTimeInMS } from "../../../foncii-toolkit/utilities/time";

/**
 * Stores the required and relevant information pertaining
 * to a Foncii Maps (FM) Integration Credential.
 */
export default class FMIntegrationCredentialModel
  extends UpdatableModel
  implements FMIntegrationCredential, Objectable<FMIntegrationCredential>
{
  // Properties
  id;
  /** Foncii User ID used to fetch this integration credential */
  userID;
  provider;
  /** App-scoped user identifier */
  appUID;
  /** User's platform specific username provided by the integration (if any, ex.) Instagram offers this field) */
  appUsername?;
  /** Some expirable access token, either short lived or long lived depending on the integration */
  accessToken;
  /**
   * The timestamp when the user's last import occurred. This is undefined when
   * the credential is first provisioned, and updated upon successful imports.
   * ISO-8601 formatted date string
   */
  lastImport?;
  /** Defines when this integration credential's access token information expires, according to the provider */
  staleDate;
  /**
   * When enabled the auth token is automatically refreshed when the user starts a new session,
   * (if the token needs to be refreshed in the first place). Default is true.
   * This is so we don't waste operations on users that don't log in for extended periods of time, plus
   * it's bad practice to persist auth tokens indefinitely without some input / interaction from the user.
   */
  autoRefresh;

  constructor({
    id,
    userID,
    provider,
    appUID,
    appUsername,
    accessToken,
    lastImport,
    staleDate,
    autoRefresh,
    creationDate,
    lastUpdated,
  }: Partial<FMIntegrationCredential> & {
    userID: string;
    provider: FMIntegrationProviders;
    appUID: string;
    accessToken: string;
    lastImport?: string;
    staleDate: string;
  }) {
    super({ creationDate, lastUpdated });

    // FM Integration Credential Properties
    this.id = id ?? DatabaseServiceAdapter.generateUUIDHexString();
    this.userID = userID;
    this.provider = provider;
    this.accessToken = accessToken;
    this.lastImport = lastImport;
    this.staleDate = staleDate;
    this.appUID = appUID;
    this.appUsername = appUsername;
    this.autoRefresh = autoRefresh ?? true;
  }

  // Business Logic
  static expiresSoon(integrationCredential: FMIntegrationCredential) {
    const integrationCredentialExpirationDateMS = getMSTimeFromDateString(
      integrationCredential.staleDate
    ),
      warningGracePeriod = 3 * UnitsOfTimeInMS.day, // ~ 3 Days in ms [ms]
      expirationDateGracePeriod =
        integrationCredentialExpirationDateMS - warningGracePeriod;

    return integrationCredentialExpirationDateMS <= expirationDateGracePeriod;
  }

  static expired(integrationCredential: FMIntegrationCredential) {
    const currentDateMS = currentDateAsMSTime(),
      integrationCredentialExpirationDateMS = integrationCredential
        ? getMSTimeFromDateString(integrationCredential.staleDate)
        : currentDateMS;

    return currentDateMS >= integrationCredentialExpirationDateMS;
  }

  static canRefresh(integrationCredential: FMIntegrationCredential) {
    const maturationPeriod = UnitsOfTimeInMS.day; // ~ 1 Day / 24 hours in [ms], required for integrations such as Instagram's Basic Display

    return (
      getMSTimeFromDateString(integrationCredential.lastUpdated) <=
      currentDateAsMSTime() - maturationPeriod
    ); // Cred is at least 24 hours old from the current time
  }

  /**
   * @param object -> An object representing an Integration Credential model's expected data shape
   *
   * @returns -> An instantiated FM Integration Credential object if the object's fields satisfy
   * the requirements to instantiate a FM Integration Credential model object, undefined otherwise.
   */
  static fromObject(
    object: FMIntegrationCredential
  ): FMIntegrationCredentialModel | undefined {
    if (object == undefined) return undefined;

    return new FMIntegrationCredentialModel(object);
  }

  /**
   * @returns -> A JSON formatted object with all of this data model
   * object's key value pairs formatted as a plain JS Object.
   */
  toObject<FMIntegrationCredential>(): FMIntegrationCredential {
    return JSON.parse(JSON.stringify(this));
  }
}
