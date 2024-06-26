"use client";
// Dependencies
// Properties
import { AppProperties } from "../properties/AppProperties";

/**
 * A simple encapsulation of the local storage system for this
 * web app, allowing the client to set and get persisted key value
 * pairs from the browser's stored data for the deployed domain. This storage
 * is accessible by the application hosted at the allotted domain only, so
 * no other site can access it.
 *
 * @returns -> An object containing key value pairs where
 * the optional values are the retrieved, these values are all undefined if they don't exist yet
 * instead of nullified, for ease of unwrapping elsewhere
 */
const LocalStorageContainer = (): LocalStorageContents => {
  // Getter Methods
  // Flag to dissolve the local storage upon some major breaking change rollout
  const getAppDevelopmentVersion = (): string | undefined => {
    try {
      const version = localStorage.getItem(StorageKeys.AppDevelopmentVersion);

      // Save the current version if it doesn't exist, and return undefined to acknowledge the prior value
      if (!version) {
        setAppDevelopmentVersion(AppProperties.DevelopmentVersion);
      }

      return version ?? undefined;
    } catch (err) {} // Local storage not defined on the server, usual error, don't log it
  };

  // Redux App State Tree -> Persisted to rehydrate the Redux store after a refresh
  const getReduxAppStateTree = (): any => {
    // Clear the redux store tree if the app development version has changed and persist the new version
    if (getAppDevelopmentVersion() != AppProperties.DevelopmentVersion) {
      setAppDevelopmentVersion(AppProperties.DevelopmentVersion);

      clearReduxAppStateTree();
    }

    try {
      const serializedReduxStateTree = localStorage.getItem(
        StorageKeys.ReduxAppStateTree
      );

      // Precondition failure
      if (!serializedReduxStateTree) {
        return undefined;
      }

      return JSON.parse(serializedReduxStateTree) ?? undefined;
    } catch (err) {}
  };

  const getLogInCoolDownExpirationDate = (): Date | undefined => {
    try {
      const dateString =
        localStorage.getItem(StorageKeys.LogInCoolDownExpirationDate) ??
        undefined;

      return dateString ? new Date(dateString) : undefined;
    } catch (err) {}
  };

  const getEncryptedStagingAuthorizationCode = (): string | undefined => {
    try {
      return (
        localStorage.getItem(StorageKeys.EncryptedStagingAuthorizationCode) ??
        undefined
      );
    } catch (err) {}
  };

  // Simple encapsulation of browser loaded key value pairs to pass to other instances
  return {
    ReduxAppStateTree: getReduxAppStateTree(),
    AppDevelopmentVersion: getAppDevelopmentVersion(),
    EncryptedStagingAuthorizationCode: getEncryptedStagingAuthorizationCode(),
    LogInCoolDownExpirationDate: getLogInCoolDownExpirationDate(),
  } as LocalStorageContents;
};

// Settet Methods
export const setReduxAppStateTree = (stateTree: any): void => {
  try {
    const serializedReduxStateTree = JSON.stringify(stateTree);
    localStorage.setItem(
      StorageKeys.ReduxAppStateTree,
      serializedReduxStateTree
    );
  } catch (err) {}
};

export const setAppDevelopmentVersion = (version: string): void => {
  try {
    localStorage.setItem(StorageKeys.AppDevelopmentVersion, version);
  } catch (err) {}
};

export const setEncipheredStagingAuthCode = (
  encryptedAuthCode: string
): void => {
  try {
    localStorage.setItem(
      StorageKeys.EncryptedStagingAuthorizationCode,
      encryptedAuthCode
    );
  } catch (err) {}
};

/**
 * @param expirationDate
 */
export const setLogInCoolDownExpirationDate = (expirationDate: Date): void => {
  try {
    // Save the date as a serializable ISO formatted date string
    const dateString = expirationDate.toISOString();

    localStorage.setItem(StorageKeys.LogInCoolDownExpirationDate, dateString);
  } catch (err) {}
};

// Clear Methods
export const clearReduxAppStateTree = (): void => {
  try {
    localStorage.setItem(StorageKeys.ReduxAppStateTree, ""); // Use set instead of clear, a blank string will reset the state tree, an undefined value will default to the previous state
  } catch (err) {}
};

export const clearLoginCoolDown = (): void => {
  try {
    localStorage.removeItem(StorageKeys.LogInCoolDownExpirationDate);
  } catch (err) {}
};

// Supported Storage Keys, used to save and retrieve values from local storage
enum StorageKeys {
  ReduxAppStateTree = "fonciimaps.app.state",
  AppDevelopmentVersion = "fonciimaps.dev.version",
  EncryptedStagingAuthorizationCode = "fonciimaps.staging.auth.cipher",
  LogInCoolDownExpirationDate = "fonciimaps.log.in.cooldown",
}

export default LocalStorageContainer;
