// Dependencies
// Enums
import { FonciiEvents } from "../../../types/common";

// Utilities
import { DatabaseServiceAdapter } from "../../../business-logic/services/database/databaseService";

/**
 * Interface implementation for the Foncii Event interface
 * extensible by other implementation related classes to
 * simplify the instantiation of these reusable fields.
 */
export default class FonciiEventModel implements FonciiEvent {
  // Properties
  id: string;
  userID?: string; // User ID of the user who performed the event (if done by a registered user)
  timestamp: Date;
  eventType: FonciiEvents;
  sessionID?: string;

  constructor({
    id,
    userID,
    timestamp,
    eventType,
    sessionID = undefined, // Session ID of the user who performed the event (if applicable / done by a registered user)
  }: Partial<FonciiEvent> & { eventType: FonciiEvents }) {
    this.id = id ?? DatabaseServiceAdapter.generateUUIDHexString();
    this.userID = userID;
    this.timestamp = timestamp ?? new Date();
    this.eventType = eventType;
    this.sessionID = sessionID;
  }
}
