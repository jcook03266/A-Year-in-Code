// Dependencies
// Inheritance
import UpdatableModel from "../../shared/protocols/updatableModel";

// Services
import { DatabaseServiceAdapter } from "../../../business-logic/services/database/databaseService";

// Utilities
import { parseHashtags } from "../../../foncii-toolkit/formatting/stringFormatting";

/**
 * Stores the required and relevant information pertaining
 * to a Foncii Maps (FM) user post
 */
export default class FMUserPostModel
  extends UpdatableModel
  implements FMUserPost, Objectable<FMUserPost>
{
  // Properties
  id;
  userID;
  fonciiRestaurantID;
  dataSource;
  customUserProperties;
  isFavorited;
  media;
  secondaryMedia;
  parentPostID;
  deletionPending;
  scheduledDeletionTimestamp;

  // Properties
  /** Max and min values for all possible user ratings */
  static UserRatingRange = { max: 5, min: 1 };

  constructor({
    id,
    userID,
    fonciiRestaurantID,
    dataSource,
    customUserProperties,
    isFavorited,
    creationDate,
    lastUpdated,
    media,
    secondaryMedia,
    parentPostID,
    deletionPending,
    scheduledDeletionTimestamp,
  }: Partial<FMUserPost>) {
    // Parse and persist the original creation date from the post's data source (if any)
    const originalCreationDate = dataSource?.creationDate ?? creationDate;

    super({ creationDate: originalCreationDate, lastUpdated });

    this.id = id ?? DatabaseServiceAdapter.generateUUIDHexString();
    this.userID = userID!;
    this.fonciiRestaurantID = fonciiRestaurantID;
    this.dataSource = dataSource;
    this.customUserProperties =
      customUserProperties ??
      FMUserPostModel.generateDefaultCustomUserProperties(dataSource);
    this.isFavorited = isFavorited ?? false; // Not favorited by default
    this.media = media;
    this.secondaryMedia = secondaryMedia;
    this.parentPostID = parentPostID;
    this.deletionPending = deletionPending;
    this.scheduledDeletionTimestamp = scheduledDeletionTimestamp; // Scheduled deletion timestamp (if any)
  }

  /**
   * @returns -> A default instantiation of the expected
   * CustomUserProperties object with empty values.
   */
  static generateDefaultCustomUserProperties(
    dataSource?: PostDataSource
  ): CustomUserProperties {
    return {
      notes: dataSource?.caption ?? "",
      rating: 0,
      categories: parseHashtags(dataSource?.caption ?? ""),
    };
  }

  /**
   * Creates a Foncii Maps user post data model from the given object only if the object's
   * fields satisfy the requirements to instantiate a Foncii Maps post data model object
   *
   * @param object
   * @returns -> A complete Foncii Maps (FM) post data model if all object fields are specified, undefined otherwise
   */
  static fromObject(object: FMUserPost): FMUserPostModel | undefined {
    if (object == undefined) return undefined;

    return new FMUserPostModel(object);
  }

  /**
   * @returns -> A JSON formatted object with all of the Foncii Maps user post data model
   * object's key value pairs formatted as a plain JS Object.
   */
  toObject(): FMUserPost {
    return JSON.parse(JSON.stringify(this));
  }
}
