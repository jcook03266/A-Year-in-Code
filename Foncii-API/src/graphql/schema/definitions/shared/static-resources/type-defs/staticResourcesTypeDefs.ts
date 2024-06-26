// Dependencies
// GraphQL Document Node
import gql from "graphql-tag";

const typeDef = gql`
  type MajorCity @cacheControl(maxAge: 600) {
    id: ID!
    name: String!
    state: String!
    abbreviatedState: String!
  }

  type DietaryRestriction @cacheControl(maxAge: 600) {
    id: ID!
    localizedNames: SupportedLocalizations!
    imageURL: String!
  }

  type Cuisine @cacheControl(maxAge: 600) {
    id: ID!
    localizedNames: SupportedLocalizations!
    imageURL: String!
  }

  type MealType @cacheControl(maxAge: 600) {
    id: ID!
    localizedNames: SupportedLocalizations!
  }

  """
  Follows the language codes defined in the localizations data model
  Keep both synchronized
  """
  type SupportedLocalizations {
    """
    English is the default language therefore it's required, other languages are optionally supported
    """
    en: String!
    es: String
    fr: String
  }
`;

export default typeDef;
