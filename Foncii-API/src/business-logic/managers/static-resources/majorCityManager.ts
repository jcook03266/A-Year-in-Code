// Dependencies
// Types
import { USStates, AbbreviatedUSStates } from "../../../types/common";

/**
 * Keeps track of our supported major cities and their respective coordinates to keep a maintainable
 * and strict set of expected data.
 */
export default class MajorCityManager implements StaticCategoryManager {
  // Supported Major Cities Table
  static SupportedMajorCities = {
    newYork: [0, "New York", USStates.NewYork, AbbreviatedUSStates.NewYork],
    losAngeles: [
      1,
      "Los Angeles",
      USStates.California,
      AbbreviatedUSStates.California,
    ],
    miami: [2, "Miami", USStates.Florida, AbbreviatedUSStates.Florida],
    chicago: [3, "Chicago", USStates.Illinois, AbbreviatedUSStates.Illinois],
    detroit: [4, "Detroit", USStates.Michigan, AbbreviatedUSStates.Michigan],
    boulder: [5, "Boulder", USStates.Colorado, AbbreviatedUSStates.Colorado],
  };

  /**
   * Factory method that creates an array of major city entities that correspond to all
   * of the supported major cities.
   *
   * @returns -> An array of major city entities corresponding to
   * of the supported major cities.
   */
  generateEntities<MajorCity>(): MajorCity[] {
    const generatedMajorCities = [];

    for (const [_, value] of Object.entries(
      MajorCityManager.SupportedMajorCities
    )) {
      const [parsedID, parsedName, parsedState, parsedAbbreviatedState] = value,
        id = parsedID as number,
        name = parsedName as string,
        state = parsedState as USStates,
        abbreviatedState = parsedAbbreviatedState as AbbreviatedUSStates;

      const majorCityDataModel = {
        id,
        name,
        state,
        abbreviatedState,
      } as MajorCity;

      generatedMajorCities.push(majorCityDataModel);
    }

    return generatedMajorCities;
  }
}
