// Dependencies
// Read / Write to File System
import fs from "fs";

// CSV Parsing
import { parse } from "csv-parse";

// Logging
import logger from "../../../../foncii-toolkit/debugging/debugLogger";

/**
 * Parses the cuisine names and their adjacent values from a CSV and writes them
 * to 'cuisines.ts' as generated code for use within the cuisine manager.
 *
 * @param csvFilePath
 */
export default function parseCuisinesFromCSV(csvFilePath: string) {
  // Properties
  const outputFilePath =
    "src/business-logic/managers/cuisine-manager/cuisines.ts";

  // Load CSV from provided file path
  const csv = fs.readFileSync(csvFilePath, "utf-8");

  // Parse the CSV data
  parse(
    csv,
    {
      columns: true,
    },
    (err, data) => {
      if (err) {
        logger.error("Error occurred while parsing CSV:", err);
        return;
      }

      // Extract headers
      const originalHeaders = Object.keys(data[0]).map((header) =>
          header
            .trim()
            .replaceAll(":", "") // Clean unintentional characters
            .replaceAll(",", "")
            .replaceAll("​", "")
        ), // Weird char, just get rid of it whenever it pops up
        headers = originalHeaders.map((header) =>
          header
            .replaceAll("/", "_") // Replace /'s like Bakeries / Cafes etc.
            .replaceAll(" ", "_") // Replace spaces between words with underscores as well to further normalize the naming scheme
            .toLowerCase()
        );

      const adjacencyList: { [key: string]: string[] } = {},
        supportedCuisines: { [key: string]: Number } = {},
        englishLocalizedCuisineNames: { [key: string]: string } = {},
        supportedCuisineImageURLs: { [key: string]: string } = {};

      headers.map((header, index) => {
        supportedCuisines[header] = index;
        englishLocalizedCuisineNames[header] = originalHeaders[index];
        supportedCuisineImageURLs[
          header
        ] = `https://cdn.foncii.com/static-assets/cuisine-icons/${header}.jpg`;

        if (!adjacencyList[header]) adjacencyList[header] = [];

        // Insert the cuisine header's name. Literal references to the cuisine like 'Mexican' must also be considered when matching adjacency lists from a potential category
        adjacencyList[header].push(originalHeaders[index]);

        for (let i = 0; i < Object.values(data).length; i++) {
          const value = (Object.values(data[i])[index] as string)
            .trim()
            .replaceAll(":", "")
            .replaceAll("/", "_")
            .replace(",", "")
            .replace("​", "");

          adjacencyList[header].push(value);
        }

        adjacencyList[header] = adjacencyList[header].filter(Boolean);
      });

      // Further processing
      const localizedCuisineNames = {
        english: englishLocalizedCuisineNames,
      };

      // Convert the JavaScript object to a string
      const formattedData: string = `// Generated Cuisine Data Code
        // * DO NOT EDIT *
        /** 
        * A collection of known aliases for different cuisines for us to map
        * similar restaurant specific categories from different data sources to our supported cuisines 
        */
        export const CuisineAliases = ${JSON.stringify(adjacencyList, null, 1)};

        /**
         * Cuisine types mapped to some arbitrary ID to be referenced by other entities such as 
         * Taste Profiles. Important: The ids these cuisines are mapped to should not be changed beyond this point because other
         * unrelated entities directly reference these values and will not know if they change unexpectedly
         */
        export const SupportedCuisines = ${JSON.stringify(
          supportedCuisines,
          null,
          1
        )};

        // Cuisine Icon Image URLs
        // The corresponding icon image in URL form for each cuisine type, Note: Do make sure these files are actually present on the CDN
        export const SupportedCuisineImageURLs = ${JSON.stringify(
          supportedCuisineImageURLs,
          null,
          1
        )};

        // Supported Localizations
        export const LocalizedCuisineNames = ${JSON.stringify(
          localizedCuisineNames,
          null,
          1
        )};
        `.replaceAll("        ", ""); // Remove the white space at the beginning of each line

      // Write the formatted data to a file at the specified path
      fs.writeFile(outputFilePath, formattedData, (err) => {
        if (err) {
          logger.error(err);
          return;
        }

        logger.info(
          `Generated cuisine code has been written to ${outputFilePath}`
        );
      });
    }
  );
}
