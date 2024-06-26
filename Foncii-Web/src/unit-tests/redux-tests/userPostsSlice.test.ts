// Dependencies
// Types
import {
  ConfigurableMockFMPostDataWRestaurantData,
  MockCoordinatePointData,
  MockFMPostData,
} from "../../types/mocks/mock-gql-types";

// Default Values
import { DefaultPostFilters } from "../../types/default-type-values";

// Actions
import {
  organizePosts,
  setIsImportingPosts,
  setPosts,
  updatePost,
  appendPost,
  removePost,
  setLoadingState,
  clear,
} from "../../redux/entities/slices/userPosts";

// Reducer + Initial State
import userPostsReducer, {
  initialState,
} from "../../redux/entities/slices/userPosts";

// User Posts Redux Slice Testing Scheme
describe("UserPostsSlice", () => {
  let initialStateCopy: UserPostsSliceState;

  // Reset the state before each test
  beforeEach(() => {
    initialStateCopy = { ...initialState };
  });

  it("should organize posts", () => {
    const selectedMockPost = ConfigurableMockFMPostDataWRestaurantData(
        false,
        false
      ),
      favoritedMockPost = ConfigurableMockFMPostDataWRestaurantData(
        true,
        false
      );

    // Adding test posts
    initialStateCopy.posts = [
      MockFMPostData,
      MockFMPostData,
      favoritedMockPost,
      selectedMockPost,
    ];

    // Configure date range of 'DefaultPostFilters'
    const postFilters = DefaultPostFilters;
    postFilters.dateRange[0] = Math.max(
      ...initialStateCopy.posts.map((post) =>
        new Date(post.dataSource?.creationDate ?? post.creationDate).getTime()
      )
    );
    postFilters.dateRange[1] = Math.min(
      ...initialStateCopy.posts.map((post) =>
        new Date(post.dataSource?.creationDate ?? post.creationDate).getTime()
      )
    );

    const actionPayload = {
      currentUserCoordinates: MockCoordinatePointData,
      postFilters: postFilters,
      selectedPostID: selectedMockPost.id,
    };

    const newState = userPostsReducer(
      initialStateCopy,
      organizePosts(actionPayload)
    );

    expect(newState.visiblePosts).toHaveLength(2);
    expect(newState.hiddenPosts).toHaveLength(2);
  });

  it("should set isImportingPosts state", () => {
    const newState = userPostsReducer(
      initialStateCopy,
      setIsImportingPosts({ isImportingPosts: true })
    );

    expect(newState.isImportingPosts).toBe(true);
  });

  it("should set posts and related states", () => {
    const actionPayload = {
      posts: [
        MockFMPostData, // Hidden
        MockFMPostData, // Hidden
        ConfigurableMockFMPostDataWRestaurantData(false, false),
      ], // Visible
    };

    const newState = userPostsReducer(
      initialStateCopy,
      setPosts(actionPayload)
    );

    expect(newState.posts).toHaveLength(3);
    expect(newState.visiblePosts).toHaveLength(0);
    expect(newState.hiddenPosts).toHaveLength(0);
  });

  it("should update a post", () => {
    const mockPost = ConfigurableMockFMPostDataWRestaurantData(false, false); // Not favorited

    // Add the original post to the initial state + some random post
    initialStateCopy.posts = [mockPost, MockFMPostData];

    // Update post
    mockPost.isFavorited = true;

    const actionPayload = {
      updatedPost: mockPost,
    };

    // Update the state with the updated post
    const newState = userPostsReducer(
        initialStateCopy,
        updatePost(actionPayload)
      ),
      updatedPost = newState.posts.filter((post) => post.id === mockPost.id)[0];

    expect(updatedPost.isFavorited).toBe(true);
  });

  it("should append a new post", () => {
    const actionPayload = {
      newPost: MockFMPostData,
    };

    const newState = userPostsReducer(
      initialStateCopy,
      appendPost(actionPayload)
    );

    expect(newState.posts).toHaveLength(1);
  });

  it("should remove a post", () => {
    const mockPost = MockFMPostData;

    const actionPayload = {
      postID: mockPost.id,
    };

    // Create an initial state with a post to be removed
    initialStateCopy.posts = [mockPost];

    const newState = userPostsReducer(
      initialStateCopy,
      removePost(actionPayload)
    );

    expect(newState.posts).toHaveLength(0);
  });

  it("should set loading state", () => {
    const newState = userPostsReducer(
      initialStateCopy,
      setLoadingState({ isLoading: true })
    );

    expect(newState.isLoading).toBe(true);
  });

  it("should clear the state", () => {
    // Create an initial state with some values to clear
    initialStateCopy.isImportingPosts = true;
    initialStateCopy.posts = [MockFMPostData, MockFMPostData];

    const newState = userPostsReducer(initialStateCopy, clear());

    expect(newState).toEqual(initialState);
  });
});
