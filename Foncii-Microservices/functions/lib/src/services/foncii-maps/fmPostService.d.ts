import { FmPost } from "../../__generated__/graphql.js";
import { FirestoreServiceAdapter } from "../database/firestoreService.js";
/**
 * Loosely coupled service layer for all Foncii Maps (FM) User posts related services, operations, and data transformations
 * including database interfacing for mutations and queries
 */
export default class FMPostService {
    dBConnection: FireStoreFMPostServiceAdapter;
    /**
     * Fetches all user posts for the given user and uploads the media for each post while
     * updating the database entries.
     *
     * @param userID -> The user whose posts to fetch and download / upload media for (if any)
     * media is uploaded on an as-needed basis i.e when the post is first imported / created and
     * doesn't have a foncii media URL.
     */
    uploadPostMediaForAllUserPosts(userID: string): Promise<void>;
}
/**
 * Firestore service Adapter for Foncii Maps (FM) User Post Services
 */
declare class FireStoreFMPostServiceAdapter extends FirestoreServiceAdapter {
    /**
    * @async
    * @param userID
    * @param limit -> The maximum number of posts to return (0 = no limit)
    *
    * @returns -> An array of all Foncii Maps posts (public and hidden)
    */
    fetchAllPostsForUser(userID: string, limit?: number): Promise<FmPost[] | undefined>;
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
    * @param fmPosts
    */
    uploadMediaForFMPosts(fmPosts: FmPost[]): Promise<void>;
    /**
    * Updates the Foncii Maps (FM) user post document referenced by the given Foncii Maps user post ID
    *
    * Note: Only use the supported fields provided by the FM post data model
    * to avoid adding isolated/unknown data to a document
    *
    * @async
    * @param postID -> The id of the FM user post document to update
    * @param data -> Updated FM post data to merge with the existing data
    */
    updatePost(postID: string, data: FmPost): Promise<void>;
}
export {};
