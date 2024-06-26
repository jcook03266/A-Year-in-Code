// Dependencies
// GraphQL Document Node
import gql from "graphql-tag";

const typeDef = gql`
  ### Queries / Mutations / Inputs ###
  # These type defs are reusable for all Foncii users, Foncii Maps and or Foncii Biz

  ## Queries ##
  type Query {
    isAccountClaimed(input: isAccountClaimedInput!): Boolean!

    getUserSessionByID(sessionID: ID!): UserSession
    getCurrentSessionForUserWithID(userID: ID!): UserSession
    getCurrentSessionForDeviceWithID(deviceID: ID!): UserSession

    getAllSessionsForUserWithID(userID: ID!): [UserSession!]!
    getAllSessionsForDeviceWithID(userID: ID!): [UserSession!]!
    getAllDeviceSessionsForUser(userID: ID!, deviceID: ID!): [UserSession!]!
    getAllAliveUserSessions: [UserSession!]!
    getAllActiveUserSessions: [UserSession!]!
  }

  ## Mutations ##
  type Mutation {
    """
    Creates a new session for the user with the given information
    and returns a session ID if the session was created successfully,
    and null if a new session could not be created at this time.
    """
    createUserSession(input: CreateUserSessionInput): UserSession

    """
    Keeps the user session alive by sending a periodic heart beat
    from the client here to the server. If a heart beat isn't received within
    a certain period of time the session is assumed to be not alive anymore.
    When the user tries to send a new heart beat for an unalive session
    the dead session is retired and a new one is created represented by the
    ID output. If the input is invalid and a session does not exist for the given
    ID
    """
    sendUserSessionHeartBeat(input: UserSessionHeartBeatInput): UserSession

    """
    Marks the user session as terminated when the user closes their
    client or logs out. User sessions that die out due to lack of heart
    beat are not marked as terminated.
    """
    endUserSession(sessionID: ID!): Boolean!
  }

  ## Inputs ##
  input isAccountClaimedInput {
    """
    The user's account uid.
    """
    userID: ID!
    """
    The platform this user account belongs to.
    """
    platform: SupportedFonciiPlatforms!
  }

  input CreateUserSessionInput {
    """
    Optional because not all users are logged in when a session is created
    """
    userID: ID
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
    deviceID: ID!
    """
    The preferred language of the user 'the browser's current language'
    """
    language: String!
    """
    The user's current physical location, to be recorded and used to track their movement
    history throughout the session.
    """
    clientGeolocation: CoordinatePointInput
    """
    Referrer URL Information: Track where users are coming from (e.g., referral links, social media, direct traffic)
    to understand your platform's sources of traffic. Useful to see where a user starts their session from,
    (Instagram, or Twitter, or Reddit, our App, or just google)
    """
    referrer: String
    """
    Optional Amplitude session ID passed from the client to track occurrences across our own session management system
    and Amplitude's.
    """
    amplitudeSessionID: Float
  }

  input UserSessionHeartBeatInput {
    sessionID: ID!
    """
    The user's current physical location, to be recorded and used to track their movement
    history throughout the session.
    """
    clientGeolocation: CoordinatePointInput
  }

  ## Subscriptions ##
  type Subscription {
    userSessionEnded: ID!
  }
`;

export default typeDef;
