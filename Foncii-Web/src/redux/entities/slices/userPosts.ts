// Package Dependencies
// Slices
import { createSlice } from "@reduxjs/toolkit";
import { ReducerNames } from "../slices";

// Post Helpers
import { searchSortFilterPosts } from "../../../core-foncii-maps/helpers/userPostHelpers";

// Types
import { FmUserPost } from "../../../__generated__/graphql";

// The default state of this entity when first instantiated
export const initialState: UserPostsSliceState = {
  posts: [], // Unfiltered and unsorted posts
  visiblePosts: [], // Filtered and sorted visible posts
  hiddenPosts: [], // Filtered and sorted hidden posts
  hasImportedPostsAlready: false, // True when posts are imported at least once, to prevent the loading animation from firing every time
  isImportingPosts: false, // False when posts aren't being currently imported, true otherwise
  isLoading: false, // True when some async process other than importing is occurring, false otherwise
  isFirstImport: false, // True when the user's first import of posts is occurring (when the user first signs up), false otherwise
  importFailed: false,
};

/**
 * Slice that stores global data tied to current user's posts, not visited user posts since those don't
 * allow direct interactions from the guest user and are thus isolated from this slice. The user posts slice
 * automatically separates visible and hidden posts and maintains the selection state of posts and simplifies the
 * interactions between the current user and their posts
 * Slice Definition that combines type def, initial state, and reducer defs into a single object via toolkit
 */
const userPostsSlice = createSlice({
  name: ReducerNames.UserPostsReducerName,
  initialState: initialState,
  reducers: {
    // All actions that can be taken on this slice //
    // Splits the combined list of all posts into separate visible and hidden lists, as well as sorts them by favorite status
    // Can be used to update either list when the main list is edited or a post is updated individually
    organizePosts: (state, action) => {
      // Separate to copy array to avoid mutating the state directly
      let visiblePosts: FmUserPost[] = [],
        hiddenPosts: FmUserPost[] = [];

      // Parsed filter and search properties
      const currentUserCoordinates = action.payload.currentUserCoordinates,
        postFilters = action.payload.postFilters,
        selectedPostID = action.payload.selectedPostID,
        computedPostTextContentMappings =
          action.payload.computedPostTextContentMappings,
        searchQuery = action.payload.searchQuery;

      state.posts.forEach((post) => {
        // Hide the post if it's marked as hidden or if the restaurant data for it hasn't been defined yet
        let isPostHidden = post.isHidden || post.restaurant == undefined;

        // Separate the posts into their individual lists
        isPostHidden ? hiddenPosts.push(post) : visiblePosts.push(post);
      });

      // Data separation
      // Reusable method that simplifies the identical processing of visible and hidden posts.
      function processPosts(posts: FmUserPost[]): FmUserPost[] {
        return searchSortFilterPosts(
          posts,
          selectedPostID,
          currentUserCoordinates,
          postFilters,
          computedPostTextContentMappings,
          searchQuery
        );
      }

      visiblePosts = processPosts(visiblePosts);
      hiddenPosts = processPosts(hiddenPosts);

      state.visiblePosts = visiblePosts;
      state.hiddenPosts = hiddenPosts;
    },

    setIsImportingPosts: (state, action) => {
      state.isImportingPosts = action.payload.isImportingPosts ?? false;
    },

    // Sets the list of posts and organizes them
    setPosts: (state, action) => {
      state.posts = action.payload.posts ?? [];
      state.hasImportedPostsAlready = true;
      state.isImportingPosts = false;
    },

    // Updates the existing post's data with the updated post
    updatePost: (state, action) => {
      const updatedPost = action.payload.updatedPost;

      // Update the existing post's data with the updated post
      const updatedPosts = state.posts.map((post) => {
        if (post.id === updatedPost.id) {
          return { ...post, ...updatedPost };
        } else {
          return post;
        }
      });

      state.posts = updatedPosts;
    },

    updateRestaurantWithAssociatedArticles: (state, action) => {
      const associatedArticlePublicationEdges =
          action.payload.associatedArticlePublicationEdges,
        restaurantID = action.payload.restaurantID;

      // Find and mutate the target restaurant with the given
      let posts = state.posts;

      posts = posts.map((post) => {
        if (
          post.fonciiRestaurant &&
          post.fonciiRestaurant.restaurant.id == restaurantID
        ) {
          post.fonciiRestaurant.associatedArticlePublicationEdges =
            associatedArticlePublicationEdges;
        }

        return post;
      });

      state.posts = posts; // Update the state with the updated list of posts
    },

    // Appends a new post to the list of posts, used when downloading a post outside of the current dataset, i.e detail views
    appendPost: (state, action) => {
      const newPost: FmUserPost = action.payload.newPost,
        doesPostExist =
          state.posts.find((post) => post.id == newPost.id) != undefined;

      // If the post doesn't already exist, add it to the list of posts
      if (!doesPostExist) {
        const postSoftCopy = state.posts;
        postSoftCopy.push(newPost);

        state.posts = postSoftCopy;
      }
    },

    removePost: (state, action) => {
      const idOfPostToRemove: string = action.payload.postID,
        updatedPosts = state.posts.filter(
          (post) => post.id != idOfPostToRemove
        );

      state.posts = updatedPosts;
    },

    setLoadingState: (state, action) => {
      state.isLoading = action.payload.isLoading ?? false;
    },

    setFirstImportState: (state, action) => {
      state.isFirstImport = action.payload.isFirstImport ?? false;
    },

    setImportFailedState: (
      state,
      action: { payload: { importFailed: boolean } }
    ) => {
      state.importFailed = action.payload.importFailed ?? false;
    },

    // Clear the user's posts, usually used when signing the current user out
    clear: () => initialState,
  },
});

// Separate action and reducer exports for easy access in other modules
export const {
  organizePosts,
  setIsImportingPosts,
  setPosts,
  updatePost,
  updateRestaurantWithAssociatedArticles,
  appendPost,
  removePost,
  setLoadingState,
  setFirstImportState,
  setImportFailedState,
  clear,
} = userPostsSlice.actions;

export default userPostsSlice.reducer;
