// Dependencies
// Actions
import {
  triggerSystemNotification,
  dismissSystemNotification,
  clear,
} from "../../redux/entities/slices/notifications";

// Reducer + Initial State
import notificationCenterReducer, {
  initialState,
} from "../../redux/entities/slices/notifications";

// Notification Center Redux Slice Testing Scheme
describe("notificationCenterSlice", () => {
  let initialStateCopy: NotificationCenterSliceState;

  beforeEach(() => {
    initialStateCopy = { ...initialState };
  });

  it("should trigger a system notification", () => {
    const systemNotification = {
      title: "Notification Title",
      message: "Notification Message",
      isError: false,
      link: "/notification-link",
    };
    const newState = notificationCenterReducer(
      initialStateCopy,
      triggerSystemNotification({ systemNotification })
    );

    expect(newState.systemNotification).toEqual(systemNotification);
    expect(newState.systemNotificationTriggered).toBe(true);
  });

  it("should dismiss a system notification", () => {
    initialStateCopy.systemNotification = {
      title: "Notification Title",
      message: "Notification Message",
      isError: false,
      link: "/notification-link",
    };
    initialStateCopy.systemNotificationTriggered = true;

    const newState = notificationCenterReducer(
      initialStateCopy,
      dismissSystemNotification({})
    );

    // The system notification's data should be defined as it's animated and can't be removed from
    // a scene immediately after it's dismissed.
    expect(newState.systemNotification).toBeDefined();
    expect(newState.systemNotificationTriggered).toBe(false);
  });

  it("should clear the state", () => {
    initialStateCopy.systemNotification = {
      title: "Notification Title",
      message: "Notification Message",
      isError: false,
      link: "/notification-link",
    };
    initialStateCopy.systemNotificationTriggered = true;

    const newState = notificationCenterReducer(initialStateCopy, clear());

    expect(newState).toEqual(initialState);
  });
});
