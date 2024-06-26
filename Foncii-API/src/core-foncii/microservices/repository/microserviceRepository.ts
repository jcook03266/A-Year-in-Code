// Dependencies
// Microservices
import InstascraperMicroservice from "../instascraperMicroservice";
import MediaMicroservice from "../mediaMicroservice";
import ReservationMicroservice from "../reservationMicroservice";
import SentimentAnalysisMicroservice from "../sentimentAnalysisMicroservice";

/**
 * Structured repository responsible for organizing access to Foncii's
 * various backend microservices.
 */
export const MicroserviceRepository = {
  // Media
  fonciiMedia: () => new MediaMicroservice(),
  // AI / ML
  fonciiSAS: () => new SentimentAnalysisMicroservice(),
  // Scraping
  fonciiInstascraper: () => new InstascraperMicroservice(),
  // Reservation Integrations
  reservationMicroservice: () => new ReservationMicroservice()
};
