// Dependencies
// GraphQL Document Node
import gql from "graphql-tag";

const typeDef = gql`
  ### Queries / Mutations / Inputs ###

  ## Queries ##
  type Query {
    # User Credentials #
    doesUsernameExistFM(username: String!): Boolean!
    doesEmailExistFM(email: String!): Boolean!
    doesPhoneNumberExistFM(phoneNumber: String!): Boolean!

    # Integration Credentials #
    """
    Fetches all integration credentials for a given user ID, and optionally automatically
    refreshes the fetched credentials that are marked for auto-refresh.
    """
    getUserIntegrationCredentials(userID: ID!): [FMIntegrationCredential!]!

    """
    Fetches the specific integration credential associated with the given user ID and integration
    provider, and automatically refreshes the credential if it's marked for auto-refresh.
    """
    getIntegrationCredentialForUser(
      input: integrationCredentialForUserInput!
    ): FMIntegrationCredential

    """
    Fetches the user's email from various associated attributes | used for fetching the user's email in order to enable dynamic login using username and phone number
    via firebase auth, which both boil down to email + password login, OTP is an option, but it's not going to be supported right now beyond one time verification on sign up
    """
    getUserEmailFromUsernameFM(username: String!): String
    getUserEmailFromPhoneNumberFM(phoneNumber: String!): String

    # User Queries #
    findUserByIDFM(userID: ID!): FMUser
    findUserByUsernameFM(username: String!): FMUser

    # Taste Profile Queries #
    findTasteProfilesForUser(userID: ID!): [TasteProfile!]
    doesUserHaveATasteProfile(userID: ID!): Boolean!
    getPrimaryUserTasteProfile(userID: ID!): TasteProfile
    getTasteProfile(id: ID!): TasteProfile

    """
    Computes similarity score between the two users with the given IDs if both
    have a valid primary taste profile associated with their account. Null if no
    taste profiles exist for either.
    """
    computeTasteProfileSimilarity(userID1: ID!, userID2: ID!): Float

    """
    Returns a list of all users up to the specified limit.
    Provide pageIndex to skip a specific amount of pages when
    paginating. So +1 to go to the next page of results and so on.
    +1 with a limit of 10,000 would return the next 10,000. 20,000 in total
    but the first 10,000 was skipped due to the +1 page index
    """
    getAllUsers(limit: Int!, pageIndex: Int): [FMUser!]!
  }

  ## Mutations ##
  type Mutation {
    # Integration Credentials #
    """
    Connects a new integration credential for the given user ID and integration provider if one doesn't already exist
    or refreshes a prexisting one using the new input when a user chooses to manually refresh the credential.
    Note: The backend tries to refresh this credential automatically when the user is active, manual refreshes are
    up to the user and are required when the credential eventually expires.
    """
    connectIntegration(input: ConnectIntegrationInput!): FMIntegrationCredential

    """
    Allows the user to manually refresh the integration credential associated with the given
    input (if the credential is mature ~ 24 hours or older)
    """
    refreshIntegration(
      input: integrationCredentialForUserInput!
    ): FMIntegrationCredential

    """
    Revokes the target integration credential for the given user ID and integration provider,
    effectively cutting off Foncii Maps' access to the user's data source until they reconnect the integration
    """
    revokeIntegrationCredential(
      userID: ID!
      provider: FMIntegrationProviders!
    ): Boolean!

    """
    Revokes all integration credentials for the given user ID.
    """
    revokeAllIntegrationCredentials(userID: ID!): Boolean!

    """
    Updates the auto refresh attribute associated with integration credentials to
    be true if enabled, and false if disabled. This attribute controls the background behavior
    associated with each credential (i.e whether or not to refresh the credential automatically)
    """
    setAutoRefreshStateForCredential(
      integrationCredentialID: ID!
      autoRefreshEnabled: Boolean!
    ): Boolean!

    # User Account #
    """
    Creates the user with the given input and returns the created user if the operation was successful, null otherwise
    """
    createUserFM(input: CreateNewFMUserInput!): FMUser

    """
    Tracks a client based user login event, not actually responsible for signing a user in and generating an auth credential.
    Returns the logged in user's data since this mutation is supposed to only be triggered when the user logs in successfully,
    null if an error occurs for some external reason.
    """
    loginUserFM(input: UserLoginInput!): FMUser

    """
    Endpoint for impersonating a user. Currently fetches the user object
    """
    fetchImpersonatedUserFM(input: ImpersonateUserInput!): FMUser

    """
    Tracks a Foncii Maps client based user sign out event, not responsible for physically signing a user out and revoking auth credentials
    True if the operation was successful, false otherwise.
    """
    signOutUserFM(userID: ID!): Boolean!

    """
    Deletes the given FM User and all of their posts, erasing their digital footprint from our services excluding analytics
    True if the operation was successful, false otherwise.
    """
    deleteUserFM(userID: ID!): Boolean!

    """
    Updates the user's map name given the new map name provided, an error is thrown if the map name is already taken or if the user doesn't exist
    True if the operation was successful, false otherwise.
    """
    updateMapNameFM(input: UpdateFMUserMapNameInput!): Boolean!

    """
    Updates the user's email address with the given valid email address string, please run REGEX in the client before submitting email addresses,
    REGEX is also ran here, but doing so on the client is good practice and allows the user to makes instant edits.
    True if the operation was successful, false otherwise.
    """
    updateUserEmailFM(userID: ID!, email: String!): Boolean!
    updateUserPhoneNumberFM(userID: ID!, phoneNumber: String!): Boolean!
    """
    True if the password update succeeded in the external auth system, false otherwise (hashes are the same)
    """
    updateUserPasswordFM(userID: ID!, password: String!): Boolean!

    """
    Uploads a universal Foncii profile picture to use across the different platform based on a single permalink,
    or deletes the user's existing profile picture. A verbose error is thrown if the update fails for some reason,
    so if the response is defined / true that means the update was successful.
    """
    setUserProfilePicture(input: SetUserProfilePictureInput!): Boolean!

    # Taste Profile #
    # Create
    createTasteProfile(tasteProfileInput: TasteProfileInput!): TasteProfile!
    autoGenerateTasteProfile(
      userID: ID!
      selectedRestaurantIDs: [ID!]!
    ): TasteProfile!
    generateDefaultTasteProfile(userID: ID!): TasteProfile!

    # Update
    updateTasteProfile(id: ID!, tasteProfileInput: TasteProfileInput!): Boolean!

    # Delete
    deleteTasteProfile(id: ID!): Boolean!
    deleteAllTasteProfilesForUser(userID: ID!): Boolean!

    # User taste profile swapping and removal
    switchPrimaryUserTasteProfile(userID: ID!, tasteProfileID: ID!): Boolean!
    removePrimaryUserTasteProfile(userID: ID!): Boolean!

    # Instagram Ingestion
    ingestDiscoveredInstagramUser(input: DiscoveredInstagramUserInput!): FMUser
  }

  ## Inputs ##
  input DiscoveredInstagramUserInput {
    username: String!
    fullName: String!
    phoneNumber: String
    email: String
    profilePictureURL: String
  }

  input SetUserProfilePictureInput {
    """
    UInt8Array String, Required input is PNG or JPG/JPEG format, max size is 4MB
    """
    fileUploadRequest: FileUploadRequestInput!
    platform: SupportedFonciiPlatforms!
  }

  input integrationCredentialForUserInput {
    userID: ID!
    integrationProvider: FMIntegrationProviders!
  }

  input ConnectIntegrationInput {
    """
    ID of the user sending the connection request
    """
    userID: ID!
    provider: FMIntegrationProviders!
    """
    Code provided by the client to connect to the given integration provider
    """
    authToken: String!
    """
    Required for Instagram integration
    """
    redirectURI: String!
  }

  input CreateNewFMUserInput {
    userID: ID!
    authProvider: AuthProviders!
    externalReferralCode: String
    firstName: String!
    lastName: String!
    username: String!
    phoneNumber: String
    email: String!
    """
    Optional photo URL of the user's profile picture tied to an OAuth provider if the user
    signs in with any of those methods.
    """
    oAuthProfilePictureURL: String
  }

  input UpdateFMUserMapNameInput {
    userID: ID!
    newMapName: String!
  }
`;

export default typeDef;
