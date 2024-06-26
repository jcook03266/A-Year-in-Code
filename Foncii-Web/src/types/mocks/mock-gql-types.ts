// Dependencies
// Types
import {
  CoordinatePoint,
  FmUserPost,
  FmUser,
  Restaurant,
  CustomUserPostProperties,
  AuthProviders,
  FmIntegrationProviders,
  PostMediaTypes,
  FmIntegrationCredential,
  FonciiRestaurant,
  ArticlePublication,
  UserAnalyticsDashboardEntityDistribution,
  UserAnalyticsDashboardTimeSeriesEntry,
  UserRoles,
} from "../../__generated__/graphql";

// Utilities
import { currentDateAsISOString } from "../../utilities/common/convenienceUtilities";

// Various mock data populating various types used for component placeholders
// Mocks
// Graphs
export const MockTopTagsDistribution: UserAnalyticsDashboardEntityDistribution[] =
  [
    { category: "Date Night", count: 10 },
    { category: "Vegan", count: 13 },
    { category: "Cheap Eats", count: 28 },
    { category: "Other", count: 129 },
  ];

export const MockReservationIntentsWeeklyDataset: UserAnalyticsDashboardTimeSeriesEntry[] =
  [
    {
      category: "Yes",
      data: [25, 2, 10, 12, 22, 30, 0],
      timestamps: ["M", "T", "W", "Th", "F", "Sa", "S"],
    },
    {
      category: "Just looking",
      data: [96, 102, 32, 46, 15, 102, 20],
      timestamps: ["M", "T", "W", "Th", "F", "Sa", "S"],
    },
    {
      category: "No",
      data: [121, 234, 59, 43, 21, 201, 42],
      timestamps: ["M", "T", "W", "Th", "F", "Sa", "S"],
    },
  ];

// FM User
export const MockFMUserData: FmUser = {
  id: Math.random().toString(36).substring(2, 15), // Generate random UUID with a length of 15,
  firstName: "test",
  lastName: "user",
  username: "testuser_123",
  mapName: "testuser_123's Map",
  isClaimed: true,
  authProviders: [AuthProviders.Default],
  creationDate: currentDateAsISOString(),
  lastUpdated: currentDateAsISOString(),
  lastLogin: {
    loginDate: currentDateAsISOString(),
    authProvider: AuthProviders.Default,
  },
  isLoggedIn: true,
  email: "testuser123@foncii.com",
  referralCode: "12345678x",
  tasteProfileEdges: [],
  profileTasks: [],
  role: UserRoles.Basic,
};

// Integration Credential
export const MockIntegrationCredentialData: FmIntegrationCredential = {
  id: Math.random().toString(36).substring(2, 15),
  userID: Math.random().toString(36).substring(2, 15),
  accessToken: "12345678910",
  appUID: "12345671010",
  appUsername: "testUser123",
  provider: FmIntegrationProviders.Instagram,
  canRefresh: false,
  autoRefresh: true,
  expired: false,
  expiresSoon: false,
  staleDate: currentDateAsISOString(),
  creationDate: currentDateAsISOString(),
  lastUpdated: currentDateAsISOString(),
};

// Coordinate Point
export const MockCoordinatePointData: CoordinatePoint = {
  lat: 40.7428,
  lng: -74.016,
};

// Restaurant
export const MockRestaurantData: Restaurant = {
  id: Math.random().toString(36).substring(2, 15), // Generate random UUID with a length of 15,
  heroImageURL:
    "https://s3-media4.fl.yelpcdn.com/bphoto/ShsfArlBSX2qjQhuBRU12A/o.jpg",
  googleID: "",
  name: "Mario's Restaurant",
  servesAlcohol: true,
  imageCollectionURLs: [],
  priceLevel: 2,
  categories: ["Italian", "Desserts", "Brunch", "Lunch"],
  coordinates: MockCoordinatePointData,
  googleProperties: { rating: 4.5 },
  addressProperties: {
    city: "New York",
    countryCode: "US",
    formattedAddress: "123 Main St New York, NY, 10001",
    stateCode: "NY",
    streetAddress: "Main St",
    zipCode: "10001",
  },
  creationDate: currentDateAsISOString(),
  lastUpdated: currentDateAsISOString(),
  staleDate: currentDateAsISOString(),
};

// Reservation Availabilities
export const MockReservationAvailabilities = [
  {
    date: "2023-12-08T00:00:00.000Z",
    timeSlot: "17:00:00",
    provider: "RESY",
    venueID: "50732",
    fonciiRestaurantID: "FNCII81ASsZgb4686n3yUwOJk",
    externalURL: "https://resy.com/cities/ny/borrachito-taqueria-spirits",
    parameterizedLink:
      "https://resy.com/cities/ny/borrachito-taqueria-spirits?date=2023-12-01&seats=2",
    lastChecked: "2023-11-26T22:42:36.218Z",
  },
  {
    date: "2023-12-01T00:00:00.000Z",
    timeSlot: "17:15:00",
    provider: "RESY",
    venueID: "50732",
    fonciiRestaurantID: "FNCII81ASsZgb4686n3yUwOJk",
    externalURL: "https://resy.com/cities/ny/borrachito-taqueria-spirits",
    parameterizedLink:
      "https://resy.com/cities/ny/borrachito-taqueria-spirits?date=2023-12-01&seats=2",
    lastChecked: "2023-11-26T22:42:36.218Z",
  },
  {
    date: "2023-12-01T00:00:00.000Z",
    timeSlot: "17:30:00",
    provider: "RESY",
    venueID: "50732",
    fonciiRestaurantID: "FNCII81ASsZgb4686n3yUwOJk",
    externalURL: "https://resy.com/cities/ny/borrachito-taqueria-spirits",
    parameterizedLink:
      "https://resy.com/cities/ny/borrachito-taqueria-spirits?date=2023-12-01&seats=2",
    lastChecked: "2023-11-26T22:42:36.218Z",
  },
  {
    date: "2023-12-01T00:00:00.000Z",
    timeSlot: "17:45:00",
    provider: "RESY",
    venueID: "50732",
    fonciiRestaurantID: "FNCII81ASsZgb4686n3yUwOJk",
    externalURL: "https://resy.com/cities/ny/borrachito-taqueria-spirits",
    parameterizedLink:
      "https://resy.com/cities/ny/borrachito-taqueria-spirits?date=2023-12-01&seats=2",
    lastChecked: "2023-11-26T22:42:36.218Z",
  },
  {
    date: "2023-12-01T00:00:00.000Z",
    timeSlot: "18:00:00",
    provider: "RESY",
    venueID: "50732",
    fonciiRestaurantID: "FNCII81ASsZgb4686n3yUwOJk",
    externalURL: "https://resy.com/cities/ny/borrachito-taqueria-spirits",
    parameterizedLink:
      "https://resy.com/cities/ny/borrachito-taqueria-spirits?date=2023-12-01&seats=2",
    lastChecked: "2023-11-26T22:42:36.218Z",
  },
  {
    date: "2023-11-27T00:00:00.000Z",
    timeSlot: "18:15:00",
    provider: "RESY",
    venueID: "50732",
    fonciiRestaurantID: "FNCII81ASsZgb4686n3yUwOJk",
    externalURL: "https://resy.com/cities/ny/borrachito-taqueria-spirits",
    parameterizedLink:
      "https://resy.com/cities/ny/borrachito-taqueria-spirits?date=2023-12-01&seats=2",
    lastChecked: "2023-11-26T22:42:36.218Z",
  },
  {
    date: "2023-12-01T00:00:00.000Z",
    timeSlot: "18:30:00",
    provider: "RESY",
    venueID: "50732",
    fonciiRestaurantID: "FNCII81ASsZgb4686n3yUwOJk",
    externalURL: "https://resy.com/cities/ny/borrachito-taqueria-spirits",
    parameterizedLink:
      "https://resy.com/cities/ny/borrachito-taqueria-spirits?date=2023-12-01&seats=2",
    lastChecked: "2023-11-26T22:42:36.218Z",
  },
  {
    date: "2023-12-01T00:00:00.000Z",
    timeSlot: "18:45:00",
    provider: "RESY",
    venueID: "50732",
    fonciiRestaurantID: "FNCII81ASsZgb4686n3yUwOJk",
    externalURL: "https://resy.com/cities/ny/borrachito-taqueria-spirits",
    parameterizedLink:
      "https://resy.com/cities/ny/borrachito-taqueria-spirits?date=2023-12-01&seats=2",
    lastChecked: "2023-11-26T22:42:36.218Z",
  },
  {
    date: "2023-12-01T00:00:00.000Z",
    timeSlot: "19:00:00",
    provider: "RESY",
    venueID: "50732",
    fonciiRestaurantID: "FNCII81ASsZgb4686n3yUwOJk",
    externalURL: "https://resy.com/cities/ny/borrachito-taqueria-spirits",
    parameterizedLink:
      "https://resy.com/cities/ny/borrachito-taqueria-spirits?date=2023-12-01&seats=2",
    lastChecked: "2023-11-26T22:42:36.218Z",
  },
  {
    date: "2023-12-01T00:00:00.000Z",
    timeSlot: "19:15:00",
    provider: "RESY",
    venueID: "50732",
    fonciiRestaurantID: "FNCII81ASsZgb4686n3yUwOJk",
    externalURL: "https://resy.com/cities/ny/borrachito-taqueria-spirits",
    parameterizedLink:
      "https://resy.com/cities/ny/borrachito-taqueria-spirits?date=2023-12-01&seats=2",
    lastChecked: "2023-11-26T22:42:36.218Z",
  },
  {
    date: "2023-12-01T00:00:00.000Z",
    timeSlot: "19:30:00",
    provider: "RESY",
    venueID: "50732",
    fonciiRestaurantID: "FNCII81ASsZgb4686n3yUwOJk",
    externalURL: "https://resy.com/cities/ny/borrachito-taqueria-spirits",
    parameterizedLink:
      "https://resy.com/cities/ny/borrachito-taqueria-spirits?date=2023-12-01&seats=2",
    lastChecked: "2023-11-26T22:42:36.218Z",
  },
  {
    date: "2023-11-28T00:00:00.000Z",
    timeSlot: "22:45:00",
    provider: "RESY",
    venueID: "50732",
    fonciiRestaurantID: "FNCII81ASsZgb4686n3yUwOJk",
    externalURL: "https://resy.com/cities/ny/borrachito-taqueria-spirits",
    parameterizedLink:
      "https://resy.com/cities/ny/borrachito-taqueria-spirits?date=2023-12-01&seats=2",
    lastChecked: "2023-11-26T22:42:36.218Z",
  },
  {
    date: "2023-12-01T00:00:00.000Z",
    timeSlot: "23:00:00",
    provider: "RESY",
    venueID: "50732",
    fonciiRestaurantID: "FNCII81ASsZgb4686n3yUwOJk",
    externalURL: "https://resy.com/cities/ny/borrachito-taqueria-spirits",
    parameterizedLink:
      "https://resy.com/cities/ny/borrachito-taqueria-spirits?date=2023-12-01&seats=2",
    lastChecked: "2023-11-26T22:42:36.218Z",
  },
];

// Article Publications
export const MockArticlePublicationData: ArticlePublication = {
  id: "Eater_maps_2023-11-27",
  title: "The Best Brunch Spots in New York City",
  venueName: "Golden Diner",
  publication: "Eater",
  publishDate: "11/17/2023",
  scrapeDate: "11/27/2023",
  url: "https://ny.eater.com/maps/best-brunch-restaurants-nyc",
  websiteDomain: "https://ny.eater.com",
  faviconLink:
    "https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://ny.eater.com&size=256",
};

// Foncii Restaurant
export const ConfigurableMockFonciiRestaurantData = (
  isSaved: boolean = false,
  percentMatchScore: number = 0.925,
  qualityScore: number = 0.925,
  averageFonciiRating: number = 4.7,
  reservationsAvailable: boolean = true,
  isOpen: boolean = true,
  isReservable: boolean = true
): FonciiRestaurant => {
  return {
    restaurant: MockRestaurantData,
    isSaved,
    percentMatchScore,
    qualityScore,
    associatedArticlePublicationEdges: [],
    associatedRestaurantAwardEdges: [],
    associatedPostEdges: [],
    influencerInsightEdges: [
      MockFMPostData,
      MockFMPostData,
      MockFMPostData,
      MockFMPostData,
    ],
    averageFonciiRating,
    reservationsAvailable,
    reservationAvailabilityEdges: [],
    isReservable,
    isOpen,
  };
};

// FM Post
export const MockFMPostData: FmUserPost = {
  id: Math.random().toString(36).substring(2, 15), // Generate random UUID with a length of 15
  restaurant: undefined,
  dataSource: {
    sourceUID: "902u2803811",
    provider: FmIntegrationProviders.Instagram,
    media: {
      mediaType: PostMediaTypes.Image,
      videoMediaThumbnailURL: undefined,
      mediaURL:
        "https://s3-media2.fl.yelpcdn.com/bphoto/IdCOSMFtXtKpNDO7U3kqag/o.jpg",
    },
    creationDate: currentDateAsISOString(),
    caption: "",
    permalink: "",
  },
  customUserProperties: {},
  creationDate: currentDateAsISOString(),
  isHidden: true,
  isFavorited: false,
  lastUpdated: currentDateAsISOString(),
  media: {
    mediaType: PostMediaTypes.Image,
    videoMediaThumbnailURL: undefined,
    mediaURL:
      "https://s3-media2.fl.yelpcdn.com/bphoto/IdCOSMFtXtKpNDO7U3kqag/o.jpg",
  },
  creator: MockFMUserData,
  mediaIsVideo: false,
  isChildPost: false,
  userID: "opwiuhdiwohudh03838",
};

export const MockVideoFMPostData: FmUserPost = {
  id: Math.random().toString(36).substring(2, 15), // Generate random UUID with a length of 15,
  restaurant: undefined,
  dataSource: {
    sourceUID: "902u2803811",
    provider: FmIntegrationProviders.Instagram,
    media: {
      mediaType: PostMediaTypes.Image,
      videoMediaThumbnailURL: undefined,
      mediaURL:
        "https://s3-media2.fl.yelpcdn.com/bphoto/IdCOSMFtXtKpNDO7U3kqag/o.jpg",
    },
    creationDate: currentDateAsISOString(),
    caption: "",
    permalink: "",
  },
  customUserProperties: {},
  creationDate: currentDateAsISOString(),
  isHidden: true,
  isFavorited: false,
  lastUpdated: currentDateAsISOString(),
  media: {
    mediaType: PostMediaTypes.Image,
    videoMediaThumbnailURL: undefined,
    mediaURL:
      "https://s3-media2.fl.yelpcdn.com/bphoto/IdCOSMFtXtKpNDO7U3kqag/o.jpg",
  },
  creator: MockFMUserData,
  mediaIsVideo: false,
  isChildPost: false,
  userID: "opwiuhdiwohudh03838",
};

const MockCustomUserPostProperties: CustomUserPostProperties = {
  categories: ["Italian", "Desserts", "Brunch", "Lunch"],
  rating: 2.5,
};

export const ConfigurableMockFMPostDataWRestaurantData = (
  favorited: boolean = false,
  hidden: boolean = false
): FmUserPost => {
  return {
    id: "IG10987654321",
    restaurant: MockRestaurantData,
    dataSource: {
      sourceUID: "902u2803811",
      provider: FmIntegrationProviders.Instagram,
      media: {
        mediaType: PostMediaTypes.Image,
        videoMediaThumbnailURL: undefined,
        mediaURL:
          "https://s3-media2.fl.yelpcdn.com/bphoto/IdCOSMFtXtKpNDO7U3kqag/o.jpg",
      },
      creationDate: currentDateAsISOString(),
      caption: "",
      permalink: "",
    },
    customUserProperties: MockCustomUserPostProperties,
    creationDate: currentDateAsISOString(),
    isHidden: hidden,
    isFavorited: favorited,
    lastUpdated: currentDateAsISOString(),
    media: {
      mediaType: PostMediaTypes.Image,
      videoMediaThumbnailURL: undefined,
      mediaURL:
        "https://s3-media2.fl.yelpcdn.com/bphoto/IdCOSMFtXtKpNDO7U3kqag/o.jpg",
    },
    creator: MockFMUserData,
    mediaIsVideo: false,
    isChildPost: false,
    userID: "opwiuhdiwohudh03838",
  };
};
