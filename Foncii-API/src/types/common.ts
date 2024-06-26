// Dependencies
// Enums
import { SupportedFonciiPlatforms } from "./namespaces/microservice-api";

/**
 * Type definition declaration for the Foncii API Codebase
 * 
 * Contributors:
 * + Justin Cook - 9/23
 */
declare global {
    /** Shared Universal Types */
    /** Allows conversion to and from a js object to some specified type */
    interface Objectable<O> {
        // Methods
        /**
         * @returns -> A JSON formatted object with all of the user data model
         * object's key value pairs formatted as a plain JS Object
         */
        toObject(): O; // Implement in class instances

        /**
         * Optional implementation because this method is designed to be statically implemented, so 
         * implement it only as a static method in the instances that inherit (implement) this interface.
         * 
         * Creates a new instance of the specified type from the object
         * that conforms to the type's interface but is not an instance (instantiated object) of the type.
         * 
         * @param object 
         * 
         * @returns -> A new instance of the specified type
         */
        fromObject?<T>(object: T): T // Implement in class instances
    }

    /** 
    * Defines some unique data type that has to be differentiated from other similar data types 
    * Note: The ID can be of any type you want, but the standard ID type should be a string or number for simplicity.
    */
    interface Identifiable<UIDDataType> {
        id: UIDDataType;
    }

    /**
     * A simple interface that defines creation and update timestamps 
     * for a dynamic entity that can be mutated at any time.
     * 
     * These timestamps are in the ISO-8601 format.
     */
    interface Updatable extends Creatable {
        lastUpdated: string;
    }

    /**
     * Defines the timestamp of when an entity was created.
     * Dynamic or static, this tracks the creation date of the entity.
     * 
     * Timestamp is in the ISO-8601 format.
     */
    interface Creatable {
        creationDate: string;
    }

    /** Stale date in ISO format that marks when the entity goes 'stale' / expires */
    interface Expirable {
        staleDate: string;
    }

    /**
     * Generic interface for saving entities, saves are attributed to users
     * via their user ID.
     */
    interface Savable extends Identifiable<string>, Creatable {
        /** The user who saved the entity */
        userID: string;
    }

    /** Restaurant Related Types */
    interface FonciiRestaurant {
        restaurant: Restaurant;
        // True if the restaurant was saved by the registered user viewing it, false otherwise
        isSaved: boolean;
        isOpen: boolean;
        // True if the restaurant has a supported reservation integration connected to it, false otherwise.
        isReservable: boolean;
        reservationAvailabilityEdges: [];
        reservationsAvailable: boolean;
        percentMatchScore: number;
        qualityScore: number;
        averageFonciiRating: number;
        averagePercentMatchScore: number;
        influencerInsightEdges: FMUserPost[];
        associatedPostEdges: FMUserPost[];
        associatedArticlePublicationEdges: ArticlePublication[];
        associatedRestaurantAwardEdges: RestaurantAward[];
    }

    /**
     * An entity that signifies a user with the given user ID has saved
     * the restaurant with the given restaurant ID, which is also optionally associated with some
     * user post with the given post ID (if the restaurant was saved via a user post)
     */
    interface SavedRestaurant extends Savable {
        /** ID of the foncii restaurant saved */
        fonciiRestaurantID: string;
        /** Optional post ID used when the restaurant was saved via a user post */
        postID?: string;
    }

    interface RestaurantAutoCompleteSuggestion extends AutoCompleteSuggestion {
        /** Not available when injecting suggestions from Google Places API, when this is missing the restaurant is aggregated from the client when user selects it */
        fonciiRestaurantID?: string;
        /** Used to aggregate a restaurant if the 'fonciiRestaurantID' is not defined meaning the restaurant doesn't exist in our database yet */
        googlePlaceID: string;
        /** Where this suggestion came from [Google, Foncii] */
        source: RestaurantAutoCompleteSuggestionSources;
        /** Cuisines / other categories attributed to aggregated restaurants | Optional for non-aggregated restaurants */
        categories?: string[];
    }

    interface UserPostAutoCompleteSuggestion extends AutoCompleteSuggestion {
        postID: string;
        fonciiRestaurantID: string;
    }

    interface UserAutoCompleteSuggestion extends AutoCompleteSuggestion {
        userID: string;
    }

    interface PopularSearchQuerySuggestion extends AutoCompleteSuggestion { }

    /**
     * Protocol for auto-complete suggestion types
     */
    interface AutoCompleteSuggestion {
        /** The string to match search queries with, used for sorting */
        title: string;
        /** Human-readable description [business name + location properties] | [username] */
        description: string;
        /** Optional preview image for this search result */
        previewImageURL?: string
    }

    /**
     * Union type Describes the possible outputs that will be mixed together in the explore search suggestions 
     * Restaurant suggestions for the user to click on, user suggestions, and or popular search terms / queries 
     * 
     * Popular search queries for the entire explore page
     */
    type ExploreSearchAutoCompleteSuggestion = RestaurantAutoCompleteSuggestion | UserPostAutoCompleteSuggestion | UserAutoCompleteSuggestion | PopularSearchQuerySuggestion;

    /**
     * User posts for when a user is searching while in the user gallery.
     */
    type UserGallerySearchAutoCompleteSuggestion = UserPostAutoCompleteSuggestion;

    /** 
    * Article publication data model that describes the structure of the scraped articles data we persist
    */
    interface ArticlePublication extends Identifiable<string>, Publication, Updatable {
        /** Hashed combination of the url and referenced venue name to keep it unique and deterministic */
        id: string;
        /** Name of the restaurant or bar the article directly references, used in the backend to search for articles by restaurant name */
        venueName: string;
        /** The publication this article was published on (i.e Timeout Eater etc.) */
        publication: string;
        /** When the article was first published in ISO-8601 format (ex. 2023-11-19) */
        publishDate: string;
        /** The time when this article was scraped by our bot */
        scrapeDate: string;
        /** City associated with the publication, in case no full address information is provided */
        city?: string
        /** Optional restaurant address string in case provided by the article */
        address?: string;
        /** Optional text content parsed from the article to store for this publication. Can be used for text embeddings */
        textContent?: string;
        /** 
         * Associated restaurant (if any). We'll keep trying to connect isolated articles to their explicit restaurants whenever 
         * new articles are ingested, such that old isolated articles and new ones can be associated with restaurants when those restaurants become
         * available on Foncii. We obviously can't aggregate a restaurant for every article, that would be insanely expensive so this is the practical
         * approach to solving this association problem.
         */
        restaurantID?: string
    }

    interface RestaurantAward extends Identifiable<string>, Publication {
        /** (Award + award date + restaurant + city) Unique identifier used to identify each batch of scraped publications (ex. michelin_guide_2023_12_31_paradisaea_san_francisco) */
        id: string;
        /** The organization this article was published on (i.e Michelin Guides etc.)*/
        organization: string;
        /** Name of the restaurant or bar the article directly references, used in the backend to geocode to our restaurants */
        venueName: string
        /** Location of the restaurant or bar the article directly references, used in the backend to geocode to our restaurants */
        venueLocation: string
        /** Post geocoded retaurant ID */
        restaurantID: string
        /** When the award was given in ISO-8601 format (ex. 2023-11-19)  */
        awardDate: string;
        /** The time when this article was scraped by our bot */
        scrapeDate: string;
    }

    interface Publication {
        /** The title of the article */
        title?: string
        /** Article link URL uploaded by a user */
        url: string
        /** The description meta tag of the publication's web page loaded and parsed by this server (can't be done client side due to cross site blocks) */
        description?: string
        /** [Computed] The domain name of the website provided by the article's URL */
        websiteDomain?: string
        /** [Computed] The favicon for the website (may not exist, depends on the website) but usually located at 'example.com/favicon.ico', uses the parsed web domain */
        faviconLink?: string
    }

    /** Updatable record for connecting restaurants with external reservation services via our own integration system */
    interface RestaurantReservationIntegration extends Identifiable<string>, Updatable {
        fonciiRestaurantID: string;
        reservationConnections: ReservationConnection[];
    }

    interface ReservationConnection {
        provider: ReservationProviders;
        venueID: string;
        venueAlias: string;
        /** A link to the reservation page which will be used to direct the user to their specified reservation time slot */
        externalURL: string;
    }

    interface ReservationSearchInput {
        /** Size of the party from [min] 1 - 20 [max] */
        partySize: number;
        /** ISO-8601 formatted date string */
        targetDate: string;
    }

    /** Object describing the timeslot when a reservation is presently available given the reservation search criteria */
    interface ReservationAvailability {
        /** The date / day of the availability formatted in ISO-8601 (ex. 2023-11-26T00:00:00.000Z) */
        date: string;
        /** The time of the reservation. Formatted as 24h time (ex. 22:00:00) hh:mm:ss */
        timeSlot: string;
        provider: ReservationProviders;
        venueID: string;
        fonciiRestaurantID: string;
        /** Generic link to the restaurant's detail page on the provider's platform (ex. https://resy.com/cities/ny/borrachito-taqueria-spirits) without parameters */
        externalURL: string;
        /** A link to the reservation page which will be used to direct the user to their specified reservation time slot based on the party size and desired date */
        parameterizedLink: string;
        /** The time when this availability was last fetched from the provider */
        lastChecked: string;
    }

    interface AvailableReservationDaysInput {
        /** Size of the party from [min] 1 - 20 [max] */
        partySize: number;
        /** ISO-8601 formatted date string */
        startDate: string;
        /** ISO-8601 formatted date string */
        endDate: string;
    }

    interface AvailableReservationDays {
        /** Ordered days the venue is reservable */
        daysWithAvailability: string[];
        /** Provider dependent - will communicate when the last possible date is */
        lastDayAvailable: string;
        provider: ReservationProviders;
        venueID: string;
        /** The time when this availability was last fetched from the provider */
        lastChecked: string;
    }

    /**
     * When a user confirms they've scheduled an event for a specific timeslot
     * (they can edit the date and or timeslot to the one they selected on the 
     * provider's website on the client side if it differs from the one they clicked)
     * this is tracked and the user can optionally select to be reminded of the reservation 
     * by Foncii.
     * 
     * If the user opts in to be reminded of the reservation by Foncii then a CRON job is 
     * scheduled to dispatch an email to the user (IF THEY WERE A REGISTERED USER, this 
     * reminder functionality will only be available to registered users, unregistered users
     * will be prompted to create an account to receive reminders about their reservations
     * through Foncii)
     */
    interface Reservation extends Identifiable<string>, Updatable {
        /** ID of the user that made the reservation (only registered users are allowed to make reservations) */
        userID: string;
        /** The ID of the venue used by the external provider's database */
        venueID: string;
        fonciiRestaurantID: string
        /** The time of the reservation in ISO-8601 format, (desired time slot + day to form one valid date) this is used to schedule the reminder */
        reservationTime: string
        provider: ReservationProviders
        /** The actual link to the reservation site's page with the necessary parameters */
        externalURL: string
        /** True if the registered user opted in for email reminders of their reservation */
        reminderScheduled: boolean
        /** 
         * True if the user marks the reservation as cancelled, if this is the case the 
         * scheduled CRON job won't send out the reminder as this field will be checked 
         * to prevent it from doing so
         */
        cancelled: boolean
        /** 
         * True if the scheduled reminder was sent by the CRON job and this entity was updated in the DB.
         * Can be used to track reminder failure rates if reminders weren't sent despite being scheduled
         */
        reminderSent: boolean

        /** 
         * A connector to the intent event that occurred before this event was created 
         * used to bridge this event to its original intent
         */
        intentID: string;
    }

    // Cached Sentiment Analysis Computations //
    /**
     * Updatable and expirable cached sentiment computations for restaurants reviews
     * 
     * Note: The `id` field for these cached computations is the id of the restaurant for which 
     * these computations are associated with.
     */
    interface CachedReviewSentimentComputation extends Identifiable<string>, Creatable, Expirable {
        // Properties
        yelpAvgReviewSentimentScore?: number,
        googleAvgReviewSentimentScore?: number,
    }

    /**
     * Updatable and expirable cached sentiment computations for aggregated restaurant articles and other
     * publications.
     * 
     * Note: The `id` field for these cached computations is the id of the restaurant for which 
     * these computations are associated with.
     */
    interface CachedArticleSentimentComputation extends Identifiable<string>, Creatable, Expirable {
        // Properties
        articleAvgSentimentScore?: number,
        /** Where this article was found */
        articleURL: string,
    }

    interface Restaurant extends Identifiable<string>, Updatable, Expirable {
        // Properties
        googleID: string;
        /** Optional because google is our data anchor and sometimes Yelp doesn't offer this restaurant */
        yelpID?: string;
        name: string;
        /** Optional but mandatory, required to display on the client side. Optional because some restaurants lack Yelp data + Google image collections, so we really can't source anything for them unless manually done. */
        heroImageURL?: string;
        imageCollectionURLs?: string[];
        /** Optional, not every restaurant has a summary */
        description?: string;
        /** Optional, not every restaurant has categories */
        categories?: string[];
        /** Optional, price levels are not always available */
        priceLevel: PriceLevels;
        phoneNumber?: string;
        /** Some restaurants lack operating hour specifications, (i.e in foreign countries) */
        operatingHours?: OperatingHours;
        reservable?: boolean;
        website?: string;
        /** Default is false if not determined. */
        servesAlcohol: boolean;
        /** Clean and decodable representation of this place's physical location. Sent back to the client */
        coordinates: CoordinatePoint;
        /** Used specifically for geospatial queries, and not easily parsed, so don't send this back to the client */
        location: GeoJSONPoint;
        addressProperties: AddressProperties;
        googleProperties: GoogleProperties;
        yelpProperties?: YelpProperties;
        /** 
         * Optional,  some places may not have this attribute specified
         * 
         * Contains the number of minutes this place’s current timezone is offset from UTC. For example, 
         * for places in Sydney, Australia during daylight saving time this would be 660 (+11 hours from UTC), 
         * and for places in California outside of daylight saving time this would be -480 (-8 hours from UTC).
         * https://developers.google.com/maps/documentation/places/web-service/details#Place-utc_offset
         */
        utcOffset?: number;

        // Social Media
        /** Optional social media handles to include for restaurants */
        socialMediaHandles?: {
            instagram?: string;
        }

        // Machine Learning Data
        /** Optional computed embedding encoded by the server when the restaurant is aggregated/updated and stored in the database for vector search */
        collective_embedding?: number[]

        /** 
         * Optional computed embedding for storing text based embeddings via OpenAI's text embedding model. Used for semantic search.
         * Docs: https://platform.openai.com/docs/guides/embeddings
         */
        text_embedding?: number[]

        // Methods
        /**
         * Generates a unique and optionally deterministic Foncii restaurant uid
         * 
         * @param googlePlaceID -> [Optional] GPID to create a deterministic UID from. This will further prevent any duplicates
         * from arising upon insertion of restaurants into the database. If not provided a random hex UID is generated.
         * 
         * @returns -> A Foncii restaurant specific unique identifier string, prefixed with the 'FNCII' substring identifier
         */
        generateRestaurantUID(googlePlaceID?: string): string; // (Foncii Specific Restaurant ID)
    }

    /** Monday thru Sunday operating hours for the given restaurant */
    type OperatingHours = { [key in WeekDays]: string };

    // Location and Geospatial Type Definitions
    /** A tuple of 2 numbers, representing a longitude and latitude, a physical point location on earth */
    interface CoordinatePoint {
        // Properties
        lng: number;
        lat: number;
    }

    /** Different types of GeoJSON Objects */
    type GeoJSONObjectType = 'Point' | 'LineString' | 'Polygon' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon' | 'GeometryCollection';

    /**
     * GeoJSON interface that encompasses many of the different possible types of GeoJSON objects,
     * but in the case of the `GeometryCollection` object, this interface won't suffice. A custom
     * interface will have to be used for that specific object, but we currently don't use that object
     * in this codebase so no worries there.
     */
    interface GeoJSON {
        // Properties
        type: string;
        /** Array of numbers, can be adapted to any specific fixed array size as needed for the different possible GeoJSON objects */
        coordinates: number[];
    }

    /** Valid longitude values are between -180 and 180, both inclusive. */
    type GeoJSONPointLng = number;
    /** Valid latitude values are between -90 and 90, both inclusive. */
    type GeoJSONPointLat = number;

    /**
     * A GeoJSON object representing a single point on a map ~ a coordinate point.
     * This is used for Geospatial searches via the database and can be used when creating 
     * complex database indexes such as 2dsphere indexes. These support queries that calculate 
     * geometries on an earth-like sphere.
     * 
     * https://www.mongodb.com/docs/manual/geospatial-queries/
     */
    interface GeoJSONPoint extends GeoJSON {
        type: 'Point';
        /** 
         * First indexed number must be longitude (lng) and the second indexed number must be latitude (lat)
         * As per MongoDB requirements: 
         * https://www.mongodb.com/docs/manual/geospatial-queries/#:~:text=If%20specifying%20latitude%20and%20longitude%20coordinates%2C%20list%20the%20longitude%20first%2C%20and%20then%20latitude.
         */
        coordinates: [GeoJSONPointLng, GeoJSONPointLat];
    }

    /** Third-party Data Types */
    interface PlaceProperties {
        // Properties
        /** Double between 0 and 5 */
        rating: number;
        /** An external link to the site where the data was sourced for this place (i.e Yelp or Google) */
        externalURL?: string;
    }

    interface GoogleProperties extends PlaceProperties { }
    interface YelpProperties extends PlaceProperties { }

    // Simple entity for containing restaurant address information
    interface AddressProperties {
        formattedAddress: string; // -> Full address
        streetAddress: string; // -> Street name
        zipCode: string; // -> Zip code
        city: string; // -> City name (ex. New York or Brooklyn for sublocalities)
        neighborhood?: string; // Optional, not really returned by places API, reverse geocoding necessary | ex.) Bushwick for NY
        stateCode: string; // -> State Code (ex. NY)
        countryCode: string; // -> Country code (ex. US)
    }

    /** Food Categorization */
    interface DietaryRestriction extends Identifiable<number>, Localizable {
        // Properties
        // ID is of number (Int) type instead of string in order to maintain the desired order of the elements ~ Meal Type ~ Cuisine
        imageURL: string; // URL of the image corresponding to the dietary restriction ~ Cuisine
    }

    interface MealType extends Identifiable<number>, Localizable {
        // ~
    }

    interface Cuisine extends Identifiable<number>, Localizable {
        imageURL: string; // ~
    }

    /** Location Categorization */
    /**
     * Entity that stores the name, id, and state of a corresponding major US City
     */
    interface MajorCity extends Identifiable<number> {
        // Properties
        name: string;
        state: USStates;
        abbreviatedState: AbbreviatedUSStates;
    }

    /** Recommendations */
    /**
     * A data model mapping out the fields for the data shared between yelp and google reviews that we require
     * for other usage cases such as sentiment analysis.
     */
    interface RestaurantReview {
        // The shared attributes between yelp and google restaurant reviews we require for sentiment analysis
        text: string;
    }

    interface Recommendable extends Identifiable<string>, Creatable {
        message: string; // Can be blank ("") or filled with a personal message
        destinationCoordinates: CoordinatePoint; // Some physical location represented by the given coordinates, Describes the location in/around which the user wants a restaurant recommended from, or the location of the restaurant a user is recommending
        accepted: boolean; // True if the recipient accepted the rec / request
        acceptationDate: string; // When the rec / request was formally accepted
    }

    interface RestaurantRecommendationRequest extends Recommendable {
        // Foncii User IDs
        requesterID: string; // Who requested this recommendation
        requesteeID: string; // Who this request will be sent to
    }

    interface RestaurantRecommendation extends Recommendable {
        // Foncii User IDs
        recommenderID: string; // Who recommended this restaurant
        recommendeeID: string; // Who this restaurant will be recommended to
        // Restaurant IDs
        restaurantIDs: string[]; // A set of unique restaurant IDs, (any duplicates are removed)

        // Optional b/c not every recommendation stems from a request
        recommendationRequestID?: string; // A reference to the recommendation request this recommendation follows up (if any)
    }

    /**
     * A unique entry that stores information about a restaurant favorited by
     * a specific user.
     * 
     * A favorited restaurant's ID is a combination of both the userID and restaurantID
     * With the userID coming first to promote a performant index table where all of a user's 
     * favorites are clustered together based on their UID's sort value.
     */
    interface FavoritedRestaurant extends Identifiable<string>, Creatable {
        userID: string; // Foncii User ID
        restaurantID: string; // Foncii Restaurant ID
    }

    /** Foncii App Types */
    /**
     * Defines properties for a friendship record shared between two users
     * to acknowledge their connection to one another
     */
    interface FonciiUserFriendship extends Identifiable<string>, Creatable {
        // An array storing two userIDs corresponding to the two friends in this friendship
        users: string;
    }

    /** Foncii App User Account Related Types */
    interface FonciiUser extends UserAccount {
        // Properties
        // Note: All dates are ISO-8601 strings
        /** User's full name, first and last, and maybe also middle name if desired */
        fullName: string;
        phoneNumber?: string;
        /** Default is false until the person adds their phone number and verifies it via OTP */
        isPhoneNumberVerified: boolean;
        /** Default is false until the person toggles notifs in the application */
        notificationsEnabled: boolean;
        /** A set of tasks to be completed by users as part of the onboarding process */
        profileTasks: FonciiUserProfileTask[];
        /** A unique code used to track app referrals */
        referralCode: string;
        /** A set of favorited restaurants that the user selects when first creating an account */
        firstFavorites: FavoritedRestaurant[];

        // Methods
        generateDefaultProfileTasks(): FonciiUserProfileTask[]
    }

    /**
     * An identifiable task that can be marked as completed by a user.
     * The default completion status is false.
     */
    interface FonciiUserProfileTask extends Identifiable<FonciiUserProfileTasks> {
        isComplete: boolean;
    }

    /** Shared Foncii User Account Related Types */
    /**
     * Describes the properties for a 'last login' / `UserLogin` object
     */
    interface UserLogin {
        authProvider: AuthProviders,
        /** ISO-8601 String */
        loginDate: string
    }

    // Localization Types
    // Interface for any object with text related properties that can be localized
    interface Localizable {
        // Properties
        localizedNames: { [key in LanguageCodes]: string };
    }

    // Note: none aka 0 indicates 'free | unknown' according to Google, but this is reflected
    // as an unknown / N/A on the client side for ease of simplicity
    type PriceLevels = 0 | 1 | 2 | 3 | 4;

    /** 
     * Cascading ranges akin to a reverse of Amazon's ** and up filter
     * Starts at 4 dollar signs and goes down from there, with each 
     * option encompassing 4 dollar signs (inclusive) and all the options below it.
     * When the user selects 4 dollar signs then a weight is applied to all price
     * levels 4 and below, and so on and so on, the only confusion thing about this
     * is that the order of the price levels is reversed, so 0 means 4 and so on.
     */
    type PriceLevelRanges = {
        0: 4, // 4 ($$$$) and below ($$$$), ($$$), ($$), ($)
        1: 3, // 3 ($$$) and below ($$$), ($$), ($)
        2: 2, // 2 ($$) and below ($$), ($)
        3: 1 // 1 ($) and below ($)
    }

    /** Taste Profile Types */
    interface TasteProfile extends Identifiable<string>, Updatable {
        // Properties
        userID: string; // ID of the user this taste profile belongs to, before this was the id, but this will allow for the possibility of switching taste profiles for users by allowing multiple taste profiles for a single user
        spicePreferenceLevel?: (0 | 1 | 2); // Optional integer from 0 - 2 - default value if undefined if no value is given
        adventureLevel?: (0 | 1 | 2); // ~ 0 - Picky eater, 1 - Stays in comfort zone, 2 - Eats anything
        distancePreferenceLevel?: (0 | 1 | 2); // ~
        diningPurpose?: (0 | 1 | 2 | 3) // Optional integer from 0 - 3 - default value is undefined if no value is given
        ambiancePreference?: (0 | 1 | 2 | 3) // ~
        drinkPreference?: (0 | 1 | 2 | 3); // Optional integer from 0 - 3 - default value if undefined if no value is given, Option 4 aka 'Non-alcoholic beverages only' indicates a non-alcoholic beverage preference i.e no alcohol, the others ~ yes alcohol
        preferredCuisines: string[]; // A set of unique cuisine IDs, (any duplicates are removed)
        dietaryRestrictions: string[]; // A set of unique ID strings associated with the dietary restrictions that the user has - default value is an empty array if no value is given
        preferredPriceRange?: (0 | 1 | 2 | 3); // Optional integer from 0 - 3 - default value is undefined if no value is given | 0.) 4 ($$$$) and below ($$$$), ($$$), ($$), ($) 1.) 3 ($$$) and below ($$$), ($$), ($) 2.) ($$) and below ($$), ($), 1.) ($) and below ($)

        /** Optional computed embedding encoded by the server when the taste profile is created/updated and stored in the database for vector search */
        collective_embedding?: number[]

        // Limits
        // Answer Index Ranges | All questions are optional, but these restrictions are enforced for the questions that are answered
        // Single Answer Questions
        spicePreferenceLevelAnswerRange?: [0, 2]
        adventureLevelAnswerRange?: [0, 2]
        distancePreferenceLevelAnswerRange?: [0, 2]
        diningPurposeAnswerRange?: [0, 3]
        ambiancePreferenceAnswerRange?: [0, 3]
        drinkPreferenceAnswerRange?: [0, 3]
        preferredPriceRangeAnswerRange?: [0, 3]

        // Multiple Choice Answer Quantity Ranges
        // The max amount of multiple choice answers allowed for each cuisine, dietary restriction, meal type preference etc, question, to ensure no unbounded behavior
        preferredCuisinesAnswerLimit?: 20;
        dietaryRestrictionsAnswerLimit?: 20;

        // Value Ranges
        // Min is 1, max is 4 (inclusive), anything outside of this range is not available on the client side and will not be interpreted here, a default value will be used in that case.
        priceLevelMinMaxValue?: [1, 4]; // $ $$ $$$ $$$$

        // The price level ranges that correspond to the answers for the price level question
        PriceLevelRanges?: PriceLevelRanges

        /**
        * Depicts the maximum radius for each distance preference Level in meters [1, 10, 100, 1000, 10000]
        */
        TravelDistancePreferenceMaxRadii?: {
            0: 8050, // ~ >= 0 && < 5 miles
            1: 16093, // ~ >= 5 && < 10 miles
            2: 16093, // ~ >= 10 miles
        }

        // Methods
        /**
         * Determines and returns the maximum radius for the user's travel distance preference level in meters [m]
         * if the user has specified it.
         * 
         * @returns -> The maximum radius (number) for the user's travel distance preference level in meters [m], undefined if the user hasn't specified it yet
         */
        getUserTravelDistancePreferenceMaxRadius(): number | undefined
    }

    /** Foncii Maps Types */
    /** Integration support for various third-party platforms that we can import from */
    interface FMIntegrationCredential extends Identifiable<string>, Updatable, Expirable {
        /** Foncii User ID used to fetch this integration credential */
        userID: string;
        provider: FMIntegrationProviders;
        /** App-scoped user identifier */
        appUID: string;
        /** User's platform specific username provided by the integration (if any, ex.) Instagram offers this field) */
        appUsername?: string;
        /** Some expirable access token, either short lived or long lived depending on the integration */
        accessToken: string;
        /** 
         * When enabled the auth token is automatically refreshed when the user starts a new session,
         * (if the token needs to be refreshed in the first place). Default is true. 
         * This is so we don't waste operations on users that don't log in for extended periods of time, plus
         * it's bad practice to persist auth tokens indefinitely without some input / interaction from the user. 
         */
        autoRefresh: boolean;
        /** 
         * The timestamp when the user's last import occurred. This is undefined when
         * the credential is first provisioned, and updated upon successful imports.
         * ISO-8601 formatted date string
         */
        lastImport?: string;
    }

    /** Foncii Maps User Account Related Types */
    interface FMUser extends UserAccount {
        /** Personal name of the user */
        firstName: string;
        lastName: string;
        /** Custom name for the user's map if they choose to define one, default value is their username */
        mapName: string;
        /** 
         * The ID of the current taste profile the user is using for their percent match ranking, 
         * undefined if the user hasn't created a taste profile yet or has deleted all of their existing taste profiles
         */
        primaryTasteProfileID?: string;
        /**
         * False if a person still needs to claim an autogenerated account, true otherwise.
         * Used to trigger the onboarding flow for new users that are just getting access to their unclaimed account.
         */
        isClaimed: boolean
    }

    interface UserAccount extends Identifiable<string>, Updatable {
        /** Optional field, used when users provide a phone number as an auth method or point of contact */
        phoneNumber?: string,
        /** Mandatory field, provided either by the user or some OAuth provider */
        email: string;
        username: string;
        /** A mutable set of unique auth providers connected to the user's account */
        authProviders: AuthProviders[];
        /** Custom code containing the user's shuffled around ID that's used to track their referrals to other users */
        referralCode: string;
        /** URL to the user's profile picture image (if provided) */
        profilePictureURL?: string;
        lastLogin: UserLogin;
        /** The date when the user last manually logged out ISO-8601 format, not updated if a forced sign-out is conducted. */
        lastSignOut?: string;
        /** 
         * A custom role denoting the user's access level across the application
         * A user's role can increase from `Basic` to `Creator` if they sign up for the business site.
         */
        role: UserRoles
    }

    interface UserAccountModel {
        // Methods - Implement in class instances
        generateUserLogin?(authProvider: AuthProviders): UserLogin
    }

    /** User Referral Record shared across all user accounts */
    interface UserReferral extends Identifiable<string>, Creatable {
        referrerCode: string;
        refereeCode: string;
    }

    /** Foncii Maps User Post Related Types */
    interface FMUserPost extends Identifiable<string>, Updatable {
        // Allow any other extraneous fields (for GraphQL resolvers for the 'fonciiRestaurant' computed field etc)
        [x: string]: any

        // Properties
        userID: string;
        /** Foncii-scoped restaurant UID */
        fonciiRestaurantID?: string;
        dataSource?: PostDataSource;
        customUserProperties: CustomUserProperties;
        isFavorited: boolean;
        /** Optional, updated after the post is created and the corresponding media is uploaded Foncii's storage containers */
        media?: FMUserPostMedia;
        /** Optional, ~ main media field */
        secondaryMedia?: FMUserPostMedia[];
        parentPostID?: string;
        /** True if the post should be deleted asynchronously, null otherwise */
        deletionPending?: boolean;
        /** UTC time in MS indicating the date at midnight (UTC) the post should be deleted, null if the post isn't marked for deletion, null if the post isn't marked for deletion */
        scheduledDeletionTimestamp?: number;
    }

    /** 
     * Modular media encapsulation for Foncii Maps Posts, allows for video and image media resource locators
     * to be stored without breaking changes. Also allows for media edges to also be stored if supported later on.
     */
    interface FMUserPostMedia {
        /** Media resource locators */
        /** URL pointing to the original media resource, in the case of Facebook's CDN (it expires after 1-2 days) */
        mediaURL: string;
        /** Optional URL, meant for a video based media's thumbnail (if the media type is of type 'VIDEO') */
        videoMediaThumbnailURL?: string;
        /** Identifies whether the post is a video or an image of a supported file type */
        mediaType: PostMediaType;
    }

    /** 
     * Modular data source populated by Foncii Maps Integrations that aggregate 
     * social media posts from external sources.
     */
    interface PostDataSource {
        /** Source Identifier */
        provider: FMIntegrationProviders;

        // Metadata
        /** 
         * The real non-app-scoped UID of the post's data source. This is the same UID you'd see when viewing the data source on the
         * provider's production site. This is either populated when scraping some data provider instead of directly connecting to 
         * their dedicated integration API service. Or when parsing the permalink of newly imported posts from a dedicated integration. The
         * purpose of this field is to prevent duplicate data from being inserted into the database by having a permanent source of truth alongside
         * the existing sourceUID field which is used to compare integration imported posts to other integration imported posts; now both
         * scraped and imported posts can now be compared and deduplicated freely.
         */
        liveSourceUID?: string;
        /** The app-scoped (Facebook) or global unique identifier (UID) of the post directly from the original data source */
        sourceUID: string;
        /** Simple description of the post generated by the user, optional b/c some sources might not support captions or they may be optional there as well */
        caption?: string;
        /** Non-expirable link to the original post, optional in the case of Instagram where posts include Copyrighted media / audio */
        permalink?: string;
        /** ISO-8601 formatted original creation date of the post */
        creationDate: string;

        // Media
        media: FMUserPostMedia;

        /** Optional secondary media / edges */
        secondaryMedia?: FMUserPostMedia[];
    }

    // Union Types
    type PostMediaType = 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';

    /**
     * A set of optional custom user defined properties for a Foncii Maps post
     * that a user can create in order to make the post more high fidelity and niche
     * such as custom categories that connect one post with others.
     */
    interface CustomUserProperties {
        /**
         * Notes defined by the user. Also auto-filled by post captions from imported user posts from Instagram and other
         * applicable sources if available.
         */
        notes: string;
        /**
         * Auto-filled from imported posts if the post has a caption with hashtags
         */
        categories: string[]; // User defined tags
        /**
         * A user rating from 1 - 5, rating their experience at the establishment associated with the post
         */
        rating: number; // Custom user rating
    }

    /** High-level Protocols **/
    interface StaticCategoryManager {
        // Methods
        // Generic method to generate computed entities of a given type (cuisine, meal type etc.)
        generateEntities<T>(): T[]
    }

    /** User Management and Event Analytics Types */
    // Important: ALL click / view events are clamped to a maximum of 5 per user per 24 hours to prevent
    // fraudluent business metrics through analytics abuse. Search events and other unlimited event types
    // are not limited because they provide useful insights and don't directly correlate to the data integrity 
    // of businesses and creators, this information must be highly accurate and indicative of their performance on the platform
    // as it directly ties into their profitability and monetary compensation. The more trusted Foncii is as a B2B provider, the better.

    /**
     * A trackable search query to pass through analytics pipelines. What this
     * enables us to do is to track queries and associate them with conversion events 
     * (views / clicks / favorites / shares )
     */
    interface ExploreSearchEvent extends FonciiEvent {
        /** 
         * Query id, also used for the actual id, generated on the server, passed to the client, and then passed back to 
         * the server to identify this query from a successful search output. Not stored in the database since it's used
         * to generate the id of the document itself. 
         */
        queryID?: string

        /** 
         * Search query used by the user. An empty string if they're only 
         * searching by location and haven't typed anything yet. This can be used
         * to suggest popular search terms dynamically to users when they're typing on the client
         * for auto-complete suggestions.
         */
        query: string
        /** Area where the user is searching */
        searchLocation: CoordinatePoint
        /** Zoom level of the view port, can be used to calculate the search area's radius */
        zoomLevel: number
        /** (Optional) Physical location of the client at the time of the request */
        clientLocation?: CoordinatePoint
        /** Any user tags the user used to filter their current search by */
        tags: string[]
        /** Cuisines / any other categories the user used to filter their current search by */
        cuisines: string[]
        /** Price levels the user used to filter restaurants by */
        prices: number[]
        /** True if the search was from the user pressing the manual 'search here' button, false otherwise */
        isManualSearch: boolean

        /** Max: 20, min: 1 */
        partySize: number
        /** ISO-8601 formatted date string */
        reservationDate: string

        /** 
         * URL at the time of the user's search. Allows us to gain further 
         * insights into what the user is doing at this specific time (i.e
         * what filters they have applied as this is stored in the URL state etc)
         * And filters can be parsed from the URL state and returned like normal for 
         * further analysis when aggregating data from the database.
         */
        sourceURL: string

        /**
         * The IDs of all of the candidates this search resulted in.
         */
        candidateIDs: string[]

        /**
         * A list of auto-complete suggestions generated by this search event.
         */
        autoCompleteSuggestions: string[]

        /**
         * This is a very useful insight to make as it directly ties in the percent match score's
         * to the search query at hand. Effectively creating a track record of how well the 
         * algorithm performs over time with the same conditions given a larger dataset or
         * more fine tuned parameter weights.
         * 
         * Optional because % match isn't available for everyone
         */
        averagePercentMatchScore?: number

        /**
         * ~ Percent Match score, but not optional since this attribute is always computed
         */
        averageQualityScore: number
    }

    /**
     * The gallery is local, but users can search locally. This allows us to see
     * what the users are searching for for specific user galleries and 
     * be able to provide search insights for creators and search 
     * suggestions specific to creators and their galleries based on
     * what their audience has been searching for via gallery auto-complete suggestions.
     * 
     * Visitors can access explore suggestions from user galleries, but authors can access
     * suggestions from their own gallery to simplify navigating their gallery and modifying / organizing
     * their content.
     */
    interface UserGallerySearchEvent extends FonciiEvent {
        /** 
         * User ID of the author of the gallery.
         */
        authorUID: string

        query: string
        /** 
         * Area where the user is searching, this doesn't do anything for user galleries, 
         * but it's still interesting to see where users are searching around
         * to kind of hint to influencers where they should be making content (!)
         */
        searchLocation: CoordinatePoint
        zoomLevel: number
        clientLocation?: CoordinatePoint

        /** Any user tags the user used to filter their current search by */
        tags: string[]
        /** Cuisines / any other categories the user used to filter their current search by */
        cuisines: string[]
        /** Price levels the user used to filter restaurants by */
        prices: number[]

        partySize: number
        reservationDate: string

        sourceURL: string

        /**
         * The IDs of all of the candidates this search resulted in.
         */
        candidateIDs: string[]

        /**
         * A list of auto-complete suggestions generated by this search event.
         */
        autoCompleteSuggestions: string[]

        averagePercentMatchScore?: number
        averageQualityScore: number
    }

    /**
     * Used when users make reservation searches from 
     * the detail view of a restaurant. Either automatically or manually
     */
    interface ReservationSearchEvent extends FonciiEvent {
        fonciiRestaurantID: string
        /** ID of the post author if the reservation search was done from a user post */
        authorUID?: string

        /** (Optional) Physical location of the client at the time of the request */
        clientLocation?: CoordinatePoint

        /** Max: 20, min: 1 */
        partySize: number
        /** ISO-8601 formatted date string */
        reservationDate: string

        sourceURL: string
    }

    /** 
     * Note: A single user's view count for a post is limited to 5 views within a 
     * 24 hour period of time like how YouTube does it (they might do 4, but we need higher metrics so 5 is good). 
     * Any views over this amount are not persisted to the  database for subsequent analytics purposes, although 
     * Amplitude will record these events as they are still valid as platform analytics, 
     * but not valid for our business metrics.
     * 
     * Also for hidden posts this event cannot be triggered on the client side. On the server
     * we won't check if the post is hidden as this is too much operational overhead, it's best to let
     * the integrity of the system justify not checking, as hidden posts are never available 
     * to the public under any circumstance. The isHidden field is a custom resolved field with specific criteria
     * and not a database boolean to toggle on or off. Posts do have isHidden as a legacy field, however, it's not
     * used right now.
     */
    interface PostViewEvent extends FonciiEvent {
        postID: string
        /**
         * User ID of the author of the post being viewed.
         */
        authorUID: string
        /** 
         * ID of the restaurant associated with the post at the time of the event, 
         * for easy querying, and to ensure this information isn't lost when
         * using an aggregation pipeline and the post has changed / is deleted
         */
        fonciiRestaurantID: string
        /** 
         * How well this user matches with the restaurant, can determine engagement rates relative to % match predictions 
         * or just the accuracy of % match predictions in general.
         */
        percentMatchScore?: number
        /** 
         * Used to measure the same metrics as % match but for unregistered users as 
         * the quality algo is used in place of % match when no account / taste profile is present
         */
        qualityScore: number

        shareEventID?: string
        referrer?: string
    }

    // ~ Same thing applies for restaurant views and all views for that matter
    interface RestaurantViewEvent extends FonciiEvent {
        fonciiRestaurantID: string
        percentMatchScore?: number
        qualityScore: number

        shareEventID?: string
        referrer?: string
    }

    interface UserGalleryViewEvent extends FonciiEvent {
        /** 
         * User ID of the author of the gallery. Note the author's views can
         * in fact count towards their own view count, but only up to 5
         * like for all of the other view / click events.
         */
        authorUID: string

        /**
         * Measures how well the viewer's taste profile matches the author's
         * taste profile. Can be used to determine the accuracy of these 
         * similarity score predictions as well in order to see if we 
         * need to fine tune or introduce more parameters to boost the real
         * world accuracy. 
         * 
         * Note: Both users must be registered and have primary taste profiles
         */
        userSimilarityScore?: number

        /** 
         * Optional ID of the share event fired when a user shared a link.
         * Can be used to track campaigns and engagement through specific users and their
         * active advertising of the site. Can also be used to determine whether or not a shared
         * link was actually shared or not, and how successful it was, as well as the places it 
         * was shared.
         */
        shareEventID?: string

        /** Optional URL of the referrer (the webpage that sends visitors to your site using a link) */
        referrer?: string
    }

    /** For public posts (media complete posts with associated restaurants) only */
    interface PostClickEvent extends FonciiEvent {
        postID: string
        authorUID: string
        fonciiRestaurantID: string
        percentMatchScore?: number
        qualityScore: number

        /** If this view event was from another user post */
        sourcePostID?: string
        /** If this view event was from a restaurant */
        sourceFonciiRestaurantID?: string
        sourceURL?: string

        /** The search query typed into search bar that populated the auto-complete drop down the user used to click on this post */
        autoCompleteQuery?: string
    }

    interface RestaurantClickEvent extends FonciiEvent {
        fonciiRestaurantID: string
        percentMatchScore?: number
        qualityScore: number

        /** If this view event was from a user post via the 'similar restaurants section' */
        sourcePostID?: string
        /** If this view event was from another restaurant via the 'similar restaurants section' */
        sourceFonciiRestaurantID?: string
        /** The URL location the click event was triggered from */
        sourceURL?: string

        /** The search query typed into search bar that populated the auto-complete drop down the user used to click on this restaurant */
        autoCompleteQuery?: string

        /** ID of the explore search query event that's responsible for presenting this restaurant which was clicked */
        queryID?: string
    }

    interface MapPinClickEvent extends FonciiEvent {
        /** Always defined because a post must be associated with a restaurant in order to be displayed on the map as a pin */
        fonciiRestaurantID: string
        /** Defined only when the pin represents a user post (i.e when the user gallery is active) */
        postID?: string
        /** Defined only when the pin represents a user post (i.e when the user gallery is active) */
        authorUID?: string
        percentMatchScore?: number
        qualityScore: number
        sourceURL: string
    }

    interface ShareEvent extends FonciiEvent {
        /** Generated UID used to track the shared URL generated by the client */
        shareEventID: string
        shareEventType: ShareEventType
        destination: ShareSheetDestination
        /** 
         * Origin point of the event, the URL state when the share event was triggered
         */
        sourceURL: string
    }

    /**
     * Tracks the intent to make a reservation via the user clicking on 
     * the target reservation link / timeslot
     */
    interface ReservationIntentEvent extends FonciiEvent {
        outcome: ReservationIntentOutcome;

        /** The ID of the venue used by the external provider's database */
        venueID: string;

        /** 
         * The user post the reservation is intending to be made from + author UID, can be used to measure influencer conversion rates relative
         * to successful reservations.
         */
        authorUID?: string
        postID?: string

        fonciiRestaurantID: string

        percentMatchScore?: number
        qualityScore: number

        /** Hours based time slot of the reservation */
        timeSlot: string
        /** Day of the target reservation */
        reservationDate: string
        provider: ReservationProviders
        /** The actual link to the reservation site's page with the necessary parameters */
        externalURL: string
    }

    /**
     * Used to track a reservation event for analytics
     */
    interface ReservationEvent extends FonciiEvent {
        /** 
         * A connector to the intent event that occurred before this event was created 
         * used to bridge this event to its original intent
         */
        intentID: string;
        /**
         * ID of the actual reservation which can be updated / marked as cancelled by the user
         */
        reservationID: string;

        /** ID of the user that made the reservation (only registered users are allowed to make reservations) */
        userID: string;
        /** The ID of the venue used by the external provider's database */
        venueID: string;

        /** The user post the reservation was made from + author UID, used to attribute reservations to influencer conversions */
        authorUID?: string
        postID?: string

        fonciiRestaurantID: string

        // Can be used to measure the effectiveness of % match relative to reservation conversions
        percentMatchScore?: number
        qualityScore: number

        /** The time of the reservation in ISO-8601 format, (desired time slot + day to form one valid date) this is used to schedule the reminder */
        reservationTime: string
        provider: ReservationProviders
        /** The actual link to the reservation site's page with the necessary parameters */
        externalURL: string
        /** True if the registered user opted in for email reminders of their reservation */
        reminderScheduled: boolean
    }

    interface ReservationCancellationEvent extends FonciiEvent {
        /**
         * ID of the actual reservation which can be updated / marked as cancelled by the user
         */
        reservationID: string

        /** ID of the user that made the reservation (only registered users are allowed to make reservations) */
        userID: string;
        /** The ID of the venue used by the external provider's database */
        venueID: string;

        fonciiRestaurantID: string

        /** The time of the reservation in ISO-8601 format, (desired time slot + day to form one valid date) this is used to schedule the reminder */
        reservationTime: string
        provider: ReservationProviders
        /** The actual link to the reservation site's page with the necessary parameters */
        externalURL: string

        /**
         * Optional brief description as to why the user cancelled their reservation.
         */
        reason?: string
    }

    // TBA + ReservationReview entity
    // interface ReservationReviewEvent

    interface BusinessWebsiteClickEvent extends FonciiEvent {
        fonciiRestaurantID: string
        /** Optional ID of the post the restaurant's website was clicked from */
        postID?: string
        /** Optional ID of the author whose map was used to click the restaurant's website from */
        authorUID?: string

        // Can be used to measure % match effectiveness relative to cross-platform conversions for creators
        percentMatchScore?: number
        qualityScore: number

        sourceURL: string
        /** URL of the business' website */
        destinationURL: string
    }

    /**
     * A user clicked the link to the source of an imported post (Instagram, Tik Tok)
     * Can be used to gauge cross-platform user conversion events like a person
     * following the influencer using Foncii as the medium for their discovery.
     */
    interface PostSourceLinkClickEvent extends FonciiEvent {
        fonciiRestaurantID: string
        postID: string
        authorUID: string

        // Can be used to measure % match effectiveness relative to cross-platform conversions for creators
        percentMatchScore?: number
        qualityScore: number

        sourceURL: string
        // The URL to the post on the original site that was clicked 
        destinationURL: string
        // The destination platform where the post was originally imported from
        destinationPlatform: FMIntegrationProviders
    }

    interface ArticlePublicationClickEvent extends FonciiEvent {
        fonciiRestaurantID: string
        postID?: string
        authorUID?: string

        // Can be used to measure % match effectiveness relative to article publication appearance
        percentMatchScore?: number
        qualityScore: number

        sourceURL: string
        // The URL to the article
        destinationURL: string
        // Publication provider of the article 'New York Times' etc. This is a string because there's no set amount of these publications
        // but their naming scheme stays the same in string form so no need to worry about deviations and malformed publication strings
        publication: string
    }

    interface UserProfilePictureUpdateEvent extends FonciiEvent {
        platform: SupportedFonciiPlatforms
    }

    /** 
     * Fired when a post is created
     */
    interface PostCreationEvent extends FonciiEvent { }

    /** 
     * Fired when a post is updated in any capacity (custom user properties or media updates etc)
     */
    interface PostUpdateEvent extends FonciiEvent { }

    /** 
     * Fired when a post is finally deleted (not just marked for deletion) 
     */
    interface PostDeletionEvent extends FonciiEvent {
        /** 
         * Keeps a record of the post's data at a specific point in time
         */
        userPostData: FMUserPost
    }

    /**
     * Fired when a restaurant is saved or unsaved via restaurant specific UI interaction 
     * or user post UI interactions
     */
    interface RestaurantSaveEvent extends FonciiEvent {
        /**
         * True if the restaurant was saved, false otherwise (unsaved)
         */
        saved: boolean;
        fonciiRestaurantID: string
        /** Optional post ID used when the restaurant was saved / unsaved via a user post */
        postID?: string;
    }

    interface TasteProfileCreationEvent extends FonciiEvent {
        /** 
         * Stores the current state of the user's taste profile at the time of the update.
         * Used to compute the differences over some period of time and analyze how people's
         * taste change over time and maybe plot this on a graph. Or even use this as a change
         * log for users to see or revert their taste profile back to certain points in time like a 
         * commit history.
         */
        tasteProfileData: TasteProfile
        /**
         * True if the taste profile was automatically generated, false otherwise
         */
        autoGenerated: boolean
        /**
         * True if this taste profile was generated using the default configuration instead of a custom 
         * auto generation approach or questionnaire based approach.
         */
        isDefault: boolean
    }

    interface TasteProfileUpdateEvent extends FonciiEvent {
        tasteProfileData: TasteProfile
    }

    interface TasteProfileDeletionEvent extends FonciiEvent {
        tasteProfileData: TasteProfile
    }

    interface FonciiBizEvent extends AnalyticsEvent {
        /**
         * The type of event this is, can be used to cluster similar events together.
         */
        eventType: FonciiBizEvents;
    }

    interface FonciiEvent extends AnalyticsEvent {
        /**
         * The type of event this is, can be used to cluster similar events together.
         */
        eventType: FonciiEvents;
    }

    interface AnalyticsEvent extends Identifiable<string> {
        /**
         * User ID of the user who performed the event (if done by a registered user)
         */
        userID?: string;
        /**
         * Valid BSON UTC datetime value, UTC date time,
         * the time when this event was recorded.
         */
        timestamp: Date;
        /** Optional session ID to attribute this event to a specific user session */
        sessionID?: string
    }

    /**
     * An interface that defines some arbitrary time-based limitation for a limitable Foncii event.
     * Allows events to be controlled with more granularity.
     */
    interface FonciiEventObservationLimit {
        eventType: FonciiEvents
        /** The maximum number of times an event can be tracked within the observation period (ex. 3 views per video every 24 hours) */
        maximumEventFrequency: number
        /** The amount of time in [ms] this limit is applicable for (ex. 1 minute ~ 60 * 1000[ms])  */
        observationPeriod: number
    }

    /**
     * Note: The session's duration depends on when it was last updated. A session
     * that has 'ended' is one where the last update exceeds a certain time threshold.
     * And an 'alive' session is one where the last update falls within a certain 
     * time threshold as well. A session is kept 'alive' with periodic 'heart beat' signals
     * the server receives. 
     */
    interface UserSession extends Identifiable<string>, Updatable {
        /** Optional because not all users are logged in */
        userID?: string
        /** The platform this user session is currently hosted on */
        platform: SupportedFonciiPlatforms
        /** 
         * Always available and can be used to track user sign up conversions /
         * retention rates based on anonymous users (users without userIDs / accounts)
         * using the application before having an established account. This period before
         * having an account is the time before the creation date of the user's account, and 
         * if the creation date of this session falls within that period then this can be 
         * used to say the person was converted into a user account, and what they did prior
         * to creating an account was XY and Z based on what we track in Amplitude and in our DB.
         * 
         * Provided by Amplitude, since that's easier than setting it up from scratch which can
         * be tedious and unreliable and a hassle to maintain and verify.
         */
        deviceID: string
        /**
         * String that stores information about the user's device, browser, or app version. This data can help optimize 
         * the platform for different devices and identify any compatibility issues.
         */
        userAgent: string
        /**
         * The operating system the user's client is operating on
         */
        operatingSystem: string
        /**
         * The preferred language of the user 'the browser's current language'
         */
        language: string
        /**
         * Storing IP addresses could help in fraud detection, location-based personalization, and security.
         * Can also be used to determine the user's location using the MaxMind DB: https://www.maxmind.com/en/geoip-databases
         */
        ipAddress?: string
        /**
         * An array tracking the user's physical location throughout the session's duration (if provided)
         * via coordinate points
         */
        clientGeolocationHistory: CoordinatePoint[]
        currentClientGeolocation?: CoordinatePoint
        /**
         * Referrer URL Information: Track where users are coming from (e.g., referral links, social media, direct traffic) 
         * to understand your platform's sources of traffic. Useful to see where a user starts their session from, 
         * (Instagram, or Twitter, or Reddit, our App, or just google)
         */
        referrer?: string
        /**
         * In milliseconds [ms]
         * Calculating and storing the session duration can provide insights into user engagement.
         * Computed and stored when the session ends.
         */
        sessionDuration: number
        /**
         * [Computed] True if the session's last heart beat aka update occurred 
         * within the max time threshold, false otherwise (session ended).
         * 
         * Also false if the session was terminated by the user or some internal 
         * service.
         */
        isAlive?: boolean
        /**
         * [Computed] True if the user's client has sent a heart beat signal within the last minute, false otherwise
         * or if the session is not alive anymore.
         * 
         * Note: A webhook can be used to determine if a user is online or not if needed later on, this isn't
         * a way to determine if a user is online in real-time. A webhook connection is simple enough to determine that
         * (webhook socket connected == online, webhook socket disconnect == user offline, and a client simply subscribes to any of those connections)
         * A user's client could be connected to a webhook and this updates their account in the DB to say 'online', and 
         * from this a separate webhook can fire from the DB for streaming the changes as they happen, and from this a 
         * webhook subscription through Apollo GQL can be subscribed to by other clients to observe changes to that one user's client based on their own
         * personal webhook connection that updates their account in the database in real-time and subsequently any subscribed clients in real time as well.
         */
        isActive?: boolean
        /**
         * True if the latest location does not match up with the latest history 
         * ~ the user is hundreds of miles away from their last reported location.
         * Doesn't do anything for now, but good logic to maintain for security purposes down the line.
         */
        isSuspicious: boolean
        /**
         * User sessions are marked as terminated when the user closes their client or logs out or if a
         * new session is created on the same device that a live session is already being used on.
         * 
         * Note: User sessions that die out due to lack of heart beat are not marked as terminated.
         */
        terminated: boolean
        /**
         * Optional Amplitude session ID passed from the client to track occurrences across our own session management system 
         * and Amplitude's.
         */
        amplitudeSessionID?: number
    }

    // Analytics
    /** A time series entry containing data for a single chart category (data points + time stamps at which those data points occur)  */
    interface AnalyticsTimeSeriesEntry {
        /**
        * Optional category value / name to identify this time series entry with in order
        * to group other similar entries together or differentiate entries from one another
        */
        category?: string,
        /**
        * A list of formatted date strings that indicate when each data point in this time series
        * was observed / recorded
        */
        timestamps: string[],
        /** A list of data points spread across some timeline indicated by the labels field */
        data: number[]
    }

    /** A distribution of some metric, ex.) User tags, and how many tags there are with the same name (category) via grouping */
    interface AnalyticsDistribution {
        /**
        * The categorical name to display for this entity (restaurant name or anything else that identifies what this metric
        * quantitatively identifies)
        */
        category: string,
        /**
        * The total count of this entity. This is used to determine the percentage this entity represents out of some
        * larger dataset.
        */
        count: number
    }

    /** Time based enums and types */
    interface TimeFrame {
        start: TimePoint,
        end: TimePoint
    }

    interface TimePoint {
        day: WeekDays
        /** In 24 hour military / UTC time */
        hour24: number,
        /** 12 hour clock, normal for most of the world */
        hour12: number,
        minutes: number,
        meridianTime: MeridianTime,
        /** 
         * In milliseconds [ms], the current time with UTC offset accounted for 
         */
        currentTime: number
    }

    /**
     * General interface that defines a database document / record for storing a secure
     * JWT refresh token alongside its non-sensitive metadata. This allows refresh tokens
     * to be single use and ultimately prevent replay attacks.
     */
    interface RefreshTokenRecord extends Identifiable<string>, Creatable {
        userID: string,
        token: string,
        expirationDate: string,
        invalidated?: boolean
    }
}

/** Enums */
export enum AnalyticsTimespan {
    ONE_WEEK = "ONE_WEEK",
    TWO_WEEKS = "TWO_WEEKS",
    ONE_MONTH = "ONE_MONTH",
    SIX_MONTHS = "SIX_MONTHS",
    ONE_YEAR = "ONE_YEAR",
    TWO_YEARS = "TWO_YEARS"
}

export enum ShareEventType {
    userGallery = 0,
    restaurant = 1,
    userPost = 2,
    referral = 3
}

/** The different possible outcomes / types for reservation intents */
export enum ReservationIntentOutcome {
    /** Yes ~ User made a reservation successfully */
    confirmed = 0,
    /** Just Looking ~ User was just browsing passively */
    passive = 1,
    /** No ~ User did not make a reservation (either failed to book to reservation) */
    failed = 2
}

export enum InfluencerLeaderboardCategory {
    TOP_RATED = 'TOP_RATED',
    TRENDING = 'TRENDING',
    NEW = 'NEW'
}

/** Meridian Time Periods */
export enum MeridianTime {
    AM = 'AM',
    PM = 'PM'
}

/** Foncii consumer platform events */
export enum FonciiEvents {
    EXPLORE_SEARCH = "EXPLORE_SEARCH",
    USER_GALLERY_SEARCH = "USER_GALLERY_SEARCH",
    RESERVATION_SEARCH = "RESERVATION_SEARCH",
    /** 
     * A reservation intent is an action intended by a user to make a reservation at an establishment.
     * If the user successfully makes a reservation and reports it to our services then a successful 
     * reservation is registered in our system. A reservation is able to be transitioned by 
     * external inputs such as a user cancelling a reservation and informing us (or anything we see fit down the line).
     */
    RESERVATION_INTENT = "RESERVATION_INTENT",
    /**
     * Fired when a user clicks on a restaurant's website link
     */
    BUSINESS_WEBSITE_CLICK = "BUSINESS_WEBSITE_CLICK",
    RESTAURANT_CLICK = "RESTAURANT_CLICK",
    POST_CLICK = "POST_CLICK",
    MAP_PIN_CLICK = "MAP_PIN_CLICK",
    POST_SOURCE_LINK_CLICK = "POST_SOURCE_LINK_CLICK",
    ARTICLE_PUBLICATION_CLICK = "ARTICLE_PUBLICATION_CLICK",
    /**
     * A view of a user / influencer's map / post gallery
     */
    USER_GALLERY_VIEW = "USER_GALLERY_VIEW",
    POST_VIEW = "POST_VIEW",
    RESTAURANT_VIEW = "RESTAURANT_VIEW",
    TASTE_PROFILE_CREATION = "TASTE_PROFILE_CREATION",
    TASTE_PROFILE_UPDATE = "TASTE_PROFILE_UPDATE",
    TASTE_PROFILE_DELETION = "TASTE_PROFILE_DELETION",
    USER_PROFILE_PICTURE_UPDATE = "USER_PROFILE_PICTURE_UPDATE",
    POST_CREATION = "POST_CREATION",
    POST_UPDATE = "POST_UPDATE",
    POST_DELETION = "POST_DELETION",
    SAVED_RESTAURANT = "SAVED_RESTAURANT",
    UNSAVED_RESTAURANT = "UNSAVED_RESTAURANT",
    SHARE = "SHARE"
}

/** Foncii business platform events */
export enum FonciiBizEvents { }

/**
 * The platforms users can choose to share 
 * various pages from the application to
 * using the provided title and description context
 */
export enum ShareSheetDestination {
    /** The user simply copied the link to their clipboard instead of choosing one of the platforms */
    Clipboard = 0,
    Reddit = 1,
    Twitter = 2,
    Facebook = 3,
    WhatsApp = 4,
    LinkedIn = 5,
    /** Device / system share sheet triggered by the browser API */
    System = 6
}

/**
 * Keeps track of where a specific auto-complete search suggestion was 
 * derived from since multiple sources can be combined to produce a single set of suggestions.
 */
export enum RestaurantAutoCompleteSuggestionSources {
    Foncii = 0,
    Google = 1
}

/** All possible reservation providers | Resy is the only one supported / available at this time (11/2023) */
export enum ReservationProviders {
    Resy = 0
}

/** The different possible roles for all Foncii users */
export enum UserRoles {
    Test = -1,  // For testing purposes (so that it won't appear in production data)
    Creator = 0,
    Business = 1,
    Basic = 2,
    Admin = 3 // Allows high level access to other user accounts from a secure dashboard
}

export enum FMIntegrationProviders {
    Instagram = 0,
    TikTok = 1,
    GoogleMaps = 2
}

/** Profile Tasks Specific to Foncii (Maps) User Accounts */
export enum FonciiUserProfileTasks {
    CreateAccount = 0, // Automatically marked as complete as the user wouldn't be seeing any of the tasks without being logged in
    ConnectSocialMedia = 1, // If user has at least 1 active integration credential this is marked as complete
    CreateTasteProfile = 2, // If the user has at least 1 taste profile (primary or not) this is resolved as complete
    InviteFriend = 3 // User referrals, if at least one user joins using the user's referral code then this is marked as complete
}

/** All support possible OAuth providers for a user to choose from */
export enum AuthProviders {
    Google = 0,
    Facebook = 1,
    Twitter = 2,
    Apple = 3,
    Default = 4
}

/*
* All supported language codes, english is the default and is usually what's always
* supported, so if a name in another language code is empty, then its english
* counterpart should be reverted to.
*/
export enum LanguageCodes {
    // English
    en = "en",
    // Spanish
    es = "es",
    // French
    fr = "fr"
}

export enum WeekDays {
    Monday = "Monday",
    Tuesday = "Tuesday",
    Wednesday = "Wednesday",
    Thursday = "Thursday",
    Friday = "Friday",
    Saturday = "Saturday",
    Sunday = "Sunday"
}

/** Foncii App Extensive Enums */
// All US States
export enum USStates {
    Alabama = 'Alabama',
    Alaska = 'Alaska',
    Arizona = 'Arizona',
    Arkansas = 'Arkansas',
    California = 'California',
    Colorado = 'Colorado',
    Connecticut = 'Connecticut',
    Delaware = 'Delaware',
    Florida = 'Florida',
    Georgia = 'Georgia',
    Hawaii = 'Hawaii',
    Idaho = 'Idaho',
    Illinois = 'Illinois',
    Indiana = 'Indiana',
    Iowa = 'Iowa',
    Kansas = 'Kansas',
    Kentucky = 'Kentucky',
    Louisiana = 'Louisiana',
    Maine = 'Maine',
    Maryland = 'Maryland',
    Massachusetts = 'Massachusetts',
    Michigan = 'Michigan',
    Minnesota = 'Minnesota',
    Mississippi = 'Mississippi',
    Missouri = 'Missouri',
    Montana = 'Montana',
    Nebraska = 'Nebraska',
    Nevada = 'Nevada',
    NewHampshire = 'New Hampshire',
    NewJersey = 'New Jersey',
    NewMexico = 'New Mexico',
    NewYork = 'New York',
    NorthCarolina = 'North Carolina',
    NorthDakota = 'North Dakota',
    Ohio = 'Ohio',
    Oklahoma = 'Oklahoma',
    Oregon = 'Oregon',
    Pennsylvania = 'Pennsylvania',
    RhodeIsland = 'Rhode Island',
    SouthCarolina = 'South Carolina',
    SouthDakota = 'South Dakota',
    Tennessee = 'Tennessee',
    Texas = 'Texas',
    Utah = 'Utah',
    Vermont = 'Vermont',
    Virginia = 'Virginia',
    Washington = 'Washington',
    WestVirginia = 'West Virginia',
    Wisconsin = 'Wisconsin',
    Wyoming = 'Wyoming'
}

export enum AbbreviatedUSStates {
    Alabama = 'AL',
    Alaska = 'AK',
    Arizona = 'AZ',
    Arkansas = 'AR',
    California = 'CA',
    Colorado = 'CO',
    Connecticut = 'CT',
    Delaware = 'DE',
    Florida = 'FL',
    Georgia = 'GA',
    Hawaii = 'HI',
    Idaho = 'ID',
    Illinois = 'IL',
    Indiana = 'IN',
    Iowa = 'IA',
    Kansas = 'KS',
    Kentucky = 'KY',
    Louisiana = 'LA',
    Maine = 'ME',
    Maryland = 'MD',
    Massachusetts = 'MA',
    Michigan = 'MI',
    Minnesota = 'MN',
    Mississippi = 'MS',
    Missouri = 'MO',
    Montana = 'MT',
    Nebraska = 'NE',
    Nevada = 'NV',
    NewHampshire = 'NH',
    NewJersey = 'NJ',
    NewMexico = 'NM',
    NewYork = 'NY',
    NorthCarolina = 'NC',
    NorthDakota = 'ND',
    Ohio = 'OH',
    Oklahoma = 'OK',
    Oregon = 'OR',
    Pennsylvania = 'PA',
    RhodeIsland = 'RI',
    SouthCarolina = 'SC',
    SouthDakota = 'SD',
    Tennessee = 'TN',
    Texas = 'TX',
    Utah = 'UT',
    Vermont = 'VT',
    Virginia = 'VA',
    Washington = 'WA',
    WestVirginia = 'WV',
    Wisconsin = 'WI',
    Wyoming = 'WY'
}
