// Note: Integration tests basically test the connectivity of all of the services within this API (database, firebase, etc)
// And this allows us to catch any outages or vulnerabilities within the connections of these services.

// Dependencies
// Types
import { SupportedFonciiPlatforms } from "../../../types/namespaces/microservice-api";

// GQL
import gql from "graphql-tag";

// Dev Env Config
import {
  DatabaseServiceAdapter,
  forceUseTestDB,
} from "../../../business-logic/services/database/databaseService";

// Services
import AppService from "../../../business-logic/services/app/appService";
import UserService from "../../../business-logic/services/shared/users/userService";

// Flags
import Flags from "../../../business-logic/services/flags/flags";

// True to force the test DB to be used instead of the Fediverse DB (prod)
async function configureIntegrationTestingEnv() {
  await Flags.loadFlags();
  forceUseTestDB.value = true;
}

describe("Foncii User Integration", () => {
  // Configure flags before running tests
  beforeAll(async () => {
    await configureIntegrationTestingEnv();
  }, 20000);

  // Properties
  const newUserInput = {
    userID: DatabaseServiceAdapter.generateUUIDHexString(),
    authProvider: "GOOGLE",
    firstName: "John",
    lastName: "Doe",
    username:
      `johnDoe${DatabaseServiceAdapter.generateUUIDHexString()}`.toLowerCase(),
    email: `john.doe${DatabaseServiceAdapter.generateUUIDHexString()}@example.com`,
    oAuthProfilePictureURL: "http://example.com/picture.jpg",
  };

  test("creates a new user", async () => {
    const appInstance = new AppService();

    const createUserMutation = gql`
      mutation CreateUser($input: CreateNewFMUserInput!) {
        createUserFM(input: $input) {
          id
          firstName
          lastName
          username
          email
          authProviders
        }
      }
    `;

    const result = await appInstance.server.executeOperation({
        query: createUserMutation,
        variables: { input: newUserInput },
      }),
      body = result.body as { singleResult: { data?: { createUserFM: any } } },
      data = body.singleResult.data;

    expect(data?.createUserFM).toEqual({
      id: newUserInput.userID,
      firstName: newUserInput.firstName,
      lastName: newUserInput.lastName,
      username: newUserInput.username,
      email: newUserInput.email,
      authProviders: [newUserInput.authProvider],
    });
  });

  test("deletes a user", async () => {
    const userService = new UserService();

    // Delete the created test user
    await userService.deleteUser({
      userID: newUserInput.userID,
      platform: SupportedFonciiPlatforms.foncii,
    });
  });
});
