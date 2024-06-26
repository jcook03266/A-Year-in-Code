// Dependencies
// Slices
import { createSlice } from "@reduxjs/toolkit";
import { ReducerNames } from "../slices";

// Types
import { FmUserPost } from "../../../__generated__/graphql";

// User Post Helpers
import { searchSortFilterPosts } from "../../../core-foncii-maps/helpers/userPostHelpers";

// The default state of this entity when first instantiated
export const initialState: VisitedUserSliceState = {
  user: undefined,
  integrationCredentials: [],
  posts: [], // Unfiltered and unsorted posts
  visiblePosts: [], // Filtered and sorted publicly visible posts
  isLoading: false, // True when an async operation is in progress, false otherwise
};

/**
 * Slice that stores global data tied to a visited user displayed when visiting the visitor page where you can see
 * the visited user's wall of visible posts and some of their public account information
 * Slice Definition that combines type def, initial state, and reducer defs into a single object via toolkit
 */
const visitedUserSlice = createSlice({
  name: ReducerNames.VisitedUserReducerName,
  initialState: initialState,
  reducers: {
    // All actions that can be taken on this slice
    // Sets the visited user's data
    setVisitedUser: (state, action) => {
      const user = action.payload.user;

      state.user = user;
    },

    setIntegrationCredentials: (state, action) => {
      state.integrationCredentials = action.payload.integrationCredentials;
    },

    // Sets the list of posts by the visited user
    setPosts: (state, action) => {
      state.posts = action.payload.posts ?? [];
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

    organizePosts: (state, action) => {
      let posts = state.posts;

      // Parsed filter and search properties
      const currentUserCoordinates = action.payload?.currentUserCoordinates,
        postFilters = action.payload?.postFilters,
        selectedPostID = action.payload?.selectedPostID,
        computedPostTextContentMappings =
          action.payload.computedPostTextContentMappings,
        searchQuery = action.payload.searchQuery;

      posts = searchSortFilterPosts(
        posts,
        selectedPostID,
        currentUserCoordinates,
        postFilters,
        computedPostTextContentMappings,
        searchQuery
      );

      state.visiblePosts = posts;
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

    setLoadingState: (state, action) => {
      state.isLoading = action.payload.isLoading ?? false;
    },

    clearAllIntegrationCredentials: (state, _) => {
      state.integrationCredentials = initialState.integrationCredentials;
    },

    // Clear the visited user's data when it's no longer needed i.e when switching back to the home page
    clear: () => initialState,
  },
});

// Separate action and reducer exports for easy access in other modules
export const {
  setVisitedUser,
  setIntegrationCredentials,
  setPosts,
  updatePost,
  organizePosts,
  updateRestaurantWithAssociatedArticles,
  appendPost,
  setLoadingState,
  clearAllIntegrationCredentials,
  clear,
} = visitedUserSlice.actions;

export default visitedUserSlice.reducer;
