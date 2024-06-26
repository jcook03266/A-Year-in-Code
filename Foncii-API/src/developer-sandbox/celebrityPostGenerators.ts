// Dependencies
// File System / CSV Parsing
import fs from "fs";
import csvParser from "csv-parser";

// Services
import FonciiMapsPostService from "../business-logic/services/foncii-maps/user-posts/fmPostService";
import GooglePlacesService from "../business-logic/services/third-party-api/place-information/googleAPIService";

// Utilities
import { delay } from "../foncii-toolkit/utilities/scheduling";

// Instantiations
const userPostService = new FonciiMapsPostService();
const googlePlacesService = new GooglePlacesService();

export async function runDualipaPostGenerator({
  userID,
  csvFilePath,
}: {
  userID: string;
  csvFilePath: string;
}) {
  const parsedEntries = await parseDualipaCSV(csvFilePath);

  parsedEntries.forEach(async (entry) => {
    // To query the places API for matches
    const businessName = entry.restaurantName,
      address = entry.restaurantAddress,
      // Find the associated restaurant in google's database (if available)
      googlePlaceID = await googlePlacesService.getPlaceIDFromTextAndLocation(
        businessName,
        address
      );

    // Create a post from the parsed information
    const post = await userPostService.createPost({
      userID,
      creationDate: entry.creationDate,
      customUserProperties: {
        notes: entry.notes ?? "",
        // articleLinks: [entry.articleLink],
        categories: [],
        rating: 0,
      },
    });

    // Associate a restaurant with the new post
    if (post?.id && googlePlaceID) {
      await userPostService.updateAssociatedRestaurantData({
        postID: post.id,
        googlePlaceID,
      });
    }

    // 0.1 Second delay to prevent API timeouts
    await delay(async () => {}, 100);
  });
}

async function parseDualipaCSV(csvFilePath: string): Promise<
  {
    restaurantName: string;
    restaurantAddress: string;
    notes?: string;
    articleLink: string;
    creationDate: string;
  }[]
> {
  // Parse the CSV data
  const parsedEntries: {
    restaurantName: string;
    restaurantAddress: string;
    notes?: string;
    articleLink: string;
    creationDate: string;
  }[] = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csvParser())
      .on(
        "data",
        (data: {
          Restaurant: string;
          Address: string;
          Notes: string;
          Article: string;
          Publication: string;
          "Article Date": string;
          "Scraped Date": string;
        }) => {
          parsedEntries.push({
            restaurantName: data["Restaurant"],
            restaurantAddress: data["Address"],
            notes: data["Notes"]?.trim() ?? "",
            articleLink: data["Article"],
            creationDate: new Date(data["Article Date"]).toISOString(),
          });
        }
      )
      .on("end", () => {
        resolve(parsedEntries);
      })
      .on("error", (error: any) => {
        reject(error);
      });
  });
}
