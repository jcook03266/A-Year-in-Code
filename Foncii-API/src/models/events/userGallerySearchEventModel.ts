// Dependencies
// Types
import { FonciiEvents } from "../../types/common";

// Inheritance
import FonciiEventModel from "./protocol/fonciiEventModel";

export default class UserGallerySearchEventModel
  extends FonciiEventModel
  implements UserGallerySearchEvent, Objectable<UserGallerySearchEvent>
{
  // Properties
  authorUID: string;
  query: string;
  searchLocation: CoordinatePoint;
  zoomLevel: number;
  clientLocation?: CoordinatePoint;
  tags: string[];
  cuisines: string[];
  prices: number[];
  partySize: number;
  reservationDate: string;
  sourceURL: string;
  candidateIDs: string[];
  autoCompleteSuggestions: string[];
  averagePercentMatchScore?: number;
  averageQualityScore: number;

  constructor({
    id,
    timestamp,
    userID,
    authorUID,
    query,
    searchLocation,
    zoomLevel,
    clientLocation,
    tags,
    cuisines,
    prices,
    partySize,
    reservationDate,
    sourceURL,
    candidateIDs,
    autoCompleteSuggestions,
    averagePercentMatchScore,
    averageQualityScore,
    sessionID,
  }: Partial<UserGallerySearchEvent> & {
    authorUID: string;
    query: string;
    searchLocation: CoordinatePoint;
    zoomLevel: number;
    tags: string[];
    cuisines: string[];
    prices: number[];
    partySize: number;
    reservationDate: string;
    sourceURL: string;
    candidateIDs: string[];
    autoCompleteSuggestions: string[];
    averageQualityScore: number;
  }) {
    const eventType = FonciiEvents.USER_GALLERY_SEARCH;

    super({ id, userID, timestamp, eventType, sessionID });

    this.authorUID = authorUID;
    this.query = query;
    this.searchLocation = searchLocation;
    this.zoomLevel = zoomLevel;
    this.clientLocation = clientLocation;
    this.tags = tags;
    this.cuisines = cuisines;
    this.prices = prices;
    this.partySize = partySize;
    this.reservationDate = reservationDate;
    this.sourceURL = sourceURL;
    this.candidateIDs = candidateIDs;
    this.autoCompleteSuggestions = autoCompleteSuggestions;
    this.averagePercentMatchScore = averagePercentMatchScore;
    this.averageQualityScore = averageQualityScore;
  }

  /**
   * @returns An object converted from JSON format representing the event model's data
   * or the data of any class that extends this class via inheritance.
   */
  toObject<UserGallerySearchEvent>(): UserGallerySearchEvent {
    return JSON.parse(JSON.stringify(this));
  }
}
