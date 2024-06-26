// Dependencies
// Types
import {
  FmIntegrationCredential,
  FmUser,
} from "../../../__generated__/graphql";

// Slices
import { createSlice } from "@reduxjs/toolkit";
import { ReducerNames } from "../slices";

// The default state of this entity when first instantiated
export const initialState: FonciiUserSliceState = {
  user: undefined, // Primary user account data
  impersonatingUser: undefined, // Original user that is impersonating
  integrationCredentials: [], // Foncii Maps user post importation integration credentials held by the current user
  integrationConnectionInProgress: false, // -> True when an integration is currently being connected, false otherwise
  clientCoordinates: undefined, // The user's last physical coordinates, if not set then the default value is undefined. The map widget's default coordinate point is ('Manhattan'), so this is rendered when first using the application.
  locationPermissionGranted: false, // True when the user allows their location to be accessed which sets the coordinates state
  isLoggedIn: false,
  isLoading: false, // True when an async operation is in progress, false otherwise
  authErrorDidOccur: false, // True if the user's login attempt failed, either through invalid credentials, or
  // an expired access token which pushes them back to the login section
  signingOut: false, // True when the user is signing out, false otherwise
  signingIn: false, // True when the user is first logging in, false otherwise (used to prevent double loading of the user's posts)
  isFTUE: false, // True if the user has just signed up, set to false when they complete onboarding or log out and log in again
};

/**
 * Slice which stores global data tied to the current user and their client, except their posts
 * which are stored in a separate slice in order to maintain simplicity
 *
 * Note: This is slice definition that combines type def, initial state, and reducer defs into a single object via toolkit
 */
const fonciiUserSlice = createSlice({
  name: ReducerNames.FonciiUserReducerName,
  initialState: initialState,
  reducers: {
    // All actions that can be taken on this slice
    setSignOutState: (state, action) => {
      state.signingOut = action.payload.signingOut ?? false;
    },

    setSignInState: (state, action) => {
      state.signingIn = action.payload.signingIn ?? false;
    },

    startFTUE: (state, _) => {
      state.isFTUE = true;
    },

    completeFTUE: (state, _) => {
      state.isFTUE = false;
    },

    /** Records the user's last physical coordinates reported by their device through the browser's navigation API */
    setClientCoordinates: (state, action) => {
      const coordinates = action.payload.clientCoordinates;

      // If the coordinates are undefined then the user has not granted their location access, so we reset the state
      if (coordinates?.lat == undefined || coordinates?.lng == undefined) {
        state.clientCoordinates = undefined;
        state.locationPermissionGranted = false;
      } else {
        state.clientCoordinates = coordinates;
        state.locationPermissionGranted = true;
      }
    },

    // Sets the current user's data
    setUser: (state, action) => {
      const user = action.payload.user;

      state.user = user;
    },

    setImpersonatedUser: (state, action) => {
      const targetImpersonatingUser: FmUser | undefined =
        action.payload.impersonatedUser;
      const impersonatingUser: FmUser | undefined = state.impersonatingUser;
      const currentUser: FmUser | undefined = state.user;
      if (
        targetImpersonatingUser &&
        targetImpersonatingUser?.username === impersonatingUser?.username
      ) {
        console.log("Clearing impersonated user");
        state.user = impersonatingUser;
        state.impersonatingUser = undefined;
      } else if (
        targetImpersonatingUser &&
        !impersonatingUser &&
        targetImpersonatingUser?.username === currentUser?.username
      ) {
        console.log("Same user requested - doing nothing");
      } else if (targetImpersonatingUser && !impersonatingUser) {
        console.log("Starting impersonated user");
        state.user = targetImpersonatingUser;
        state.impersonatingUser = currentUser;
      } else if (targetImpersonatingUser && impersonatingUser) {
        console.log("Replacing impersonated user");
        state.user = targetImpersonatingUser;
      }
    },

    setLoginState: (state, action) => {
      const isLoggedIn = action.payload.isLoggedIn;

      state.authErrorDidOccur = false; // Any old auth error is resolved when the user logs in successfull
      state.isLoggedIn = isLoggedIn;
    },

    // Triggered when the user's login attempt fails
    authErrorOccurred: (state, _) => {
      state.authErrorDidOccur = true;
    },

    setLoadingState: (state, action) => {
      state.isLoading = action.payload.isLoading ?? false;
    },

    setIntegrationCredentials: (state, action) => {
      state.integrationCredentials = action.payload.integrationCredentials;
    },

    setIntegrationConnectionInProgressState: (state, action) => {
      state.integrationConnectionInProgress =
        action.payload.integrationConnectionInProgress ?? false;
    },

    updateIntegrationCredential: (state, action) => {
      const updatedIntegrationCredential =
        action.payload.updatedIntegrationCredential;

      // Update the existing credential's data with the updated credential
      const updatedIntegrationCredentials = state.integrationCredentials.map(
        (storedCred) => {
          if (storedCred.id === updatedIntegrationCredential.id) {
            return { ...storedCred, ...updatedIntegrationCredential };
          } else {
            return storedCred;
          }
        }
      );

      state.integrationCredentials = updatedIntegrationCredentials;
    },

    /** Inserts the given credential into the credentials set and replaces any previous instance of itself */
    insertIntegrationCredential: (state, action) => {
      const newIntegrationCredential: FmIntegrationCredential =
          action.payload.newIntegrationCredential,
        // Remove the existing old credential (if any)
        updatedIntegrationCredentials = state.integrationCredentials.filter(
          (storedCred) => storedCred.id != newIntegrationCredential.id
        );

      updatedIntegrationCredentials.push(newIntegrationCredential);
      state.integrationCredentials = updatedIntegrationCredentials;
    },

    removeIntegrationCredential: (state, action) => {
      const idOfCredentialToRemove: string =
          action.payload.integrationCredentialID,
        updatedIntegrationCredentials = state.integrationCredentials.filter(
          (storedCred) => storedCred.id != idOfCredentialToRemove
        );

      state.integrationCredentials = updatedIntegrationCredentials;
    },

    clearAllIntegrationCredentials: (state, _) => {
      state.integrationCredentials = initialState.integrationCredentials;
    },

    // Resets the state of this slice to its initial state
    clear: () => initialState,
  },
});

// Separate action and reducer exports for easy access in other modules
export const {
  setSignOutState,
  setSignInState,
  startFTUE,
  completeFTUE,
  setClientCoordinates,
  setUser,
  setImpersonatedUser,
  setLoginState,
  authErrorOccurred,
  setLoadingState,
  setIntegrationCredentials,
  setIntegrationConnectionInProgressState,
  insertIntegrationCredential,
  updateIntegrationCredential,
  removeIntegrationCredential,
  clearAllIntegrationCredentials,
  clear,
} = fonciiUserSlice.actions;

export default fonciiUserSlice.reducer;
