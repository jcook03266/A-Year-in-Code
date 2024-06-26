// Dependencies
// GraphQL Document Node
import gql from "graphql-tag";

/**
 * Union types to use across the schema
 */
const typeDef = gql`
  """
  Describes the possible outputs that will be mixed together in the explore search suggestions
  Restaurant suggestions for the user to click on, user suggestions, and or popular search terms / queries
  """
  union ExploreSearchAutoCompleteSuggestion =
      RestaurantAutoCompleteSuggestion
    | UserPostAutoCompleteSuggestion
    | UserAutoCompleteSuggestion
    | PopularSearchQuerySuggestion
`;

export default typeDef;
