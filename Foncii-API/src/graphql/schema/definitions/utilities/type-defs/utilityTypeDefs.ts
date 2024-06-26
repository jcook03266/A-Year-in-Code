// Dependencies
// GraphQL Document Node
import gql from "graphql-tag";

const typeDef = gql`
  ## Inputs ##
  """
  Allows for individual 'pages' of data to be returned with a specified
  number of elements returned per page (limit), as well as a sort order 'ascending or descending'
  [Not Used]
  """
  input CursorPaginationInput {
    paginationCursor: ID
    limit: Int
    sortOrder: SortOrders
  }

  """
  Paginates a list of results based on the specified page, limit,
  sort key, and sort order parameters to ensure each following page is
  successive of the previous page.
  """
  input PaginationInput {
    limit: Int! = 100
    page: Int! = 0
    sortKey: String
    sortOrder: SortOrders = "ASCENDING"
  }
`;

export default typeDef;
