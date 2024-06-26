// Helpful Formatting methods for the website

// Ex.) something -> Something
export const uppercaseFirstLetter = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Ex.) something -> Something or SOMETHING -> Something
export const uppercaseFirstLetterOnly = (str: string): string => {
  return uppercaseFirstLetter(str.toLowerCase());
};

// Formatting methods for username copies across the website
// Ex.) testuser123 -> Testuser123
export const formattedCreatorUsername = (creatorUsername: string): string => {
  let username = creatorUsername ?? "";

  return uppercaseFirstLetterOnly(username);
};

export const isStringPlural = (string: string): boolean => {
  return string?.endsWith("s") ?? false;
};

// Ex.) testuser123 -> Testuser123's
export const possessiveFormattedUsernameCopy = (
  creatorUsername?: string
): string => {
  if (!creatorUsername) return "";

  return `${formattedCreatorUsername(creatorUsername)}${isStringPlural(creatorUsername) ? "'" : "'s"
    }`;
};

// Ex.) testuser123 -> testuser123's
export const possessiveFormattedString = (string?: string): string => {
  if (!string) return "";

  return `${string}${isStringPlural(string) ? "'" : "'s"}`;
};

// Ex.) 1234567890 -> 123.45M, up to the 2nd decimal place
export function abbreviateNumber(number: number) {
  // Create an array of prefixes.
  const prefixes = ['', 'k', 'M', 'B', 'T'];

  // Get the magnitude of the number.
  const magnitude = Math.floor(Math.log10(Math.abs(number)) / 3);

  // Abbreviate the number.
  const shouldBeAbbreviated = String(number).length > 3,
    // Abbreviated numbers will have up to 2 decimal places to reflect their abbreviated figures
    abbreviatedNumber = (shouldBeAbbreviated ? (number / Math.pow(1000, magnitude)).toFixed(2) : number);

  // Return the abbreviated number with the appropriate prefix.
  return `${abbreviatedNumber}${prefixes[magnitude]}`;
}