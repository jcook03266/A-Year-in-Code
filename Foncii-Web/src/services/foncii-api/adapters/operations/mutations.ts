// Dependencies
// GraphQL Types
import { gql } from "@apollo/client";

// Fragments
import { OperationFragments } from "./fragments";

// All supported mutation operations used by this client
export const Mutations = {
  CREATE_USER_SESSION_MUTATION: gql`
    ${OperationFragments.CORE_USER_SESSION_FIELDS}
    mutation CreateUserSession($input: CreateUserSessionInput) {
      createUserSession(input: $input) {
        ...CoreUserSessionFields
      }
    }
  `,

  SEND_USER_SESSION_HEART_BEAT_MUTATION: gql`
    ${OperationFragments.CORE_USER_SESSION_FIELDS}
    mutation SendUserSessionHeartBeat($input: UserSessionHeartBeatInput) {
      sendUserSessionHeartBeat(input: $input) {
        ...CoreUserSessionFields
      }
    }
  `,

  END_USER_SESSION_MUTATION: gql`
    ${OperationFragments.CORE_POST_FIELDS}
    mutation EndUserSession($sessionID: ID!) {
      endUserSession(sessionID: $sessionID)
    }
  `,

  IMPORT_POSTS_MUTATION: gql`
    mutation ImportPosts($input: ImportPostsInput!) {
      importPosts(input: $input)
    }
  `,

  DUPLICATE_POST_MUTATION: gql`
    ${OperationFragments.CORE_POST_FIELDS}
    mutation DuplicatePost($sourcePostId: ID!) {
      duplicatePost(sourcePostID: $sourcePostId) {
        ...CorePostFields
      }
    }
  `,

  UPDATE_POST_RESTAURANT_DATA_MUTATION: gql`
    ${OperationFragments.PERSONALIZED_CORE_POST_FIELDS}
    mutation UpdatePostRestaurantData(
      $input: UpdateFMUserPostRestaurantDataInput!
      $userPersonalizationInput: UserPersonalizationInput
      $postsToExclude: [ID!]
    ) {
      updatePostRestaurantData(input: $input) {
        ...PersonalizedCorePostFields
      }
    }
  `,

  UPDATE_POST_CUSTOM_USER_PROPERTIES_MUTATION: gql`
    ${OperationFragments.PERSONALIZED_CORE_POST_FIELDS}
    mutation UpdatePostCustomUserProperties(
      $input: UpdateFMUserPostCustomUserPropertiesInput!
      $userPersonalizationInput: UserPersonalizationInput
      $postsToExclude: [ID!]
    ) {
      updatePostCustomUserProperties(input: $input) {
        ...PersonalizedCorePostFields
      }
    }
  `,

  UPDATE_POST_FAVORITE_STATE_MUTATION: gql`
    mutation updatePostFavoriteState(
      $input: UpdateFMUserPostFavoriteStateInput!
    ) {
      updatePostFavoriteState(input: $input)
    }
  `,

  LOG_IN_USER_FM_MUTATION: gql`
    ${OperationFragments.MAIN_USER_FIELDS}
    mutation LoginUserFM($input: UserLoginInput!) {
      loginUserFM(input: $input) {
        ...MainUserFields
      }
    }
  `,

  FETCH_IMPERSONATED_USER_FM_MUTATION: gql`
    ${OperationFragments.MAIN_USER_FIELDS}
    mutation fetchImpersonatedUserFM($input: ImpersonateUserInput!) {
      fetchImpersonatedUserFM(input: $input) {
        ...MainUserFields
      }
    }
  `,

  SIGN_OUT_USER_FM_MUTATION: gql`
    mutation SignOutUserFM($userId: ID!) {
      signOutUserFM(userID: $userId)
    }
  `,

  UPDATE_MAP_NAME_FM_MUTATION: gql`
    mutation UpdateMapNameFM($input: UpdateFMUserMapNameInput!) {
      updateMapNameFM(input: $input)
    }
  `,

  CREATE_USER_FM_MUTATION: gql`
    ${OperationFragments.MAIN_USER_FIELDS}
    mutation CreateUserFM($input: CreateNewFMUserInput!) {
      createUserFM(input: $input) {
        ...MainUserFields
      }
    }
  `,

  CONNECT_INTEGRATION_MUTATION: gql`
    ${OperationFragments.CORE_INTEGRATION_CREDENTIAL_FIELDS}
    mutation ConnectIntegration($input: ConnectIntegrationInput!) {
      connectIntegration(input: $input) {
        ...CoreIntegrationCredentialFields
      }
    }
  `,

  REFRESH_INTEGRATION_MUTATION: gql`
    ${OperationFragments.CORE_INTEGRATION_CREDENTIAL_FIELDS}
    mutation RefreshIntegration($input: integrationCredentialForUserInput!) {
      refreshIntegration(input: $input) {
        ...CoreIntegrationCredentialFields
      }
    }
  `,

  REVOKE_INTEGRATION_CREDENTIAL_MUTATION: gql`
    mutation RevokeIntegrationCredential(
      $userID: ID!
      $provider: FMIntegrationProviders!
    ) {
      revokeIntegrationCredential(userID: $userID, provider: $provider)
    }
  `,

  REVOKE_ALL_INTEGRATION_CREDENTIALS_MUTATION: gql`
    mutation RevokeAllIntegrationCredentials($userID: ID!) {
      revokeAllIntegrationCredentials(userID: $userID)
    }
  `,

  SET_AUTO_REFRESH_STATE_FOR_MUTATION: gql`
    mutation SetAutoRefreshStateForCredential(
      $integrationCredentialID: ID!
      $autoRefreshEnabled: Boolean!
    ) {
      setAutoRefreshStateForCredential(
        integrationCredentialID: $integrationCredentialID
        autoRefreshEnabled: $autoRefreshEnabled
      )
    }
  `,

  SET_USER_PROFILE_PICTURE_MUTATION: gql`
    mutation SetUserProfilePicture($input: SetUserProfilePictureInput!) {
      setUserProfilePicture(input: $input)
    }
  `,

  UPDATE_USER_EMAIL_FM_MUTATION: gql`
    mutation UpdateUserEmailFM($userId: ID!, $email: String!) {
      updateUserEmailFM(userID: $userId, email: $email)
    }
  `,

  AGGREGATE_RESTAURANT_MUTATION: gql`
    ${OperationFragments.CORE_RESTAURANT_FIELDS}
    mutation AggregateRestaurant($input: AggregateRestaurantInput) {
      aggregateRestaurant(input: $input) {
        ... on Restaurant {
          ...CoreRestaurantFields
        }
      }
    }
  `,

  CREATE_TASTE_PROFILE_MUTATION: gql`
    ${OperationFragments.CORE_TASTE_PROFILE_FIELDS}
    mutation CreateTasteProfile($tasteProfileInput: TasteProfileInput!) {
      createTasteProfile(tasteProfileInput: $tasteProfileInput) {
        ...CoreTasteProfileFields
      }
    }
  `,

  UPDATE_TASTE_PROFILE_MUTATION: gql`
    mutation UpdateTasteProfile(
      $tasteProfileID: ID!
      $tasteProfileInput: TasteProfileInput!
    ) {
      updateTasteProfile(
        id: $tasteProfileID
        tasteProfileInput: $tasteProfileInput
      )
    }
  `,

  AUTO_GENERATE_TASTE_PROFILE_MUTATION: gql`
    ${OperationFragments.CORE_TASTE_PROFILE_FIELDS}
    mutation AutoGenerateTasteProfile(
      $userID: ID!
      $selectedRestaurantIDs: [ID!]!
    ) {
      autoGenerateTasteProfile(
        userID: $userID
        selectedRestaurantIDs: $selectedRestaurantIDs
      ) {
        ...CoreTasteProfileFields
      }
    }
  `,

  UPDATE_POST_MEDIA_MUTATION: gql`
    ${OperationFragments.PERSONALIZED_CORE_POST_FIELDS}
    mutation UpdatePostMedia(
      $input: UpdateFMUserPostMediaInput!
      $userPersonalizationInput: UserPersonalizationInput
      $postsToExclude: [ID!]
    ) {
      updatePostMedia(input: $input) {
        ...PersonalizedCorePostFields
      }
    }
  `,

  CREATE_USER_POST_MUTATION: gql`
    ${OperationFragments.CORE_POST_FIELDS}
    mutation CreateUserPost($input: CreateFMUserPostInput!) {
      createUserPost(input: $input) {
        ...CorePostFields
      }
    }
  `,

  DELETE_POST_MUTATION: gql`
    mutation DeletePost($input: UpdateFMUserPostUserInput!) {
      deletePost(input: $input)
    }
  `,

  UNDELETE_POST_MUTATION: gql`
    mutation UndeletePost($input: UpdateFMUserPostUserInput!) {
      undeletePost(input: $input)
    }
  `,

  FORCE_DELETE_POST_MUTATION: gql`
    mutation ForceDeletePost($input: UpdateFMUserPostUserInput!) {
      forceDeletePost(input: $input)
    }
  `,

  SAVE_RESTAURANT_MUTATION: gql`
    mutation SaveRestaurant($input: RestaurantSaveInput) {
      saveRestaurant(input: $input)
    }
  `,

  UNSAVE_RESTAURANT_MUTATION: gql`
    mutation UnsaveRestaurant($input: RestaurantSaveInput) {
      unsaveRestaurant(input: $input)
    }
  `,

  TRACK_FONCII_EVENT: gql`
    mutation TrackFonciiEvent($input: FonciiAnalyticsEventInput!) {
      trackFonciiEvent(input: $input)
    }
  `,
};
