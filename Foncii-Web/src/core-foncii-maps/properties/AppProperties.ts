// Dependencies
// Local Files
import packageJSON from "../../../package.json";

/**
 * Various global properties used to describe this web app
 * across its different states of deployment
 */
export const AppProperties = {
  Name: packageJSON.name,
  DevelopmentVersion: "03.31.24", // IMPORTANT: Used to flush the redux store on major breaking changes, doesn't have to be kept in parity with the release versioning sys
  ProductionSemanticVersion: packageJSON.version,
};

// Local environments need to port through ngrok to allow HTTPS endpoint functionality
export const productionEnvironment =
  process.env.NEXT_PUBLIC_NODE_ENV_CUSTOM === "production";
export const nonProductionEnvironment =
  process.env.NEXT_PUBLIC_NODE_ENV_CUSTOM !== "production";
export const localEnvironment =
  process.env.NEXT_PUBLIC_NODE_ENV_CUSTOM === "local";
export const stagingEnvironment =
  process.env.NEXT_PUBLIC_NODE_ENV_CUSTOM === "staging";

// Replace development link as needed using ngrok's free tunneling, download ngrok and run ./ngrok http 3000 to setup a new tunnel and adapt this link as needed
// Note: The forward slash is mandatory
export const integrationOAuthRedirectURI = (originDomainURL: string) =>
  localEnvironment
    ? "https://b64f-2600-4041-5c17-4d00-bcdd-6a2f-d523-4121.ngrok-free.app/"
    : originDomainURL.endsWith("/")
    ? originDomainURL
    : originDomainURL + "/";
