// Dependencies
// Inheritance
import FonciiMicroservice from "./protocol/fonciiMicroservice";

// Networking
import fetch from "node-fetch";

export default class ReservationMicroservice extends FonciiMicroservice {
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
        const requestMethod = "GET";

        const response = await fetch(
            this.serviceEndpoints.ReservationMicroservice
                .FindResyAvailableDays({ resyVenueID, partySize, startDateInMS, endDateInMS }),
            {
                method: requestMethod,
                headers: this.sharedHeader
            }
        );

        return await response.json()
    }

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
    }): Promise<Partial<ReservationAvailability>[] | undefined> {
        const requestMethod = "GET";

        console.log(this.serviceEndpoints.ReservationMicroservice
                .FindResyAvailabilitiesForDate({ resyVenueID, partySize, dateOfReservationInMS }))

        const response = await fetch(
            this.serviceEndpoints.ReservationMicroservice
                .FindResyAvailabilitiesForDate({ resyVenueID, partySize, dateOfReservationInMS }),
            {
                method: requestMethod,
                headers: this.sharedHeader
            }
        );

        return await response.json()
    }
}
