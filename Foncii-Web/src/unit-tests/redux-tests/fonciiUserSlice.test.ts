// Dependencies
// Types
import {
  MockCoordinatePointData,
  MockFMUserData,
  MockIntegrationCredentialData,
} from "../../types/mocks/mock-gql-types";
import { FmIntegrationCredential, FmUser } from "../../__generated__/graphql";

// Actions
import {
  setSignOutState,
  setSignInState,
  setClientCoordinates,
  setUser,
  setLoginState,
  authErrorOccurred,
  setLoadingState,
  clear,
  setIntegrationCredentials,
  setIntegrationConnectionInProgressState,
  updateIntegrationCredential,
  insertIntegrationCredential,
  removeIntegrationCredential,
  clearAllIntegrationCredentials,
} from "../../redux/entities/slices/fonciiUser";

// Reducer + Initial State
import fonciiUserReducer, {
  initialState,
} from "../../redux/entities/slices/fonciiUser";

// Foncii User Redux Slice Testing Scheme
describe("FonciiUserSlice", () => {
  let initialStateCopy: FonciiUserSliceState;

  // Reset the state before each test
  beforeEach(() => {
    initialStateCopy = { ...initialState };
  });

  it("should set signing out state", () => {
    const newState = fonciiUserReducer(
      undefined,
      setSignOutState({ signingOut: true })
    );
    expect(newState.signingOut).toBe(true);
  });

  it("should set signing in state", () => {
    const newState = fonciiUserReducer(
      undefined,
      setSignInState({ signingIn: true })
    );
    expect(newState.signingIn).toBe(true);
  });

  it("should set client coordinates", () => {
    // Defined coordinates
    var newState = fonciiUserReducer(
      undefined,
      setClientCoordinates({
        clientCoordinates: MockCoordinatePointData,
      })
    );

    expect(newState.clientCoordinates).toEqual(MockCoordinatePointData);
    expect(newState.locationPermissionGranted).toBe(true);

    // Undefined (Location Permissions invalidated and user physical position also revoked)
    var newState = fonciiUserReducer(
      undefined,
      setClientCoordinates({
        clientCoordinates: undefined,
      })
    );

    expect(newState.clientCoordinates).toBeUndefined();
    expect(newState.locationPermissionGranted).toBe(false);
  });

  it("should set user", () => {
    const user: FmUser = MockFMUserData;
    const newState = fonciiUserReducer(undefined, setUser({ user }));

    expect(newState.user).toEqual(user);
  });

  it("should set login state", () => {
    const newState = fonciiUserReducer(
      undefined,
      setLoginState({ isLoggedIn: true })
    );

    expect(newState.isLoggedIn).toBe(true);
  });

  it("should set auth error state", () => {
    const state = { ...initialStateCopy, authErrorDidOccur: false };
    const newState = fonciiUserReducer(state, authErrorOccurred({}));

    expect(newState.authErrorDidOccur).toBe(true);
  });

  it("should set loading state", () => {
    const newState = fonciiUserReducer(
      undefined,
      setLoadingState({ isLoading: true })
    );

    expect(newState.isLoading).toBe(true);
  });

  it("should set integration credentials", () => {
    const integrationCredentials: FmIntegrationCredential[] = [
      /* ... your integration credentials here */
    ];
    const newState = fonciiUserReducer(
      undefined,
      setIntegrationCredentials({ integrationCredentials })
    );

    expect(newState.integrationCredentials).toEqual(integrationCredentials);
  });

  it("should set integration connection in progress state", () => {
    const newState = fonciiUserReducer(
      undefined,
      setIntegrationConnectionInProgressState({
        integrationConnectionInProgress: true,
      })
    );

    expect(newState.integrationConnectionInProgress).toBe(true);
  });

  it("should update integration credential", () => {
    // Mock an existing credential and updated credential
    const existingCredential: FmIntegrationCredential =
      MockIntegrationCredentialData;
    existingCredential.expiresSoon = true;

    const updatedCredential: FmIntegrationCredential = existingCredential;
    updatedCredential.expiresSoon = false;

    const initialStateWithCredential: FonciiUserSliceState = {
      ...initialState,
      integrationCredentials: [existingCredential],
    };

    const newState = fonciiUserReducer(
      initialStateWithCredential,
      updateIntegrationCredential({
        updatedIntegrationCredential: updatedCredential,
      })
    );

    expect(newState.integrationCredentials.length).toBe(1);
    expect(newState.integrationCredentials[0].expiresSoon).toEqual(
      updatedCredential.expiresSoon
    );
  });

  it("should insert integration credential", () => {
    // Mock a new integration credential
    const newCredential: FmIntegrationCredential =
      MockIntegrationCredentialData;
    const newState = fonciiUserReducer(
      undefined,
      insertIntegrationCredential({ newIntegrationCredential: newCredential })
    );

    expect(newState.integrationCredentials.length).toBe(1);
    expect(newState.integrationCredentials[0]).toEqual(newCredential);
  });

  it("should remove integration credential", () => {
    // Mock an existing credential to remove
    const credentialToRemove: FmIntegrationCredential =
      MockIntegrationCredentialData;

    const initialStateWithCredential: FonciiUserSliceState = {
      ...initialState,
      integrationCredentials: [credentialToRemove],
    };

    const newState = fonciiUserReducer(
      initialStateWithCredential,
      removeIntegrationCredential({
        integrationCredentialID: credentialToRemove.id,
      })
    );
    expect(newState.integrationCredentials.length).toBe(0);
  });

  it("should clear all integration credentials", () => {
    const initialStateWithCredentials: FonciiUserSliceState = {
      ...initialState,
      integrationCredentials: [MockIntegrationCredentialData],
    };

    const newState = fonciiUserReducer(
      initialStateWithCredentials,
      clearAllIntegrationCredentials({})
    );
    expect(newState.integrationCredentials.length).toBe(0);
  });

  it("should clear state", () => {
    const mutatedState: FonciiUserSliceState = {
      ...initialStateCopy,
      signingIn: true, // Random mutation
    };

    const newState = fonciiUserReducer(mutatedState, clear());
    expect(newState).toEqual(initialStateCopy);
  });
});
