// Dependencies
// Types
import { FmUserPost, FmUserPostMedia, PostMediaTypes } from "../../__generated__/graphql.js";

// Logging
import { logger } from '../logging/debugLoggingService.js';

// Services
import { FonciiCloudStorageServiceAdapter } from "../cloud-storage/service-adapters/cloudStorageServiceAdapter.js";
import { DatabaseServiceAdapter } from "../database/databaseService.js";

// Namespace Declarations
import * as DatabaseAPI from '../../types/namespaces/database-api.js'

/**
 * Loosely coupled service layer for all Foncii Maps (FM) User posts related services, operations, and data transformations
 * including database interfacing for mutations and queries
 */
export default class FMPostService {
    // Service
    database = new DatabaseServiceAdapter();

    // User Post Media
    /**
     * Fetches all user posts for the given user and uploads the media for each post while 
     * updating the database entries.
     * 
     * @param userID -> The user whose posts to fetch and download / upload media for (if any)
     * media is uploaded on an as-needed basis i.e when the post is first imported / created and 
     * doesn't have a foncii media URL.
     */
    async uploadPostMediaForAllUserPosts(userID: string) {
        const allUserPosts = await this.fetchAllPostsWithoutUploadedMedia(userID) ?? [];
        await this.uploadMediaForFMPosts(allUserPosts);
    }

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
    async updatePostMedia({
        userID,
        postID,
        mediaFileDataBuffer,
        videoThumbnailFileDataBuffer
    }: {
        userID: string,
        postID: string,
        mediaFileDataBuffer?: Uint8Array | undefined,
        videoThumbnailFileDataBuffer?: Uint8Array | undefined
    }): Promise<boolean> {
        // Properties
        const cloudStorageService = new FonciiCloudStorageServiceAdapter();

        // File Deletion
        if (mediaFileDataBuffer == undefined) {
            return await this.setPostMedia({ userID, postID });
        }

        // Input Validation
        if (!FonciiCloudStorageServiceAdapter.isUserPostVideoMediaValid(mediaFileDataBuffer)
            || !FonciiCloudStorageServiceAdapter.isUserPostImageMediaValid(mediaFileDataBuffer)) { return false; }

        // Image / Video Media
        let fileDataBufferToUpload: Uint8Array | undefined = mediaFileDataBuffer;

        // Media Type Branching
        const mediaIsVideo = FonciiCloudStorageServiceAdapter.isUserPostVideoMediaValid(mediaFileDataBuffer);

        // Conversion / Optimization
        if (!mediaIsVideo) {
            fileDataBufferToUpload = await cloudStorageService.convertImageToJPEG(mediaFileDataBuffer);

            return await this.setPostMedia({ userID, postID, mediaFileDataBuffer: fileDataBufferToUpload });
        }
        else {
            // Thumbnail image required for video media uploads, fail if none provided
            if (!videoThumbnailFileDataBuffer) return false;

            const videoThumbnailFileDataBufferToUpload = await cloudStorageService.convertImageToJPEG(videoThumbnailFileDataBuffer);

            return await this.setPostMedia({
                userID,
                postID,
                mediaFileDataBuffer: fileDataBufferToUpload,
                videoThumbnailFileDataBuffer: videoThumbnailFileDataBufferToUpload
            });
        }
    }

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
    async setPostMedia({
        userID,
        postID,
        mediaFileDataBuffer,
        videoThumbnailFileDataBuffer
    }: {
        userID: string,
        postID: string,
        mediaFileDataBuffer?: Uint8Array | undefined,
        videoThumbnailFileDataBuffer?: Uint8Array | undefined
    }): Promise<boolean> {
        const cloudStorageService = new FonciiCloudStorageServiceAdapter();

        // Logging Metrics
        let startTime: number = Date.now(),
            elapsedTime: number;

        const { operationSucceeded, media } = await cloudStorageService.updatePostMedia({
            userID,
            fileName: postID,
            mediaFileDataBuffer,
            videoThumbnailFileDataBuffer
        });

        // Update the post data in the DB
        if (operationSucceeded) {
            await this.updatePost(postID, { media });
        }

        // Metrics
        elapsedTime = (Date.now() - startTime) / 1000; // In seconds [s]

        operationSucceeded ?
            logger.info(`\nPost Media Update Complete. \nTime Elapsed: ${elapsedTime}[s]`) :
            logger.info(`\nPost Media Update Failed. \nTime Elapsed: ${elapsedTime}[s]`);

        return operationSucceeded;
    }

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
    async deleteMediaForPost({
        userID,
        postID
    }: {
        userID: string,
        postID: string
    }) {
        // Service defs
        const cloudStorageService = new FonciiCloudStorageServiceAdapter(),
            postService = new FMPostService();

        // Fetching
        const post = await postService.fetchPost(postID);

        // Precondition failure, post doesn't exist
        if (!post) return false;

        // Parsing
        const secondaryMedia = post.secondaryMedia ?? [],
            fileName = postID;

        // Delete main media (image + video + video thumbnail)
        const deletedMainMedia = await cloudStorageService.deleteMediaForFMPost({ userID, fileName });
        // True by default to ensure this function returns true even if there is no secondary media
        let deletedSecondaryMedia = true;

        // Delete secondary media (if any) (image + video + video thumbnail)
        await Promise.all(secondaryMedia.map(async (_, index) => {
            // File name inferencing
            const fileName = this.generateSecondaryMediaChildFileName({ postID, index }),
                didSucceed = await cloudStorageService.deleteMediaForFMPost({ userID, fileName });

            // Update externally scoped operation success tracker
            deletedSecondaryMedia = didSucceed && deletedSecondaryMedia;
        }));

        return deletedMainMedia && deletedSecondaryMedia;
    }

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
    async deleteAllFMPostMedia(userID: string): Promise<boolean> {
        const cloudStorageService = new FonciiCloudStorageServiceAdapter();
        return await cloudStorageService.deleteAllFMPostMedia(userID);
    }

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
    async fetchPost(postID: string): Promise<FmUserPost | null> {
        const collectionName = DatabaseAPI.FonciiDBCollections.FMPosts,
            documentID = postID;

        return await this.database.findDocumentWithID<FmUserPost>(collectionName, documentID);
    }

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
    async fetchAllPostsWithoutUploadedMedia(
        userID: string,
        limit: number = 0
    ): Promise<FmUserPost[] | undefined> {
        const collectionName = DatabaseAPI.FonciiDBCollections.FMPosts;

        // Conditions
        // Look for media without a media URL (prior media not uploaded), or video media that's missing a video thumbnailURL (from prior import discrepancies)
        // Pending media uploads must have a media data source, any posts without this shouldn't be pulled in
        const mainMediaMissing = {
            $and: [
                { 'media.mediaURL': { $exists: false } },
                { 'dataSource.media.mediaURL': { $exists: true } }
            ]
        },
            mainMediaThumbnailMissing = {
                $and: [
                    { 'media.mediaType': PostMediaTypes.Video },
                    { 'media.videoMediaThumbnailURL': { $exists: false } },
                    { 'dataSource.media.videoMediaThumbnailURL': { $exists: true } }
                ]
            },
            secondaryMediaMissing = {
                $and: [
                    { "secondaryMedia": { $exists: false } },
                    { "dataSource.secondaryMedia": { $exists: true } },
                    { "dataSource.secondaryMedia": { $ne: null } }
                ]
            };

        return (await this.database.findDocumentsWithProperties<FmUserPost>({
            collectionName,
            properties: {
                userID,
                $or: [mainMediaMissing, mainMediaThumbnailMissing, secondaryMediaMissing]
            } as any,
            resultsPerPage: limit
        })).documents;
    }

    /**
     * Converts a usual post ID based file name from '1234567' -> '1234567_1' to denote a secondary media
     * file that's associated with the original post.
     * 
     * @param postID -> ID of the original post, this will be extended by the index of the media child
     * @param index -> The location of the media child in the secondary media child array
     * 
     * @returns -> The generated file name: ex.) '1234567' -> '1234567_1'
     */
    generateSecondaryMediaChildFileName({
        postID,
        index
    }: {
        postID: string,
        index: number
    }) {
        const oneIndexed = index + 1,
            fileName = `${postID}_${oneIndexed}`;

        return fileName;
    }

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
    async uploadMediaForFMPosts(posts: FmUserPost[]) {
        // Service defs
        const cloudStorageService = new FonciiCloudStorageServiceAdapter();

        function shouldSomeMediaBeUploaded({
            dataSourceMedia,
            primaryMedia
        }: {
            dataSourceMedia?: FmUserPostMedia,
            primaryMedia?: FmUserPostMedia
        }) {
            // Media (video or image)
            const mediaExistsAtSource = dataSourceMedia?.mediaURL != undefined,
                primaryMediaNotYetUploaded = primaryMedia?.mediaURL == undefined,
                primaryMediaShouldBeUploaded = mediaExistsAtSource && primaryMediaNotYetUploaded,

                // Video thumbnail (if media is a video)
                primaryMediaThumbnailExistsAtSource = dataSourceMedia?.videoMediaThumbnailURL != undefined,
                primaryMediaThumbnailNotYetUploaded = primaryMedia?.videoMediaThumbnailURL == undefined,
                primaryMediaThumbnailShouldBeUploaded = primaryMediaThumbnailExistsAtSource && primaryMediaThumbnailNotYetUploaded;

            // Final | Either the core media or a video thumbnail has to be uploaded (again if the core media is a video)
            return primaryMediaShouldBeUploaded || primaryMediaThumbnailShouldBeUploaded;
        }

        // Logging Metrics
        const totalPosts = posts.length,
            startTime = Date.now();

        // Task Statistics
        let videosUploaded = 0,
            imagesUploaded = 0;

        for (let index = 0; index < totalPosts; index++) {
            // Mutable copy
            const post = posts[index];

            // Impossible case, but good to catch and log if it does happen to prevent the service from erroring out
            if (post == undefined) {
                logger.error(`[uploadMediaForFMPosts] Fatal Exception Caught: Post at index ${index} is undefined`);
                continue;
            }

            // Post media properties
            const dataSourceMedia = post.dataSource?.media,
                mainMedia = (post.media ?? undefined),
                someMainMediaShouldBeUploaded = shouldSomeMediaBeUploaded({ dataSourceMedia, primaryMedia: mainMedia });

            // Check secondary media
            const dataSourceSecondaryMedia = (post.dataSource?.secondaryMedia ?? []).filter(Boolean),
                secondaryMedia = (post.secondaryMedia ?? []).filter(Boolean),
                someSecondaryMediaShouldBeUploaded = dataSourceSecondaryMedia
                    .some((dataSourceSecondaryMediaChild, index) => {
                        const secondaryMediaChild = secondaryMedia[index],
                            secondaryMediaShouldBeUploaded = shouldSomeMediaBeUploaded({
                                dataSourceMedia: dataSourceSecondaryMediaChild,
                                primaryMedia: secondaryMediaChild
                            });

                        return secondaryMediaShouldBeUploaded;
                    });

            // Main Media Properties
            const mediaExistsAtSource = dataSourceMedia?.mediaURL != undefined,
                mainMediaNotYetUploaded = mainMedia?.mediaURL == undefined,
                mainMediaShouldBeUploaded = mediaExistsAtSource && mainMediaNotYetUploaded,

                // Video thumbnail (if media is a video)
                mainMediaThumbnailExistsAtSource = dataSourceMedia?.videoMediaThumbnailURL != undefined,
                mainMediaThumbnailNotYetUploaded = mainMedia?.videoMediaThumbnailURL == undefined,
                mainMediaThumbnailShouldBeUploaded = mainMediaThumbnailExistsAtSource && mainMediaThumbnailNotYetUploaded,
                mainMediaIsVideo = mainMediaThumbnailExistsAtSource,

                mediaUploadPending = someMainMediaShouldBeUploaded || someSecondaryMediaShouldBeUploaded;

            if (mediaUploadPending) {
                // Parse post metadata
                const postID = post.id,
                    userID = post.userID ?? undefined;

                // Main Media (Image + Video & Video Thumbnail)
                if (someMainMediaShouldBeUploaded) {
                    // Image + Video
                    if (mainMediaShouldBeUploaded) {
                        const dataSourceMediaURL = dataSourceMedia?.mediaURL ?? undefined,
                            postMediaFileName = postID,
                            uploadedMediaPermalink = await cloudStorageService.uploadFMPostMediaFromURL(dataSourceMediaURL, postMediaFileName, userID);

                        if (uploadedMediaPermalink) {
                            logger.info(`The required main media was successfully uploaded for post: ${postID}`);

                            post.media = {
                                ...post.media,
                                mediaType: mainMediaIsVideo ? PostMediaTypes.Video : dataSourceMedia?.mediaType ?? PostMediaTypes.Image, // Default to image if the data source doesn't specify 
                                mediaURL: uploadedMediaPermalink!
                            } as FmUserPostMedia;

                            // Update upload stats
                            mainMediaIsVideo ? videosUploaded += 1 : imagesUploaded += 1;
                        }
                        else {
                            logger.info(`The required main media could not be uploaded for post: ${postID}`);
                            continue; // Jump ahead to next post since this issue could not be resolved
                        }
                    }

                    // Video Thumbnail (if primary media is a video)
                    if (mainMediaThumbnailShouldBeUploaded) {
                        const dataSourceVideoMediaThumbnailURL = dataSourceMedia?.videoMediaThumbnailURL ?? undefined,
                            postMediaFileName = postID,
                            uploadedMediaPermalink = await cloudStorageService.uploadFMPostVideoThumbnailMedia(dataSourceVideoMediaThumbnailURL, postMediaFileName, userID);

                        if (uploadedMediaPermalink) {
                            logger.info(`Main media video thumbnail successfully uploaded for post ${postID}`);

                            post.media = {
                                ...post.media,
                                mediaType: PostMediaTypes.Video,
                                videoMediaThumbnailURL: uploadedMediaPermalink!
                            } as FmUserPostMedia;

                            // Update upload stats
                            imagesUploaded += 1;
                        }
                        else {
                            logger.info(`Main media video thumbnail could not be uploaded for post ${postID}`);
                            continue; // Jump ahead to next post, can't resolve this upload if video thumbnail isn't available
                        }
                    }
                }

                // Secondary Media (Image + Video & Video Thumbnail))
                if (someSecondaryMediaShouldBeUploaded) {
                    for (let index = 0; index < dataSourceSecondaryMedia.length; index++) {
                        // Data retrieval
                        const dataSourceSecondaryMediaChild = dataSourceSecondaryMedia[index];
                        let secondaryMediaChild: FmUserPostMedia | undefined = secondaryMedia[index];

                        // Media (video or image)
                        const mediaExistsAtSource = dataSourceSecondaryMediaChild.mediaURL != undefined,
                            mediaNotYetUploaded = secondaryMediaChild?.mediaURL == undefined,
                            mediaShouldBeUploaded = mediaExistsAtSource && mediaNotYetUploaded,

                            // Video thumbnail (if media is a video)
                            mediaThumbnailExistsAtSource = dataSourceSecondaryMediaChild.videoMediaThumbnailURL != undefined,
                            mediaThumbnailNotYetUploaded = secondaryMediaChild?.videoMediaThumbnailURL == undefined,
                            mediaThumbnailShouldBeUploaded = mediaThumbnailExistsAtSource && mediaThumbnailNotYetUploaded,
                            mediaIsVideo = mediaThumbnailExistsAtSource;

                        // Image + Video
                        if (mediaShouldBeUploaded) {
                            const dataSourceMediaURL = dataSourceSecondaryMediaChild?.mediaURL ?? undefined,
                                postMediaFileName = this.generateSecondaryMediaChildFileName({ postID, index }),
                                uploadedMediaPermalink = await cloudStorageService.uploadFMPostMediaFromURL(dataSourceMediaURL, postMediaFileName, userID);

                            if (uploadedMediaPermalink) {
                                logger.info(`The required secondary media was successfully uploaded for post: ${postID} | index: ${index + 1}`);

                                secondaryMediaChild = {
                                    ...secondaryMediaChild,
                                    mediaType: mediaIsVideo ? PostMediaTypes.Video : dataSourceSecondaryMediaChild?.mediaType ?? PostMediaTypes.Image, // Default to image if the data source doesn't specify 
                                    mediaURL: uploadedMediaPermalink!
                                } as FmUserPostMedia;

                                // Update upload stats
                                mediaIsVideo ? videosUploaded += 1 : imagesUploaded += 1;

                                // Update mutable secondary media array with updated data
                                secondaryMedia[index] = secondaryMediaChild;
                            }
                            else {
                                logger.info(`The required secondary media could not be uploaded for post: ${postID} | index: ${index + 1}`);

                                // Backtrack and remove all secondary media if one fails to upload properly
                                while (secondaryMedia.length > 0) {
                                    secondaryMedia.pop();
                                }

                                // Break out of loop, since this issue could not be resolved
                                break;
                            }
                        }

                        // Video Thumbnail (if media is a video)
                        if (mediaThumbnailShouldBeUploaded) {
                            const dataSourceVideoMediaThumbnailURL = dataSourceSecondaryMediaChild?.videoMediaThumbnailURL ?? undefined,
                                postMediaFileName = this.generateSecondaryMediaChildFileName({ postID, index }),
                                uploadedMediaPermalink = await cloudStorageService.uploadFMPostVideoThumbnailMedia(dataSourceVideoMediaThumbnailURL, postMediaFileName, userID);

                            if (uploadedMediaPermalink) {
                                logger.info(`Secondary media video thumbnail successfully uploaded for post ${postID} | index: ${index + 1}`);

                                secondaryMediaChild = {
                                    ...secondaryMediaChild,
                                    mediaType: PostMediaTypes.Video,
                                    videoMediaThumbnailURL: uploadedMediaPermalink!
                                } as FmUserPostMedia;

                                // Update upload stats
                                imagesUploaded += 1;

                                // Update mutable secondary media array with updated data
                                secondaryMedia[index] = secondaryMediaChild;
                            }
                            else {
                                logger.info(`Secondary media video thumbnail could not be uploaded for post ${postID} | index: ${index + 1}`);

                                // Backtrack and remove all secondary media if one fails to upload properly
                                while (secondaryMedia.length > 0) {
                                    secondaryMedia.pop();
                                }

                                // Break out of loop, can't resolve this upload if video thumbnail isn't available
                                break;
                            }
                        }
                    }

                    // Update secondary media array for the post
                    post.secondaryMedia = secondaryMedia.length > 0 ? secondaryMedia : undefined;
                }

                // Update the post in the DB
                await this.updatePost(postID, post);
            }

            // Logging Metrics
            const elapsedTime = (Date.now() - startTime) / 1000; // In seconds [s]

            if (mediaUploadPending) {
                logger.info(`\n\nTime Elapsed: ${elapsedTime}[s]`);
            }
            else {
                logger.info(`Skipping over post with ID: ${post.id} | Required media already uploaded.`)
            }
        }

        // Task Completion Logger
        const fileUploadCount = imagesUploaded + videosUploaded;

        logger.info(`\nUpload Complete. ${fileUploadCount} Files Uploaded\n`);
        logger.info(`\nTotal Images Uploaded: ${imagesUploaded}`);
        logger.info(`\nTotal Videos Uploaded: ${videosUploaded}`);
    }

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
    async updatePost(
        postID: string,
        data: Partial<FmUserPost>) {
        const documentID = postID,
            collectionName = DatabaseAPI.FonciiDBCollections.FMPosts;

        // Update the post's last updated timestamp by merging the data object with the updated timestamp
        const updatedData = {
            ...data,
            lastUpdated: new Date().toISOString()
        } as FmUserPost

        return await this.database.updateFieldsInDocumentWithID(collectionName, documentID, updatedData);
    }
}