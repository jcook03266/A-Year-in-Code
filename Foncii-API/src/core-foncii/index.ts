// Dependencies
// Dev Env Config
import { forceUseTestDB } from "../business-logic/services/database/databaseService";

// Services
import AppService from "../business-logic/services/app/appService";

// Flags
import Flags from "../business-logic/services/flags/flags";

async function main() {
  await Flags.loadFlags();
  if (process.env.NODE_ENV == "local") configureDevEnv();

  const appInstance = new AppService();
  appInstance.startServer();
}

/**
 * Some useful configurations to make when testing this server in the dev environment
 */
function configureDevEnv() {
  // True to force the test DB to be used instead of external db
  forceUseTestDB.value = false;
}

main();
