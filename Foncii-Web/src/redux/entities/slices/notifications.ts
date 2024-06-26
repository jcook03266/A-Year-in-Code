// Dependencies
// Slices
import { createSlice } from "@reduxjs/toolkit";
import { ReducerNames } from "../slices";

// The default state of this entity when first instantiated
export const initialState: NotificationCenterSliceState = {
  systemNotification: null,
  systemNotificationTriggered: false,
};

/**
 * Slice which stores global data tied to notifications triggered by client interactions and error
 * processes.
 *
 * Note: This is slice definition that combines type def, initial state, and reducer defs into a single object via toolkit
 */
const notificationCenterSlice = createSlice({
  name: ReducerNames.NotificationReducerName,
  initialState: initialState,
  reducers: {
    triggerSystemNotification: (state, action) => {
      let systemNotification = action.payload.systemNotification;

      state.systemNotification = systemNotification;
      state.systemNotificationTriggered = true;
    },

    dismissSystemNotification: (state, _) => {
      state.systemNotificationTriggered = false;
    },

    // Resets the state of this slice to its initial state
    clear: () => initialState,
  },
});

// Separate action and reducer exports for easy access in other modules
export const { triggerSystemNotification, dismissSystemNotification, clear } =
  notificationCenterSlice.actions;

export default notificationCenterSlice.reducer;
