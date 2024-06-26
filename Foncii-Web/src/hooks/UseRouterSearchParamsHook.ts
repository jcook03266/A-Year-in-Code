"use client";
// Dependencies
// Hooks
import { useRouter } from "next/navigation";

// Query parsing and encoding
import queryString from "query-string";

// Type Definitions
/// Defines the configurable options for this hook to implement when called
interface UseRouterParamsOptions {
  method?: "push" | "replace";
}

// Parameter Types
type SearchParameterKey = string;
/// Supports singular and list values
type SearchParameterValue =
  | string
  | boolean
  | number
  | string[]
  | boolean[]
  | number[];
// Key value pair type
type SearchParameterRecords = Record<SearchParameterKey, SearchParameterValue>;

// Singleton Parameter Store for persisting state across multiple hook instances
let parameterStore: SearchParameterRecords = {};

// Custom hook to manage URL states
export const useRouterSearchParams = (options?: UseRouterParamsOptions) => {
  // Navigation
  const { push, replace } = useRouter();

  // Dynamic navigation method swizzling
  // Default is replace if not specified, replacing doesn't add a new entry to the history stack
  // which is ideal if the modification isn't navigation based
  const reload = options?.method === "push" ? push : replace;

  /**
   * Determines whether a param with the given key is exposed in the URL string or not.
   *
   * @param key The unique identifier of the parameter in question.
   * @returns {boolean} -> True, parameter exists in the current search params, false otherwise
   */
  const hasParam = (key: SearchParameterKey): boolean => {
    return parameterStore[key] != undefined;
  };

  /**
   * Retrieves the value associated with the given key from the
   * current search parameters.
   *
   * @param key The unique identifier of the parameter in question.
   * @returns {SearchParameterValue} The value of the param associated with the given key.
   */
  const getParamValue = (key: SearchParameterKey): SearchParameterValue => {
    return parameterStore[key];
  };

  /**
   * Adds a query parameter to the current URL string. This function is deterministic
   * and exclusive to unique key value pairs. If a key value pair already exists, it won't be
   * added again, to add the value again, use the `setParam` function.
   *
   * @param key The unique identifier of the parameter in question.
   * @param value The value of the given parameter
   */
  const addParam = (key: SearchParameterKey, value: SearchParameterValue) => {
    if (hasParam(key)) return;

    setParams({ [key]: value });
  };

  /**
   * Important: When using this hook in a component with multiple URL states, set all states at
   * once with this method. Setting this individually results in a race condition where the
   * last state set will override the others.
   *
   * @param params -> A record containing key value pairs to add to the current URL search params
   * @param key The unique identifier of the parameter in question.
   * @param value Optional parameter, if defined then its either added or updated, otherwise
   * the parameter is removed from the current search parameters and updated.
   */
  const setParams = (
    params: Record<SearchParameterKey, SearchParameterValue | undefined>
  ): void => {
    Object.entries(params).forEach(([key, value]) => {
      if (value == undefined) {
        // Remove value for key
        removeParam(key);
        return;
      } else {
        // Set value for given key
        parameterStore[key] = value;

        updateAndReloadParams();
      }
    });
  };

  const getCurrentParams = () => parameterStore;

  /**
   * Removes the target parameter from the current search parameters and
   * updates the URL string by reloading.
   *
   * @param key The unique identifier of the parameter in question.
   */
  const removeParam = (key: SearchParameterKey) => {
    delete parameterStore[key];

    updateAndReloadParams();
  };

  /**
   * Plural version of removeParam. Removes multiple parameters from the current search parameters,
   * use this when removing multiple parameters at once in order to avoid race conditions.
   *
   * @param keys
   */
  const removeParams = (keys: SearchParameterKey[]) => {
    keys.forEach((key) => {
      delete parameterStore[key];
    });

    updateAndReloadParams();
  };

  /**
   * Updates the current search params, and reloads the current route with the updated
   * parameter string
   *
   * @param params - Search paramater records containing key value pairs to update the current
   * route's search parameters with.
   */
  const updateAndReloadParams = () => {
    const updatedSearchParams = queryString.stringify(parameterStore),
      updatedhref = `${location.pathname}?${updatedSearchParams}`;

    reload(updatedhref);
  };

  /**
   * Hydrates the parameter store with the parameters stored by the `persistedURLStateString`,
   * usually used loading the initial properties of a component from a persisted URL state.
   *
   * @param persistedURLStateString -> A URL string containing a previous app state based on the contents of its
   * search parameters. This function will parse the string and update the current search parameters, effectively
   * restoring the app's UI state copied over from some other source.
   */
  const hydrateStateFromURL = (
    persistedURLStateString: string = location.toString()
  ) => {
    const parsedQueryString = queryString.parseUrl(
        persistedURLStateString
      ).query,
      parsedSearchParams: SearchParameterRecords = {};

    // Only parse supported parameters
    Object.entries(parsedQueryString).forEach(([key, value]) => {
      if (value != null) {
        if (Array.isArray(value) && !value.includes(null)) {
          // Remove any null values and cast to string array
          let definedValueArray: string[] = value
            .filter((value) => {
              return value != null;
            })
            .map((value) => {
              return value as string;
            });

          parsedSearchParams[key] = definedValueArray;
        } else if (
          typeof value == "string" ||
          typeof value == "boolean" ||
          typeof value == "number"
        ) {
          parsedSearchParams[key] = value;
        }
      }
    });

    parameterStore = parsedSearchParams;
    updateAndReloadParams();
  };

  /**
   * Clears all parameters from the current search parameters and updates the URL string.
   */
  const clearState = () => {
    {
      parameterStore = {};
      updateAndReloadParams();
    }
  };

  /**
   * Toggles the presence of a parameter in the current search parameters. Provide a value to
   * update the parameter, otherwise the parameter is removed (untoggled). Also, if the parameter already exists
   * for the given key, it is removed, otherwise it is added.
   *
   * @param key The unique identifier of the parameter in question.
   * @param value Optional parameter, if defined then its corresponding key value pair is either added or updated,
   * otherwise it's removed
   */
  const toggleParam = (
    key: SearchParameterKey,
    value?: SearchParameterValue
  ) => {
    if (hasParam(key) || value == undefined) {
      removeParam(key);
    } else {
      setParams({ [key]: value });
    }
  };

  /**
   * If the parameter and value exist then remove them, if the parameter exists but the value
   * does not, or if the parameter does not exist then set it with the given value. Used when
   * you want to be able to toggle a parameter but don't want it to be removed when the value changes,
   * i.e selecting different posts.
   *
   * @param key The unique identifier of the parameter in question.
   * @param value Optional parameter, if defined then its corresponding key value pair is either added or updated,
   * otherwise it's removed.
   */
  const toggleParameterWithValue = (
    key: SearchParameterKey,
    value?: SearchParameterValue
  ) => {
    let currentValue = getParamValue(key);

    if (currentValue != value) {
      setParams({ [key]: value });
    } else if (currentValue == value) {
      removeParam(key);
    }
  };

  return {
    hasParam,
    getParamValue,
    addParam,
    setParams,
    getCurrentParams,
    hydrateStateFromURL,
    clearState,
    removeParam,
    removeParams,
    toggleParam,
    toggleParameterWithValue,
  };
};
