// Dependencies
// Services
import { DatabaseServiceAdapter } from "../../../business-logic/services/database/databaseService";

/**
 * Interface implementation for the identifiable interface,
 * specifically for string based identifiers.
 */
export default class IdentifiableModel implements Identifiable<string> {
  // Properties
  id: string;

  constructor({ id }: Partial<Identifiable<string>>) {
    this.id = id ?? DatabaseServiceAdapter.generateUUIDHexString();
  }
}
