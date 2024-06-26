// Dependencies
// GraphQL Document Node
import gql from "graphql-tag";

const typeDef = gql`
  interface Publication {
    """
    The title of the article
    """
    title: String
    url: String!
    """
    [Computed] The domain name of the website provided by the article's URL
    """
    websiteDomain: String!
    """
    [Computed] The favicon for the website (may not exist, depends on the website) but usually located at 'example.com/favicon.ico', uses the parsed web domain
    """
    faviconLink: String!
    """
    The description meta tag of the article's web page loaded and parsed by this server (can't be done client side due to cross site blocks)
    """
    description: String
  }

  """
  Generic interface for saving entities, saves are attributed to users
  via their user ID.
  """
  interface Savable {
    """
    Unique identifier for this entity
    """
    id: ID!
    """
    The user who saved the entity
    """
    userID: ID!
    """
    When this entity was created / saved
    """
    creationDate: String!
  }

  """
  Boilerplate for all Foncii user accounts
  """
  interface UserAccount {
    id: ID!
    username: String!
    phoneNumber: String
    email: String!
    authProviders: [AuthProviders!]!
    """
    Optional to have, most people might not want to use a profile picture
    """
    profilePictureURL: String
    creationDate: String!
    lastUpdated: String!
    referralCode: String!
    lastLogin: UserLogin!
    """
    Optional because a user doesn't sign out until after they login, thus this date is null until that dependent event is triggered
    """
    lastSignOut: String
    """
    [Computed] true if the last sign in date is after the last sign out date
    """
    isLoggedIn: Boolean!
  }

  """
  Properties shared between Google and Yelp
  """
  interface PlaceProperties {
    """
    The average rating for this place provided by the external platform these properties are attributed to
    """
    rating: Float
    """
    An external link to the site where the data was sourced for this place (i.e Yelp or Google)
    """
    externalURL: String
  }

  """
  Simple interface that necessitates the use of an identifier for entities
  that must be differentiated from other similar entities.
  """
  interface Identifiable {
    id: ID!
  }

  interface Creatable {
    """
    ISO-8601 Formatted Date String, when this entity was first created
    """
    creationDate: String!
  }

  interface Updatable {
    """
    ISO-8601 Formatted Date String, when this entity was first created
    """
    creationDate: String!
    """
    ISO-8601 Formatted Date String, when this entity was last updated
    """
    lastUpdated: String!
  }

  interface Expirable {
    """
    Stale date in ISO format that marks when the entity goes 'stale' / expires
    """
    staleDate: String!
  }

  interface AutoCompleteSuggestion {
    """
    The string to match search queries with, used for sorting
    """
    title: String!
    """
    Human-readable description [business name + location properties] | [username]
    """
    description: String!
    """
    Optional preview image for this search result
    """
    previewImageURL: String
  }
`;

export default typeDef;
