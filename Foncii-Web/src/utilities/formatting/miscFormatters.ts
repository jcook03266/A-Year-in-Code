// Various miscellaneous useful formatters
export class DateFormatter {
  /**
   * @param date
   * @returns -> The passed date in the long month-day-year format.
   * Ex.) "January 1, 2021"
   */
  static formatDateToMDY(date: Date): string {
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  /**
   * @param date
   * @returns -> The passed date in the long month-day-year format.
   * Ex.) "01/01/2021, 1:01 PM EST"
   */
  static formatDateToLocalizedNumericMMDDYYHH(date: Date): string {
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      timeZoneName: "short",
    });
  }

  /**
   * @param date
   * @returns -> The passed date in the long month-day-year format.
   * Ex.) "01/01/2021, 1:01 PM EST"
   */
  static formatDateToMDYHMS(date: Date): string {
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      timeZoneName: "short",
    });
  }
}
