// Dependencies
// GraphQL Types
import { gql } from "@apollo/client";

// Fragments
import { OperationFragments } from "./fragments";

// All supported query operations used by this client
export const Queries = {
  GET_USER_GALLERY_HTML_METADATA_QUERY: gql`
    query GetUserGalleryHTMLMetadata($username: String!) {
      getUserGalleryHTMLMetadata(username: $username) {
        title
        description
        keywords
        previewImageURL
      }
    }
  `,

  FIND_USER_BY_ID_FM_QUERY: gql`
    ${OperationFragments.MAIN_USER_FIELDS}
    query FindUserByIDFM($userID: ID!) {
      findUserByIDFM(userID: $userID) {
        ... on FMUser {
          ...MainUserFields
        }
      }
    }
  `,

  FIND_USER_BY_USERNAME_FM_QUERY: gql`
    ${OperationFragments.VISITED_USER_FIELDS}
    query FindUserByUsernameFM($username: String!, $userToCompare: ID) {
      findUserByUsernameFM(username: $username) {
        ... on FMUser {
          ...VisitedUserFields
          tasteProfileSimilarityScore(userToCompare: $userToCompare)
        }
      }
    }
  `,

  FIND_PUBLIC_POSTS_BY_USERNAME_QUERY: gql`
    ${OperationFragments.CORE_POST_FIELDS}
    query FindPublicPostsByUsername(
      $username: String!
      $fonciiPostFilterInput: FonciiPostFilterInput
      $userPersonalizationInput: UserPersonalizationInput
      $fonciiRestaurantSearchFilterInput: FonciiRestaurantSearchFilterInput
      $paginationInput: PaginationInput!
    ) {
      findPublicPostsByUsername(
        username: $username
        fonciiPostFilterInput: $fonciiPostFilterInput
        userPersonalizationInput: $userPersonalizationInput
        fonciiRestaurantSearchFilterInput: $fonciiRestaurantSearchFilterInput
        paginationInput: $paginationInput
      ) {
        posts {
          ...CorePostFields
        }
        totalPosts
      }
    }
  `,

  FIND_ALL_POSTS_BY_USER_ID_QUERY: gql`
    ${OperationFragments.CORE_POST_FIELDS}
    query FindAllPostsByUserID(
      $userID: String!
      $fonciiRestaurantSearchFilterInput: FonciiRestaurantSearchFilterInput
      $userPersonalizationInput: UserPersonalizationInput
      $paginationInput: PaginationInput!
    ) {
      findAllPostsByUserID(
        userID: $userID
        fonciiRestaurantSearchFilterInput: $fonciiRestaurantSearchFilterInput
        userPersonalizationInput: $userPersonalizationInput
        paginationInput: $paginationInput
      ) {
        posts {
          ...CorePostFields
        }
        totalPosts
      }
    }
  `,

  FIND_POST_BY_ID_QUERY: gql`
    ${OperationFragments.CORE_CUSTOM_POST_PROPERTY_FIELDS}
    ${OperationFragments.POST_CREATOR_FIELDS}
    ${OperationFragments.CORE_RESTAURANT_FIELDS}
    ${OperationFragments.FONCII_RESTAURANT_DETAIL_FIELDS}
    ${OperationFragments.CORE_MEDIA_FIELDS}
    ${OperationFragments.CORE_POST_DATA_SOURCE_FIELDS}
    query FindPostByID(
      $postID: String!
      $userPersonalizationInput: UserPersonalizationInput
      $postsToExclude: [ID!]
    ) {
      findPostByID(postID: $postID) {
        id
        creationDate
        lastUpdated
        dataSource {
          ...CorePostDataSourceFields
        }
        customUserProperties {
          ...CoreCustomPostPropertyFields
        }
        isFavorited
        isHidden
        media {
          ...CoreMediaFields
        }
        secondaryMedia {
          ...CoreMediaFields
        }
        parentPostID
        isChildPost
        mediaIsVideo
        fonciiRestaurant {
          ...FonciiRestaurantDetailFields
        }
        restaurant {
          ...CoreRestaurantFields
        }
        creator {
          ...PostCreatorFields
        }
      }
    }
  `,

  FIND_RESERVATION_AVAILABILITIES_FOR_QUERY: gql`
    ${OperationFragments.RESERVATION_AVAILABILITY_FIELDS}
    query FindReservationAvailabilitiesFor(
      $fonciiRestaurantID: ID!
      $reservationSearchInput: ReservationSearchInput!
    ) {
      findReservationAvailabilitiesFor(
        fonciiRestaurantID: $fonciiRestaurantID
        reservationSearchInput: $reservationSearchInput
      ) {
        ...ReservationAvailabilityFields
      }
    }
  `,
  FIND_AVAILABLE_RESERVATION_DAYS_FOR_QUERY: gql`
    ${OperationFragments.AVAILABLE_RESERVATION_DAYS_FIELDS}
    query FindAvailableReservationDaysFor(
      $fonciiRestaurantID: ID!
      $availableReservationDaysInput: AvailableReservationDaysInput!
    ) {
      findAvailableReservationDaysFor(
        fonciiRestaurantID: $fonciiRestaurantID
        availableReservationDaysInput: $availableReservationDaysInput
      ) {
        ...AvailableReservationDaysFields
      }
    }
  `,

  GET_FONCII_RESTAURANT_BY_ID_QUERY: gql`
    ${OperationFragments.FONCII_RESTAURANT_DETAIL_FIELDS}
    query GetFonciiRestaurantByID(
      $id: ID!
      $userPersonalizationInput: UserPersonalizationInput
      $postsToExclude: [ID!]
    ) {
      getFonciiRestaurantByID(
        id: $id
        userPersonalizationInput: $userPersonalizationInput
      ) {
        ...FonciiRestaurantDetailFields
      }
    }
  `,

  FONCII_RESTAURANT_SEARCH: gql`
    ${OperationFragments.FONCII_RESTAURANT_SEARCH_FIELDS}
    query FonciiRestaurantSearch($input: FonciiRestaurantSearchInput!) {
      fonciiRestaurantSearch(input: $input) {
        fonciiRestaurants {
        ...FonciiRestaurantSearchFields
        }
        queryID
      }
    }
  `,

  ONBOARDING_FONCII_RESTAURANT_SEARCH: gql`
    query FonciiRestaurantSearch($input: FonciiRestaurantSearchInput!) {
      fonciiRestaurantSearch(input: $input) {
        fonciiRestaurants {
        restaurant {
          id
          googleID
          name
          heroImageURL
          categories
          priceLevel
        }
        }
      }
    }
  `,

  GET_USER_INTEGRATION_CREDENTIALS_QUERY: gql`
    ${OperationFragments.CORE_INTEGRATION_CREDENTIAL_FIELDS}
    query GetUserIntegrationCredentials($userID: ID!) {
      getUserIntegrationCredentials(userID: $userID) {
        ...CoreIntegrationCredentialFields
      }
    }
  `,

  GET_NON_USER_INTEGRATION_CREDENTIALS_QUERY: gql`
    query GetUserIntegrationCredentials($userID: ID!) {
      getUserIntegrationCredentials(userID: $userID) {
        provider
        appUsername
        expired
      }
    }
  `,

  GET_USER_EMAIL_FROM_USERNAME_FM_QUERY: gql`
    query GetUserEmailFromUsernameFM($username: String!) {
      getUserEmailFromUsernameFM(username: $username)
    }
  `,

  DOES_EMAIL_EXIST_FM_QUERY: gql`
    query DoesEmailExistFM($email: String!) {
      doesEmailExistFM(email: $email)
    }
  `,

  DOES_USERNAME_EXIST_FM_QUERY: gql`
    query DoesUsernameExistFM($username: String!) {
      doesUsernameExistFM(username: $username)
    }
  `,

  FIND_ASSOCIATED_ARTICLES_FOR_QUERY: gql`
    ${OperationFragments.DETAILED_ASSOCIATED_ARTICLE_PUBLICATION_FIELDS}
    query FindAssociatedArticlesFor($restaurantID: String!) {
      findAssociatedArticlesFor(restaurantID: $restaurantID) {
        associatedArticlePublicationEdges {
          ...DetailedAssociatedArticlePublicationFields
        }
      }
    }
  `,

  GALLERY_SEARCH_AUTO_COMPLETE_SUGGESTIONS_QUERY: gql`
    query GallerySearchAutoCompleteSuggestions(
      $input: GallerySearchAutoCompleteSuggestionsInput!
    ) {
      gallerySearchAutoCompleteSuggestions(input: $input) {
        postID
        title
        description
        previewImageURL
      }
    }
  `,

  RESTAURANT_AUTO_COMPLETE_SUGGESTIONS_QUERY: gql`
    query RestaurantAutoCompleteSuggestions(
      $input: RestaurantAutoCompleteSuggestionsInput!
    ) {
      restaurantAutoCompleteSuggestions(input: $input) {
        fonciiRestaurantID
        googlePlaceID
        source
        title
        description
        previewImageURL
      }
    }
  `,

  EXPLORE_SEARCH_AUTO_COMPLETE_SUGGESTIONS_QUERY: gql`
    query ExploreSearchAutoCompleteSuggestions(
      $input: ExploreSearchAutoCompleteSuggestionsInput!
    ) {
      exploreSearchAutoCompleteSuggestions(input: $input) {
        ... on RestaurantAutoCompleteSuggestion {
          fonciiRestaurantID
          googlePlaceID
          source
          title
          description
          previewImageURL
        }
        ... on UserPostAutoCompleteSuggestion {
          postID
          title
          description
          previewImageURL
        }
        ... on UserAutoCompleteSuggestion {
          userID
          title
          description
          previewImageURL
        }
        ... on PopularSearchQuerySuggestion {
          title
          description
          previewImageURL
        }
      }
    }
  `,

  FETCH_ALL_CUISINES: gql`
    query FetchAllCuisines {
      fetchAllCuisines {
        id
        localizedNames {
          en
        }
        imageURL
      }
    }
  `,

  FETCH_ALL_DIETARY_RESTRICTIONS: gql`
    query FetchAllDietaryRestrictions {
      fetchAllDietaryRestrictions {
        id
        localizedNames {
          en
        }
        imageURL
      }
    }
  `,

  FIND_RESTAURANTS_SIMILAR_TO: gql`
    ${OperationFragments.SIMILAR_FONCII_RESTAURANT_FIELDS}
    query FindRestaurantsSimilarTo(
      $restaurantID: ID!
      $userPersonalizationInput: UserPersonalizationInput
    ) {
      findRestaurantsSimilarTo(restaurantID: $restaurantID) {
        ...SimilarFonciiRestaurantFields
      }
    }
  `,

  FIND_ASSOCIATED_POSTS_FOR: gql`
    ${OperationFragments.ASSOCIATED_POST_FIELDS}
    query FindAssociatedPostsFor(
      $fonciiRestaurantID: ID!
      $creatorID: ID
      $postsToExclude: [ID!]
      $userPersonalizationInput: UserPersonalizationInput
    ) {
      findAssociatedPostsFor(
        fonciiRestaurantID: $fonciiRestaurantID
        creatorID: $creatorID
        postsToExclude: $postsToExclude
      ) {
        ...AssociatedPostFields
      }
    }
  `,

  FETCH_LOCAL_INFLUENCER_LEADERBOARD_QUERY: gql`
    ${OperationFragments.VISITED_USER_FIELDS}
    query FetchLocalInfluencerLeaderboard(
      $input: LocalInfluencerLeaderboardInput
      $userToCompare: ID
    ) {
      fetchLocalInfluencerLeaderboard(input: $input) {
        category
        totalLocalRestaurantsVisited
        user {
          ...VisitedUserFields
          tasteProfileSimilarityScore(userToCompare: $userToCompare)
        }
      }
    }
  `,

  FETCH_POPULAR_USER_TAGS_QUERY: gql`
    query FetchPopularUserTags {
      fetchPopularUserTags
    }
  `,

  USER_TAG_AUTO_COMPLETE_SUGGESTIONS_QUERY: gql`
    query UserTagAutoCompleteSuggestions($searchQuery: String!) {
      userTagAutoCompleteSuggestions(searchQuery: $searchQuery)
    }
  `,

  GET_SAVED_RESTAURANTS_QUERY: gql`
    ${OperationFragments.FONCII_RESTAURANT_SEARCH_FIELDS}
    query GetSavedRestaurantsFor($input: GetSavedRestaurantsForInput!) {
      getSavedRestaurantsFor(input: $input) {
        ...FonciiRestaurantSearchFields
      }
    }
  `,

  IS_ACCOUNT_CLAIMED: gql`
    query IsAccountClaimed($input: isAccountClaimedInput!) {
      isAccountClaimed(input: $input)
    }
  `,

  GET_ALL_PUBLIC_POSTS: gql`
  query GetAllPublicPosts($limit: Int!, $pageIndex: Int) {
  getAllPublicPosts(limit: $limit, pageIndex: $pageIndex) {
    id
  }
}
`,

  GET_ALL_RESTAURANTS: gql`
  query GetAllRestaurants($limit: Int!, $pageIndex: Int) {
  getAllRestaurants(limit: $limit, pageIndex: $pageIndex) {
    id
  }
}
  `,

  GET_ALL_USERS: gql`
  query GetAllUsers($limit: Int!, $pageIndex: Int) {
  getAllUsers(limit: $limit, pageIndex: $pageIndex) {
    id
    username
  }
}
`,

  FETCH_USER_MAP_ANALYTICS_DASHBOARD: gql`
query FetchUserMapAnalyticsDashboard($input: UserAnalyticsDashboardInput!) {
  fetchUserMapAnalyticsDashboard(input: $input) {
    totalTags
    totalMapViews
    totalLocations
    totalExperienceViews
    topTagsDistribution {
      category
      count
    }
    topLocationsDistribution {
      category
      count
    }
    relativeMapViewChange
    mostViewedExperienceDistribution {
      category
      count
    }
    mapViewsTimeSeries {
      timestamps
      data
      category
    }
  }
}
`,

  FETCH_USER_BUSINESS_WEBSITE_ANALYTICS_DASHBOARD: gql`
query FetchUserBusinessWebsiteAnalyticsDashboard($input: UserAnalyticsDashboardInput!) {
  fetchUserBusinessWebsiteAnalyticsDashboard(input: $input) {
    totalBusinessWebsiteClicks
    relativeBusinessWebsiteClicksChange
    businessWebsiteClicksTimeSeries {
      category
      data
      timestamps
    }
    mostClickedBusinessWebsitesDistribution {
      category
      count
    }
  }
}
`,

  FETCH_USER_RESERVATIONS_INTENTS_ANALYTICS_DASHBOARD: gql`
query FetchUserReservationsIntentsAnalyticsDashboard($input: UserAnalyticsDashboardInput!) {
  fetchUserReservationsIntentsAnalyticsDashboard(input: $input) {
    totalReservationIntents
    relativeReservationIntentsChange
    reservationIntentsTimeSeries {
      category
      data
      timestamps
    }
    topReservedRestaurantsDistribution {
      category
      count
    }
  }
}
`
};