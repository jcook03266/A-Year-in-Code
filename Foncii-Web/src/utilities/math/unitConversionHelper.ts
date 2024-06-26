// Collection of unit conversion helper methods
export function convertKMToMiles(km: number): number {
  return km * 0.621371;
}

export function convertMilesToKM(miles: number): number {
  return miles * 1.60934;
}

export function convertKMToFeet(km: number): number {
  return km * 3280.84;
}

export function convertFeetToKM(feet: number): number {
  return feet / 3280.84;
}

export function convertMilesToFeet(miles: number): number {
  return miles * 5280;
}

export function convertFeetToMiles(feet: number): number {
  return feet / 5280;
}

export function convertKMToMeters(km: number): number {
  return km * 1000;
}

// Constants
const Untis = {
  feet: "feet",
  mile: "mile",
  kilometer: "kilometer",
  meter: "meter",
};

const AbbreviatedUnits = {
  feet: "ft",
  miles: "mi",
  kilometer: "km",
  meter: "m",
};

// To String helpers
// Imperial System to string
/// Fixed to 1 decimal place
export function displayHumanReadableLengthInImperialUnits(
  lengthInMiles: number
): string {
  // Convert to feet
  if (lengthInMiles < 1) {
    const lengthInFeet = convertMilesToFeet(lengthInMiles);

    return `${lengthInFeet.toFixed(1)} ${AbbreviatedUnits.feet}`;
  } else {
    // Continue to use Miles
    return `${lengthInMiles.toFixed(1)} ${AbbreviatedUnits.miles}`;
  }
}

// Metric System to string
/// Fixed to 1 decimal place
export function displayHumanReadableLengthInMetricUnits(
  lengthInKilometers: number
): string {
  // Convert to meters
  if (lengthInKilometers < 1) {
    const lengthInMeters = convertKMToMeters(lengthInKilometers);
    return `${lengthInMeters} ${AbbreviatedUnits.meter}`;
  } else {
    // Continue to use Kilometers
    return `${lengthInKilometers} ${AbbreviatedUnits.kilometer}`;
  }
}
