export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends {
    [key: string]: unknown;
}> = {
    [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
    [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
    [SubKey in K]: Maybe<T[SubKey]>;
};
export type MakeEmpty<T extends {
    [key: string]: unknown;
}, K extends keyof T> = {
    [_ in K]?: never;
};
export type Incremental<T> = T | {
    [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never;
};
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
    ID: {
        input: string;
        output: string;
    };
    String: {
        input: string;
        output: string;
    };
    Boolean: {
        input: boolean;
        output: boolean;
    };
    Int: {
        input: number;
        output: number;
    };
    Float: {
        input: number;
        output: number;
    };
    /** Represents a binary file upload. */
    Upload: {
        input: any;
        output: any;
    };
};
export type AddUserFirstFavoritesInput = {
    restaurantIDs: Array<Scalars['ID']['input']>;
    userID: Scalars['ID']['input'];
};
export type AddressProperties = {
    __typename?: 'AddressProperties';
    city?: Maybe<Scalars['String']['output']>;
    countryCode?: Maybe<Scalars['String']['output']>;
    formattedAddress?: Maybe<Scalars['String']['output']>;
    stateCode?: Maybe<Scalars['String']['output']>;
    streetAddress?: Maybe<Scalars['String']['output']>;
    zipCode?: Maybe<Scalars['String']['output']>;
};
export type AggregateRestaurantInput = {
    googlePlaceID: Scalars['String']['input'];
    userID?: InputMaybe<Scalars['ID']['input']>;
};
export type AggregateRestaurantsAroundInput = {
    coordinates: CoordinatePointInput;
    userID?: InputMaybe<Scalars['ID']['input']>;
};
export type ClientError = {
    __typename?: 'ClientError';
    description: Scalars['String']['output'];
    errorCode: Scalars['String']['output'];
};
export type CommunicationsInput = {
    message: Scalars['String']['input'];
    recipientUserID: Scalars['ID']['input'];
    senderUserID: Scalars['ID']['input'];
};
export type CoordinatePoint = {
    __typename?: 'CoordinatePoint';
    lat: Scalars['Float']['output'];
    lng: Scalars['Float']['output'];
};
export type CoordinatePointInput = {
    lat: Scalars['Float']['input'];
    lng: Scalars['Float']['input'];
};
export type CopyAndCreateFmPostFromResponse = {
    __typename?: 'CopyAndCreateFMPostFromResponse';
    errors?: Maybe<Array<ClientError>>;
    newChildPost: FmPost;
    statusCode: Scalars['Int']['output'];
};
export type CreateNewUserInput = {
    authProviders: Array<UserAuthProviders>;
    email: Scalars['String']['input'];
    fullName: Scalars['String']['input'];
    id?: InputMaybe<Scalars['ID']['input']>;
    phoneNumberInput?: InputMaybe<PhoneNumberInput>;
    username: Scalars['String']['input'];
};
export type CreateUserResponse = {
    __typename?: 'CreateUserResponse';
    errors?: Maybe<Array<ClientError>>;
    newUser?: Maybe<User>;
    statusCode: Scalars['Int']['output'];
};
export type Cuisine = {
    __typename?: 'Cuisine';
    id: Scalars['ID']['output'];
    imageURL: Scalars['String']['output'];
    localizedNames: SupportedLocalizations;
};
export type CursorPaginationInput = {
    limit?: InputMaybe<Scalars['Int']['input']>;
    paginationCursor?: InputMaybe<Scalars['ID']['input']>;
    sortOrder?: InputMaybe<SortOrders>;
};
export type CustomUserPostProperties = {
    __typename?: 'CustomUserPostProperties';
    categories?: Maybe<Array<Scalars['String']['output']>>;
    notes?: Maybe<Scalars['String']['output']>;
    rating?: Maybe<Scalars['Float']['output']>;
    review?: Maybe<Scalars['String']['output']>;
};
export type DeleteUserInput = {
    userID: Scalars['ID']['input'];
};
export type FmPost = {
    __typename?: 'FMPost';
    creationDate: Scalars['String']['output'];
    creator: FmUser;
    customUserProperties: CustomUserPostProperties;
    id: Scalars['ID']['output'];
    instagramPost: FmPostInstagramProperties;
    isFavorited: Scalars['Boolean']['output'];
    isHidden: Scalars['Boolean']['output'];
    lastUpdated: Scalars['String']['output'];
    mediaIsVideo: Scalars['Boolean']['output'];
    mediaURL?: Maybe<Scalars['String']['output']>;
    parentPostID?: Maybe<Scalars['String']['output']>;
    restaurant?: Maybe<Restaurant>;
    userID?: Maybe<Scalars['String']['output']>;
    videoMediaThumbnailURL?: Maybe<Scalars['String']['output']>;
};
export type FmPostInstagramProperties = {
    __typename?: 'FMPostInstagramProperties';
    caption?: Maybe<Scalars['String']['output']>;
    instagramID: Scalars['ID']['output'];
    instagramMediaType: Scalars['String']['output'];
    instagramTimestamp: Scalars['String']['output'];
    instagramURL: Scalars['String']['output'];
    instagramUsername: Scalars['String']['output'];
    permalink?: Maybe<Scalars['String']['output']>;
    videoThumbnailURL?: Maybe<Scalars['String']['output']>;
};
export type FmPostSearchFilterInput = {
    cities?: InputMaybe<Array<Scalars['String']['input']>>;
    cuisines?: InputMaybe<Array<Scalars['ID']['input']>>;
    foodRestrictions?: InputMaybe<Array<Scalars['ID']['input']>>;
    googleRatings?: InputMaybe<Array<Scalars['Int']['input']>>;
    isFavorited?: InputMaybe<Scalars['Boolean']['input']>;
    isHidden?: InputMaybe<Scalars['Boolean']['input']>;
    mealTypes?: InputMaybe<Array<Scalars['ID']['input']>>;
    priceLevels?: InputMaybe<Array<Scalars['Int']['input']>>;
    userID?: InputMaybe<Scalars['ID']['input']>;
    yelpRatings?: InputMaybe<Array<Scalars['Int']['input']>>;
};
export type FmPostSearchResult = {
    __typename?: 'FMPostSearchResult';
    posts?: Maybe<Array<FmPost>>;
    queryID: Scalars['String']['output'];
};
export type FmUser = {
    __typename?: 'FMUser';
    accessToken?: Maybe<Scalars['String']['output']>;
    creationDate: Scalars['String']['output'];
    id: Scalars['ID']['output'];
    instagramID: Scalars['String']['output'];
    instagramUsername: Scalars['String']['output'];
    lastLogin: Scalars['String']['output'];
    lastSignOutDate?: Maybe<Scalars['String']['output']>;
    lastUpdated: Scalars['String']['output'];
    mapName: Scalars['String']['output'];
    profilePictureURL?: Maybe<Scalars['String']['output']>;
};
export type FavoritedRestaurant = {
    __typename?: 'FavoritedRestaurant';
    creationDate: Scalars['String']['output'];
    favoritedRestaurant?: Maybe<PersonalizedRestaurant>;
    id: Scalars['ID']['output'];
    userID: Scalars['ID']['output'];
};
export type FavoritedRestaurantInput = {
    restaurantID: Scalars['ID']['input'];
    userID: Scalars['ID']['input'];
};
export type FavoritedRestaurantResponse = {
    __typename?: 'FavoritedRestaurantResponse';
    errors?: Maybe<Array<ClientError>>;
    statusCode: Scalars['Int']['output'];
    updatedPersonalizedRestaurant: PersonalizedRestaurant;
};
export type FetchAllFmUsersInput = {
    cursorPaginationInput?: InputMaybe<CursorPaginationInput>;
};
export type FetchAllFriendsForUserInput = {
    cursorPaginationInput?: InputMaybe<CursorPaginationInput>;
    userID: Scalars['ID']['input'];
};
export type FetchAllUsersInput = {
    cursorPaginationInput?: InputMaybe<CursorPaginationInput>;
};
export type FetchFmPostsByIgUsernameInput = {
    instagramUsername: Scalars['ID']['input'];
};
export type FetchFavoriteRestaurantsInput = {
    cursorPaginationInput?: InputMaybe<CursorPaginationInput>;
    personalized?: InputMaybe<Scalars['Boolean']['input']>;
    userID: Scalars['ID']['input'];
};
export type FileInfo = {
    __typename?: 'FileInfo';
    name: Scalars['ID']['output'];
    url: Scalars['String']['output'];
};
export type FileUploadInput = {
    base64EncodedFileData: Scalars['String']['input'];
    userID: Scalars['String']['input'];
};
export type FileUploadResponse = {
    __typename?: 'FileUploadResponse';
    errors?: Maybe<Array<ClientError>>;
    statusCode: Scalars['Int']['output'];
    uploadedFileURL: Scalars['String']['output'];
};
export type FirstFavoritedRestaurantsInput = {
    restaurantIDs?: Array<Scalars['ID']['input']>;
    userID: Scalars['ID']['input'];
};
export type FoodRestriction = {
    __typename?: 'FoodRestriction';
    id: Scalars['ID']['output'];
    imageURL: Scalars['String']['output'];
    localizedNames: SupportedLocalizations;
};
export type Friendship = {
    __typename?: 'Friendship';
    creationDate: Scalars['String']['output'];
    id: Scalars['ID']['output'];
    users: Array<Scalars['ID']['output']>;
};
export type FriendshipInput = {
    user1ID: Scalars['ID']['input'];
    user2ID: Scalars['ID']['input'];
};
export type GenericMutationResponse = {
    __typename?: 'GenericMutationResponse';
    errors?: Maybe<Array<ClientError>>;
    statusCode: Scalars['Int']['output'];
};
export type GeoLocationSearchInput = {
    latitude: Scalars['Float']['input'];
    longitude: Scalars['Float']['input'];
    maxRadius?: InputMaybe<Scalars['Int']['input']>;
};
export type GetRestaurantRecommendationsForUserInput = {
    cities?: InputMaybe<Array<Scalars['String']['input']>>;
    cursorPaginationInput?: InputMaybe<CursorPaginationInput>;
    userID: Scalars['ID']['input'];
};
export type GoogleRestaurantProperties = {
    __typename?: 'GoogleRestaurantProperties';
    rating?: Maybe<Scalars['Float']['output']>;
};
export type HtmlMetadataResponse = {
    __typename?: 'HTMLMetadataResponse';
    description: Scalars['String']['output'];
    keywords: Array<Scalars['String']['output']>;
    previewImageURL?: Maybe<Scalars['String']['output']>;
    title: Scalars['String']['output'];
};
export type ImportFmPostsInput = {
    instagramAccessToken: Scalars['String']['input'];
    userID: Scalars['ID']['input'];
};
export type ImportFmPostsResponse = {
    __typename?: 'ImportFMPostsResponse';
    errors?: Maybe<Array<ClientError>>;
    importedPosts?: Maybe<Array<FmPost>>;
    statusCode: Scalars['Int']['output'];
};
export type IndividualRestaurantAggregationResponse = {
    __typename?: 'IndividualRestaurantAggregationResponse';
    errors?: Maybe<Array<ClientError>>;
    restaurant?: Maybe<Restaurant>;
    statusCode: Scalars['Int']['output'];
};
export type LoginFmUserInput = {
    customRedirectURI?: InputMaybe<Scalars['String']['input']>;
    instagramAuthToken: Scalars['String']['input'];
};
export type LoginFmUserResponse = {
    __typename?: 'LoginFMUserResponse';
    accessToken?: Maybe<Scalars['String']['output']>;
    errors?: Maybe<Array<ClientError>>;
    statusCode: Scalars['Int']['output'];
    user?: Maybe<FmUser>;
};
export type MajorCity = {
    __typename?: 'MajorCity';
    abbreviatedState: Scalars['String']['output'];
    id: Scalars['ID']['output'];
    name: Scalars['String']['output'];
    state: Scalars['String']['output'];
};
export type MealType = {
    __typename?: 'MealType';
    id: Scalars['ID']['output'];
    localizedNames: SupportedLocalizations;
};
export type Mutation = {
    __typename?: 'Mutation';
    acceptRestaurantRecommendation: GenericMutationResponse;
    acceptRestaurantRecommendationRequest: GenericMutationResponse;
    addFavoriteRestaurant: FavoritedRestaurantResponse;
    addFirstFavoriteRestaurants: GenericMutationResponse;
    addFriendship: GenericMutationResponse;
    aggregateRestaurant: IndividualRestaurantAggregationResponse;
    aggregateRestaurantsAround: RestaurantAggregationResponse;
    copyAndCreateFMPostFrom: CopyAndCreateFmPostFromResponse;
    createUser: CreateUserResponse;
    deleteFMUser: GenericMutationResponse;
    deleteUser: GenericMutationResponse;
    importFMPosts: ImportFmPostsResponse;
    inferUserTasteProfileUsingFirstFavorites: SetTasteProfileResponse;
    loginFMUser: LoginFmUserResponse;
    loginUser: GenericMutationResponse;
    removeFavoriteRestaurant: FavoritedRestaurantResponse;
    removeFriendship: GenericMutationResponse;
    removeRestaurantRecommendation: GenericMutationResponse;
    removeRestaurantRecommendationRequest: GenericMutationResponse;
    requestPasswordResetEmail: GenericMutationResponse;
    requestRestaurantRecommendation: GenericMutationResponse;
    requestUsernameReminderEmail: GenericMutationResponse;
    sendRestaurantRecommendation: GenericMutationResponse;
    setLastActive: GenericMutationResponse;
    setUserTasteProfile: SetTasteProfileResponse;
    signOutFMUser: GenericMutationResponse;
    signOutUser: GenericMutationResponse;
    trackRestaurantPersonalizationEvent: GenericMutationResponse;
    trackUserEvent: GenericMutationResponse;
    updateFMPostCustomUserProperties: UpdateFmPostResponse;
    updateFMPostFavoriteStatus: UpdateFmPostResponse;
    updateFMPostRestaurantData: UpdateFmPostResponse;
    updateFMPostVisibilityStatus: UpdateFmPostResponse;
    updateFMUserMapName: UpdateFmUserMapNameResponse;
    updateUserNotificationPreference: UserNotificationPreferenceUpdateResponse;
    updateUserPhoneNumberVerificationStatus: GenericMutationResponse;
    updateUserProfile: GenericMutationResponse;
    updateUserProfilePictureURL: GenericMutationResponse;
    updateUserProfileTasks: GenericMutationResponse;
    uploadProfilePicture: FileUploadResponse;
};
export type MutationAcceptRestaurantRecommendationArgs = {
    recommendationID: Scalars['ID']['input'];
    userID: Scalars['ID']['input'];
};
export type MutationAcceptRestaurantRecommendationRequestArgs = {
    requestID: Scalars['ID']['input'];
    userID: Scalars['ID']['input'];
};
export type MutationAddFavoriteRestaurantArgs = {
    input: FavoritedRestaurantInput;
};
export type MutationAddFirstFavoriteRestaurantsArgs = {
    input: FirstFavoritedRestaurantsInput;
};
export type MutationAddFriendshipArgs = {
    input: FriendshipInput;
};
export type MutationAggregateRestaurantArgs = {
    input?: InputMaybe<AggregateRestaurantInput>;
};
export type MutationAggregateRestaurantsAroundArgs = {
    input?: InputMaybe<AggregateRestaurantsAroundInput>;
};
export type MutationCopyAndCreateFmPostFromArgs = {
    sourcePostID: Scalars['ID']['input'];
};
export type MutationCreateUserArgs = {
    input: CreateNewUserInput;
};
export type MutationDeleteFmUserArgs = {
    userID: Scalars['ID']['input'];
};
export type MutationDeleteUserArgs = {
    input: DeleteUserInput;
};
export type MutationImportFmPostsArgs = {
    input: ImportFmPostsInput;
};
export type MutationInferUserTasteProfileUsingFirstFavoritesArgs = {
    userID: Scalars['ID']['input'];
};
export type MutationLoginFmUserArgs = {
    input: LoginFmUserInput;
};
export type MutationLoginUserArgs = {
    input: UserLoginInput;
};
export type MutationRemoveFavoriteRestaurantArgs = {
    input: RemoveFavoritedRestaurantInput;
};
export type MutationRemoveFriendshipArgs = {
    input: FriendshipInput;
};
export type MutationRemoveRestaurantRecommendationArgs = {
    recommendationID: Scalars['ID']['input'];
    userID: Scalars['ID']['input'];
};
export type MutationRemoveRestaurantRecommendationRequestArgs = {
    requestID: Scalars['ID']['input'];
    userID: Scalars['ID']['input'];
};
export type MutationRequestPasswordResetEmailArgs = {
    email: Scalars['ID']['input'];
};
export type MutationRequestRestaurantRecommendationArgs = {
    input: RestaurantRecommendationRequestInput;
};
export type MutationRequestUsernameReminderEmailArgs = {
    email: Scalars['ID']['input'];
};
export type MutationSendRestaurantRecommendationArgs = {
    input: RestaurantRecommendationInput;
};
export type MutationSetLastActiveArgs = {
    userID: Scalars['ID']['input'];
};
export type MutationSetUserTasteProfileArgs = {
    input: UserTasteProfileInput;
};
export type MutationSignOutFmUserArgs = {
    userID: Scalars['ID']['input'];
};
export type MutationSignOutUserArgs = {
    input: UserSignOutInput;
};
export type MutationTrackRestaurantPersonalizationEventArgs = {
    input?: InputMaybe<RestaurantPersonalizationEventTrackingInput>;
};
export type MutationTrackUserEventArgs = {
    input?: InputMaybe<TrackableUserEventTrackingInput>;
};
export type MutationUpdateFmPostCustomUserPropertiesArgs = {
    input: UpdateFmPostCustomUserPropertiesInput;
};
export type MutationUpdateFmPostFavoriteStatusArgs = {
    input: UpdateFmPostFavStatusInput;
};
export type MutationUpdateFmPostRestaurantDataArgs = {
    input: UpdateFmPostRestaurantDataInput;
};
export type MutationUpdateFmPostVisibilityStatusArgs = {
    input: UpdateFmPostVisibilityStatusInput;
};
export type MutationUpdateFmUserMapNameArgs = {
    input: UpdateFmUserMapNameInput;
};
export type MutationUpdateUserNotificationPreferenceArgs = {
    input: UpdateUserNotificationPreferenceInput;
};
export type MutationUpdateUserPhoneNumberVerificationStatusArgs = {
    input: UpdateUserPhoneNumberVerificationStatusInput;
};
export type MutationUpdateUserProfileArgs = {
    input: UpdateUserProfileInput;
};
export type MutationUpdateUserProfilePictureUrlArgs = {
    input: UpdateUserProfilePictureUrlInput;
};
export type MutationUpdateUserProfileTasksArgs = {
    input: UpdateUserProfileTasksInput;
};
export type MutationUploadProfilePictureArgs = {
    fonciiMaps: Scalars['Boolean']['input'];
    input: FileUploadInput;
};
export type OffsettableLimitInput = {
    limit: Scalars['Int']['input'];
    limitOffset: Scalars['Int']['input'];
};
export type OperatingHours = {
    __typename?: 'OperatingHours';
    Friday?: Maybe<Scalars['String']['output']>;
    Monday?: Maybe<Scalars['String']['output']>;
    Saturday?: Maybe<Scalars['String']['output']>;
    Sunday?: Maybe<Scalars['String']['output']>;
    Thursday?: Maybe<Scalars['String']['output']>;
    Tuesday?: Maybe<Scalars['String']['output']>;
    Wednesday?: Maybe<Scalars['String']['output']>;
};
export type PersonalizedRestaurant = {
    __typename?: 'PersonalizedRestaurant';
    isFavorited?: Maybe<Scalars['Boolean']['output']>;
    percentMatch?: Maybe<Scalars['Float']['output']>;
    restaurant: Restaurant;
};
export type PersonalizedRestaurantSearchResult = {
    __typename?: 'PersonalizedRestaurantSearchResult';
    queryID: Scalars['String']['output'];
    restaurants?: Maybe<Array<PersonalizedRestaurant>>;
};
export type PhoneNumberInput = {
    countryCode: Scalars['String']['input'];
    nsn: Scalars['String']['input'];
};
export type ProfileTask = {
    __typename?: 'ProfileTask';
    id: Scalars['ID']['output'];
    isComplete: Scalars['Boolean']['output'];
};
export type ProxyFetchFavoriteRestaurantsInput = {
    cursorPaginationInput?: InputMaybe<CursorPaginationInput>;
    ownerUserID: Scalars['ID']['input'];
    proxyUserID: Scalars['ID']['input'];
};
export type Query = {
    __typename?: 'Query';
    areUsersFriends?: Maybe<Scalars['Boolean']['output']>;
    countTotalFriendsForUser: Scalars['Int']['output'];
    didUserAcceptRecommendationForRestaurant: Scalars['Boolean']['output'];
    didUserAcceptRequestedRecommendationForRestaurant: Scalars['Boolean']['output'];
    didUserReceiveRestaurantRecommendation?: Maybe<Scalars['Boolean']['output']>;
    didUserReceiveRestaurantRecommendationRequest?: Maybe<Scalars['Boolean']['output']>;
    didUserSendRecommendationForRestaurant: Scalars['Boolean']['output'];
    didUserSendRequestedRecommendationForRestaurant: Scalars['Boolean']['output'];
    didUserSendRestaurantRecommendation?: Maybe<Scalars['Boolean']['output']>;
    didUserSendRestaurantRecommendationRequest?: Maybe<Scalars['Boolean']['output']>;
    doUsersShareCommonFriends?: Maybe<Scalars['Boolean']['output']>;
    doesEmailExist: Scalars['Boolean']['output'];
    doesPhoneNumberExist: Scalars['Boolean']['output'];
    doesUserHaveATasteProfile: Scalars['Boolean']['output'];
    doesUsernameExist: Scalars['Boolean']['output'];
    fetchAllCommonFriendsBetween?: Maybe<Array<Scalars['ID']['output']>>;
    fetchAllCuisines: Array<Cuisine>;
    fetchAllFMPostsByIGUsername: Array<FmPost>;
    fetchAllFMUsers: Array<Maybe<FmUser>>;
    fetchAllFoodRestrictions: Array<FoodRestriction>;
    fetchAllFriendsForUser?: Maybe<Array<User>>;
    fetchAllFriendshipsForUser?: Maybe<Array<Friendship>>;
    fetchAllMajorCities: Array<MajorCity>;
    fetchAllMealTypes: Array<MealType>;
    fetchAllUsers?: Maybe<Array<User>>;
    fetchFMPostsByIGUsername: Array<FmPost>;
    fetchFavoriteRestaurantsFor?: Maybe<Array<FavoritedRestaurant>>;
    fetchFriendshipBetweenUsers?: Maybe<Friendship>;
    fetchUserGalleryHTMLMetadata?: Maybe<HtmlMetadataResponse>;
    getAverageGroupPercentageMatch?: Maybe<Scalars['Float']['output']>;
    getFMPostByID?: Maybe<FmPost>;
    getFMUser?: Maybe<FmUser>;
    getFMUserByInstagramUsername?: Maybe<FmUser>;
    getPercentageMatch?: Maybe<Scalars['Float']['output']>;
    getRestaurantRecommendationByFor?: Maybe<RestaurantRecommendation>;
    getRestaurantRecommendationFromID?: Maybe<RestaurantRecommendation>;
    getRestaurantRecommendationRequestFromID?: Maybe<RestaurantRecommendationRequest>;
    getRestaurantRecommendationRequestsForUser?: Maybe<Array<RestaurantRecommendationRequest>>;
    getRestaurantRecommendationToFor?: Maybe<RestaurantRecommendation>;
    getRestaurantRecommendationsForUser?: Maybe<Array<RestaurantRecommendation>>;
    getSuggestedFriendsForUser?: Maybe<Array<User>>;
    getTotalRestaurantCount: Scalars['Int']['output'];
    getUser?: Maybe<User>;
    getUserEmailFromPhoneNumber?: Maybe<Scalars['String']['output']>;
    getUserEmailFromUsername?: Maybe<Scalars['String']['output']>;
    getUserTasteProfile?: Maybe<TasteProfile>;
    hasUserFavoritedRestaurant: Scalars['Boolean']['output'];
    isInstagramIDInUse: Scalars['Boolean']['output'];
    isInstagramUsernameInUse: Scalars['Boolean']['output'];
    searchForFMPosts?: Maybe<FmPostSearchResult>;
    searchForRestaurants?: Maybe<PersonalizedRestaurantSearchResult>;
};
export type QueryAreUsersFriendsArgs = {
    input: FriendshipInput;
};
export type QueryCountTotalFriendsForUserArgs = {
    userID: Scalars['ID']['input'];
};
export type QueryDidUserAcceptRecommendationForRestaurantArgs = {
    restaurantID: Scalars['ID']['input'];
    userID: Scalars['ID']['input'];
};
export type QueryDidUserAcceptRequestedRecommendationForRestaurantArgs = {
    restaurantID: Scalars['ID']['input'];
    userID: Scalars['ID']['input'];
};
export type QueryDidUserReceiveRestaurantRecommendationArgs = {
    recommendationID: Scalars['ID']['input'];
    userID: Scalars['ID']['input'];
};
export type QueryDidUserReceiveRestaurantRecommendationRequestArgs = {
    requestID: Scalars['ID']['input'];
    userID: Scalars['ID']['input'];
};
export type QueryDidUserSendRecommendationForRestaurantArgs = {
    restaurantID: Scalars['ID']['input'];
    userID: Scalars['ID']['input'];
};
export type QueryDidUserSendRequestedRecommendationForRestaurantArgs = {
    restaurantID: Scalars['ID']['input'];
    userID: Scalars['ID']['input'];
};
export type QueryDidUserSendRestaurantRecommendationArgs = {
    recommendationID: Scalars['ID']['input'];
    userID: Scalars['ID']['input'];
};
export type QueryDidUserSendRestaurantRecommendationRequestArgs = {
    requestID: Scalars['ID']['input'];
    userID: Scalars['ID']['input'];
};
export type QueryDoUsersShareCommonFriendsArgs = {
    input: FriendshipInput;
};
export type QueryDoesEmailExistArgs = {
    email: Scalars['String']['input'];
};
export type QueryDoesPhoneNumberExistArgs = {
    phoneNumberInput: PhoneNumberInput;
};
export type QueryDoesUserHaveATasteProfileArgs = {
    userID: Scalars['ID']['input'];
};
export type QueryDoesUsernameExistArgs = {
    username: Scalars['String']['input'];
};
export type QueryFetchAllCommonFriendsBetweenArgs = {
    input: FriendshipInput;
};
export type QueryFetchAllFmPostsByIgUsernameArgs = {
    input: FetchFmPostsByIgUsernameInput;
};
export type QueryFetchAllFmUsersArgs = {
    input: FetchAllFmUsersInput;
};
export type QueryFetchAllFriendsForUserArgs = {
    input: FetchAllFriendsForUserInput;
};
export type QueryFetchAllFriendshipsForUserArgs = {
    input: FetchAllFriendsForUserInput;
};
export type QueryFetchAllUsersArgs = {
    input: FetchAllUsersInput;
};
export type QueryFetchFmPostsByIgUsernameArgs = {
    input: FetchFmPostsByIgUsernameInput;
};
export type QueryFetchFavoriteRestaurantsForArgs = {
    input: FetchFavoriteRestaurantsInput;
};
export type QueryFetchFriendshipBetweenUsersArgs = {
    input: FriendshipInput;
};
export type QueryFetchUserGalleryHtmlMetadataArgs = {
    username: Scalars['String']['input'];
};
export type QueryGetAverageGroupPercentageMatchArgs = {
    restaurantID: Scalars['ID']['input'];
    userIDs: Array<Scalars['ID']['input']>;
};
export type QueryGetFmPostByIdArgs = {
    postID: Scalars['String']['input'];
};
export type QueryGetFmUserArgs = {
    userID: Scalars['ID']['input'];
};
export type QueryGetFmUserByInstagramUsernameArgs = {
    instagramUsername: Scalars['ID']['input'];
};
export type QueryGetPercentageMatchArgs = {
    restaurantID: Scalars['ID']['input'];
    userID: Scalars['ID']['input'];
};
export type QueryGetRestaurantRecommendationByForArgs = {
    restaurantID: Scalars['ID']['input'];
    userID: Scalars['ID']['input'];
};
export type QueryGetRestaurantRecommendationFromIdArgs = {
    recommendationID: Scalars['ID']['input'];
};
export type QueryGetRestaurantRecommendationRequestFromIdArgs = {
    requestID: Scalars['ID']['input'];
};
export type QueryGetRestaurantRecommendationRequestsForUserArgs = {
    input: GetRestaurantRecommendationsForUserInput;
};
export type QueryGetRestaurantRecommendationToForArgs = {
    restaurantID: Scalars['ID']['input'];
    userID: Scalars['ID']['input'];
};
export type QueryGetRestaurantRecommendationsForUserArgs = {
    input: GetRestaurantRecommendationsForUserInput;
};
export type QueryGetSuggestedFriendsForUserArgs = {
    userID: Scalars['ID']['input'];
};
export type QueryGetUserArgs = {
    userID: Scalars['ID']['input'];
};
export type QueryGetUserEmailFromPhoneNumberArgs = {
    phoneNumberInput: PhoneNumberInput;
};
export type QueryGetUserEmailFromUsernameArgs = {
    username: Scalars['String']['input'];
};
export type QueryGetUserTasteProfileArgs = {
    userID: Scalars['ID']['input'];
};
export type QueryHasUserFavoritedRestaurantArgs = {
    input: FavoritedRestaurantInput;
};
export type QueryIsInstagramIdInUseArgs = {
    instagramID: Scalars['ID']['input'];
};
export type QueryIsInstagramUsernameInUseArgs = {
    instagramUsername: Scalars['ID']['input'];
};
export type QuerySearchForFmPostsArgs = {
    input?: InputMaybe<SearchForFmPostsInput>;
};
export type QuerySearchForRestaurantsArgs = {
    input?: InputMaybe<SearchForRestaurantsInput>;
};
export type Recommendation = {
    acceptationDate?: Maybe<Scalars['String']['output']>;
    accepted: Scalars['Boolean']['output'];
    creationDate: Scalars['String']['output'];
    destinationCity: Scalars['String']['output'];
    id: Scalars['ID']['output'];
    message: Scalars['String']['output'];
};
export type RemoveFavoritedRestaurantInput = {
    restaurantID: Scalars['ID']['input'];
    userID: Scalars['ID']['input'];
};
export type Restaurant = {
    __typename?: 'Restaurant';
    _geoloc: CoordinatePoint;
    addressProperties: AddressProperties;
    categories?: Maybe<Array<Scalars['String']['output']>>;
    creationDate: Scalars['String']['output'];
    description?: Maybe<Scalars['String']['output']>;
    googleID: Scalars['String']['output'];
    googleProperties?: Maybe<GoogleRestaurantProperties>;
    heroImageURL?: Maybe<Scalars['String']['output']>;
    id: Scalars['ID']['output'];
    imageCollectionURLs?: Maybe<Array<Scalars['String']['output']>>;
    lastUpdated: Scalars['String']['output'];
    name: Scalars['String']['output'];
    operatingHours?: Maybe<OperatingHours>;
    phoneNumber?: Maybe<Scalars['String']['output']>;
    priceLevel?: Maybe<Scalars['Int']['output']>;
    servesAlcohol: Scalars['Boolean']['output'];
    staleDate: Scalars['String']['output'];
    website?: Maybe<Scalars['String']['output']>;
    yelpID?: Maybe<Scalars['String']['output']>;
    yelpProperties?: Maybe<YelpRestaurantProperties>;
};
export type RestaurantAggregationResponse = {
    __typename?: 'RestaurantAggregationResponse';
    errors?: Maybe<Array<ClientError>>;
    restaurants: Array<Restaurant>;
    statusCode: Scalars['Int']['output'];
};
export type RestaurantPersonalizationEventTrackingInput = {
    eventType: RestaurantPersonalizationEvents;
    filters?: InputMaybe<Array<Scalars['String']['input']>>;
    objectIDs?: InputMaybe<Array<Scalars['String']['input']>>;
    queryID?: InputMaybe<Scalars['String']['input']>;
    userID: Scalars['ID']['input'];
};
export declare enum RestaurantPersonalizationEvents {
    UserAcceptedRestaurantRecommendation = "USER_ACCEPTED_RESTAURANT_RECOMMENDATION",
    UserClickedFilters = "USER_CLICKED_FILTERS",
    UserClickedOnRestaurant = "USER_CLICKED_ON_RESTAURANT",
    UserClickedOnRestaurantAfterSearch = "USER_CLICKED_ON_RESTAURANT_AFTER_SEARCH",
    UserFavoritedRestaurant = "USER_FAVORITED_RESTAURANT",
    UserFavoritedRestaurantAfterFiltering = "USER_FAVORITED_RESTAURANT_AFTER_FILTERING",
    UserFavoritedRestaurantAfterSearch = "USER_FAVORITED_RESTAURANT_AFTER_SEARCH",
    UserRecommendedRestaurant = "USER_RECOMMENDED_RESTAURANT",
    UserRecommendedRestaurantAfterRequest = "USER_RECOMMENDED_RESTAURANT_AFTER_REQUEST",
    UserReservedRestaurant = "USER_RESERVED_RESTAURANT",
    UserReservedRestaurantAfterFiltering = "USER_RESERVED_RESTAURANT_AFTER_FILTERING",
    UserReservedRestaurantAfterSearch = "USER_RESERVED_RESTAURANT_AFTER_SEARCH",
    UserViewedFilters = "USER_VIEWED_FILTERS",
    UserViewedRestaurantDetailView = "USER_VIEWED_RESTAURANT_DETAIL_VIEW"
}
export type RestaurantRecommendation = Recommendation & {
    __typename?: 'RestaurantRecommendation';
    acceptationDate?: Maybe<Scalars['String']['output']>;
    accepted: Scalars['Boolean']['output'];
    creationDate: Scalars['String']['output'];
    destinationCity: Scalars['String']['output'];
    id: Scalars['ID']['output'];
    message: Scalars['String']['output'];
    recommendationRequestID?: Maybe<Scalars['ID']['output']>;
    recommendeeID: Scalars['ID']['output'];
    recommenderID: Scalars['ID']['output'];
    restaurantIDs: Array<Scalars['ID']['output']>;
    restaurants?: Maybe<Array<Restaurant>>;
};
export type RestaurantRecommendationInput = {
    communications: CommunicationsInput;
    destinationCity: Scalars['String']['input'];
    recommendationRequestID?: InputMaybe<Scalars['ID']['input']>;
    restaurantIDs: Array<Scalars['ID']['input']>;
};
export type RestaurantRecommendationRequest = Recommendation & {
    __typename?: 'RestaurantRecommendationRequest';
    acceptationDate?: Maybe<Scalars['String']['output']>;
    accepted: Scalars['Boolean']['output'];
    creationDate: Scalars['String']['output'];
    destinationCity: Scalars['String']['output'];
    id: Scalars['ID']['output'];
    message: Scalars['String']['output'];
    requesteeID: Scalars['ID']['output'];
    requesterID: Scalars['ID']['output'];
};
export type RestaurantRecommendationRequestInput = {
    communications: CommunicationsInput;
    destinationCity: Scalars['String']['input'];
};
export type SearchFilterInput = {
    cities?: InputMaybe<Array<Scalars['String']['input']>>;
    cuisines?: InputMaybe<Array<Scalars['ID']['input']>>;
    foodRestrictions?: InputMaybe<Array<Scalars['ID']['input']>>;
    googleRatings?: InputMaybe<Array<Scalars['Int']['input']>>;
    mealTypes?: InputMaybe<Array<Scalars['ID']['input']>>;
    priceLevels?: InputMaybe<Array<Scalars['Int']['input']>>;
    userID: Scalars['ID']['input'];
    yelpRatings?: InputMaybe<Array<Scalars['Int']['input']>>;
};
export type SearchForFmPostsInput = {
    geoLocationSearchInput?: InputMaybe<GeoLocationSearchInput>;
    optionalCityToFilterBy?: InputMaybe<Scalars['String']['input']>;
    paginationInput?: InputMaybe<SearchPaginationInput>;
    query?: InputMaybe<Scalars['String']['input']>;
    searchFilterInput?: InputMaybe<FmPostSearchFilterInput>;
};
export type SearchForRestaurantsInput = {
    geoLocationSearchInput?: InputMaybe<GeoLocationSearchInput>;
    optionalCityToFilterBy?: InputMaybe<Scalars['String']['input']>;
    paginationInput?: InputMaybe<SearchPaginationInput>;
    personalize?: Scalars['Boolean']['input'];
    query?: InputMaybe<Scalars['String']['input']>;
    searchFilterInput?: InputMaybe<SearchFilterInput>;
};
export type SearchPaginationInput = {
    hitsPerPage?: InputMaybe<Scalars['Int']['input']>;
    page?: InputMaybe<Scalars['Int']['input']>;
};
export type SetTasteProfileResponse = {
    __typename?: 'SetTasteProfileResponse';
    errors?: Maybe<Array<ClientError>>;
    statusCode: Scalars['Int']['output'];
    tasteProfile: TasteProfile;
};
export declare enum SortOrders {
    Ascending = "ASCENDING",
    Descending = "DESCENDING"
}
export type SupportedLocalizations = {
    __typename?: 'SupportedLocalizations';
    en: Scalars['String']['output'];
    es: Scalars['String']['output'];
    fr: Scalars['String']['output'];
};
export type TasteProfile = {
    __typename?: 'TasteProfile';
    adventureLevel?: Maybe<Scalars['Int']['output']>;
    creationDate: Scalars['String']['output'];
    distancePreferenceLevel?: Maybe<Scalars['Int']['output']>;
    favoriteCuisines: Array<Scalars['ID']['output']>;
    foodRestrictions: Array<Scalars['ID']['output']>;
    id: Scalars['ID']['output'];
    lastUpdated: Scalars['String']['output'];
    preferredMealTypes: Array<Scalars['ID']['output']>;
    preferredPriceLevels: Array<Scalars['Int']['output']>;
    prefersDrinks: Scalars['Boolean']['output'];
    restaurantRatingImportanceLevel?: Maybe<Scalars['Int']['output']>;
};
export type TrackableUserEventTrackingInput = {
    eventPropertiesJSON: Scalars['String']['input'];
    eventType: TrackableUserEvents;
    userID: Scalars['ID']['input'];
};
export declare enum TrackableUserEvents {
    FirstAppLaunch = "FIRST_APP_LAUNCH",
    FmUserClickedFonciiSignUpRedirectButton = "FM_USER_CLICKED_FONCII_SIGN_UP_REDIRECT_BUTTON",
    RestaurantsAggregated = "RESTAURANTS_AGGREGATED",
    RestaurantAggregationErrorNotPossible = "RESTAURANT_AGGREGATION_ERROR_NOT_POSSIBLE",
    UserAcceptedRestaurantRecommendation = "USER_ACCEPTED_RESTAURANT_RECOMMENDATION",
    UserAddedFriend = "USER_ADDED_FRIEND",
    UserAnsweredTasteProfileQuestion = "USER_ANSWERED_TASTE_PROFILE_QUESTION",
    UserBlockedUser = "USER_BLOCKED_USER",
    UserCancelledReservation = "USER_CANCELLED_RESERVATION",
    UserClickedFilters = "USER_CLICKED_FILTERS",
    UserClickedOnRestaurantAfterSearch = "USER_CLICKED_ON_RESTAURANT_AFTER_SEARCH",
    UserClickedRestaurant = "USER_CLICKED_RESTAURANT",
    UserClickedRestaurantSearchResult = "USER_CLICKED_RESTAURANT_SEARCH_RESULT",
    UserCompletedAllProfileTasks = "USER_COMPLETED_ALL_PROFILE_TASKS",
    UserCompletedOnboarding = "USER_COMPLETED_ONBOARDING",
    UserCompletedProfileTask = "USER_COMPLETED_PROFILE_TASK",
    UserCreatedAccount = "USER_CREATED_ACCOUNT",
    UserDeclinedRestaurantRecommendation = "USER_DECLINED_RESTAURANT_RECOMMENDATION",
    UserDeclinedRestaurantRecommendationRequest = "USER_DECLINED_RESTAURANT_RECOMMENDATION_REQUEST",
    UserDeletedAccount = "USER_DELETED_ACCOUNT",
    UserDeniedLocationPermissions = "USER_DENIED_LOCATION_PERMISSIONS",
    UserEnteredFirstFavorites = "USER_ENTERED_FIRST_FAVORITES",
    UserFavoritedRestaurant = "USER_FAVORITED_RESTAURANT",
    UserFavoritedRestaurantAfterFiltering = "USER_FAVORITED_RESTAURANT_AFTER_FILTERING",
    UserFavoritedRestaurantAfterSearch = "USER_FAVORITED_RESTAURANT_AFTER_SEARCH",
    UserFulfilledRecommendationRequest = "USER_FULFILLED_RECOMMENDATION_REQUEST",
    UserImportedContacts = "USER_IMPORTED_CONTACTS",
    UserImportedFriendFavorites = "USER_IMPORTED_FRIEND_FAVORITES",
    UserInvitedContact = "USER_INVITED_CONTACT",
    UserLeftAppRating = "USER_LEFT_APP_RATING",
    UserLoggedIn = "USER_LOGGED_IN",
    UserLoggedOut = "USER_LOGGED_OUT",
    UserNavigatedToHomescreen = "USER_NAVIGATED_TO_HOMESCREEN",
    UserNavigatedToMapscreen = "USER_NAVIGATED_TO_MAPSCREEN",
    UserNavigatedToProfilescreen = "USER_NAVIGATED_TO_PROFILESCREEN",
    UserPressedHelpAndSupportButton = "USER_PRESSED_HELP_AND_SUPPORT_BUTTON",
    UserReceivedRecommendationRequest = "USER_RECEIVED_RECOMMENDATION_REQUEST",
    UserReceivedRecommendedRestaurants = "USER_RECEIVED_RECOMMENDED_RESTAURANTS",
    UserRecommendedRestaurant = "USER_RECOMMENDED_RESTAURANT",
    UserRegisteredWithReferral = "USER_REGISTERED_WITH_REFERRAL",
    UserRemovedFriend = "USER_REMOVED_FRIEND",
    UserRemovedProfilePicture = "USER_REMOVED_PROFILE_PICTURE",
    UserRequestedPasswordResetEmail = "USER_REQUESTED_PASSWORD_RESET_EMAIL",
    UserRequestedUsernameReminderEmail = "USER_REQUESTED_USERNAME_REMINDER_EMAIL",
    UserReservedRestaurant = "USER_RESERVED_RESTAURANT",
    UserReservedRestaurantAfterFiltering = "USER_RESERVED_RESTAURANT_AFTER_FILTERING",
    UserReservedRestaurantAfterSearch = "USER_RESERVED_RESTAURANT_AFTER_SEARCH",
    UserSearchedForRestaurant = "USER_SEARCHED_FOR_RESTAURANT",
    UserSearchedForRestaurantAfterFiltering = "USER_SEARCHED_FOR_RESTAURANT_AFTER_FILTERING",
    UserSentRecommendationRequest = "USER_SENT_RECOMMENDATION_REQUEST",
    UserSetLocationPermissionsAlways = "USER_SET_LOCATION_PERMISSIONS_ALWAYS",
    UserSetLocationPermissionsWhileInUse = "USER_SET_LOCATION_PERMISSIONS_WHILE_IN_USE",
    UserSetTasteProfile = "USER_SET_TASTE_PROFILE",
    UserSkippedFirstFavorites = "USER_SKIPPED_FIRST_FAVORITES",
    UserSkippedTasteProfileQuestion = "USER_SKIPPED_TASTE_PROFILE_QUESTION",
    UserTurnedOffPushNotifications = "USER_TURNED_OFF_PUSH_NOTIFICATIONS",
    UserTurnedOnPushNotifications = "USER_TURNED_ON_PUSH_NOTIFICATIONS",
    UserUnblockedUser = "USER_UNBLOCKED_USER",
    UserUnfavoritedRestaurant = "USER_UNFAVORITED_RESTAURANT",
    UserUpdatedProfile = "USER_UPDATED_PROFILE",
    UserUpdatedProfilePicture = "USER_UPDATED_PROFILE_PICTURE",
    UserUpdatedReservation = "USER_UPDATED_RESERVATION",
    UserVerifiedPhoneNumber = "USER_VERIFIED_PHONE_NUMBER",
    UserViewedFilters = "USER_VIEWED_FILTERS",
    UserViewedRestaurantDetailView = "USER_VIEWED_RESTAURANT_DETAIL_VIEW"
}
export type TrendingRestaurant = {
    __typename?: 'TrendingRestaurant';
    creationDate: Scalars['String']['output'];
    id: Scalars['ID']['output'];
    impressions: Scalars['Int']['output'];
    rank: Scalars['Int']['output'];
    restaurant: PersonalizedRestaurant;
};
export type UpdateFmPostCustomUserPropertiesInput = {
    associatedGoogleBusinessPlaceIDs?: InputMaybe<Array<Scalars['String']['input']>>;
    associatedMediaURLS?: InputMaybe<Array<Scalars['String']['input']>>;
    customCategories?: InputMaybe<Array<Scalars['String']['input']>>;
    notes?: InputMaybe<Scalars['String']['input']>;
    rating?: InputMaybe<Scalars['Float']['input']>;
    review?: InputMaybe<Scalars['String']['input']>;
    userInput: UpdateFmPostUserInput;
};
export type UpdateFmPostFavStatusInput = {
    isFavorited: Scalars['Boolean']['input'];
    userInput: UpdateFmPostUserInput;
};
export type UpdateFmPostResponse = {
    __typename?: 'UpdateFMPostResponse';
    errors?: Maybe<Array<ClientError>>;
    statusCode: Scalars['Int']['output'];
    updatedPost: FmPost;
};
export type UpdateFmPostRestaurantDataInput = {
    googlePlaceID: Scalars['ID']['input'];
    userInput: UpdateFmPostUserInput;
};
export type UpdateFmPostUserInput = {
    postID: Scalars['ID']['input'];
    userID: Scalars['ID']['input'];
};
export type UpdateFmPostVisibilityStatusInput = {
    isPubliclyVisible: Scalars['Boolean']['input'];
    userInput: UpdateFmPostUserInput;
};
export type UpdateFmUserMapNameInput = {
    newMapName: Scalars['String']['input'];
    userID: Scalars['ID']['input'];
};
export type UpdateFmUserMapNameResponse = {
    __typename?: 'UpdateFMUserMapNameResponse';
    errors?: Maybe<Array<ClientError>>;
    mapName: Scalars['String']['output'];
    statusCode: Scalars['Int']['output'];
};
export type UpdateUserActivityInput = {
    newlastActiveDate: Scalars['String']['input'];
    userID: Scalars['ID']['input'];
};
export type UpdateUserNotificationPreferenceInput = {
    isEnabled: Scalars['Boolean']['input'];
    userID: Scalars['ID']['input'];
};
export type UpdateUserNotificationsPreferenceInput = {
    notificationsEnabled: Scalars['Boolean']['input'];
    userID: Scalars['ID']['input'];
};
export type UpdateUserPhoneNumberVerificationStatusInput = {
    phoneNumberVerified: Scalars['Boolean']['input'];
    userID: Scalars['ID']['input'];
};
export type UpdateUserProfileInput = {
    email?: InputMaybe<Scalars['String']['input']>;
    fullName?: InputMaybe<Scalars['String']['input']>;
    phoneNumberInput?: InputMaybe<PhoneNumberInput>;
    userID: Scalars['ID']['input'];
    username?: InputMaybe<Scalars['String']['input']>;
};
export type UpdateUserProfilePictureUrlInput = {
    newPictureURL: Scalars['String']['input'];
    userID: Scalars['ID']['input'];
};
export type UpdateUserProfileTasksInput = {
    FavoriteTask: ProfileTaskInput;
    InviteTask: ProfileTaskInput;
    RecommendTask: ProfileTaskInput;
    TasteProfileTask: ProfileTaskInput;
    UploadPictureTask: ProfileTaskInput;
    userID: Scalars['ID']['input'];
};
export type User = {
    __typename?: 'User';
    authProviders: Array<Scalars['ID']['output']>;
    creationDate: Scalars['String']['output'];
    email: Scalars['String']['output'];
    firstFavorites?: Maybe<Array<Restaurant>>;
    fullName: Scalars['String']['output'];
    id: Scalars['ID']['output'];
    isPhoneNumberVerified: Scalars['Boolean']['output'];
    lastActive: Scalars['String']['output'];
    lastLogin: UserLogin;
    lastSignOutDate?: Maybe<Scalars['String']['output']>;
    lastUpdated: Scalars['String']['output'];
    notificationsEnabled: Scalars['Boolean']['output'];
    phoneNumber: Scalars['String']['output'];
    profilePictureURL?: Maybe<Scalars['String']['output']>;
    profileTasks: Array<ProfileTask>;
    referralCode: Scalars['String']['output'];
    username: Scalars['String']['output'];
};
export declare enum UserAuthProviders {
    Apple = "APPLE",
    Default = "DEFAULT",
    Facebook = "FACEBOOK",
    Google = "GOOGLE",
    Twitter = "TWITTER"
}
export type UserLogin = {
    __typename?: 'UserLogin';
    authProvider: UserAuthProviders;
    loginDate: Scalars['String']['output'];
};
export type UserLoginInput = {
    authProvider: UserAuthProviders;
    userID: Scalars['ID']['input'];
};
export type UserNotificationPreferenceUpdateResponse = {
    __typename?: 'UserNotificationPreferenceUpdateResponse';
    errors?: Maybe<Array<ClientError>>;
    notificationsEnabled?: Maybe<Scalars['Boolean']['output']>;
    statusCode: Scalars['Int']['output'];
};
export type UserReferral = {
    __typename?: 'UserReferral';
    id: Scalars['ID']['output'];
    refereeID: Scalars['ID']['output'];
    referralCode: Scalars['String']['output'];
    referrerID: Scalars['ID']['output'];
};
export type UserSignOutInput = {
    userID: Scalars['ID']['input'];
};
export type UserTasteProfileInput = {
    adventureLevel?: InputMaybe<Scalars['Int']['input']>;
    distancePreferenceLevel?: InputMaybe<Scalars['Int']['input']>;
    favoriteCuisines?: InputMaybe<Array<Scalars['ID']['input']>>;
    foodRestrictions?: InputMaybe<Array<Scalars['ID']['input']>>;
    preferredMealTypes?: InputMaybe<Array<Scalars['ID']['input']>>;
    preferredPriceLevels?: InputMaybe<Array<Scalars['Int']['input']>>;
    prefersDrinks?: InputMaybe<Scalars['Boolean']['input']>;
    restaurantRatingImportanceLevel?: InputMaybe<Scalars['Int']['input']>;
    userID: Scalars['ID']['input'];
};
export type YelpRestaurantProperties = {
    __typename?: 'YelpRestaurantProperties';
    rating?: Maybe<Scalars['Float']['output']>;
};
export type ProfileTaskInput = {
    isComplete: Scalars['Boolean']['input'];
};
