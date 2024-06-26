// Dependencies
// Slices
import { createSlice } from "@reduxjs/toolkit";
import { ReducerNames } from "../slices";

// Default Values
import {
  defaultMapBoxCenter,
  defaultMapBoxZoomLevel,
} from "../../../core-foncii-maps/default-values/UserDefaults";

const initialState: MapboxSliceState = {
  galleryState: "idle",
  mapState: "idle",
  virtualCoordinates: defaultMapBoxCenter,
  virtualZoomLevel: defaultMapBoxZoomLevel,
};

const mapboxSlice = createSlice({
  name: ReducerNames.MapboxReducerName,
  initialState: initialState,
  reducers: {
    updateGalleryState: (state, action: { payload: { galleryState: GalleryStates } }) => {
      state.galleryState = action.payload.galleryState;
    },

    updateMapState: (state, action: { payload: { mapState: MapStates } }) => {
      state.mapState = action.payload.mapState;
    },

    /** Records the user's last virtual coordinates reported by the map widget */
    setVirtualCoordinates: (state, action) => {
      const coordinates = action.payload.virtualCoordinates;

      if (coordinates?.lat != undefined && coordinates?.lng != undefined) {
        state.virtualCoordinates = coordinates;
      }
    },

    /** Records the user's virtual zoom level reported by the map widget */
    setVirtualZoomLevel: (state, action) => {
      const zoomLevel = action.payload.virtualZoomLevel;

      if (Number(zoomLevel)) {
        state.virtualZoomLevel = zoomLevel;
      }
    },
  },
});

export const {
  updateGalleryState,
  updateMapState,
  setVirtualCoordinates,
  setVirtualZoomLevel
} = mapboxSlice.actions;

export default mapboxSlice.reducer;
