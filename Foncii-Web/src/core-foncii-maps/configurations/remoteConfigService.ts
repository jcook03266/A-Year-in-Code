// Dependencies
// Inheritance
import FirebaseService from "../../services/firebase/firebaseService";

// Firebase SDK / Remote Configuration Service
import {
  fetchAndActivate,
  getRemoteConfig,
  getValue,
} from "firebase/remote-config";

// App Properties
import { nonProductionEnvironment } from "../properties/AppProperties";

// Local Types
export enum FMRemoteConfigurationKeys {
  foncii_maps_undergoing_maintenance = "foncii_maps_undergoing_maintenance",
}

export default class RemoteConfigurationService extends FirebaseService {
  // Properties
  manager;

  // Tracking
  lastFetchTimestamp = Date.now();

  // Limits
  // In [ms] ~ 30 minutes refresh the client's remote config values
  private refreshInterval = 1800000;

  // Defaults
  defaultConfig = {
    [FMRemoteConfigurationKeys.foncii_maps_undergoing_maintenance]: false, // Maintenance flag is disabled by default
  };

  constructor() {
    super();

    this.manager = getRemoteConfig(this.app);
    this.setup();
  }

  /**
   * Fetches and activates (makes values available) the remote config
   * from the remote config backend service layer.
   *
   * @async
   *
   * @returns -> True if the remote config was fetched successfully,
   * false otherwise (error occurred).
   */
  async fetchRemoteConfig(): Promise<Boolean> {
    let didSucceed = false;

    try {
      didSucceed = await fetchAndActivate(this.manager);

      // Log successful fetch
      this.lastFetchTimestamp = Date.now();

      if (nonProductionEnvironment)
        console.log("Fetched remote config successfully.");
    } catch (err) {
      if (nonProductionEnvironment)
        console.error(`Could not fetch remote config at this time. ${err}`);
    }

    return didSucceed;
  }

  /**
   * Setup the default configuration values for the remotely
   * configured flags and features, as well as specify the
   * fetch interval for refreshing the config values.
   */
  setup() {
    this.manager.defaultConfig = this.defaultConfig;
    this.manager.settings.minimumFetchIntervalMillis = this.refreshInterval;
  }

  // Accessor Methods
  getValueForKey(key: FMRemoteConfigurationKeys) {
    return getValue(this.manager, key);
  }
}
