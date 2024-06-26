// Dependencies
// File System
import * as fs from "fs/promises";

// Schema File Generation
import { printSchema } from "graphql";
import schema from "../schema/executableSchema";

// Logging
import logger from "../../foncii-toolkit/debugging/debugLogger";

// SDL Schema Code generation
/**
 * Generates a .GraphQL SDL file containing the SDL version of
 * the schema required for exporting to Apollo Studio when publishing new launches.
 */
function generateSchema() {
  const fileData = printSchema(schema),
    // Generated file output path
    pathToGeneratedSchemaFile = "./src/graphql/schema/generated/schema.graphql";

  fs.writeFile(pathToGeneratedSchemaFile, fileData)
    .catch((err) => {
      logger.error(`Error encountered while generating schema file: ${err}`);
    })
    .finally(() => {
      logger.info(
        `File data successfully written to ${pathToGeneratedSchemaFile}`
      );
    });
}

generateSchema();
