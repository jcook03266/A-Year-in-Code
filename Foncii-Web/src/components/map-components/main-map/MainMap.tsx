/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Framework
import { createRoot } from "react-dom/client";

// Types
import {
  CoordinatePoint,
  FmUserPost,
  FonciiRestaurant,
  Restaurant,
} from "../../../__generated__/graphql";

// Styling
// Local
import ColorRepository from "../../../../public/assets/ColorRepository";

// External Style Sheets
import "mapbox-gl/dist/mapbox-gl.css";

// Components
// Local
import mapboxgl, { LngLat, LngLatLike } from "mapbox-gl";
import { MapControlBox } from "../map-controls/map-control-box/MapControlBox";
import { ExperienceSections } from "../../panels/gallery-panel/gallery-contexts/restaurant-entity-collection-context/RestaurantEntityCollectionContext";
import CoordinatePointDescriptorLabel from "../../labels/coordinate-point-descriptor-label/CoordinatePointDescriptorLabel";
import RestaurantEntityPopup from "../../restaurant-entities/foncii-restaurants/pop-up/FonciiRestaurantPopup";

// Hooks
import { useRouterSearchParams } from "../../../hooks/UseRouterSearchParamsHook";
import { usePathname, useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouteObserver } from "../../../hooks/UseRouteObserver";

// URL State Persistence
import {
  SharedURLParameters,
  currentPageCanonicalURL,
} from "../../../core-foncii-maps/properties/NavigationProperties";

// User Defaults
import {
  defaultMapBoxCenter,
  defaultMapBoxZoomLevel,
} from "../../../core-foncii-maps/default-values/UserDefaults";

// Redux
import {
  getFonciiRestaurantsSlice,
  getFonciiUserSlice,
  getMapboxSlice,
  getPostFiltersSlice,
  getUserPostsSlice,
  getVisitedUserSlice,
} from "../../../redux/operations/selectors";
import {
  FonciiRestaurantActions,
  FonciiUserActions,
  MapboxActions,
  PostFiltersActions,
} from "../../../redux/operations/dispatchers";
import store from "../../../redux/store";

// Utilities
import {
  calculateMapSearchAreaDiameter,
  computeCoordinateAndZoomLevelToFitCluster,
  computeDistanceBetweenCoordinatePoints,
} from "../../../utilities/math/euclideanGeometryMath";
import { cn } from "../../../utilities/development/DevUtils";

// Managers
import AnalyticsService, {
  AnalyticsEvents,
} from "../../../services/analytics/analyticsService";

// Animation
import { AnimatePresence, motion } from "framer-motion";
import { delay } from "@/utilities/common/scheduling";

// Types
interface MainMapProps {
  disableInteraction?: boolean;
  defaultZoomLevel?: number;
  defaultCenter?: LngLat;
  children?: React.ReactNode;
}

/**
 * High level interactive map component with nestable children
 * Note: The order of the coordinate points when in array form are [lat, lng]
 * The URL reflects this ordering, and this ordering should be expected when
 * parsing the URL for the coordinate position, also make sure to preserve this ordering
 * when updating the URL param as well
 */
export default function MainMap({
  disableInteraction = false,
  defaultZoomLevel = defaultMapBoxZoomLevel,
  defaultCenter = new LngLat(defaultMapBoxCenter.lng, defaultMapBoxCenter.lat),
  children
}: MainMapProps) {
  // Properties
  // Identifiers
  // Constants
  const MAP_ELEMENT_ID = "mapbox";

  // Sources
  const MAPPED_RESTAURANT_ENTITY_FEATURE_SOURCE_ID = "mapped-restaurant-entity-feature-source";
  const USER_POSITION_SOURCE_ID = "user-position-source";

  // Layers 
  const USER_POSITION_LAYER_ID = "user-position-layer";
  const MAPPED_RESTAURANT_ENTITY_FEATURE_CLUSTER_LAYER_ID = "mapped-restaurant-entity-feature-cluster-layer";

  // Images
  const USER_MAP_INDICATOR_MARKER_IMAGE_ID = "user-map-indicator-marker";

  // Elements
  const unclusteredMapMarkerID = (id: string) => `unclustered-map-marker-${id}`,
    clusteredMapMarkerID = (id: string) => `clustered-map-marker-${id}`,
    mapPopup = (id: string) => `map-popup-${id}`;

  // Observers
  const routeObserver = useRouteObserver();

  // Component State
  const [mapLoaded, setMapLoaded] = useState(false);

  // Memory references
  const unclusteredMarkers = useRef<{ [key: string]: mapboxgl.Marker; }>({});
  const clusteredMarkers = useRef<{ [key: string]: mapboxgl.Marker; }>({});

  // Pop-ups
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  // Global State
  const userPosts = getUserPostsSlice()(),
    fonciiRestaurantsState = getFonciiRestaurantsSlice()(),
    fonciiUser = getFonciiUserSlice()(),
    visitedUser = getVisitedUserSlice()(),
    entityFilters = getPostFiltersSlice()(),
    mapboxState = getMapboxSlice()();

  // Requests location permissions if not already granted,
  // and updates the user's last position in the local store
  const setUserLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Only triggered once to orient the user to their current location after
        // granting permission
        if (!fonciiUser.locationPermissionGranted) {
          centerOnCurrentUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        }

        // Set current user coordinates
        FonciiUserActions.setClientCoordinates({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (_) => {
        // Permission denied, reset coordinate state
        FonciiUserActions.setClientCoordinates(undefined);
      }
    );
  };

  // URL State
  const searchParams = useSearchParams();
  const routerSearchParams = useRouterSearchParams();
  const pathname = usePathname();

  const searchQueryFromURLState = (): string => {
    return String(
      routerSearchParams.getParamValue(SharedURLParameters.search) ?? ""
    );
  };

  // Component References
  const mapReference = useRef<mapboxgl.Map>();
  const mapContainer = useRef<HTMLDivElement>(null);

  // Styling
  const mapStyleConfig = "mapbox://styles/jodesign/cl3gbruw700ai14rqh4dtgv4f";

  // Reactive UI Subscriptions
  // Fired when component mounts
  useEffect(() => {
    // Clean up when component dismounts
    return () => {
      // Pop ups
      popupRef.current?.remove();
      popupRef.current = null;
    }
  }, [])

  // UI Instantiation
  useEffect(() => {
    // Singleton instance, only create map once
    if (!mapLoaded) {
      createMap();
      setUserLocation();

      hydrateComponentStateFromURL();
    }
  }, [pathname]);

  useEffect(() => {
    // Map data source
    updateMapSource();

    if (mapReference.current) {
      // Render initial markers
      updateInteractiveMapMarkers();
      updateUserMapIndicator();

      // Update markers on map move
      const onMapMoveEventHandler = () => {
        updateInteractiveMapMarkers();
      }

      // Dismount and remount listeners to have access to the latest component state
      // mounting within a function will cause the callback to use a stale version of the component's state
      // passed down when the function was originally called
      mapReference.current.off('move', onMapMoveEventHandler);
      mapReference.current.on('move', onMapMoveEventHandler);

      return () => {
        mapReference?.current?.off('move', onMapMoveEventHandler);
      }
    }
  }, [
    pathname,
    mapLoaded,
    userPosts,
    fonciiRestaurantsState,
    visitedUser,
    entityFilters,
    searchParams.get(SharedURLParameters.galleryTab),
    searchParams.get(SharedURLParameters.gallerySection)
  ]);

  // Update user map indicator graphics when user state updates
  useEffect(() => {
    updateUserMapIndicator();
  }, [fonciiUser.clientCoordinates, fonciiUser.locationPermissionGranted]);

  // Refresh on mapbox state updates
  useEffect(() => { }, [
    mapboxState.virtualCoordinates,
    mapboxState.virtualZoomLevel
  ]);

  // Updates the search results page when the explore page search query updates
  // And updates the explore page's search results when the user's auth state changes in order to display the
  // appropriate data for the current user context. Fired when the user logs in and logs out
  useEffect(() => {
    if (!routeObserver.explorePageActive()) return;

    if (fonciiRestaurantsState.searchQuery) {
      // SRP active
      performSemanticSearch();
    } else {
      const { zoom, center } = parseZoomAndCenterFromURL();

      // Explore page active
      performGeoSearch(center, zoom, true);
    }
  }, [fonciiRestaurantsState.searchQuery, fonciiUser.isLoggedIn]);

  // Keep the global search query state in parity with the URL state
  useEffect(() => {
    FonciiRestaurantActions.setSearchQuery(searchQueryFromURLState());
  }, [searchQueryFromURLState]);

  // Convenience
  const isRestaurantEntitySelected = (id: string) => {
    return entityFilters.currentlySelectedPostID == id;
  };

  const galleryMyExperiencesSectionActive = (): boolean => {
    const currentSection = Number(searchParams.get(SharedURLParameters.gallerySection)) ??
      ExperienceSections.myExperiences;

    return currentSection == ExperienceSections.myExperiences;
  };

  const gallerySavedSectionActive = (): boolean => {
    const currentSection = Number(searchParams.get(SharedURLParameters.gallerySection)) ??
      ExperienceSections.myExperiences;

    return currentSection == ExperienceSections.savedExperiences;
  };

  const shouldDisplayGalleryAsList = (): boolean => {
    return (
      String(
        routerSearchParams.getParamValue(
          SharedURLParameters.galleryListFormatToggled
        )
      ) == "true"
    );
  };

  const isARestaurantEntityCurrentlySelected = (): boolean => {
    return entityFilters.currentlySelectedPostID != null;
  };

  // Only display markers and other indicators when needed, user location indicator is rendered regardless for simplicity
  const shouldDisplayMapElements = (): boolean => {
    return (
      routeObserver.explorePageActive() || routeObserver.galleryPageActive()
    );
  };

  /// Only reflect the map's properties as a URL state for specific pages
  const canPersistStateToURL = (): boolean => {
    return (
      routeObserver.explorePageActive() || routeObserver.galleryPageActive()
    );
  };

  // Data Providers
  const visiblePosts = () => {
    return routeObserver.isCurrentUserGalleryAuthor()
      ? userPosts?.visiblePosts
      : visitedUser?.visiblePosts ?? [];
  }

  const visibleFonciiRestaurants = () => {
    return routeObserver.galleryPageActive() && gallerySavedSectionActive()
      ? fonciiRestaurantsState.savedFonciiRestaurants
      : fonciiRestaurantsState.visibleFonciiRestaurants;
  }

  // Map Cluster Data Source
  const mappedRestaurantEntityFeatureSource = (): GeoJSON.FeatureCollection<GeoJSON.Geometry> => {
    const features: GeoJSON.Feature<GeoJSON.Geometry>[] = mappedRestaurantEntities.map((entity) => {
      const coordinates = entity.fonciiRestaurant.restaurant.coordinates;

      return {
        "id": entity.id,
        "type": "Feature",
        "properties": { ...entity },
        "geometry": {
          "type": "Point",
          "coordinates": [
            coordinates.lng,
            coordinates.lat
          ]
        }
      }
    });

    return {
      "type": "FeatureCollection",
      "features": features
    }
  }

  // Actions
  function trackMapPinClickEvent({
    fonciiRestaurantID,
    postID,
  }: {
    fonciiRestaurantID: string;
    postID?: string;
  }) {
    // Find required data
    const fonciiRestaurant = visibleFonciiRestaurants()
      .find((element) => element.restaurant.id == fonciiRestaurantID);

    // Precondition failure, valid restaurant data is required for tracking this metric
    if (!fonciiRestaurant) return;

    // Parsing
    const authorUID = routeObserver.isGalleryBeingViewedByVisitor()
      ? visitedUser.user?.id
      : undefined,
      percentMatchScore = fonciiRestaurant.percentMatchScore,
      qualityScore = fonciiRestaurant.qualityScore;

    AnalyticsService.shared
      .trackMapPinClick({
        authorUID,
        fonciiRestaurantID,
        postID,
        percentMatchScore,
        qualityScore,
        sourceURL: currentPageCanonicalURL(location),
      });
  }

  // Actions
  // Selects the post and transitions to its associated marker
  const onPostClickAction = (postID: string) => {
    // Used when navigating on the same path (explore or gallery) to remove conflicting properties
    routerSearchParams.setParams({
      [SharedURLParameters.detailViewForRestaurant]: undefined,
      [SharedURLParameters.selectedPost]: postID,
      [SharedURLParameters.detailViewForPost]: postID,
      [SharedURLParameters.isEditingPost]: undefined,
    });
  };

  const onFonciiRestaurantClickAction = (restaurantID: string) => {
    // Used when navigating on the same path (explore or gallery) to remove conflicting properties
    routerSearchParams.setParams({
      [SharedURLParameters.detailViewForPost]: undefined,
      [SharedURLParameters.selectedPost]: restaurantID,
      [SharedURLParameters.detailViewForRestaurant]: restaurantID,
      [SharedURLParameters.isEditingPost]: undefined,
    });
  };

  // Map Search Logic
  /**
   * Persists the latest center position given that it exceeds the required update threshold,
   * and zoom level to the user store and updates the explore page's search area.
   *
   * @async
   * @param centerPosition
   * @param zoomLevel
   * @param forceUpdate
   */
  const performGeoSearch = (
    centerPosition: CoordinatePoint,
    zoomLevel: number,
    forceUpdate: boolean = false
  ) => {
    // URL state
    const searchQuery = searchQueryFromURLState(),
      postDetailView = routerSearchParams.getParamValue(
        SharedURLParameters.detailViewForPost
      ),
      restaurantDetailView = routerSearchParams.getParamValue(
        SharedURLParameters.detailViewForRestaurant
      );

    // Geo search only available when SRP is inactive and the explore page is the current route
    // pass `forceUpdate` to override the SRP requirement and clear any SRP state.
    const explorePageActive = routeObserver.explorePageActive(),
      searchResultsPageActive = searchQuery != undefined && searchQuery != "",
      detailViewOpen =
        postDetailView != undefined || restaurantDetailView != undefined,
      canPerformGeoSearch =
        ((!searchResultsPageActive && !detailViewOpen) || forceUpdate) &&
        explorePageActive;

    if (!canPerformGeoSearch) return;

    const currentVirtualCoordinates =
      store.getState().mapbox.virtualCoordinates,
      distanceBetweenOldAndNewCoordinates =
        computeDistanceBetweenCoordinatePoints(
          centerPosition,
          currentVirtualCoordinates
        );

    // Dynamic search area based on zoom level and earth circumference relative to coordinate position
    const searchAreaDiameter = calculateMapSearchAreaDiameter(
      currentVirtualCoordinates,
      zoomLevel
    ),
      searchAreaRadiusKM = searchAreaDiameter / 2 / 1000;

    const searchAreaThresholdCrossed =
      distanceBetweenOldAndNewCoordinates >= searchAreaRadiusKM,
      canUpdateSearchArea =
        searchAreaThresholdCrossed && !fonciiRestaurantsState.isLoading;

    // Only update the virtual coordinates when not focused on a post and when the previous search area's
    // radius has been cleared
    if (canUpdateSearchArea || forceUpdate) {
      MapboxActions.setVirtualCoordinates({
        lat: centerPosition.lat,
        lng: centerPosition.lng,
      });
      MapboxActions.setVirtualZoomLevel(zoomLevel);

      FonciiRestaurantActions.search({
        coordinates: centerPosition,
        zoomLevel,
        reservationSearchInput: {
          targetDate: new Date(
            entityFilters.targetReservationDate
          ).toISOString(),
          partySize: entityFilters.targetReservationPartySize,
        },
      });
    }
  };

  /**
   * Updates the explore page's search forcefully when the user enters a new search query.
   * Location search already parses the search query, this simply forces the search the
   * update without the user moving.
   *
   * @async
   * @param forceUpdate
   */
  const performSemanticSearch = async (forceUpdate: boolean = false) => {
    // Precondition failure, can't search when explore not active
    if (!routeObserver.explorePageActive()) return;

    const searchQuery = fonciiRestaurantsState.searchQuery;

    // Avoid searches that overlap unresolved ones, and don't search if the search query is empty
    if (searchQuery && fonciiRestaurantsState.isLoading && !forceUpdate) return;

    // Zoom level set to 0 to unlimit the search area to the entire earth.
    const fonciiRestaurants =
      (await FonciiRestaurantActions.search({
        searchQuery,
        reservationSearchInput: {
          targetDate: new Date(
            entityFilters.targetReservationDate
          ).toISOString(),
          partySize: entityFilters.targetReservationPartySize,
        },
      })) ?? [];

    // Cluster the fetched restaurant coordinate points
    const coordinatePoints = fonciiRestaurants.map(
      (fonciiRestaurant) => fonciiRestaurant.restaurant.coordinates
    );

    // Calculate center point and zoom level required to display all restaurants provided by the search
    const { centroidCoordinatePoint, zoomLevel } =
      computeCoordinateAndZoomLevelToFitCluster(coordinatePoints);

    // Zoom out by this buffer factor to allow the plotted points to fit comfortably in the view port
    const zoomBuffer = 1,
      normalizedZoomLevel = zoomLevel
        ? zoomLevel - zoomBuffer
        : mapboxState.virtualZoomLevel;

    // Update the map UI to reflect the zoom and coordinate point center updates in an animated fashion
    updateMapViewPort({
      updatedCenter: centroidCoordinatePoint ?? mapboxState.virtualCoordinates,
      updatedZoom: normalizedZoomLevel,
      animated: true,
    });
  };

  /**
   * Sets the parameters of the URL to match the component state
   *
   * @param centerPosition
   * @param zoomLevel
   */
  const updateURLState = (centerPosition: LngLat, zoomLevel: number) => {
    if (!canPersistStateToURL()) return;

    // Position
    const definedPositionParam = [
      centerPosition.lat,
      centerPosition.lng,
    ].toString(),
      splitPositionParam = definedPositionParam.split(",").map(Number),
      latitude = Number(splitPositionParam[0]),
      longitude = Number(splitPositionParam[1]);

    // Validate inputs and update the conjoined states
    if (!isNaN(latitude) && !isNaN(longitude) && !isNaN(Number(zoomLevel))) {
      routerSearchParams.setParams({
        [SharedURLParameters.zoomLevel]: zoomLevel,
        [SharedURLParameters.mapPosition]: definedPositionParam,
      });
    }
  };

  const parseZoomAndCenterFromURL = () => {
    // Default Values
    let zoom: number = defaultZoomLevel,
      // Default center is the user's last reported location (if given) else our default coordinate center (Manhattan)
      center: LngLat = fonciiUser.clientCoordinates
        ? new LngLat(
          fonciiUser.clientCoordinates.lng,
          fonciiUser.clientCoordinates.lat
        )
        : defaultCenter;

    // Position
    const mapPositionParam = routerSearchParams.getParamValue(
      SharedURLParameters.mapPosition
    ) as string,
      definedPositionParam =
        mapPositionParam ?? [center.lat, center.lng].toString(),
      splitPositionParam = definedPositionParam.split(",").map(Number),
      latitude = Number(splitPositionParam[0]),
      longitude = Number(splitPositionParam[1]),
      parsedPositionParam: LngLat = new LngLat(longitude, latitude);

    // Validate input and update
    if (!isNaN(latitude) && !isNaN(longitude)) {
      center = parsedPositionParam;
    }

    // Zoom Level
    const zoomLevelParam = routerSearchParams.getParamValue(
      SharedURLParameters.zoomLevel
    ),
      definedZoomLevelParam = zoomLevelParam ?? zoom,
      parsedZoomLevelParam = Number(definedZoomLevelParam) ?? zoom;

    // Validate input and update
    if (parsedZoomLevelParam != undefined) {
      zoom = parsedZoomLevelParam;
    }

    return { zoom, center };
  };

  // Sets the component's current state to match the URL state
  const hydrateComponentStateFromURL = () => {
    if (!canPersistStateToURL()) return;

    routerSearchParams.hydrateStateFromURL(location.toString());

    const { zoom, center } = parseZoomAndCenterFromURL();
    updateMapViewPort({ updatedZoom: zoom, updatedCenter: center });

    // Precondition failure
    if (!routeObserver.explorePageActive()) return;

    // Perform initial explore page search from initial geolocation state
    // force update to bypass the search area delta requirement
    if (searchQueryFromURLState()) {
      FonciiRestaurantActions.setSearchQuery(searchQueryFromURLState());
    } else {
      performGeoSearch(center, zoom, true);
    }
  };

  // Instantiation
  const createMap = () => {
    // Default values
    let zoom: number = defaultZoomLevel,
      // Default center is the user's last reported location (if given) else our default coordinate center (Manhattan)
      center: LngLat = fonciiUser.clientCoordinates
        ? new LngLat(
          fonciiUser.clientCoordinates.lng,
          fonciiUser.clientCoordinates.lat
        )
        : defaultCenter;

    setMapLoaded(false);

    // Setup
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    mapReference.current = new mapboxgl.Map({
      container: MAP_ELEMENT_ID, // Container ID
      style: mapStyleConfig, // Custom Style Configuration location
      center: center, // Starting position [lng, lat]
      zoom: zoom, // Starting zoom
      attributionControl: false, // Remove attribution
    });

    mapReference.current.on('load', () => {
      setMapLoaded(true);
    });

    // Map State Update Listener and Handler
    mapReference.current.on('movestart', () => {
      MapboxActions.updateMapState("moving");
    });

    mapReference.current.on("moveend", () => {
      const updatedCenter = mapReference.current?.getCenter();

      // Position Properties
      // Decrease the coordinate system's precision to make the URL parameter less verbose
      const lessPreciseCenter: LngLat = new LngLat(
        Number(updatedCenter?.lng.toPrecision(5)),
        Number(updatedCenter?.lat.toPrecision(5))
      );

      center = lessPreciseCenter;

      // Zoom Properties
      let zoom: number = mapReference.current?.getZoom() ?? 10;

      // Same as the coordinates, less verbose
      const lessPreciseZoom = Number(zoom?.toPrecision(2));
      zoom = lessPreciseZoom;

      // Update URL with current position
      updateURLState(center, zoom);

      // Search the new geolocation (if possible)
      performGeoSearch(center, zoom);

      MapboxActions.updateMapState("idle");
    });
  };

  // UI Updates
  // Map Markers
  // Foncii restaurants / posts with associated foncii restaurants displayed on the map
  const mappedRestaurantEntities = useMemo((): {
    id: string;
    post?: FmUserPost;
    fonciiRestaurant: FonciiRestaurant,
    isUserPost: boolean
    isSaved: boolean;
    shouldBeHighlighted: boolean;
  }[] => {
    if (!shouldDisplayMapElements()) return [];

    if (routeObserver.galleryPageActive() && galleryMyExperiencesSectionActive()) {
      return visiblePosts()
        .filter((post) => post.restaurant)
        .map((post) => {
          return {
            id: post.id,
            post: post,
            fonciiRestaurant: post.fonciiRestaurant!,
            isUserPost: true,
            isSaved: post?.fonciiRestaurant?.isSaved ?? false,
            shouldBeHighlighted: post.isFavorited
          };
        });
    } else if (
      routeObserver.explorePageActive() ||
      (routeObserver.galleryPageActive() && gallerySavedSectionActive())
    ) {
      return visibleFonciiRestaurants()
        .map((fonciiRestaurant) => {
          return {
            id: fonciiRestaurant.restaurant.id,
            post: undefined,
            fonciiRestaurant: fonciiRestaurant,
            isUserPost: false,
            isSaved: fonciiRestaurant.isSaved,
            // No highlight state for explore page markers
            shouldBeHighlighted: false
          };
        });
    } else {
      // Unrelated page is active, display no mappings
      return [];
    }
  }, [
    fonciiRestaurantsState.visibleFonciiRestaurants,
    routeObserver,
    shouldDisplayMapElements,
    userPosts?.visiblePosts,
    visitedUser?.visiblePosts,
    gallerySavedSectionActive,
    galleryMyExperiencesSectionActive,
    visibleFonciiRestaurants,
    visiblePosts
  ]);

  const updateInteractiveMapMarkers = () => {
    updateClusteredMarkers();
    updateUnclusteredMarkers();
  }

  const updateMapSource = () => {
    if (!mapLoaded || !mapReference.current) return;

    const mappedRestaurantEntityFeatureClusterMapLayer = mapReference.current
      .getLayer(
        MAPPED_RESTAURANT_ENTITY_FEATURE_CLUSTER_LAYER_ID
      ),
      mappedRestaurantEntityFeatureMapSource = mapReference.current
        .getSource(
          MAPPED_RESTAURANT_ENTITY_FEATURE_SOURCE_ID
        ) as mapboxgl.GeoJSONSource;

    // Elements conditionally shouldn't be displayed, 
    // remove existing source / layer and don't add new ones
    if (!shouldDisplayMapElements()) {
      if (mappedRestaurantEntityFeatureClusterMapLayer) {
        mapReference.current.removeLayer(MAPPED_RESTAURANT_ENTITY_FEATURE_CLUSTER_LAYER_ID);
      }

      if (mappedRestaurantEntityFeatureMapSource) {
        mapReference.current.removeSource(MAPPED_RESTAURANT_ENTITY_FEATURE_SOURCE_ID);
      }

      return;
    }

    // Update when source exists, create when it doesn't
    if (mappedRestaurantEntityFeatureMapSource) {
      mappedRestaurantEntityFeatureMapSource.setData({
        ...mappedRestaurantEntityFeatureSource()
      });
    } else {
      // Add data source for cluster markers
      // set the 'cluster' option to true. GL-JS will
      // add the point_count property to your source data.
      // Docs: https://docs.mapbox.com/mapbox-gl-js/example/cluster/
      mapReference.current
        .addSource(MAPPED_RESTAURANT_ENTITY_FEATURE_SOURCE_ID, {
          type: 'geojson',
          data: mappedRestaurantEntityFeatureSource(),
          cluster: true,
          clusterMaxZoom: 14, // Max zoom to cluster points on
          clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
        });

      // Create an invisible layer to allow the creation of HTML based cluster and discrete map markers
      mapReference.current
        .addLayer({
          id: MAPPED_RESTAURANT_ENTITY_FEATURE_CLUSTER_LAYER_ID,
          type: 'circle',
          source: MAPPED_RESTAURANT_ENTITY_FEATURE_SOURCE_ID,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': ColorRepository.colors['transparent'],
            'circle-radius': 0,
            'circle-opacity': 0
          }
        });
    }

    // By trial and error 200ms is an adequate time interval that allows the map source to be updated
    // and the markers to become initially renderable, initially 50ms, but switching navigation paths increased that latency
    delay(() => {
      updateInteractiveMapMarkers();
    }, 200)
  }

  const updateUnclusteredMarkers = () => {
    if (!mapReference.current) return;

    const features: mapboxgl.MapboxGeoJSONFeature[] = mapReference.current
      .querySourceFeatures(MAPPED_RESTAURANT_ENTITY_FEATURE_SOURCE_ID);

    const unclusteredMarkersLocalCopy = unclusteredMarkers.current;

    // Delete stored map markers to make way for the new ones below
    Object.keys(unclusteredMarkers.current).forEach((mapMarkerKey) => {
      const storedMapMarker = unclusteredMarkers.current[mapMarkerKey],
        markerElement = storedMapMarker.getElement();

      storedMapMarker.remove();
      markerElement.remove();
      delete unclusteredMarkers.current[mapMarkerKey];
    });

    for (const feature of features) {
      // Parsing
      const props = feature.properties as GeoJSON.GeoJsonProperties,
        id = props?.id,
        isClustered = props?.cluster,
        // Find the corresponding entity data matching the given feature
        entity = mappedRestaurantEntities.find((entity) => entity.id == id),
        // This allows access to the latest store state, any instance variables referenced are stale
        // once in a call back, which is one of the callstack entry points for this logic
        isSelected = store.getState().postFilters.currentlySelectedPostID == id;

      // Don't render clustered points + points that are already plotted + points missing data
      // FYI the map source can return more features than expected because of how tiles work, features can be duplicated between tiles
      if (isClustered || !entity || unclusteredMarkersLocalCopy[id]) continue;

      // Properties
      const isUserPost = entity.isUserPost,
        isSaved = entity.isSaved,
        restaurant = entity.fonciiRestaurant.restaurant,
        postID = entity.id,
        restaurantID = restaurant.id,
        coordinates = restaurant?.coordinates,
        shouldBeHighlighted = entity.shouldBeHighlighted;

      // Dimensions
      const width = "30px",
        height = "30px";

      // Dynamic Styling
      const currentBackgroundHexColor = (): string => {
        const selectedColor = shouldBeHighlighted
          ? ColorRepository.colors['gold']
          : ColorRepository.colors['primary'],
          defaultColor = ColorRepository.colors['light_grey'];

        return isSelected
          ? selectedColor
          : shouldBeHighlighted
            ? selectedColor
            : defaultColor;
      };

      const className = cn('z-[1] cursor-pointer hover:opacity-75 transition-all ease-in-out', isSelected ? "z-[1]" : "z-[0]"),
        opacity = isSelected ? 1 : 0.8;

      let unclusteredMapMarker = unclusteredMarkersLocalCopy[id];

      // Instantiate marker element
      const mapMarkerNode = unclusteredMapMarker ? unclusteredMapMarker.getElement() : document.createElement(unclusteredMapMarkerID(id));

      const mapMarkerIconSVGContent = isSaved
        ? // Saved Restaurant Map Marker Icon
        `
            <svg xmlns="http://www.w3.org/2000/svg" height=${height} width=${width} viewBox="0 0 19 24" fill="none">
            <path d="M9.5 0C6.98132 0.00283581 4.56662 0.997121 2.78564 2.76472C1.00466 4.53233 0.00285727 6.9289 0 9.42867C0 17.4966 8.63636 23.5899 9.00449 23.8449C9.1497 23.9458 9.3227 24 9.5 24C9.6773 24 9.8503 23.9458 9.99551 23.8449C10.3636 23.5899 19 17.4966 19 9.42867C18.9971 6.9289 17.9953 4.53233 16.2144 2.76472C14.4334 0.997121 12.0187 0.00283581 9.5 0ZM9.5 6.00006C11.8811 6.00001 11 6 11.5 6C12 6 12 6 12 6.5C12 6.84187 12 11.5 12 12.5C12 12.9573 11.7328 12.8799 11.3253 12.6725C11.2108 12.6143 11.0976 12.5547 11 12.5C10.386 12.1556 10.0693 11.7846 9.5 11.5L8 12.5L7.44721 12.7764C7.24175 12.8791 7 12.7297 7 12.5V12.2491C7 12.2491 7 7 7 6.5C7 6 7 6 7.5 6C8.28105 6 7.7666 6.00002 9.5 6.00006Z" 
            fill=${currentBackgroundHexColor()} 
            opacity=${opacity}
            />
            </svg>
            `
        : // Regular Map Marker Icon
        `
            <svg xmlns="http://www.w3.org/2000/svg" height=${height} width=${width} viewBox="0 0 19 24" fill="none">
            <path d="M9.5 0C6.98132 0.00283581 4.56662 0.997121 2.78564 2.76472C1.00466 4.53233 0.00285727 6.9289 0 9.42867C0 17.4966 8.63636 23.5899 9.00449 23.8449C9.1497 23.9458 9.3227 24 9.5 24C9.6773 24 9.8503 23.9458 9.99551 23.8449C10.3636 23.5899 19 17.4966 19 9.42867C18.9971 6.9289 17.9953 4.53233 16.2144 2.76472C14.4334 0.997121 12.0187 0.00283581 9.5 0ZM9.5 6.00006C10.1832 6.00006 10.8511 6.20114 11.4192 6.57788C11.9873 6.95462 12.4301 7.4901 12.6916 8.1166C12.9531 8.74309 13.0215 9.43247 12.8882 10.0976C12.7549 10.7626 12.4259 11.3736 11.9427 11.8531C11.4596 12.3326 10.8441 12.6591 10.1739 12.7914C9.50383 12.9237 8.80924 12.8558 8.178 12.5963C7.54677 12.3368 7.00724 11.8973 6.62765 11.3335C6.24806 10.7697 6.04545 10.1068 6.04545 9.42867C6.04545 8.51934 6.40941 7.64726 7.05727 7.00428C7.70512 6.36129 8.5838 6.00006 9.5 6.00006Z" 
            fill=${currentBackgroundHexColor()}
            opacity=${opacity}
            />
            </svg>
            `;

      // Add icon to marker element
      mapMarkerNode.id = id;
      mapMarkerNode.className = className;
      mapMarkerNode.innerHTML = mapMarkerIconSVGContent;

      if (!unclusteredMapMarker) {
        // Actions
        const selectEntityAction = () => {
          // Conditions
          const postDetailView = routerSearchParams.getParamValue(
            SharedURLParameters.detailViewForPost
          ),
            restaurantDetailView = routerSearchParams.getParamValue(
              SharedURLParameters.detailViewForRestaurant
            ),
            detailViewOpen =
              postDetailView != undefined || restaurantDetailView != undefined;

          // Selection
          if (!isSelected) {
            // Analytics
            trackMapPinClickEvent({
              fonciiRestaurantID: restaurantID,
              postID: isUserPost ? id : undefined
            });

            if (isUserPost) {
              // Foncii restaurants
              AnalyticsService.shared.trackGenericEvent(
                AnalyticsEvents.FONCII_RESTAURANT_SELECTED,
                {
                  fonciiRestaurantID: id,
                  selectionSource: "map-pin", // The element used to select the post
                  origin: location.pathname,
                }
              );
            } else {
              // User posts
              AnalyticsService.shared.trackGenericEvent(
                AnalyticsEvents.POST_SELECTED,
                {
                  postID: id,
                  fonciiRestaurantID: restaurantID,
                  selectionSource: "map-pin", // The element used to select the post
                  origin: location.pathname,
                }
              );
            }

            // A detail view is open, update the detail view to show the current entity
            if (detailViewOpen) {
              if (isUserPost) {
                onPostClickAction(id);
              } else {
                onFonciiRestaurantClickAction(id);
              }
            } else {
              // Detail view not open, don't open it / switch to this entity
              // Mark the current post or restaurant as selected when its marker is clicked on
              routerSearchParams.toggleParameterWithValue(
                SharedURLParameters.selectedPost,
                id
              );
            }

            PostFiltersActions.setCurrentlySelectedPostID(id);
          } else {
            // Unselect the currently selected post or restaurant
            routerSearchParams.toggleParameterWithValue(
              SharedURLParameters.selectedPost,
              id
            );

            PostFiltersActions.clearCurrentlySelectedPostID();
          }
        }

        // Add event handlers
        // Pop-up behavior
        // Present on hover
        mapMarkerNode.addEventListener("mouseenter", (e) => {
          if (!mapReference.current) return;

          // Pop-up Node
          const popupNode = document.createElement(mapPopup(id));

          // Create a root to render the custom pop-up content within the pop-up node's DOM
          const popupNodeRoot = createRoot(popupNode);

          // Actions
          // Open detail view for post or restaurant, whichever is applicable
          const openEntityDetailViewAction = () => {
            if (isUserPost) {
              selectEntityAction();
              onPostClickAction(postID);
            }
            else {
              selectEntityAction();
              onFonciiRestaurantClickAction(restaurantID);
            }
          }

          popupNodeRoot.render(
            <RestaurantEntityPopup
              restaurant={restaurant}
              fonciiUserState={fonciiUser}
              onClick={openEntityDetailViewAction}
            />
          );

          // Pop-up element to be displayed on hover
          popupRef.current?.remove();
          popupRef.current = new mapboxgl.Popup({
            offset: -24,
            closeOnMove: true,
            closeButton: false,
            closeOnClick: true,
            anchor: 'left'
          });

          // Populate the popup and set its coordinates
          // based on the feature found.
          popupRef.current
            .setLngLat(coordinates)
            .setDOMContent(popupNode)
            .addTo(mapReference.current);

          // Dismiss on hover end / mouse leave
          popupNode.addEventListener("mouseleave", (e) => {
            if (!popupRef.current) return;

            popupRef.current.remove();
            popupRef.current = null;
          });

          // Implicit map marker behavior
          // Pop up covers map marker so this doubles as a selection action trigger
          popupNode.addEventListener("click", () => {
            if (!mapReference.current) return;

            selectEntityAction();
          });
        });

        // Map marker component + set marker's coordinate point
        // +
        // Store a reference to the map marker currently being displayed this will serve as a method
        // of removing it later on
        // +
        // Update the map marker truth table with the current map markers which will be deleted in the next update
        unclusteredMapMarker = unclusteredMarkers.current[id] = new mapboxgl.Marker(mapMarkerNode);
      }

      unclusteredMapMarker
        .setLngLat({
          lat: coordinates?.lat ?? 0,
          lng: coordinates?.lng ?? 0,
        })
        // Add marker as child of the map component and render there
        .addTo(mapReference.current!);
    }
  };

  const updateClusteredMarkers = () => {
    if (!mapReference.current) return;

    const features: mapboxgl.MapboxGeoJSONFeature[] = mapReference.current
      .querySourceFeatures(MAPPED_RESTAURANT_ENTITY_FEATURE_SOURCE_ID);

    const clusteredMarkersLocalCopy = clusteredMarkers.current;

    // Delete stored map markers to make way for the new ones below
    Object.keys(clusteredMarkers.current).forEach((mapMarkerKey) => {
      const storedMapMarker = clusteredMarkers.current[mapMarkerKey],
        markerElement = storedMapMarker.getElement();

      storedMapMarker.remove();
      markerElement.remove();
      delete clusteredMarkers.current[mapMarkerKey];
    });

    for (const feature of features) {
      // Parsing
      const geometry = feature.geometry as GeoJSON.Point,
        coordinates = geometry.coordinates as LngLatLike,
        props = feature.properties,
        isClustered = props?.cluster,
        clusterID = props?.cluster_id,
        pointCount: number = props?.point_count;

      if (!isClustered || !pointCount || clusteredMarkersLocalCopy[clusterID]) continue;

      // Properties
      const id = clusterID;

      // Clustering
      let clusteredMarker = clusteredMarkersLocalCopy[id];

      if (!clusteredMarker) {
        // Dynamic Styling
        const className = 'z-[1] hover:opacity-75 transition-all ease-in-out text-[14px]';

        // Instantiate marker element
        const mapMarkerNode = document.createElement(clusteredMapMarkerID(id));

        const mapMarkerHTMLContent = `
        <div style="display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 2px 2px 10px 0px rgba(255, 255, 255, 0.15), -2px -2px 10px 0px rgba(255, 255, 255, 0.15); width: 30px; height: 30px; background-color: #ffffff; border-radius: 50%; padding: 16px; text-align: center; font-weight: normal; color: #000000; transition: all 0.3s ease-in-out;">
        <p>${pointCount}</p>
        </div>
        `;

        // Add icon to marker element
        mapMarkerNode.id = id;
        mapMarkerNode.className = className;
        mapMarkerNode.innerHTML = mapMarkerHTMLContent;

        // Map marker behavior
        mapMarkerNode.addEventListener("click", () => {
          if (!mapReference.current) return;

          // Zoom into the cluster on click
          (mapReference.current
            .getSource(MAPPED_RESTAURANT_ENTITY_FEATURE_SOURCE_ID) as mapboxgl.GeoJSONSource)
            ?.getClusterExpansionZoom(
              clusterID,
              (err, zoom) => {
                if (err || !mapReference.current) return;

                mapReference.current.easeTo({
                  center: coordinates,
                  zoom: (zoom + 0.5) // 0.5 to expand the cluster into individual markers
                });
              }
            );
        });

        // Map marker component + set marker's coordinate point
        clusteredMarker = clusteredMarkers.current[id] = new mapboxgl.Marker(mapMarkerNode);

        clusteredMarker
          .setLngLat(coordinates)
          .addTo(mapReference.current!);
      }
    }
  }

  // Update the user map indicator with the user's current location
  const updateUserMapIndicator = () => {
    // User's current position
    const currentUserCoordinates = fonciiUser.clientCoordinates,
      latitude = currentUserCoordinates?.lat,
      longitude = currentUserCoordinates?.lng;

    // Conditional Render Logic
    const shouldRender = fonciiUser.locationPermissionGranted && shouldDisplayMapElements();

    // Updates are only possible when the map has been loaded
    if (!mapReference.current) return;

    const userPositionLayer = mapReference.current.getLayer(
      USER_POSITION_LAYER_ID
    ) as mapboxgl.Layer;

    const userPositionSource = mapReference.current.getSource(
      USER_POSITION_SOURCE_ID
    ) as mapboxgl.GeoJSONSource;

    // Remove the user location marker (if applicable) from the map context if no location permission is granted and
    // if no current location is defined, also if the gallery / explore page is not active as this element doesn't need
    // to be rendered for other screens
    if (!shouldRender || latitude == undefined || longitude == undefined) {
      if (userPositionLayer) {
        mapReference.current.removeLayer(USER_POSITION_LAYER_ID);
      }

      if (userPositionSource) {
        mapReference.current.removeSource(USER_POSITION_SOURCE_ID);
      }

      return;
    }

    // If the position source already exists then update it with new features, if not then create it
    if (userPositionSource) {
      const updatedFeature = {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
      } as GeoJSON.Feature;

      userPositionSource.setData({
        type: "FeatureCollection",
        features: [updatedFeature],
      });
    } else if (mapLoaded && mapReference.current) {
      // Add user location marker to the map context
      const userIndicatorMapMarker = createUserIndicatorMapMarker() as any;

      // Animated position indicator
      mapReference.current.addImage(
        USER_MAP_INDICATOR_MARKER_IMAGE_ID,
        userIndicatorMapMarker,
        { pixelRatio: 2 }
      );

      // Data source for user client map position information
      mapReference.current.addSource(USER_POSITION_SOURCE_ID, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {},
              geometry: {
                type: "Point",
                coordinates: [longitude, latitude], // icon position [lng, lat]
              },
            },
          ],
        },
      });

      // Layer combining the position indicator image + geoJSON coordinate information
      mapReference.current.addLayer({
        id: USER_POSITION_LAYER_ID,
        type: "symbol",
        source: USER_POSITION_SOURCE_ID,
        layout: {
          "icon-image": USER_MAP_INDICATOR_MARKER_IMAGE_ID,
        },
      });
    }
  };

  const createUserIndicatorMapMarker = () => {
    if (!mapReference) return;

    // Dimensions of the indicator
    const size = 120;

    const userIndicatorMapMarker = {
      width: size,
      height: size,
      context: null as CanvasRenderingContext2D | null,
      data: new Uint8ClampedArray(size * size * 4),

      onAdd: function () {
        const canvas = document.createElement("canvas");
        canvas.width = this.width;
        canvas.height = this.height;
        this.context = canvas.getContext("2d", { willReadFrequently: true });
      },

      render: function () {
        // Animation properties and dimensions
        const duration = 1500;
        const t = (performance.now() % duration) / duration;
        const radius = (size / 2) * 0.3;
        const outerRadius = (size / 2) * 0.7 * t + radius;
        const context = this.context;

        // Clear the entire canvas before drawing the new frame
        if (context == null) return false;
        context.clearRect(0, 0, this.width, this.height);

        context.beginPath();
        context.arc(
          this.width / 2,
          this.height / 2,
          outerRadius,
          0,
          Math.PI * 2
        );
        context.fillStyle = `rgba(64, 163, 255, ${1 - t})`; // Fade the color based on progress
        context.fill();

        context.beginPath();
        context.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2);
        context.fillStyle = "#40A3FF";
        context.strokeStyle = "white";
        context.lineWidth = 2 + 4 * (1 - t);
        context.fill();
        context.stroke();

        this.data = context.getImageData(0, 0, this.width, this.height).data;
        mapReference?.current?.triggerRepaint();

        return true;
      },
    };

    return userIndicatorMapMarker;
  };

  // Map Movement Control
  const centerOnCurrentUserLocation = (coordinates: CoordinatePoint) => {
    // Don't zoom in if a post is currently selected, this bouncing behavior can be seen as annoying by end users
    if (entityFilters.currentlySelectedPostID != undefined) return;

    // City level zoom
    const fineZoom = 15;

    updateMapViewPort({
      updatedCenter: coordinates,
      updatedZoom: fineZoom,
      animated: true,
    });
  };

  // Updates the map's center and zoom immediately, ignoring stale state values
  // using passed arguments
  const updateMapViewPort = ({
    updatedCenter,
    updatedZoom,
    animated = false,
  }: {
    updatedCenter?: CoordinatePoint;
    updatedZoom?: number;
    animated?: boolean;
  }) => {
    // Default values
    const zoom: number = defaultZoomLevel,
      center: LngLat = fonciiUser.clientCoordinates
        ? new LngLat(
          fonciiUser.clientCoordinates.lng,
          fonciiUser.clientCoordinates.lat
        )
        : defaultCenter;

    const mapRef = mapReference.current;

    // Precondition failure
    if (mapRef == undefined) return;

    // Update the map's center and zoom
    if (animated) {
      mapRef.flyTo({
        center: updatedCenter ?? center,
        zoom: updatedZoom ?? zoom,
      });
    } else {
      mapRef.setCenter(updatedCenter ?? center);
      mapRef.setZoom(updatedZoom ?? zoom);
    }
  };

  // Dynamic Control Box Styling and Positioning on a page by page basis
  const controlBoxStyling = () => {
    let className = "hidden pointer-events-none";

    if (routeObserver.explorePageActive()) {
      className = `flex bottom-[220px] md:bottom-[260px] xl:bottom-[40px]`;
    } else if (routeObserver.isGalleryBeingViewedByVisitor()) {
      className = `flex bottom-[200px] md:bottom-[250px] xl:bottom-[40px]`;
    } else if (routeObserver.isGalleryBeingViewedByAuthor()) {
      className = `flex ${gallerySavedSectionActive()
        ? "bottom-[240px] md:bottom-[280px]"
        : "bottom-[280px] md:bottom-[330px]"
        } xl:bottom-[40px]`;
    }

    return (className +=
      " fixed pl-[16px] z-[9] left-0 transition-all ease-in-out duration-300");
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        id={MAP_ELEMENT_ID}
        ref={mapContainer}
        className={cn(
          disableInteraction ? "pointer-events-none" : "",
          "relative xl:fixed h-[100dvh] w-[100dvw] xl:w-[calc(100dvw-590px)] transition-all ease-in-out"
        )}
      >
        <div className="absolute h-[100dvh] w-[100dvw] justify-center pointer-events-auto">
          {children}
        </div>

        {/** Auto hides below md screen size when user is moving map + no entity selected */}
        <div
          className={cn(
            "pointer-events-none transition-all ease-in-out duration-300",
            controlBoxStyling(),
            mapboxState.mapState === "moving" &&
              !isARestaurantEntityCurrentlySelected() &&
              !shouldDisplayGalleryAsList()
              ? "opacity-0 md:opacity-100"
              : ""
          )}
        >
          <MapControlBox mapReference={mapReference.current} />
        </div>

        <div
          className={cn(
            "hidden",
            routeObserver.explorePageActive() ||
              routeObserver.galleryPageActive()
              ? "xl:flex z-[9] bottom-0 left-0 pl-[24px] pb-[10px] fixed"
              : ""
          )}
        >
          <CoordinatePointDescriptorLabel />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
