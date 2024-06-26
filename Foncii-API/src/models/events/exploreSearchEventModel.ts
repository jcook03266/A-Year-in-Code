// Dependencies
// Types
import { FonciiEvents } from "../../types/common";

// Inheritance
import FonciiEventModel from "./protocol/fonciiEventModel";

// Services
import { DatabaseServiceAdapter } from "../../business-logic/services/database/databaseService";

export default class ExploreSearchEventModel
  extends FonciiEventModel
  implements ExploreSearchEvent, Objectable<ExploreSearchEvent>
{
  // Properties
  queryID?: string;
  query: string;
  searchLocation: CoordinatePoint;
  zoomLevel: number;
  clientLocation?: CoordinatePoint;
  tags: string[];
  cuisines: string[];
  prices: number[];
  isManualSearch: boolean;
  partySize: number;
  reservationDate: string;
  sourceURL: string;
  candidateIDs: string[];
  autoCompleteSuggestions: string[];
  averagePercentMatchScore?: number;
  averageQualityScore: number;

  constructor({
    id,
    queryID,
    timestamp,
    userID,
    query,
    searchLocation,
    zoomLevel,
    clientLocation,
    tags,
    cuisines,
    prices,
    isManualSearch,
    partySize,
    reservationDate,
    sourceURL,
    candidateIDs,
    autoCompleteSuggestions,
    averagePercentMatchScore,
    averageQualityScore,
    sessionID
  }: Partial<ExploreSearchEvent> & {
    query: string;
    searchLocation: CoordinatePoint;
    zoomLevel: number;
    tags: string[];
    cuisines: string[];
    prices: number[];
    isManualSearch: boolean;
    partySize: number;
    reservationDate: string;
    sourceURL: string;
    candidateIDs: string[];
    autoCompleteSuggestions: string[];
    averageQualityScore: number;
  }) {
    const eventType = FonciiEvents.EXPLORE_SEARCH;

    // The query ID is used as the id of this event when defined,
    // otherwise the id is randomly generated
    super({ id: queryID ?? id, userID, timestamp, eventType, sessionID });

    this.query = query;
    this.searchLocation = searchLocation;
    this.zoomLevel = zoomLevel;
    this.clientLocation = clientLocation;
    this.tags = tags;
    this.cuisines = cuisines;
    this.prices = prices;
    this.isManualSearch = isManualSearch;
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
  toObject<ExploreSearchEvent>(): ExploreSearchEvent {
    return JSON.parse(JSON.stringify(this));
  }

  // Helpers
  /**
   * @returns -> A hex string to use on the client to associate other events with this search event
   * and pass back to the server to persist this event in the database.
   */
  static generateQueryID(): string {
    return DatabaseServiceAdapter.generateUUIDHexString();
  }
}
