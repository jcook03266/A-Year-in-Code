/**
 * @param date
 *
 * @returns -> ISO 8601 formatted date string (September 27, 2022 at 6 p.m. is represented as 2022-09-27 18:00:00.000)
 */
export declare function dateToISOString(date: Date): string;
/**
 * @param ISODateString
 *
 * @returns -> Date from the ISO 8601 formatted date string passed as argument,
 * undefined if the date string is invalid
 */
export declare function ISOStringToDate(ISODateString: string): Date | undefined;
/**
 * Converts the given date string to its ISO formatted date string.
 *
 * @param date
 *
 * @returns -> ISO formatted date string
 */
export declare function dateStringToISOString(dateString: string): string;
/**
 * @param date
 *
 * @returns -> The stored time value in milliseconds since midnight, January 1, 1970 UTC.
 */
export declare function getMSTimeFromDate(date: Date): number;
/**
 * Converts the date string to its stored time value in milliseconds since midnight, January 1, 1970 UTC.
 *
 * @param date
 *
 * @returns -> The stored time value in milliseconds since midnight, January 1, 1970 UTC.
 */
export declare function getMSTimeFromDateString(dateString: string): number;
/**
 * Converts the current date at this exact moment to its stored time value in milliseconds since midnight,
 * January 1, 1970 UTC.
 *
 * @returns -> The stored time value in milliseconds since midnight, January 1, 1970 UTC of
 * the current date.
 */
export declare function currentDateAsMSTime(): number;
/**
 * Converts dates like January 1, 1970 -> 1970-01-01 (YYYY-MM-DD format)
 *
 * @param date
 * @returns -> A date string formatted in the YYYY-MM-DD format by slicing the ISO time (UTC).
 * Note: For future reference don't use `toLocaleDateString` this will restrict the output to the local time zone.
 */
export declare function convertDateToYYYYMMDDFormat(date: Date): string;
export declare function currentDateInYYYYMMDDFormat(): string;
export declare function convertMSTimeToISODate(msTime: number): string;
/**
 * @returns -> ISO-8601 formatted date string of the current time.
 */
export declare function currentDateAsISOString(): string;
/**
 * @param object
 * @param value
 *
 * @returns -> The key of the given object that has the given value.
 */
export declare function getObjectKeyForValue(object: Object, value: any): string | undefined;
export declare function encodeStringToURLSafeBase64(rawInput: string): string;
export declare function decodeFromBase64(encipheredInput: string): string;
