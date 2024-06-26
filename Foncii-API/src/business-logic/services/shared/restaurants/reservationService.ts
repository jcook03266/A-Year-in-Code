// Dependencies
// Types
import { AggregationSortOrders, FonciiDBCollections } from "../../../../types/namespaces/database-api";
import { ReservationProviders } from "../../../../types/common";

// Models
import ReservationIntegrationModel from "../../../../models/shared/reservationIntegrationModel";

// Logging
import logger from "../../../../foncii-toolkit/debugging/debugLogger";

// Services
import { DatabaseServiceAdapter } from "../../database/databaseService";
import RestaurantService from "./restaurantService";
import RestaurantAggregator from "./restaurantAggregator";

// Utilities
import { convertDateToYYYYMMDDFormat, currentDateAsISOString, getMSTimeFromDate } from "../../../../foncii-toolkit/utilities/convenienceUtilities";
import { MicroserviceRepository } from "../../../../core-foncii/microservices/repository/microserviceRepository";

// Local Types
type ReservationIntegrationSortOptions = { [K in keyof Partial<RestaurantReservationIntegration>]: AggregationSortOrders };
type ReservationIntegrationPropertyOptions = { [K in keyof Partial<RestaurantReservationIntegration>]: any };

/**
 * Service layer for interacting with external reservation services ~ Resy.com
 * Allowing us to pull the latest availabilities to display for users. At this
 * point in time we're using Resy's `https://api.resy.com/4/` API endpoint; this 
 * access is not commercial, it's via a regular user account so we may run into 
 * authorization issues if too many requests are sent. We'll have to figure things
 * out and do some load testing.
 */
export default class ReservationService {
    // Services
    database = new DatabaseServiceAdapter();
    restaurantService = new RestaurantService();
    restaurantAggregator = new RestaurantAggregator();

    /**
     * @async 
     * @param fonciiRestaurantID 
     * @param partySize 
     * @param startDate -> To start looking for reservations
     * @param endDate -> To stop looking for reservations
     * 
     * @returns calendar availability for the restaurant
     */
    async getAvailableReservationDates({
        fonciiRestaurantID,
        partySize,
        startDate,
        endDate
    }: {
        fonciiRestaurantID: string,
        partySize: number,
        startDate: Date,
        endDate: Date
    }): Promise<AvailableReservationDays | undefined> {
        const supportsReservations = await this.doesRestaurantSupportReservations(fonciiRestaurantID);

        // Precondition failure
        if (!supportsReservations) return;

        // Search the 'Reservation Integrations' collection for the given restaurant ID which will in turn
        // provide the ID of the venue to query Resy's API with in order to find available reservations to make
        const reservationIntegration = await this.findReservationIntegrationWith({ fonciiRestaurantID });

        /** No reservation integration was found for the given Foncii restaurant */
        try {
            // Parsing integration connections
            const resyIntegrationConnection = reservationIntegration!.reservationConnections.find((connection) => connection.provider == ReservationProviders.Resy);

            // Resy Integration Support
            if (resyIntegrationConnection) {
                return await MicroserviceRepository
                    .reservationMicroservice()
                    .findResyAvailableDays({
                        resyVenueID: resyIntegrationConnection.venueID,
                        partySize,
                        startDateInMS: getMSTimeFromDate(startDate),
                        endDateInMS: getMSTimeFromDate(endDate)
                    });
            }
            else throw new Error(`No reservation integration connection found for restaurant ID ${fonciiRestaurantID}`);
        }
        catch (error) {
            logger.error(`Error occurred while finding reservations for restaurant ID ${fonciiRestaurantID}. Error: ${error}`);
            return undefined
        }
    }

    /**
     * @async 
     * @param fonciiRestaurantID 
     * @param partySize 
     * @param dateOfReservation -> The date upon which the reservation will be made
     * @param lookAheadDays -> If there is no availability for the reservation day, the lookAheadDays is used to query future availabilities
     * 
     * @returns -> A list of reservation availabilities for the target reservation date
     */
    async getReservationsForDate({
        fonciiRestaurantID,
        partySize,
        dateOfReservation
    }: {
        fonciiRestaurantID: string,
        partySize: number,
        dateOfReservation: Date
    }): Promise<ReservationAvailability[]> {
        const supportsReservations = await this.doesRestaurantSupportReservations(fonciiRestaurantID);

        // Precondition failure
        if (!supportsReservations) return [];

        // Search the 'Reservation Integrations' collection for the given restaurant ID which will in turn
        // provide the ID of the venue to query Resy's API with in order to find available reservations to make
        const reservationIntegration = await this.findReservationIntegrationWith({ fonciiRestaurantID });

        /** No reservation integration was found for the given Foncii restaurant */
        try {
            // Parsing integration connections
            const resyIntegrationConnection = reservationIntegration?.reservationConnections
                .find((connection) => connection.provider == ReservationProviders.Resy);

            // Output
            let partialAvailabilitiesData: Partial<ReservationAvailability>[] = [],
                externalURL = "",
                parameterizedLink = "";

            // Resy Integration Support
            if (resyIntegrationConnection) {
                const venueID = resyIntegrationConnection.venueID,
                    resyURLParams = new URLSearchParams({ date: convertDateToYYYYMMDDFormat(dateOfReservation), seats: String(partySize) });

                externalURL = resyIntegrationConnection.externalURL,
                    parameterizedLink = externalURL + "?" + resyURLParams.toString();

                partialAvailabilitiesData = await MicroserviceRepository
                    .reservationMicroservice()
                    .findResyAvailabilitiesForDate({
                        resyVenueID: venueID,
                        partySize,
                        dateOfReservationInMS: getMSTimeFromDate(dateOfReservation)
                    }) ?? [];
            }
            else throw new Error(`No reservation integration connection found for restaurant ID ${fonciiRestaurantID}`);

            // Add the foncii restaurant id and external URL data from the persisted connection data to each availability to complete the partial data
            return partialAvailabilitiesData.map((partialAvailability) => {
                return {
                    ...partialAvailability,
                    fonciiRestaurantID,
                    externalURL,
                    parameterizedLink
                } as ReservationAvailability
            }) as ReservationAvailability[];
        }
        catch (error) {
            logger.error(`Error occurred while finding reservations for restaurant ID ${fonciiRestaurantID}. Error: ${error}`);
            return [];
        }
    }

    /**
     * Determines whether or not the given restaurant has been integrated with some reservation
     * service provider ~ (Resy) by us. Basically checking the reservations integration document collection
     * to see if the given restaurant ID is present ~ restaurant has been integrated with a reservation service, 
     * and has been validated to support reservations by some external system of ours.
     * 
     * @async
     * @param fonciiRestaurantID 
     * 
     * @returns -> True if the restaurant has been integrated by us with some reservation 
     * service provider ~ (Resy), false otherwise.
     */
    async doesRestaurantSupportReservations(fonciiRestaurantID: string): Promise<boolean> {
        return await this.doesReservationIntegrationExistWith({ fonciiRestaurantID });
    }

    /**
     * Determines whether or not at least one reservation availabilitiy 
     * exists for the given parameters.
     * 
     * @async
     * @param fonciiRestaurantID 
     * @param partySize 
     * @param dateOfReservation 
     * 
     * @returns -> True if at least one reservation availabilitiy exists for the given parameters 
     */
    async areReservationsAvailable({
        fonciiRestaurantID,
        partySize,
        dateOfReservation
    }: {
        fonciiRestaurantID: string,
        partySize: number,
        dateOfReservation: Date
    }): Promise<boolean> {
        return (await this.getReservationsForDate({
            fonciiRestaurantID,
            partySize,
            dateOfReservation
        }) ?? []).length > 0;
    }

    // Database Operations
    // Reusable / Modular Methods
    // Mutations
    /**
     * Creates and or updates a reservation integration connection between the restaurant 
     * information existing in our database (if any) and the given reservation provider
     * details. If the restaurant doesn't exist then it's aggregated dynamically and connected
     * to the desired integration provider.
     * 
     * @async
     * @param integrationConnectionInput 
     * 
     * @returns -> True if the connection was created / updated successfully, false otherwise
     */
    async connectReservationIntegration(
        integrationConnectionInput: {
            provider: ReservationProviders,
            name: string,
            venueID: string,
            venueAlias: string,
            externalURL: string,
            locationDetails: string
        }): Promise<boolean> {
        // Step 1: Try to find the restaurant associated with these aggregated details in the Foncii database
        const matchingRestaurant = await this.restaurantService
            .findOrAggregateRestaurant({
                name: integrationConnectionInput.name,
                locationDetails: integrationConnectionInput.locationDetails
            });

        // Fall-through: No matching restaurant information found whatsoever, discard this operation
        if (!matchingRestaurant) {
            logger.warn(`[connectReservationIntegration] The restaurant with the given information could not be found in any of the known databases 
            and can't be aggregated and or connected to the desired reservation integration:`)
            console.table(integrationConnectionInput)

            return false;
        }

        // Step 2: Find existing reservation connections from an existing integration (if any exists)
        const existingReservationIntegration = await this.findReservationIntegrationWith({ fonciiRestaurantID: matchingRestaurant.id });

        let existingReservationConnections: ReservationConnection[] = existingReservationIntegration?.reservationConnections ?? []

        // Deduplicate any existing connections that have the same provider as the provider currently being connected
        existingReservationConnections = existingReservationConnections.filter(
            (connection) => connection.provider != integrationConnectionInput.provider
        );

        const reservationConnections = [...existingReservationConnections, {
            provider: integrationConnectionInput.provider,
            venueID: integrationConnectionInput.venueID,
            venueAlias: integrationConnectionInput.venueAlias,
            externalURL: integrationConnectionInput.externalURL
        }] as ReservationConnection[]

        // Step 3: Connect the reservation integration with the matching Foncii restaurant information
        if (existingReservationIntegration) {
            logger.info(`Updating reservation integration connection for integration with id: ${existingReservationIntegration.id}`)

            /**
             * Restaurant integration already exists, update the existing integration with the new / updated connection
             * Once a single connection is made, the integration can be updated with multiple connections later through this branch
             */
            return await this.updateReservationIntegration(existingReservationIntegration.id, { reservationConnections });
        }
        else {
            // Reservation integration not supported yet, create new integration based on the given information
            return await this.createRestaurantReservationIntegration({
                fonciiRestaurantID: matchingRestaurant.id,
                reservationConnections
            }) != null;
        }
    }

    async updateReservationIntegration(
        id: string,
        properties: ReservationIntegrationPropertyOptions
    ) {
        const documentID = id,
            updatedProperties = {
                ...properties,
                lastUpdated: currentDateAsISOString(), // Will overwrite any property named 'lastUpdated' below as intended if included
            }

        return await this.database
            .updateFieldsInDocumentWithID(
                FonciiDBCollections.ReservationIntegrations,
                documentID,
                updatedProperties);
    }

    // Queries
    async findReservationIntegrationWith(
        properties: ReservationIntegrationPropertyOptions
    ) {
        return await this.database
            .findDocumentWithProperties<RestaurantReservationIntegration>(
                FonciiDBCollections.ReservationIntegrations,
                properties);
    }

    async findReservationIntegrationsWith({
        properties = {},
        resultsPerPage = 100,
        paginationPageIndex = 0,
        sortOptions = {}
    }: {
        properties?: ReservationIntegrationPropertyOptions,
        resultsPerPage?: number,
        paginationPageIndex?: number,
        sortOptions?: ReservationIntegrationSortOptions
    }) {
        return await this.database
            .findDocumentsWithProperties<RestaurantReservationIntegration>({
                collectionName: FonciiDBCollections.ReservationIntegrations,
                properties,
                resultsPerPage,
                paginationPageIndex,
                sortOptions
            });
    }

    async doesReservationIntegrationExistWith(
        properties: ReservationIntegrationPropertyOptions
    ) {
        return await this.database
            .doesDocumentExistWithProperties<RestaurantReservationIntegration>(
                FonciiDBCollections.ReservationIntegrations,
                properties
            );
    }

    async countTotalReservationIntegrationsWithProperties(
        properties: ReservationIntegrationPropertyOptions
    ) {
        return await this.database.countTotalDocumentsWithProperties(
            FonciiDBCollections.ReservationIntegrations,
            properties
        );
    }

    // Unique Methods
    // Queries | None for now

    // Mutations
    private async createRestaurantReservationIntegration(
        props: Partial<ReservationIntegrationModel> & {
            fonciiRestaurantID: string,
            reservationConnections: ReservationConnection[]
        }): Promise<ReservationIntegrationModel | null> {
        const newRestaurantReservationIntegration = new ReservationIntegrationModel({
            ...props
        }), documentID = newRestaurantReservationIntegration.id;

        // Precondition failure
        if (newRestaurantReservationIntegration == undefined) return null;

        // Operation success flag
        let didSucceed = false;

        // Validate that the reservation integration is not already supported before creating a record for it in the DB.
        if (await this.doesRestaurantSupportReservations(props.fonciiRestaurantID)) {
            logger.warn(`The Foncii restaurant with the id: ${props.fonciiRestaurantID} already has a reservation integration; another one cannot be created again at this time.`);
            return null;
        }

        didSucceed = await this.database.createNewDocumentWithID(
            FonciiDBCollections.ReservationIntegrations,
            documentID,
            newRestaurantReservationIntegration.toObject()
        );

        return didSucceed ? newRestaurantReservationIntegration : null;
    }
}