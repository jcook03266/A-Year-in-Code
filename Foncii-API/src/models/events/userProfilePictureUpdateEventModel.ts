// Dependencies
// Types
import { FonciiEvents } from "../../types/common";
import { SupportedFonciiPlatforms } from "../../types/namespaces/microservice-api";

// Inheritance
import FonciiEventModel from "./protocol/fonciiEventModel";

export default class UserProfilePictureUpdateEventModel
  extends FonciiEventModel
  implements
    UserProfilePictureUpdateEvent,
    Objectable<UserProfilePictureUpdateEvent>
{
  // Properties
  platform: SupportedFonciiPlatforms;

  constructor({
    id,
    userID,
    timestamp,
    platform,
    sessionID,
  }: Partial<FonciiEvent> & { platform: SupportedFonciiPlatforms }) {
    super({
      id,
      userID,
      timestamp,
      eventType: FonciiEvents.USER_PROFILE_PICTURE_UPDATE,
      sessionID,
    });

    this.platform = platform;
  }

  /**
   * @returns An object converted from JSON format representing the event model's data
   * or the data of any class that extends this class via inheritance.
   */
  toObject<UserProfilePictureUpdateEvent>(): UserProfilePictureUpdateEvent {
    return JSON.parse(JSON.stringify(this));
  }
}
