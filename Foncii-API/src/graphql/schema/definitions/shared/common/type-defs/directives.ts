// Dependencies
// GraphQL Document Node
import gql from "graphql-tag";

const typeDef = gql`
  enum CacheControlScope {
    PUBLIC
    PRIVATE
  }

  # https://www.apollographql.com/docs/apollo-server/performance/caching
  # Automatically recognized by Apollo Server
  directive @cacheControl(
    maxAge: Int
    scope: CacheControlScope
    inheritMaxAge: Boolean
  ) on FIELD_DEFINITION | OBJECT | INTERFACE | UNION
`;

export default typeDef;
