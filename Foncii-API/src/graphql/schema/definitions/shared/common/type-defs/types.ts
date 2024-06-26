// Dependencies
// GraphQL Document Node
import gql from "graphql-tag";

const typeDef = gql`
  """
  Describes a user login event handled by the client and tracked by the backend
  """
  type UserLogin {
    authProvider: AuthProviders!
    loginDate: String!
  }

  """
  Simple type that defines a physical location
  Based on real world coordinates
  """
  type CoordinatePoint {
    lat: Float!
    lng: Float!
  }
`;

export default typeDef;
