// Dependencies
// GraphQL Document Node
import gql from "graphql-tag";

const typeDef = gql`
  """
  Foncii User
  """
  type FonciiUser implements UserAccount & Identifiable & Updatable {
    # Interface Implementations
    id: ID!
    username: String!
    phoneNumber: String
    email: String!
    authProviders: [AuthProviders!]!
    profilePictureURL: String
    creationDate: String!
    lastUpdated: String!
    referralCode: String!
    lastLogin: UserLogin!
    lastSignOut: String
    isLoggedIn: Boolean!

    # Foncii User Fields
    fullName: String!
    isPhoneNumberVerified: Boolean!
    notificationsEnabled: Boolean!
    firstFavorites: [Restaurant!]
  }

  """
  User Profile Tasks
  Computed on a field level to determine if each task was fulfilled.
  """
  type ProfileTask {
    # Interface Implementations
    id: FonciiUserProfileTasks!

    # Profile Task Fields
    isComplete: Boolean!
  }

  type UserSession implements Identifiable & Updatable {
    # Interface Implementations
    id: ID!
    creationDate: String!
    """
    The last time the session received a heart beat signal
    """
    lastUpdated: String!

    """
    Optional because not all users are logged in when a session is created
    """
    userID: String
    """
    The platform this user session is currently hosted on.
    """
    platform: SupportedFonciiPlatforms!
    """
    Always available and can be used to track user sign up conversions /
    retention rates based on anonymous users (users without userIDs / accounts)
     using the application before having an established account. This period before
    having an account is the time before the creation date of the user's account, and
    if the creation date of this session falls within that period then this can be
    used to say the person was converted into a user account, and what they did prior
    to creating an account was XY and Z based on what we track in Amplitude and in our DB.

    Provided by Amplitude, since that's easier than setting it up from scratch which can
    be tedious and unreliable and a hassle to maintain and verify.
    """
    deviceID: String!
    """
    String that stores information about the user's device, browser, or app version. This data can help optimize
    the platform for different devices and identify any compatibility issues.
    """
    userAgent: String!
    """
    The operating system the user's client is operating on
    """
    operatingSystem: String!
    """
    The preferred language of the user 'the browser's current language'
    """
    language: String!
    """
    Optional. Storing IP addresses help in fraud detection, location-based personalization, and security.
    Can also be used to determine the user's location using the MaxMind DB: https://www.maxmind.com/en/geoip-databases
    """
    ipAddress: String
    """
    An array tracking the user's physical location throughout the session's duration (if provided)
    via coordinate points
    """
    clientGeolocationHistory: [CoordinatePoint!]!
    currentClientGeolocation: CoordinatePoint
    """
    Referrer URL Information: Track where users are coming from (e.g., referral links, social media, direct traffic)
    to understand your platform's sources of traffic. Useful to see where a user starts their session from,
    (Instagram, or Twitter, or Reddit, our App, or just google)
    """
    referrer: String
    """
    In milliseconds [ms]
    Calculating and storing the session duration can provide insights into user engagement.
    Computed and stored when the session ends.
    """
    sessionDuration: Float!
    """
    [Computed] True if the session's last heart beat aka update occurred
    within the max time threshold, false otherwise (session ended).

    Also false if the session was terminated by the user or some internal
    service.
    """
    isAlive: Boolean!
    """
    [Computed] True if the user's client has sent a heart beat signal within the last minute, false otherwise
    or if the session is not alive anymore.
    """
    isActive: Boolean!
    """
    True if the latest location does not match up with the latest history
    ~ the user is hundreds of miles away from their last reported location.
    Doesn't do anything for now, but good logic to maintain for security purposes down the line.
    """
    isSuspicious: Boolean!
    """
    User sessions are marked as terminated when the user closes their client or logs out or if a
    new session is created on the same device that a live session is already being used on.

    Note: User sessions that die out due to lack of heart beat are not marked as terminated.
    """
    terminated: Boolean!

    """
    Optional Amplitude session ID passed from the client to track occurrences across our own session management system
    and Amplitude's.
    """
    amplitudeSessionID: Float
  }
`;

export default typeDef;
