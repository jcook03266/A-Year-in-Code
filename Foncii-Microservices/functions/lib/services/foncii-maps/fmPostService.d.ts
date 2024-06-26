import { FmUserPost } from "../../__generated__/graphql.js";
import { DatabaseServiceAdapter } from "../database/databaseService.js";
/**
 * Loosely coupled service layer for all Foncii Maps (FM) User posts related services, operations, and data transformations
 * including database interfacing for mutations and queries
 */
export default class FMPostService {
    database: DatabaseServiceAdapter;
    /**
     * Fetches all user posts for the given user and uploads the media for each post while
     * updating the database entries.
     *
     * @param userID -> The user whose posts to fetch and download / upload media for (if any)
     * media is uploaded on an as-needed basis i.e when the post is first imported / created and
     * doesn't have a foncii media URL.
     */
    uploadPostMediaForAllUserPosts(userID: string): Promise<void>;
    /**
     * Updates the post's media in the cloud storage bucket, and updates the post's record in the database
     * with new permalink(s) (if uploading, removed if media is deleted).
     *
     * @async
     * @param userID
     * @param postID
     * @param mediaFileDataBuffer (Optional) Left undefined if the desired media file(s) should be removed from storage
     * @param videoThumbnailFileDataBuffer (Optional) Only required if the file being uploaded is a video
     *
     * @returns -> True if the post's media was updated successfully across all mediums, false otherwise.
     */
    updatePostMedia({ userID, postID, mediaFileDataBuffer, videoThumbnailFileDataBuffer }: {
        userID: string;
        postID: string;
        mediaFileDataBuffer?: Uint8Array | undefined;
        videoThumbnailFileDataBuffer?: Uint8Array | undefined;
    }): Promise<boolean>;
    /**
     * A passthrough function for updating the post's media in the cloud storage bucket
     * via the cloud storage service, and updating its record in the database via the
     * database service.
     *
     * @async
     * @param userID
     * @param postID
     * @param mediaFileDataBuffer (Optional) Left undefined if the desired media file(s) should be removed from storage
     * @param videoThumbnailFileDataBuffer (Optional) Only required if the file being uploaded is a video
     *
     * @returns -> True if the post's media was updated successfully in the cloud storage bucket, false otherwise.
     */
    setPostMedia({ userID, postID, mediaFileDataBuffer, videoThumbnailFileDataBuffer }: {
        userID: string;
        postID: string;
        mediaFileDataBuffer?: Uint8Array | undefined;
        videoThumbnailFileDataBuffer?: Uint8Array | undefined;
    }): Promise<boolean>;
    /**
     * Deletes the main and secondary media (if any) (video / image as well as thumbnail) associated with the post
     * referenced by the given post ID. This should be used when deleting posts. This does
     * not update any information about the post in the database, anything else pertaining to the
     * post after its media is deleted should be handled by the caller.
     *
     * @async
     * @param userID -> ID of the owner of the post to locate the folder in which the post is located in.
     * @param postID -> ID of the post to delete the corresponding main and secondary media (if any) for.
     *
     * @returns -> True if the post's media was deleted successfully, false otherwise.
     */
    deleteMediaForPost({ userID, postID }: {
        userID: string;
        postID: string;
    }): Promise<boolean>;
    /**
     * Deletes all media (videos / images as well as thumbnails) associated with the user
     * referenced by the given user ID. This method should only be used when deleting
     * all user posts, i.e when deleting a user account as it's highly destructive and will
     * result in all post media uploads tied to the given user being wiped. For singular post
     * deletions (such as when a user deletes a post) use the `deleteMediaForPost` method.
     *
     * @async
     * @param userID
     *
     * @returns -> True if all of the given user's post media was deleted successfully,
     * false otherwise.
     */
    deleteAllFMPostMedia(userID: string): Promise<boolean>;
    /**
     * Fetches and returns the post data associated with the given
     * post UID / document ID (if any).
     *
     * @async
     * @param postID
     *
     * @returns -> The post with the given document identifier, null if
     * no post could be found with the UID provided.
     */
    fetchPost(postID: string): Promise<FmUserPost | null>;
    /**
     * Fetches and returns all posts for the given user that don't have
     * uploaded media (i.e. the post's media field is not yet provisioned), but
     * some data source exists to potentially populate it with.
     *
    * @async
    * @param userID
    * @param limit -> The maximum number of posts to return (0 = no limit)
    *
    * @returns -> An array of all the target user's Foncii Maps posts (public and hidden)
    * that don't have uploaded media (i.e. the post's media field is not yet provisioned)
    */
    fetchAllPostsWithoutUploadedMedia(userID: string, limit?: number): Promise<FmUserPost[] | undefined>;
    /**
     * Converts a usual post ID based file name from '1234567' -> '1234567_1' to denote a secondary media
     * file that's associated with the original post.
     *
     * @param postID -> ID of the original post, this will be extended by the index of the media child
     * @param index -> The location of the media child in the secondary media child array
     *
     * @returns -> The generated file name: ex.) '1234567' -> '1234567_1'
     */
    generateSecondaryMediaChildFileName({ postID, index }: {
        postID: string;
        index: number;
    }): string;
    /**
    * A side process that uploads instagram media via URL download
    * to our own storage bucket to be served by own our corresponding CDN.
    * This side process is necessary because large imports will absolutely hang
    * the instance and the endpoint's response time will be way too long. The
    * immediate posts can use the fallback media URL provided by instagram's original data
    * until the post's uploaded media is provisioned. Note: This process has to upload media
    * sequentially instead of in parallel as downloading is required and oversaturating the connection
    * is not beneficial.
    *
    * @async
    * @param posts
    */
    uploadMediaForFMPosts(posts: FmUserPost[]): Promise<void>;
    /**
    * Updates the Foncii Maps (FM) user post document referenced by the given Foncii Maps user post ID
    *
    * Note: Only use the supported fields provided by the FM post data model
    * to avoid adding isolated/unknown data to a document
    *
    * @async
    * @param postID -> The id of the FM user post document to update
    * @param data -> Updated FM post data to merge with the existing data
    *
    * @returns -> True if the post was update successfully, false otherwise.
    */
    updatePost(postID: string, data: Partial<FmUserPost>): Promise<boolean>;
}
