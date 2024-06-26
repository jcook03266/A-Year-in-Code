// Dependencies
// Inheritance
import FonciiMapsPostService from "../../fmPostService";

// Microservices
import { MicroserviceRepository } from "../../../../../../core-foncii/microservices/repository/microserviceRepository";

// Utilities
import { getMSTimeFromDateString } from "../../../../../../foncii-toolkit/utilities/convenienceUtilities";

/**
 * Generic integration base class for the others to inherit reusable methods
 * and properties from.
 */
export default class FMIntegrationService extends FonciiMapsPostService {
  // Properties
  integrationCredential: FMIntegrationCredential;

  // Convenience
  // ID of the user associated with the provided integration credential
  userID = (): string => {
    return this.integrationCredential.userID;
  };

  constructor(integrationCredential: FMIntegrationCredential) {
    super();

    this.integrationCredential = integrationCredential;
  }

  /**
   * Determines if the any new media exists and should be uploaded to the storage bucket to update
   * posts accordingly.
   *
   * @param posts -> The posts to check for new / un-uploaded media.
   *
   * @returns -> True when there are posts with undefined media URLs and existing source media
   * metadata.
   */
  static isMediaUploadPending(posts: FMUserPost[]): boolean {
    let mediaUploadPending = false;

    function shouldSomeMediaBeUploaded({
      dataSourceMedia,
      primaryMedia,
    }: {
      dataSourceMedia?: FMUserPostMedia;
      primaryMedia?: FMUserPostMedia;
    }) {
      // Media (video or image)
      const mediaExistsAtSource = dataSourceMedia?.mediaURL != undefined,
        primaryMediaNotYetUploaded = primaryMedia?.mediaURL == undefined,
        primaryMediaShouldBeUploaded =
          mediaExistsAtSource && primaryMediaNotYetUploaded,
        // Video thumbnail (if media is a video)
        primaryMediaThumbnailExistsAtSource =
          dataSourceMedia?.videoMediaThumbnailURL != undefined,
        primaryMediaThumbnailNotYetUploaded =
          primaryMedia?.videoMediaThumbnailURL == undefined,
        primaryMediaThumbnailShouldBeUploaded =
          primaryMediaThumbnailExistsAtSource &&
          primaryMediaThumbnailNotYetUploaded;

      // Final | Either the core media or a video thumbnail has to be uploaded (again if the core media is a video)
      return (
        primaryMediaShouldBeUploaded || primaryMediaThumbnailShouldBeUploaded
      );
    }

    for (let post of posts) {
      const dataSourceMedia = post.dataSource?.media,
        primaryMedia = post.media,
        someMainMediaShouldBeUploaded = shouldSomeMediaBeUploaded({
          dataSourceMedia,
          primaryMedia,
        });

      // Check secondary media
      const dataSourceSecondaryMedia = (
        post.dataSource?.secondaryMedia ?? []
      ).filter(Boolean),
        secondaryMedia = (post.secondaryMedia ?? []).filter(Boolean),
        someSecondaryMediaShouldBeUploaded = dataSourceSecondaryMedia.some(
          (dataSourceSecondaryMediaChild, index) => {
            const secondaryMediaChild = secondaryMedia[index],
              secondaryMediaShouldBeUploaded = shouldSomeMediaBeUploaded({
                dataSourceMedia: dataSourceSecondaryMediaChild,
                primaryMedia: secondaryMediaChild,
              });

            return secondaryMediaShouldBeUploaded;
          }
        );

      // Any main or secondary media not yet uploaded or video media missing its thumbnail
      if (someMainMediaShouldBeUploaded || someSecondaryMediaShouldBeUploaded) {
        mediaUploadPending = true;
        break;
      }
    }

    return mediaUploadPending;
  }

  /**
   * Conditionally parses through the passed posts to determine if any need their media uploaded or not.
   * If a media upload is pending / required then our media microservice is triggered and this
   * requirement is fulfilled.
   *
   * @param posts -> The posts to iterate through to determine if any need their media uploaded or not
   */
  uploadPostMediaIfNeeded(posts: FMUserPost[]) {
    /**
     * Upload any new media to the storage bucket and update the posts accordingly
     * Only triggered when there are posts with undefined media URLs.
     */
    const mediaUploadPending = FMIntegrationService.isMediaUploadPending(posts);

    // Microservice trigger
    if (mediaUploadPending) {
      MicroserviceRepository.fonciiMedia().uploadUserPostMediaFor(
        this.userID()
      );
    }
  }

  /**
   * Combines arrays of two post sources, one fetched from the database
   * and the other imported from an integration of choice in an
   * exclusive set of elements where the ID of each is unique.
   *
   * @param fetchedPosts -> From database
   * @param importedPosts -> From importation method
   *
   * @returns -> Imported posts and fetched posts inside of one
   * mutually exclusive set / array where each post has a unique ID to
   * prevent duplicate entries from being shown.
   */
  joinImportedPostsWithFetchedPosts({
    fetchedPosts,
    importedPosts,
  }: {
    fetchedPosts: FMUserPost[];
    importedPosts: FMUserPost[];
  }) {
    const joinedPosts: FMUserPost[] = importedPosts;

    fetchedPosts.forEach((fetchedPost) => {
      // If the existing set excludes the element with the given ID, then add that element to the set
      if (joinedPosts.find((post) => post.id == fetchedPost.id) == undefined) {
        joinedPosts.push(fetchedPost);
      }
    });

    return joinedPosts;
  }

  /**
   * Sorts posts by original creation date in the given sort order. If the post was
   * manually added then the date the post was added to our database is used. If the
   * post was imported from an external source then the creation date reported by the data
   * source is used as the original creation date.
   *
   * @param posts
   * @param descendingSortOrder -> Newest to oldest (descending order) is the default value
   *
   * @returns -> Posts sorted by creation date (newest to oldest) by default
   */
  sortByOriginalCreationDate(
    posts: FMUserPost[],
    descendingSortOrder: boolean = true
  ): FMUserPost[] {
    const sortedPosts = posts.sort((postA, postB) => {
      // Properties
      let postAOriginalCreationDateTime = getOriginalCreationDateTime(postA),
        postBOriginalCreationDateTime = getOriginalCreationDateTime(postB);

      /**
       * @param post
       *
       * @returns -> Original post creation date time in [ms].
       */
      function getOriginalCreationDateTime(post: FMUserPost): number {
        let postSourceCreationDate = post.dataSource?.creationDate, // Creation date reported by the original data source
          postCreationDate = post.creationDate, // Date when the post was created in our database / first added by the user to Foncii Maps
          originalCreationDate = postSourceCreationDate ?? postCreationDate,
          originalCreationDateTime =
            getMSTimeFromDateString(originalCreationDate);

        return originalCreationDateTime;
      }

      return descendingSortOrder
        ? postBOriginalCreationDateTime - postAOriginalCreationDateTime
        : postAOriginalCreationDateTime - postBOriginalCreationDateTime;
    });

    return sortedPosts;
  }

  /**
   * A simple block encapsulating the expected processing
   * done on imported posts.
   *
   * @param importedPosts -> Sourced from the `import` method
   *
   * @returns -> Processed and sorted imported / fetched posts inside of one
   * mutually exclusive set / array where each post has a unique ID to
   * prevent duplicate entries from being shown.
   */
  async processPosts(importedPosts: FMUserPost[]): Promise<FMUserPost[]> {
    const userID = this.userID(),
      fetchedPosts = (await this.fetchAllPostsForUser(userID)); // Important: Unlimited quantity of posts returned for now, but this should be limited in the future.

    let fmPosts: FMUserPost[] = this.joinImportedPostsWithFetchedPosts({
      fetchedPosts,
      importedPosts,
    });

    // External processes
    this.uploadPostMediaIfNeeded(fmPosts);

    // Sort from newest to oldest (descending order)
    fmPosts = this.sortByOriginalCreationDate(fmPosts);

    return fmPosts;
  }
}
