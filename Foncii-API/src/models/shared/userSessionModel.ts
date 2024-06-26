// Dependencies
// Inheritance
import UpdatableModel from "./protocols/updatableModel";

// Types
import { SupportedFonciiPlatforms } from "../../types/namespaces/microservice-api";

// Services
import { DatabaseServiceAdapter } from "../../business-logic/services/database/databaseService";

/**
 * User Referral record shared across all user accounts
 */
export default class UserSessionModel
  extends UpdatableModel
  implements UserSession, Objectable<UserSession>
{
  // Properties
  id: string;
  userID?: string;
  platform: SupportedFonciiPlatforms;
  deviceID: string;
  userAgent: string;
  operatingSystem: string;
  language: string;
  ipAddress?: string;
  clientGeolocationHistory: CoordinatePoint[];
  currentClientGeolocation?: CoordinatePoint;
  referrer?: string;
  sessionDuration: number;
  isSuspicious: boolean;
  terminated: boolean;
  amplitudeSessionID?: number;

  constructor({
    id,
    userID,
    platform,
    deviceID,
    userAgent,
    operatingSystem,
    language,
    ipAddress,
    clientGeolocationHistory,
    currentClientGeolocation,
    referrer,
    sessionDuration,
    isSuspicious,
    terminated,
    amplitudeSessionID,
    creationDate,
    lastUpdated,
  }: Partial<UserSession> & {
    platform: SupportedFonciiPlatforms;
    deviceID: string;
    userAgent: string;
    operatingSystem: string;
    language: string;
    sessionDuration: number;
    isSuspicious: boolean;
    terminated: boolean;
  }) {
    super({ creationDate, lastUpdated });

    this.id = id ?? DatabaseServiceAdapter.generateUUIDHexString();
    this.userID = userID;
    this.platform = platform;
    this.deviceID = deviceID;
    this.userAgent = userAgent;
    this.operatingSystem = operatingSystem;
    this.language = language;
    this.ipAddress = ipAddress;
    this.clientGeolocationHistory = clientGeolocationHistory ?? [];
    this.currentClientGeolocation = currentClientGeolocation;
    this.referrer = referrer;
    this.sessionDuration = sessionDuration;
    this.isSuspicious = isSuspicious;
    this.terminated = terminated;
    this.amplitudeSessionID = amplitudeSessionID;
  }

  /**
   * @returns An object converted from JSON format representing the user account model's data
   * or the data of any class that extends this class via inheritance.
   */
  toObject() {
    return JSON.parse(JSON.stringify(this));
  }
}
