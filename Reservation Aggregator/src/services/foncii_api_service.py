# Dependencies
# Networking
import requests

# Control Flow
import time

# Types
from typing import Optional, Dict

# Environment Variables
from dotenv import dotenv_values

# Load env variables
# Debug environment flag
config = dotenv_values(".env")
is_debug = str(config['DEBUG']) == 'True'

# API
foncii_api_key = str(config['FONCII_API_KEY'])
prod_api_endpoint = str(config['FONCII_PROD_SERVER_ENDPOINT'])
dev_api_endpoint = str(config['FONCII_DEV_SERVER_ENDPOINT'])

"""
Simple interactor service class for communicating with the Foncii API
"""
class FonciiAPIService:
    # Properties 
    # Middleware
    HEADERS = {
            'Authorization': foncii_api_key,
            'Content-Type': 'application/json'
        }
    
    def __init__(self):
        self.api_endpoint = dev_api_endpoint if is_debug else prod_api_endpoint

    def perform_mutation(self, mutation: Dict[str, any], variables: Dict[str, any]) -> Optional[Dict[str, any]]:
        # GraphQL mutation query with variables
        mutation_operation = {
            'query': mutation,
            'variables': variables
        }

        # Make a POST request to the GraphQL API endpoint
        response = requests.post(self.api_endpoint, 
                                 json=mutation_operation,
                                 headers=self.HEADERS)

        # Check if the request was successful
        if response.status_code == 200:
            return response.json()
        else:
            # Log error and move on
            print(f"[FonciiAPIService][perform_mutation] Error occurred: {response.status_code} | {response.text}")
            return None

"""
Service adapter class for the Foncii API service that allows for unique mutations
and queries to be triggered from outside of the context for which the operation
pertains to. This helps to limit the verbosity of other files and classes and isolate
different complex functionalities between instances.
"""
class FonciiAPIServiceAdapter: 
    def __init__(self):
        self.api_service = FonciiAPIService()

    # Mutations
    """
    Uploads the given restaurant reservation details to the Foncii API in batches of `100` from the original 
    list of restaurant reservation details. Returns `True` if all batches were successfully uploaded, false otherwise.
    Batching helps to break up very large dataset uploads into managable chunks, which prevents the API from timing out
    while also allowing the API to spin up other instances to handle requests in parallel if needed.
    """
    def upload_resy_restaurant_reservation_details(self, restaurant_reservation_details: list[Dict[str, any]]) -> bool:
        mutation = """
            mutation IngestRestaurantReservationDetails($input: IngestRestaurantReservationDetailsInput) {
            ingestRestaurantReservationDetails(input: $input)
            }
        """

         # Define batch size
        batch_size = 100
        batches_uploaded = 0

        # Loop through the list in batches
        for i in range(0, len(restaurant_reservation_details), batch_size):
            batches_uploaded += 1
            print(f"Uploading batch: {batches_uploaded}")

            # Get a slice of the list for the current batch by offsetting the list by the current batch size
            # and slicing the list up to the current batch
            current_batch = restaurant_reservation_details[i:i + batch_size]

            variables = {
                "input": {
                    "provider": "RESY",
                    "restaurantReservationDetails": current_batch
                }
            }

            # Perform mutation for the current batch
            success = self.api_service.perform_mutation(mutation, variables) != None

            if not success:
                return False  # Break the loop or handle the failure as needed

            # Wait 1 minute before uploading the next batch
            time.sleep(60) 

        return True  # Return True if all batches were successfully uploaded