// Dependencies
// Types
import { AvailableReservationDays, ReservationAvailability } from "../../__generated__/graphql";

// Logging
import logger from "../../foncii-toolkit/debugging/debugLogger";

// Utilities
import { convertDateToYYYYMMDDFormat, currentDateAsISOString, dateStringToISOString } from "../../foncii-toolkit/utilities/convenienceUtilities";
import axios, { AxiosError, AxiosResponse } from 'axios';
import { clampNumber } from "../../foncii-toolkit/utilities/commonMath";

// Local Types
enum ReservationProviders {
    Resy = 0
}

/**
 * Service layer for interacting with external reservation services ~ Resy.com
 * Allowing us to pull the latest availabilities to display for users. At this
 * point in time we're using Resy's `https://api.resy.com/4/` API endpoint; this 
 * access is not commercial, it's via a regular user account so we may run into 
 * authorization issues if too many requests are sent. We'll have to figure things
 * out and do some load testing.
 */
export default class ReservationService {
    // Constants
    private PARTY_SIZE_LIMIT = { max: 20, min: 1 };

    // The supported endpoints used by this service to interface with the IG API
    private static Endpoints = {
        findAvailabilities: "https://api.resy.com/4/find",
        calendarAvailabilities: "https://api.resy.com/4/venue/calendar"
    }

    // Database Operations
    // Reusable / Modular Methods
    // Queries
    // Resy Reservations `Integration`
    /**
     * Finds and returns a list of reservation days availabilities (if any) matching the 
     * given criteria.
     * 
     * @param resyVenueID -> The ID of the venue within Resy's database to search for availabilities for 
     * @param partySize -> The desired party size for the reservation. Note: max is 20, min is 1
     * @param startDateInMS -> Starting date of the reservation availability sliding window search in milliseconds [ms]
     * @param endDateInMS -> End date of the reservation availability sliding window search in milliseconds [ms]
     * 
     * @returns -> A list of reservation available days availabilities for the target restaurant matching 
     * the requested parameters
     */
    async findResyAvailableDays({
        resyVenueID,
        partySize,
        startDateInMS,
        endDateInMS
    }: {
        resyVenueID: string,
        partySize: number,
        startDateInMS: number,
        endDateInMS: number
    }): Promise<AvailableReservationDays | undefined> {
        const url = new URL(ReservationService.Endpoints.calendarAvailabilities)

        // Get Request Options
        const axiosConfig = {
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Authorization": `ResyAPI api_key="${process.env.RESY_API_SECRET}"`,
                "Accept-Encoding": "gzip"
            }
        };

        // Append the query parameters to the URL
        url.searchParams.set('start_date', convertDateToYYYYMMDDFormat(new Date(startDateInMS))) // Formatted here in the format (YYYY-MM-DD)
        url.searchParams.set('end_date', convertDateToYYYYMMDDFormat(new Date(endDateInMS)))
        url.searchParams.set('num_seats', String(clampNumber(partySize, this.PARTY_SIZE_LIMIT.min, this.PARTY_SIZE_LIMIT.max)))
        url.searchParams.set('venue_id', resyVenueID)

        return axios.get(url.toString(), axiosConfig)
            .then((response: AxiosResponse) => {
                const { last_calendar_day } = response.data,
                    scheduled: object[] = response.data.scheduled ?? [];

                // Get Request successful, parse the availabilities into partial ReservationAvailability objects
                // the fonciiRestaurantID attribute and the externalURL attribute will be populated by the caller
                const availableDays = (scheduled
                    .filter(availability => {
                        const { inventory } = availability as any,
                            { reservation } = inventory

                        return reservation === "available";
                    })
                    .map((availability) => {
                        // Parsing the start time of the reservation availability, the end time isn't important to us
                        const { date } = availability as any

                        return dateStringToISOString(date)
                    }) as Partial<ReservationAvailability>[])
                    .filter(Boolean);

                return {
                    daysWithAvailability: availableDays,
                    lastDayAvailable: dateStringToISOString(last_calendar_day),
                    provider: ReservationProviders.Resy as any, // Coerced to any since this enum is numeric and the GQL enum is a String
                    venueID: resyVenueID,
                    lastChecked: currentDateAsISOString()
                } as AvailableReservationDays;
            })
            .catch((reason: AxiosError) => {
                logger.error(reason);
                return undefined
            });
    }

    // Resy Reservations `Integration`
    /**
     * Finds and returns a list of reservation availabilities (if any) matching the 
     * given criteria.
     * 
     * @async
     * @param resyVenueID -> The ID of the venue within Resy's database to search for availabilities for 
     * @param partySize -> The amount of patrons that will dine via this reservation
     * @param dateOfReservationInMS -> The desired date of the reservation in milliseconds [ms] 
     * 
     * @returns -> A list of reservation availabilities for the target restaurant matching 
     * the requested parameters
     */
    async findResyAvailabilitiesForDate({
        resyVenueID,
        partySize,
        dateOfReservationInMS
    }: {
        resyVenueID: string,
        partySize: number,
        dateOfReservationInMS: number
    }): Promise<Partial<ReservationAvailability>[]> {
        const url = new URL(ReservationService.Endpoints.findAvailabilities);

        // Get Request Options
        const axiosConfig = {
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Authorization": `ResyAPI api_key="${process.env.RESY_API_SECRET}"`,
                "Accept-Encoding": "gzip"
            }
        };

        // Append the query parameters to the URL
        url.searchParams.set('lat', "0")
        url.searchParams.set('long', "0")
        url.searchParams.set('day', convertDateToYYYYMMDDFormat(new Date(dateOfReservationInMS))) // Formatted here in the format (YYYY-MM-DD)
        url.searchParams.set('party_size', String(clampNumber(partySize, this.PARTY_SIZE_LIMIT.min, this.PARTY_SIZE_LIMIT.max)))
        url.searchParams.set('venue_id', resyVenueID)

        return axios.get(url.toString(), axiosConfig)
            .then((response: AxiosResponse) => {
                const { results } = response.data,
                    { venues } = results,
                    venue = venues[0] ?? {},
                    reservationAvailabilities: object[] = venue.slots ?? [];

                // Get Request successful, parse the availabilities into partial ReservationAvailability objects
                // the fonciiRestaurantID attribute and the externalURL attribute will be populated by the caller
                const parsedReservationAvailabilities = reservationAvailabilities.map((availability) => {
                    // Parsing the start time of the reservation availability, the end time isn't important to us
                    const { date } = availability as any,
                        { start }: { start: string } = date,
                        [day, time] = start.split(" ");

                    return {
                        date: dateStringToISOString(day),
                        timeSlot: time,
                        provider: ReservationProviders.Resy as any,
                        venueID: resyVenueID,
                        lastChecked: currentDateAsISOString()
                    } as Partial<ReservationAvailability>;
                }) as Partial<ReservationAvailability>[];

                return parsedReservationAvailabilities;
            })
            .catch((reason: AxiosError) => {
                logger.error(reason);
                return []
            })
    }
}