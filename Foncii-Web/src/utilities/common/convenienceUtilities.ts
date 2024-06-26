// Convenient methods and operations often used throughout the application
// Date Formatting and transformations
/**
 * @param date
 *
 * @returns -> ISO formatted date string
 */
export function dateToISOString(date: Date): string {
  return date.toISOString();
}

/**
 * Converts the given date string to its ISO formatted date string.
 *
 * @param date
 *
 * @returns -> ISO formatted date string
 */
export function dateStringToISOString(dateString: string): string {
  return new Date(dateString).toISOString();
}

/**
 * Converts dates like January 1, 1970 -> 1970-01-01 (YYYY-MM-DD format)
 *
 * @param date
 * @returns -> A date string formatted in the YYYY-MM-DD format by slicing the ISO time (UTC).
 * Note: For future reference don't use `toLocaleDateString` this will restrict the output to the local time zone.
 */
export function convertDateToYYYYMMDDFormat(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function currentDateInYYYYMMDDFormat(): string {
  return convertDateToYYYYMMDDFormat(new Date());
}

export function convertMSTimeToISODate(msTime: number): string {
  return new Date(msTime).toISOString();
}

/**
 * @param date
 *
 * @returns -> The stored time value in milliseconds since midnight, January 1, 1970 UTC.
 */
export function getMSTimeFromDate(date: Date): number {
  return date.getTime();
}

/**
 * Converts the date string to its stored time value in milliseconds since midnight, January 1, 1970 UTC.
 *
 * @param date
 *
 * @returns -> The stored time value in milliseconds since midnight, January 1, 1970 UTC.
 */
export function getMSTimeFromDateString(dateString: string): number {
  return new Date(dateString).getTime();
}

/**
 * Converts the current date at this exact moment to its stored time value in milliseconds since midnight,
 * January 1, 1970 UTC.
 *
 * @returns -> The stored time value in milliseconds since midnight, January 1, 1970 UTC of
 * the current date.
 */
export function currentDateAsMSTime(): number {
  return getMSTimeFromDate(new Date());
}

/**
 * @returns -> ISO formatted date string of the current time.
 */
export function currentDateAsISOString(): string {
  return dateToISOString(new Date());
}

// Object Transformations
/**
 * @param object
 * @param value
 *
 * @returns -> The key of the given object that has the given value.
 */
export function getObjectKeyForValue(object: Object, value: any) {
  return Object.keys(object).find((key) => {
    const parsedKey = key as keyof typeof object;

    return object[parsedKey] === value;
  });
}

export function encodeStringToURLSafeBase64(rawInput: string) {
  const base64 = Buffer.from(rawInput, "utf-8").toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function decodeFromBase64(encipheredInput: string) {
  const buffer = Buffer.from(encipheredInput, "base64");
  return buffer.toString("utf-8");
}
