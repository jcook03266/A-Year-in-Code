// Types
/** Time based enums and types */
interface TimeFrame {
  start: TimePoint;
  end: TimePoint;
}

interface TimePoint {
  day: WeekDays;
  /** In 24 hour military / UTC time */
  hour24: number;
  /** 12 hour clock, normal for most of the world */
  hour12: number;
  minutes: number;
  meridianTime: MeridianTime;
  /**
   * The date of the time point in milliseconds [ms]
   */
  msTime: number;
}

/** Enums */
/** Meridian Time Periods */
enum MeridianTime {
  AM = "AM",
  PM = "PM",
}

enum WeekDays {
  Monday = "Monday",
  Tuesday = "Tuesday",
  Wednesday = "Wednesday",
  Thursday = "Thursday",
  Friday = "Friday",
  Saturday = "Saturday",
  Sunday = "Sunday",
}

/** Monday thru Sunday operating hours for the given restaurant */
type OperatingHours = { [key in WeekDays]: string };

// Time Constants
// 1 * 1000 instead of 1000 just as a formality because 1000 is the conversion factor 
// and 1 is the quantity to convert
const ONE_SECOND_IN_MS = 1 * 1000;

export const UnitsOfTimeInMS = {
  year: ONE_SECOND_IN_MS * 60 * 60 * 24 * 365,
  month: ONE_SECOND_IN_MS * 60 * 60 * 24 * 30,
  week: ONE_SECOND_IN_MS * 60 * 60 * 24 * 7,
  day: ONE_SECOND_IN_MS * 60 * 60 * 24,
  hour: ONE_SECOND_IN_MS * 60 * 60,
  minute: ONE_SECOND_IN_MS * 60,
  second: ONE_SECOND_IN_MS,
  millisecond: 1
};

/**
 * Various methods and algorithms used for time based computations
 * like determining operating hours / open status for businesses
 */
/**
 * Process:
 * 1.) Offset (add) the current UTC time by the given UTC offset to get the local time of the establishment,
 * this allows us to get the current day of the week for the establishment. 14 UTC -> 9AM NYC (+-300 ~ 5 hours behind)
 *
 * 2.) Configure a new UTC time with the operating hours of the establishment; the local UTC date from
 * the previous step is used to ensure the correct day of the week is used.
 *
 * 3.) This new UTC date for the establishment is then synchronized back up with the current UTC time by subtracting the UTC
 * offset instead of adding like in the first step. So NYC 9 AM -> 14 UTC (--300 ~ +300 ~ 5 hours away from UTC so add 300 to bring it back to UTC)
 *
 * 4.) Compare the current UTC time with the UTC synchronized time of the establishment to determine whether or not it's currently open
 * based on universal time from anywhere in the world.
 *
 * The main point of contention in this process is selecting the correct day of the week to use for the operating hours time frame selection, as
 * well as selecting the current local date / day, because everything depends on the correct day.
 *
 * @param operatingHours
 * @param utcOffset -> Offset from UTC in minutes [m], ex.) -300 for NYC (5 hours behind)
 *
 * @returns -> True if the business is currently open, false otherwise
 */
export function isBusinessOpen({
  operatingHours,
  utcOffset,
}: {
  operatingHours: OperatingHours;
  utcOffset: number;
}): boolean {
  const currentUTCOffsetTimeInMillis = getCurrentUTCTimeInMS(),
    currentLocalUTCDay = getLocalizedUTCDayFor(utcOffset),
    currentLocalUTCDate = getLocalizedUTCDateFor(utcOffset),
    operatingHourTimeFrames = getCurrentOperatingHourTimeFrames({
      operatingHours,
      day: currentLocalUTCDay,
    });

  // Track the open status relative to the current time frame, isOpen is false (closed) by default
  // unless stated otherwise by the operating hour time frames below
  let isOpen = false;

  for (const operatingHourTimeFrame of operatingHourTimeFrames) {
    // Edge-cases for operating hours to consider
    // Return immediately, this always means they're open, there's no other meaning or edge case to consider
    if (operatingHourTimeFrame == "Open 24 hours".toLowerCase()) return true;
    // Set to false but continue to see if this is the current time frame, don't return just yet
    else if (operatingHourTimeFrame == "Closed".toLowerCase()) {
      isOpen = false;
      continue;
    }

    // Determine the current time frame
    const timeFrame = computeTimeFrameFor({
      operatingHourTimeFrame,
      utcOffset,
      date: currentLocalUTCDate, // Use the localized UTC date to determine the current time frame
    });

    // Check if the current time falls within the current operating hours time frame
    const isCurrentTimeWithinThisTimeFrame =
      currentUTCOffsetTimeInMillis >= timeFrame.start.msTime &&
      currentUTCOffsetTimeInMillis <= timeFrame.end.msTime;

    if (isCurrentTimeWithinThisTimeFrame) {
      // They're open, break out the loop early
      isOpen = true;
      break;
    } else continue; // Try the next time frame (if any), if no other then they are closed
  }

  return isOpen;
}

export function determineNextOpeningTimeForDay({
  day,
  date,
  operatingHours,
  utcOffset,
}: {
  day: WeekDays;
  date: Date;
  operatingHours: OperatingHours;
  utcOffset: number;
}): TimePoint | undefined {
  const referenceUTCTimeInMS = date.getTime(),
    operatingHourTimeFrames = getOperatingHourTimeFramesFor({
      operatingHours,
      day,
    });

  // Undefined when closed and for 'Open 24 hours' because this means there's no next opening time, it's 24 hours
  let nextOpeningTime: TimePoint | undefined = undefined;

  for (const operatingHourTimeFrame of operatingHourTimeFrames) {
    // Edge-cases for operating hours to consider
    // Return immediately, this always means they're open, there's no other meaning or edge case to consider
    if (operatingHourTimeFrame == "Open 24 hours".toLowerCase()) {
      nextOpeningTime = undefined;
      break;
    }
    // Set to false but continue to see if this is the target time frame, don't return just yet
    else if (operatingHourTimeFrame == "Closed".toLowerCase()) {
      continue;
    }

    // Determine the time frame for the given date
    const timeFrame = computeTimeFrameFor({
      operatingHourTimeFrame,
      utcOffset,
      date,
    });

    // Check if the reference time comes before the target operating hours time frame starts
    const isReferenceTimeLessThanThisTime =
      referenceUTCTimeInMS < timeFrame.start.msTime;

    if (isReferenceTimeLessThanThisTime) {
      // They will open again later than the target time, break out the loop early
      nextOpeningTime = timeFrame.start; // The next opening time is the start time of the target time frame
      break;
    } else continue; // Try the next time frame (if any), if no other then they won't open again today
  }

  return nextOpeningTime;
}

export function determineNextOpeningTimeForToday({
  operatingHours,
  utcOffset,
}: {
  operatingHours: OperatingHours;
  utcOffset: number;
}): TimePoint | undefined {
  return determineNextOpeningTimeForDay({
    day: getLocalizedUTCDayFor(utcOffset),
    date: getCurrentDate(), // Use the current UTC date, the offset date is not applicable here
    operatingHours,
    utcOffset
  });
}

export function determineNextClosingTimeForDay({
  day,
  date,
  operatingHours,
  utcOffset,
}: {
  day: WeekDays;
  date: Date;
  operatingHours: OperatingHours;
  utcOffset: number;
}): TimePoint | undefined {
  const referenceUTCTimeInMS = date.getTime(),
    operatingHourTimeFrames = getOperatingHourTimeFramesFor({
      operatingHours,
      day,
    });

  // Undefined when closed and for 'Open 24 hours' because this means there's no next opening time, it's 24 hours
  let nextClosingTime: TimePoint | undefined = undefined;

  for (const operatingHourTimeFrame of operatingHourTimeFrames) {
    // Edge-cases for operating hours to consider
    // Return immediately, this always means they're open, there's no other meaning or edge case to consider
    if (operatingHourTimeFrame == "Open 24 hours".toLowerCase()) {
      nextClosingTime = undefined;
      break;
    }
    // Set to false but continue to see if this is the current time frame, don't return just yet
    else if (operatingHourTimeFrame == "Closed".toLowerCase()) {
      continue;
    }

    // Determine the time frame for the given date
    const timeFrame = computeTimeFrameFor({
      operatingHourTimeFrame,
      utcOffset,
      date,
    });

    // Check if the reference time comes before the target operating hours time frame starts
    const isReferenceTimeLessThanThisTime =
      referenceUTCTimeInMS < timeFrame.end.msTime;

    if (isReferenceTimeLessThanThisTime) {
      // They will open again later than the target time, break out the loop early
      nextClosingTime = timeFrame.end; // The next opening time is the start time of the target time frame
      break;
    } else continue; // Try the next time frame (if any), if no other then they won't open again today
  }

  return nextClosingTime;
}

export function determineNextClosingTimeForToday({
  operatingHours,
  utcOffset,
}: {
  operatingHours: OperatingHours;
  utcOffset: number;
}): TimePoint | undefined {
  return determineNextClosingTimeForDay({
    day: getLocalizedUTCDayFor(utcOffset),
    date: getCurrentDate(),
    operatingHours,
    utcOffset,
  });
}

export function determineNextOpeningTime({
  operatingHours,
  utcOffset,
}: {
  operatingHours: OperatingHours;
  utcOffset: number;
}): TimePoint | undefined {
  const today = getLocalizedUTCDayFor(utcOffset),
    todayDate = getLocalizedUTCDateFor(utcOffset);

  // Iterator
  let nextOpeningTime: TimePoint | undefined = determineNextOpeningTimeForToday({
    operatingHours,
    utcOffset
  }),
    nextDay = getNextDayAfter(today),
    nextDayDate = new Date(todayDate.getTime() + UnitsOfTimeInMS.day); // Advance by 24 hours in milliseconds [ms]

  // Set time to midnight
  nextDayDate = setDateToMidnight(nextDayDate);

  // Search for the next opening time throughout the week
  while (nextDay != today && nextOpeningTime == undefined) {
    // Determine the next opening time for the current day
    nextOpeningTime = determineNextOpeningTimeForDay({
      date: nextDayDate,
      day: nextDay,
      operatingHours,
      utcOffset,
    });

    // Go to the next day
    nextDay = getNextDayAfter(nextDay);
    nextDayDate = new Date(nextDayDate.getTime() + UnitsOfTimeInMS.day); // Advance by 24 hours in milliseconds [ms])

    // Set time to midnight
    nextDayDate = setDateToMidnight(nextDayDate);
  }

  return nextOpeningTime;
}

export function determineNextClosingTime({
  operatingHours,
  utcOffset,
}: {
  operatingHours: OperatingHours;
  utcOffset: number;
}): TimePoint | undefined {
  const today = getLocalizedUTCDayFor(utcOffset),
    todayDate = getLocalizedUTCDateFor(utcOffset);

  // Iterator
  let nextClosingTime: TimePoint | undefined = determineNextClosingTimeForToday(
    { operatingHours, utcOffset }
  ),
    nextDay = getNextDayAfter(today),
    nextDayDate = new Date(todayDate.getTime() + UnitsOfTimeInMS.day); // Advance by 24 hours in milliseconds [ms])

  // Set time to midnight
  nextDayDate = setDateToMidnight(nextDayDate);

  // Search for the next opening time throughout the week
  while (nextDay != today && nextClosingTime == undefined) {
    // Determine the next opening time for the current day
    nextClosingTime = determineNextClosingTimeForDay({
      date: nextDayDate,
      day: nextDay,
      operatingHours,
      utcOffset,
    });

    // Go to the next day
    nextDay = getNextDayAfter(nextDay);
    nextDayDate = new Date(nextDayDate.getTime() + UnitsOfTimeInMS.day); // Advance by 24 hours in milliseconds [ms])

    // Set time to midnight
    nextDayDate = setDateToMidnight(nextDayDate);
  }

  return nextClosingTime;
}

export function computeTimeFrameFor({
  operatingHourTimeFrame,
  utcOffset,
  date,
}: {
  operatingHourTimeFrame: string;
  utcOffset: number;
  date: Date;
}): TimeFrame {
  // Determine the current time frame
  // 12:00 – 3:00 PM
  // -> ['12:00','3:00 PM']
  const [startTime, endTime] = operatingHourTimeFrame
    .split("–")
    .map((string) => string.trim()),
    // At the start time if the meridian time for the start and end are different, and at the end time if both fall within the same meridian time period
    startTimeMeridianTime = (determineMeridianTimeForTimePoint(startTime) ??
      determineMeridianTimeForTimePoint(endTime)) as MeridianTime,
    // The meridian time of the end time point is always present, no exceptions
    endTimeMeridianTime = determineMeridianTimeForTimePoint(
      endTime
    ) as MeridianTime;

  let startTimePoint: TimePoint = createTimePointFrom({
    date,
    utcOffset,
    timePointString: startTime,
    meridianTime: startTimeMeridianTime,
  }),
    endTimePoint: TimePoint = createTimePointFrom({
      date,
      utcOffset,
      timePointString: endTime,
      meridianTime: endTimeMeridianTime,
    });

  // If the end time is before the start time, then the end time is during the next day (24 hours in milliseconds [ms])
  if (endTimePoint.msTime <= startTimePoint.msTime) {
    endTimePoint = createTimePointFrom({
      date: new Date(date.getTime() + UnitsOfTimeInMS.day), // Advance by 24 hours in milliseconds [ms]),
      utcOffset,
      timePointString: endTime,
      meridianTime: endTimeMeridianTime,
    });
  }

  const timeFrame = {
    start: startTimePoint,
    end: endTimePoint,
  };

  return timeFrame;
}

function getCurrentOperatingHourTimeFrames({
  operatingHours,
  day,
}: {
  operatingHours: OperatingHours;
  day: WeekDays;
}): string[] {
  return getOperatingHourTimeFramesFor({
    operatingHours,
    day,
  });
}

function getOperatingHourTimeFramesFor({
  operatingHours,
  day,
}: {
  operatingHours: OperatingHours;
  day: WeekDays;
}): string[] {
  // Parse and pre-process operating hours for the current day relative to UTC offset
  const currentOperatingHours = operatingHours[day].trim().toLowerCase();

  const operatingHourTimeFrames = currentOperatingHours.split(",");
  return operatingHourTimeFrames;
}

export function getNextDayAfter(currentDay: WeekDays): WeekDays {
  const currentDayIndex = Object.values(WeekDays).findIndex(
    (day) => day == currentDay
  ),
    // Loop back to the first day if the current day is the last index aka 'Sunday'
    nextDayIndex =
      currentDayIndex == Object.values(WeekDays).length - 1
        ? 0
        : currentDayIndex + 1;

  return Object.values(WeekDays)[nextDayIndex];
}

export function getLocalizedUTCDayFor(utcOffset: number): WeekDays {
  return getLocalizedUTCDateFor(utcOffset).toLocaleString("en-us", {
    weekday: "long",
    timeZone: "UTC",
  }) as WeekDays;
}

/**
 * @returns -> The current UTC time in milliseconds
 */
export function getCurrentUTCTimeInMS(): number {
  return new Date().getTime();
}

export function getCurrentDate(): Date {
  return new Date();
}

export function getLocalizedUTCDateFor(utcOffset: number): Date {
  return new Date(
    convertUTCDateToUTCOffset({
      date: new Date(),
      utcOffset,
    })
  );
}

/**
 * Used to normalize dates to a specific time (midnight) on a given
 * date / day as referenced by the given input date.
 *
 * @param date
 *
 * @returns -> The given date with its time set to midnight
 */
export function setDateToMidnight(date: Date): Date {
  const inputDate = date;

  inputDate.setUTCHours(0);
  inputDate.setUTCMinutes(0);
  inputDate.setUTCSeconds(0);
  inputDate.setUTCMilliseconds(0);

  return inputDate;
}

/**
 * Used to normalize dates to a specific time (first day of the month + midnight) on a given
 * date / day as referenced by the given input date.
 *
 * @param date
 *
 * @returns -> The given date with its time set to the first day of the month at midnight
 */
export function setDateToFirstDayOfMonthMidnight(date: Date): Date {
  const inputDate = date;

  inputDate.setDate(1);
  inputDate.setUTCHours(0);
  inputDate.setUTCMinutes(0);
  inputDate.setUTCSeconds(0);
  inputDate.setUTCMilliseconds(0);

  return inputDate;
}

/**
 * Converts the input date to its UTC time in milliseconds at midnight on the given date / day
 *
 * @param date
 *
 * @returns -> The UTC date in milliseconds at midnight on the given date / day
 */
export function convertDateToMidnightMSTimestamp(date: Date): number {
  return setDateToMidnight(date).getTime();
}

/**
 * Advances the input date advanced by 30 days ~ equivalent of one month.
 *
 * @param date
 *
 * @returns -> The input date advanced by 30 days ~ equivalent of one month
 */
export function advanceDateBy30Days(date: Date): Date {
  return new Date(date.getTime() + UnitsOfTimeInMS.month);
}

export function getSnapedStringTimeFromNow(date: Date): string {
  const diffMillis = new Date().getTime() - date.getTime();
  let diffVal;
  if (diffMillis < UnitsOfTimeInMS.week) {
    diffVal = Math.floor(diffMillis / UnitsOfTimeInMS.day);
    return diffVal.toString() + (diffVal === 1 ? " day" : " days") + " ago";
  } else if (diffMillis < UnitsOfTimeInMS.month) {
    diffVal = Math.floor(diffMillis / UnitsOfTimeInMS.week);
    return diffVal.toString() + (diffVal === 1 ? " week" : " weeks") + " ago";
  } else if (diffMillis < UnitsOfTimeInMS.month * 3) {
    diffVal = Math.floor(diffMillis / UnitsOfTimeInMS.month);
    return diffVal.toString() + (diffVal === 1 ? " month" : " months") + " ago";
  } else {
    return date.toLocaleString().split(",")[0];
  }
}

/**
 * Should be used to convert a localized UTC time (a time that's already offset from UTC) to UTC by subtracting the offset from the UTC time to bring it to the current UTC time.
 * 9 AM NYC -> 14:00 UTC (-5, -300 minutes) Behind UTC so --300 ~ +300, 9 AM Germany -> 8:00 UTC (+1, +60 minutes) Ahead of UTC so -60.
 *
 * @param date -> Some UTC date to offset by the provided UTC offset to sync it up with UTC, ex.) 9 AM in NYC (09:00) is 14:00 when converted to UTC via the 5h offset.
 * when passing in a date be sure to do .setUTCHours(...)... to specify the initial properties of the date in UTC in order for the date to be converted properly, using
 * .setHours won't work as it adjusts the time according to the system's local time which is not universal time.
 * @param utcOffset -> UTC offset in minutes (-300 for NYC for example) to adjust the date by (300 is added (-- becomes + via sign rule) to the UTC date passed since NYC is behind by 5 hours)
 *
 * @returns -> UTC date in milliseconds forward adjusted by the number of minutes specified by the UTC offset
 */
export function convertUTCOffsetDateToUTC({
  date,
  utcOffset,
}: {
  date: Date;
  utcOffset: number;
}): number {
  // Compute the current time in milliseconds using the UTC offset (in minutes)
  const utcOffsetInMillis = utcOffset * UnitsOfTimeInMS.minute,
    dateUTCTimeInMilliseconds = date.getTime(), // Current UTC time in milliseconds
    // Important: Subtract by the offset (-) to get utc offset time in milliseconds, -300 is 5 hours behind (New York), -480 is 8 hours behind (California), +60 is 1 hour ahead (Germany)
    // this is how UTC offset works, you subtract the current UTC time from the offset to get the utc time relative to the offset
    utcOffsetTimeInMillis = dateUTCTimeInMilliseconds - utcOffsetInMillis;

  return utcOffsetTimeInMillis;
}

/**
 * The inverse of [convertUTCOffsetDateToUTC], converts a UTC date to a localized UTC date by adding the offset
 * to the UTC date to bring it to the required local time. 14 UTC -> 9 NYC time because NYC is 5 hours (-300 minutes) behind so this would give us the local time in NYC
 *
 * @param date -> UTC date
 * @param utcOffset -> The number of minutes to offset the given date by backwards to bring it to the required local time
 * enumerated by the offset, ex.) 12 UTC -> 7 NYC time because NYC is 5 hours behind so this would give us the local time in NYC
 *
 * @returns -> UTC date in milliseconds backward adjusted by the number of minutes specified by the UTC offset
 */
export function convertUTCDateToUTCOffset({
  date,
  utcOffset,
}: {
  date: Date;
  utcOffset: number;
}) {
  const utcOffsetInMillis = utcOffset * UnitsOfTimeInMS.minute,
    dateUTCTimeInMilliseconds = date.getTime(),
    utcOffsetTimeInMillis = dateUTCTimeInMilliseconds + utcOffsetInMillis;

  return utcOffsetTimeInMillis;
}

/**
 * @param date
 * @param utcOffset
 *
 * @returns -> A UTC date offset by the number of minutes specified by the UTC offset
 */
export function getUTCOffsetDate({
  date,
  utcOffset,
}: {
  date: Date;
  utcOffset: number;
}): Date {
  // Compute the current date using the UTC offset (in minutes)
  const utcOffsetTimeInMillis = convertUTCOffsetDateToUTC({ date, utcOffset }),
    currentUTCOffsetDate = new Date(utcOffsetTimeInMillis);

  return currentUTCOffsetDate;
}

/**
 * @param date -> Localized (offset) UTC date to set with the time point's hour and minute properties
 * @param utcOffset -> The time in minutes to offset the localize date by in order to synchronize it back up with the current UTC time
 * @param timePointString -> The hours and minutes to assign to the localized date and offset by the UTC offset time
 * @param meridianTime -> AM or PM, used to convert from 12 hours to 24 hours (+12 after noon)
 *
 * @returns -> A formatted time point with the given time properties assigned to the localized UTC date
 * which was then offset by the provided UTC offset time to synchronize it back up with the current UTC time.
 */
export function createTimePointFrom({
  date,
  utcOffset,
  timePointString,
  meridianTime,
}: {
  date: Date;
  utcOffset: number;
  timePointString: string;
  meridianTime: MeridianTime;
}): TimePoint {
  // Remove 'am' or 'pm' (case insensitive)
  timePointString = timePointString.replace(/am|pm/gi, "");

  // 12:00 -> [12,0]
  // 3:00 PM -> 3:00 -> [3, 0]
  const [hour, minutes] = timePointString.split(":").map(Number);

  // Convert the hours to the 24h UTC standard
  let utcNormalizedHour = hour,
    regularHour = hour;

  // If the meridian time is PM, add 12 to the hour to convert it to 24-hour time
  if (meridianTime == MeridianTime.PM && hour != 12) {
    utcNormalizedHour += 12;
  } else if (meridianTime == MeridianTime.AM && hour == 12) {
    // Midnight condition, 12 AM is 0 aka midnight
    utcNormalizedHour = 0;
  }

  // Configure the passed localized UTC date with the parsed properties
  const currentTimePointDate = new Date(date);
  currentTimePointDate.setUTCHours(utcNormalizedHour);
  currentTimePointDate.setUTCMinutes(minutes);
  currentTimePointDate.setUTCSeconds(0);
  currentTimePointDate.setUTCMilliseconds(0);

  const utcOffsetCurrentTimePointDate = getUTCOffsetDate({
    date: currentTimePointDate,
    utcOffset,
  });

  return {
    day: utcOffsetCurrentTimePointDate.toLocaleString("en-us", {
      weekday: "long",
    }) as WeekDays,
    hour24: utcNormalizedHour,
    hour12: regularHour,
    minutes: minutes,
    meridianTime,
    msTime: utcOffsetCurrentTimePointDate.getTime(),
  };
}

export function determineHoursUntilOpen(args: {
  operatingHours: OperatingHours;
  utcOffset: number;
}): number | undefined {
  const nextOpeningTime = determineNextOpeningTime(args);

  return (
    ((nextOpeningTime?.msTime ?? 0) - getCurrentUTCTimeInMS()) /
    UnitsOfTimeInMS.hour
  );
}

export function isOpeningSoon(args: {
  operatingHours: OperatingHours;
  utcOffset: number;
}): boolean {
  const hoursUntilOpening = determineHoursUntilOpen(args),
    // 2 hours is considered soon
    operationTimeThreshold = 2;

  return hoursUntilOpening
    ? hoursUntilOpening <= operationTimeThreshold
    : false;
}

export function determineHoursUntilClose(args: {
  operatingHours: OperatingHours;
  utcOffset: number;
}): number | undefined {
  const nextClosingTime = determineNextClosingTime(args);

  return (
    ((nextClosingTime?.msTime ?? 0) - getCurrentUTCTimeInMS()) /
    UnitsOfTimeInMS.hour
  );
}

export function isClosingSoon(args: {
  operatingHours: OperatingHours;
  utcOffset: number;
}): boolean {
  const hoursUntilClosing = determineHoursUntilClose(args),
    // 2 hours is considered soon
    operationTimeThreshold = 2;

  return hoursUntilClosing
    ? hoursUntilClosing <= operationTimeThreshold
    : false;
}

export function determineMeridianTimeForTimePoint(
  timePointString: string
): MeridianTime | undefined {
  return timePointString.includes("AM".toLowerCase())
    ? MeridianTime.AM
    : timePointString.includes("PM".toLowerCase())
      ? MeridianTime.PM
      : undefined;
}
