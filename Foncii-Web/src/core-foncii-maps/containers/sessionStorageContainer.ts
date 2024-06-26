"use client";
/**
 * Note: Session storage is tab based. You open up a new tab, a new session is started.
 * But session storage survives page reloads and restores.
 *
 * https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage
 */
const SessionStorageContainer = (): SessionStorageContents => {
  // Getters
  const getUserSessionID = (): string | undefined => {
    try {
      return sessionStorage.getItem(StorageKeys.UserSessionID) ?? undefined;
    } catch (err) {}
  };

  // Simple encapsulation of browser loaded key value pairs to pass to other instances
  return {
    UserSessionID: getUserSessionID(),
  } as SessionStorageContents;
};

// Setter Methods
/**
 * @param expirationDate
 */
export const setUserSessionID = (sessionID: string): void => {
  try {
    sessionStorage.setItem(StorageKeys.UserSessionID, sessionID);
  } catch (err) {}
};

// Clear Methods
export const clearUserSessionID = (): void => {
  try {
    sessionStorage.removeItem(StorageKeys.UserSessionID);
  } catch (err) {}
};

// Supported Storage Keys, used to save and retrieve values from session storage
enum StorageKeys {
  UserSessionID = "user.session.id",
}

export default SessionStorageContainer;
