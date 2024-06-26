// Dependencies
// Inheritance
import SavableModel from "./protocols/savableModel";

// Services
import { DatabaseServiceAdapter } from "../../business-logic/services/database/databaseService";

/**
 * Model that represents a restaurant saved by a user
 */
export default class SavedRestaurantModel
  extends SavableModel
  implements Savable, Objectable<SavedRestaurant>
{
  // Properties
  fonciiRestaurantID: string;
  postID?: string;

  constructor({
    id,
    userID,
    creationDate,
    fonciiRestaurantID,
    postID,
  }: Partial<SavedRestaurant> & {
    userID: string;
    fonciiRestaurantID: string;
  }) {
    super({
      id:
        id ??
        SavedRestaurantModel.createDeterministicUID({
          userID,
          fonciiRestaurantID,
        }),
      userID,
      creationDate,
    });

    this.fonciiRestaurantID = fonciiRestaurantID;
    this.postID = postID;
  }

  // Helper methods
  /**
   *
   * @returns -> A deterministic unique identifier that's a simple combination of the user's ID and the
   * id of the restaurant that was saved in order to prevent the restaurant from being saved again via
   * some unintended mechanism. This prevents the need to perform a lookup of an existing similar entry
   * before insertion of the document.
   */
  static createDeterministicUID({
    userID,
    fonciiRestaurantID,
  }: {
    userID: string;
    fonciiRestaurantID: string;
  }) {
    return DatabaseServiceAdapter.createDeterministicUID({
      uid1: userID,
      uid2: fonciiRestaurantID,
    });
  }

  /**
   * @returns An object converted from JSON format representing the model's data
   * or the data of any class that extends this class via inheritance.
   */
  toObject() {
    return JSON.parse(JSON.stringify(this));
  }
}
