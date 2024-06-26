// Dependencies
// Networking
import { HeadersInit } from "node-fetch";

/**
 * Base class for Foncii Microservices to inherit in order to have access to
 * reusable properties and methods required for basic networking functionalities
 */
export default class FonciiMicroservice {
  // API Properties
  // HTTP Triggers for all proprietary Foncii microservices
  serviceEndpoints = {
    InstascraperService: {
      ClassifyAndIngestPosts:
        "https://insta-scraper-meocnix4pq-uc.a.run.app/classify_and_ingest_posts_ig",
      IngestPosts:
        "https://insta-scraper-meocnix4pq-uc.a.run.app/ingest_posts_ig",
      IngestNewUserAndClassifiedPosts:
        "https://insta-scraper-meocnix4pq-uc.a.run.app/ingest_new_user_ig",
      IngestNewUserAndPosts:
        "https://insta-scraper-meocnix4pq-uc.a.run.app/ingest_new_user_ingest_posts_ig",
      IngestNewUser:
        "https://insta-scraper-meocnix4pq-uc.a.run.app/ingest_new_user_ig",
    },
    MediaService: {
      UploadUserPostMedia:
        "https://uploaduserpostmedia-meocnix4pq-uc.a.run.app",
      DeleteUserPostMedia:
        "https://deleteuserpostmedia-meocnix4pq-uc.a.run.app",
      DeleteAllUserPostMedia:
        "https://deletealluserpostmedia-meocnix4pq-uc.a.run.app",
      SetUserProfilePicture:
        "https://setuserprofilepicture-meocnix4pq-uc.a.run.app",
      SetUserProfilePictureFromURL:
        "https://setuserprofilepicturefromurl-meocnix4pq-uc.a.run.app",
    },
    SentimentAnalysisService: {
      AnalyzeReview:
        "https://foncii-sas-meocnix4pq-uc.a.run.app/get-sentiment-score-for-review",
      AnalyzeArticle:
        "https://foncii-sas-meocnix4pq-uc.a.run.app/get-sentiment-score-for-article",
    },
    ReservationMicroservice: {
      FindResyAvailableDays: ({
        resyVenueID,
        partySize,
        startDateInMS,
        endDateInMS
      }: {
        resyVenueID: string,
        partySize: number,
        startDateInMS: number,
        endDateInMS: number
      }) => {
        // Append URL params to URL to form GET request
        const url = new URL("https://findresyavailabledays-meocnix4pq-uc.a.run.app"),
          urlParamKeyValues = { resyVenueID, partySize, startDateInMS, endDateInMS };

        Object.entries(urlParamKeyValues).forEach(([key, value]) => {
          url.searchParams.append(String(key), String(value));
        })

        return url.toString()
      },
      FindResyAvailabilitiesForDate: ({
        resyVenueID,
        partySize,
        dateOfReservationInMS
      }: {
        resyVenueID: string,
        partySize: number,
        dateOfReservationInMS: number
      }) => {
        // Append URL params to URL to form GET request
        const url = new URL("https://findresyavailabilitiesfordate-meocnix4pq-uc.a.run.app"),
          urlParamKeyValues = { resyVenueID, partySize, dateOfReservationInMS };

        Object.entries(urlParamKeyValues).forEach(([key, value]) => {
          url.searchParams.append(String(key), String(value));
        })

        return url.toString()
      }
    }
  };

  // Authorization headers
  private readonly authorizationHeaderKey: string = "API_KEY";
  sharedHeader: HeadersInit = [
    [this.authorizationHeaderKey, process.env.FONCII_SERVER_API_SECRET],
    ["Content-Type", "application/json"],
  ];
}
