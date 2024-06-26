// Dependencies
// GraphQL Document Node
import gql from "graphql-tag";

const typeDef = gql`
  ### Queries ###

  ## Queries ##
  type Query {
    """
    Returns a non-paginated full list of all supported cuisines
    """
    fetchAllCuisines: [Cuisine!]!

    """
    Returns a non-paginated full list of all supported food restrictions
    """
    fetchAllDietaryRestrictions: [DietaryRestriction!]!

    """
    Returns a non-paginated full list of all supported meal types
    """
    fetchAllMealTypes: [MealType!]!

    """
    Returns a non-paginated full list of all supported major cities
    """
    fetchAllMajorCities: [MajorCity!]!
  }
`;

export default typeDef;
