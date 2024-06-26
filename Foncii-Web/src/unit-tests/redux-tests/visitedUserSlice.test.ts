// Dependencies
// Types
import {
  ConfigurableMockFMPostDataWRestaurantData,
  MockCoordinatePointData,
  MockFMPostData,
  MockFMUserData,
  MockIntegrationCredentialData,
} from "../../types/mocks/mock-gql-types";
import { FmIntegrationCredential } from "../../__generated__/graphql";

// Default Values
import { DefaultPostFilters } from "../../types/default-type-values";

// Helpers
import { sortAndFilterUserPosts } from "../../core-foncii-maps/helpers/userPostHelpers";

// Actions
import {
  setVisitedUser,
  setIntegrationCredentials,
  setPosts,
  organizePosts,
  appendPost,
  setLoadingState,
  clearAllIntegrationCredentials,
  clear,
} from "../../redux/entities/slices/visitedUser";

// Reducer + Initial State
import visitedUserReducer, {
  initialState,
} from "../../redux/entities/slices/visitedUser";

// Visited User Redux Slice Testing Scheme
describe("visitedUserSlice", () => {
  let initialStateCopy: VisitedUserSliceState;

  beforeEach(() => {
    initialStateCopy = { ...initialState };
  });

  it("should set the visited user data", () => {
    const user = MockFMUserData;

    const newState = visitedUserReducer(
      initialStateCopy,
      setVisitedUser({ user })
    );

    expect(newState.user).toEqual(user);
  });

  it("should set integration credentials", () => {
    const integrationCredentials: FmIntegrationCredential[] = [
      /* ... your integration credentials here */
    ];
    const newState = visitedUserReducer(
      undefined,
      setIntegrationCredentials({ integrationCredentials })
    );

    expect(newState.integrationCredentials).toEqual(integrationCredentials);
  });

  it("should set the list of posts", () => {
    const posts = [MockFMPostData, MockFMPostData];

    const newState = visitedUserReducer(initialStateCopy, setPosts({ posts }));

    expect(newState.posts).toEqual(posts);
  });

  it("should organize the posts", () => {
    const selectedPost = ConfigurableMockFMPostDataWRestaurantData(
        false,
        false
      ),
      posts = [selectedPost, MockFMPostData, MockFMPostData, MockFMPostData];

    const currentUserCoordinates = MockCoordinatePointData;
    const selectedPostID = selectedPost.id;

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

    const newState = visitedUserReducer(
      { ...initialStateCopy, posts },
      organizePosts({
        currentUserCoordinates,
        postFilters,
        selectedPostID,
      })
    );

    const sortedPosts = sortAndFilterUserPosts(
      posts,
      selectedPostID,
      currentUserCoordinates,
      postFilters
    );

    // Since this is a visited user all posts should be visible
    expect(newState.visiblePosts).toEqual(sortedPosts);
  });

  it("should append a new post", () => {
    const newPost = MockFMPostData;

    initialStateCopy.posts = [MockFMPostData, MockFMPostData];

    const newState = visitedUserReducer(
      initialStateCopy,
      appendPost({ newPost })
    );

    expect(newState.posts).toContain(newPost);
  });

  it("should set loading state", () => {
    const newState = visitedUserReducer(
      initialStateCopy,
      setLoadingState({ isLoading: true })
    );

    expect(newState.isLoading).toBe(true);
  });

  it("should clear all integration credentials", () => {
    const initialStateWithCredentials: VisitedUserSliceState = {
      ...initialState,
      integrationCredentials: [MockIntegrationCredentialData],
    };

    const newState = visitedUserReducer(
      initialStateWithCredentials,
      clearAllIntegrationCredentials({})
    );
    expect(newState.integrationCredentials.length).toBe(0);
  });

  it("should clear the state", () => {
    initialStateCopy.user = MockFMUserData;
    initialStateCopy.posts = [MockFMPostData];
    initialStateCopy.visiblePosts = [MockFMPostData];
    initialStateCopy.isLoading = true;

    const newState = visitedUserReducer(initialStateCopy, clear());

    expect(newState).toEqual(initialState);
  });
});
