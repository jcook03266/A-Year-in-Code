// Dependencies
// Services
import { DatabaseServiceAdapter } from "../../../../business-logic/services/database/databaseService";

// Utilities
import { truncateString } from "../../../../foncii-toolkit/formatting/stringFormatting";

// Protocols
/**
 * Protocol implemented by both recommendation instances for keeping track
 * of identifier properties, personal messages, destinationCoordinates properties, creation date,
 * and the state of the request/recommendation after being sent to another user
 */
export default class Recommendation implements Recommendable {
  // Properties:
  id;
  message;
  destinationCoordinates;
  creationDate;
  accepted;
  acceptationDate;

  // Limits
  /* Message Validation Criteria */
  // A max length of 500 characters
  #messageMaxLength = 500;

  constructor({
    id,
    message = "",
    destinationCoordinates,
    creationDate,
    accepted,
    acceptationDate,
  }: Recommendable) {
    this.id = id ?? DatabaseServiceAdapter.generateUUIDHexString();
    this.message = message;
    this.destinationCoordinates = destinationCoordinates;
    this.creationDate = creationDate ?? new Date().toISOString();
    this.accepted = accepted ?? false;
    this.acceptationDate = acceptationDate;

    // Input validation
    this.validateMessageContents(message);
  }

  /**
   * A validator that rejects (clears) messages that don't pass the required criteria,
   * and or truncates messages that exceed the max length limitation.
   *
   * @param message
   */
  validateMessageContents(message: string) {
    if (message.length > this.#messageMaxLength)
      message = truncateString(message, this.#messageMaxLength);
  }
}
