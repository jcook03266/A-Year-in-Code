// Dependencies
// GraphQL Document Node
import gql from "graphql-tag";

const typeDef = gql`
  ### Queries / Mutations / Inputs ###

  ## Queries ##
  type Query {
    ## Post Queries ##
    """
    Fetches public posts made by the user with the specified username (if any) | For populating visited post galleries
    """
    findPublicPostsByUsername(
      username: String!
      fonciiPostFilterInput: FonciiPostFilterInput
      fonciiRestaurantSearchFilterInput: FonciiRestaurantSearchFilterInput
      userPersonalizationInput: UserPersonalizationInput
      paginationInput: PaginationInput!
    ): UserPostGalleryOutput!

    """
    Fetches all posts (visible and hidden) made by the user with the specified user ID | For populating author galleries
    """
    findAllPostsByUserID(
      userID: String!
      fonciiRestaurantSearchFilterInput: FonciiRestaurantSearchFilterInput
      userPersonalizationInput: UserPersonalizationInput
      paginationInput: PaginationInput!
    ): UserPostGalleryOutput!

    """
    Queries a single post using the provided post ID, used for detail views to fetch isolated data when sharing links
    """
    findPostByID(postID: String!): FMUserPost

    """
    Returns a list of all posts marked for deletion
    """
    getAllPostsMarkedForDeletion: [FMUserPost!]!

    ## Full-text + Geospatial Search ##
    """
    Advanced search using full-text and geospatial search to find public posts within the given search area that also match
    the text search query and any additional properties to filter the results by. Returns denormalized posts with
    creator and restaurant data attached from the appropriate database aggregation pipelines. Note: Posts returned by
    this query are implicitly public because they have restaurant data which is used by the geospatial search pipeline.

    Note: This was previously used for the explore page, but is no longer in use, so it doesn't support percent match etc.
    """
    searchForPosts(
      input: FullTextGeospatialPostSearchInput!
      fonciiRestaurantSearchFilterInput: FonciiRestaurantSearchFilterInput
      userPersonalizationInput: UserPersonalizationInput
    ): [FMUserPost!]!

    ## Dynamic HTML Metadata ##
    """
    Provisions all the necessary components for creating an HTML preview for a user's gallery including
    description, title, keywords, and an applicable thumbnail image. A clean, fast and optimized way of generating better SEO#
    through SSR (server-side rendering)
    """
    getUserGalleryHTMLMetadata(username: String!): HTMLMetadataResponse

    """
    Simplifies adding custom tags to user posts by suggesting tags that match
    what they're typing in real time, like when you're typing a hashtag on IG or other social medias
    """
    userTagAutoCompleteSuggestions(searchQuery: String!): [String!]!

    """
    Returns the most commonly used tags amongst users
    """
    fetchPopularUserTags: [String!]!

    """
    Returns the computed influencer map leaderboard for the given area of interest
    """
    fetchLocalInfluencerLeaderboard(
      input: LocalInfluencerLeaderboardInput
    ): [LocalInfluencerLeaderboardEntry!]!

    """
    Returns a list of all users up to the specified limit.
    Provide pageIndex to skip a specific amount of pages when
    paginating. So +1 to go to the next page of results and so on.
    +1 with a limit of 10,000 would return the next 10,000. 20,000 in total
    but the first 10,000 was skipped due to the +1 page index
    """
    getAllPublicPosts(limit: Int!, pageIndex: Int): [FMUserPost!]!
  }

  ## Mutations ##
  type Mutation {
    """
    Marks the target user post for async deletion from the database alongside its corresponding media from the cloud storage bucket. Any child posts
    will still be attached to the parent post in a many-to-one relationship, even if the parent post is deleted.
    """
    deletePost(input: UpdateFMUserPostUserInput!): Boolean!

    """
    Forcibly deletes the post and skips over the allotted 30 day grace period for the user to choose to
    undo deletion of their post. Note: This is only for posts marked for deletion by the user that haven't already been deleted yet.
    """
    forceDeletePost(input: UpdateFMUserPostUserInput!): Boolean!

    """
    Unmarks the post for deletion. Note: This is only for posts marked for deletion by the user that haven't already been deleted yet.
    """
    undeletePost(input: UpdateFMUserPostUserInput!): Boolean!

    """
    Copy and create a new post from another post's attributes. The parent post is referenced by the child via ID
    and any children of the child automatically become children of the parent post in a many-to-one relationship.
    """
    duplicatePost(sourcePostID: ID!): FMUserPost

    """
    Imports the user's posts using the target Foncii Maps integration.
    Returns true if the import process succeeded, and false if it doesn't / throws

    input:
    integrationCredentialID: ID! // ID of the integration credential to use for importing posts
    straddleImport?: boolean, // True if all supported import methods should be used (ex.) Basic Display + Scraper), true by default
    classifyPosts?: boolean, // True if posts should be automatically classified, false otherwise, true by default
    isFirstImport?: boolean, // // True if the user just created their account and are importing posts for the first time, false by default
    """
    importPosts(input: ImportPostsInput!): Boolean!

    """
    Marks the post as favorited or not favorited
    True if the operation was successful, false otherwise.
    """
    updatePostFavoriteState(input: UpdateFMUserPostFavoriteStateInput!): Boolean

    """
    Updates the post's restaurant data by adding corresponding Google and Yelp data by using Google Autocomplete as a data anchor
    """
    updatePostRestaurantData(
      input: UpdateFMUserPostRestaurantDataInput!
    ): FMUserPost

    """
    Updates the post's custom user properties all at once to keep parity between the individual properties
    """
    updatePostCustomUserProperties(
      input: UpdateFMUserPostCustomUserPropertiesInput!
    ): FMUserPost

    """
    Updates the post's media information with the provided media URL and type. Note: This is only for
    media uploaded through the client to the Foncii CDN. Do not pass in a URL that points to an object
    that's not of the supported type and or is not hosted in the Foncii CDN storage bucket.
    """
    updatePostMedia(input: UpdateFMUserPostMediaInput!): FMUserPost

    """
    Creates a new Foncii Maps user post for the user with provided ID. After being created the
    user can simply update their post with the information they wish including a custom image or video
    to be displayed. The post will be hidden until they upload the appropriate media to accompany the post.
    """
    createUserPost(input: CreateFMUserPostInput!): FMUserPost

    """
    Processes aggregated posts from Instagram that are also classified with Google Place IDs and
    ingests them into the Foncii ecosystem if they don't already exist within. For those that already
    exist they're simply updated with the new data (if any). And any pending or new media that should be
    uploaded are also handled. Note: This is used for the automatic post import functionality such that users
    essentially won't have to touch their map at all (ideally).
    """
    ingestClassifiedDiscoveredInstagramPosts(
      input: ClassifiedDiscoveredInstagramPostsInput
    ): [FMUserPost!]!

    """
    Processes aggregated posts from Instagram and ingests them into the Foncii ecosystem if they don't
    already exist within. For those that already exist they're simply updated with the new data (if any).
    And any pending or new media that should be uploaded are also handled.
    """
    ingestDiscoveredInstagramPosts(
      input: DiscoveredInstagramPostsInput
    ): [FMUserPost!]!
  }

  ## Responses ##
  type HTMLMetadataResponse {
    title: String!
    description: String!
    keywords: [String!]!

    """
    Optional because the user can have 0 posts sometimes
    """
    previewImageURL: String
  }

  ## Inputs ##
  input ImportPostsInput {
    integrationCredentialID: String!
    straddleImport: Boolean
    classifyPosts: Boolean
    isFirstImport: Boolean
  }

  # ingestClassifiedDiscoveredInstagramPosts
  input ClassifiedDiscoveredInstagramPostsInput {
    username: String!
    posts: [ClassifiedDiscoveredInstagramPostInput!]!
  }

  input ClassifiedDiscoveredInstagramPostInput {
    dataSource: InstagramPostDataSourceInput!
    googlePlaceIDs: [String!]!
    gpidToInstagramHandleMappings: [gpidToInstagramHandleMappingInput!]!
  }

  input gpidToInstagramHandleMappingInput {
    googlePlaceID: String!
    instagramHandle: String!
  }

  # ingestDiscoveredInstagramPosts
  input DiscoveredInstagramPostsInput {
    username: String!
    posts: [DiscoveredInstagramPostInput!]!
  }

  input DiscoveredInstagramPostInput {
    dataSource: InstagramPostDataSourceInput!
  }

  # ingestClassifiedDiscoveredInstagramPosts + ingestDiscoveredInstagramPosts
  input InstagramPostDataSourceInput {
    liveSourceUID: String!
    sourceUID: String!
    caption: String
    permalink: String!
    creationDate: String!
    media: UserPostMediaInput!
    secondaryMedia: [UserPostMediaInput!]
  }

  input LocalInfluencerLeaderboardInput {
    coordinates: CoordinatePointInput!
    searchRadius: Float!
  }

  input FullTextGeospatialPostSearchInput {
    searchQuery: String! = ""
    coordinates: CoordinatePointInput!
    searchRadius: Float!
  }

  input UpdateFMUserPostFavoriteStateInput {
    userInput: UpdateFMUserPostUserInput!
    isFavorited: Boolean!
  }

  input UpdateFMUserPostRestaurantDataInput {
    userInput: UpdateFMUserPostUserInput!
    """
    Note: The absence of the place ID indicates the restaurant associated with the post at hand
    should be removed from the post's data and deassociated with it. If the place ID is defined then
    the restaurant is then associated with the post by ID in a one-to-many (restaurant-to-post) relationship.
    """
    googlePlaceID: ID
  }

  input UpdateFMUserPostCustomUserPropertiesInput {
    userInput: UpdateFMUserPostUserInput!
    notes: String
    rating: Float
    categories: [String!]
  }

  input UpdateFMUserPostMediaInput {
    userInput: UpdateFMUserPostUserInput!
    mediaInput: UserPostMediaInput!
  }

  input CreateFMUserPostInput {
    userID: ID!
  }

  """
  Reusable input for updating a post's data, posts are owned by users so a user ID has to be passed to verify if the user has the
  rights to edit the post.
  """
  input UpdateFMUserPostUserInput {
    postID: ID!
    userID: ID!
  }
`;

export default typeDef;
