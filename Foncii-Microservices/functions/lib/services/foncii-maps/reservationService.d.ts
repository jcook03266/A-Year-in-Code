import { AvailableReservationDays, ReservationAvailability } from "../../__generated__/graphql";
/**
 * Service layer for interacting with external reservation services ~ Resy.com
 * Allowing us to pull the latest availabilities to display for users. At this
 * point in time we're using Resy's `https://api.resy.com/4/` API endpoint; this
 * access is not commercial, it's via a regular user account so we may run into
 * authorization issues if too many requests are sent. We'll have to figure things
 * out and do some load testing.
 */
export default class ReservationService {
    private PARTY_SIZE_LIMIT;
    private static Endpoints;
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
    findResyAvailableDays({ resyVenueID, partySize, startDateInMS, endDateInMS }: {
        resyVenueID: string;
        partySize: number;
        startDateInMS: number;
        endDateInMS: number;
    }): Promise<AvailableReservationDays | undefined>;
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
    findResyAvailabilitiesForDate({ resyVenueID, partySize, dateOfReservationInMS }: {
        resyVenueID: string;
        partySize: number;
        dateOfReservationInMS: number;
    }): Promise<Partial<ReservationAvailability>[]>;
}
