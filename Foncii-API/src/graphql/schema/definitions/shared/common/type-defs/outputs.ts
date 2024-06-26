// Dependencies
// GraphQL Document Node 
import gql from 'graphql-tag';

/**
 * Shared inputs used across multiple queries and mutations.
 */
const typeDef = gql`
type FonciiRestaurantSearchOutput {
    fonciiRestaurants: [FonciiRestaurant!]!
    """
    An id that links this output to a search event recorded in the database. This allows the client
    to attribute this query to other conversion events that stem from this search event, further allowing
    us to track and analyze user activity pathways, behavioral patterns, and UX KPIs.
    """
    queryID: String!
}

type PlaceSearchOutput {
    """
    The corresponding Google Place ID of the place found with the search query (if any)
    """
    googlePlaceID: String!
    """
    The name + location description for the place found with the search query (if any)
    """
    description: String!
    """
    The similarity between the search query and the found place's name. With a higher
    similarity indicating a closer relationship between the search query string and the 
    restaurant name string, and the inverse for dissimilar query to place name comparisons.

    This can be used to further gauge whether or not the found place is what was truly 
    """
    similarityScore: Float!
}

"""
An output for article publications queried outside of Foncii Restaurant based resolvers.
"""
type ArticlePublicationStandaloneOutput {
    # Article Publications
    """
    [Computed] Aggregated articles that mention this restaurant by name. Limited to 10 (Update when needed)
    """
    associatedArticlePublicationEdges: [ArticlePublication!]!
}

"""
An output for restaurant awards queried outside of Foncii Restaurant based resolvers.
"""
type RestaurantAwardStandaloneOutput {
    """
    [Computed] Aggregated articles that mention this restaurant by name. Limited to 10 (Update when needed)
    """
    associatedRestaurantAwardEdges: [RestaurantAward!]!
}

# Foncii Maps User Post Outputs #
type UserPostGalleryOutput {
    """
    An array of applicable posts that fulfill some query criteria
    """
    posts: [FMUserPost!]!
    """
    A count of all of the user's total posts that fulfill the query criteria
    """
    totalPosts: Int!
}

## Error Handling ##
"""
Defines a basic response for understanding the outcome of a mutation operation
"""
type GenericMutationResponse {
    statusCode: Int!
    errors: [ClientError!]
}

"""
Defines error types to be parsed by the client when an operation goes wrong
"""
type ClientError {
    errorCode: String!
    description: String!
}
`;

export default typeDef;