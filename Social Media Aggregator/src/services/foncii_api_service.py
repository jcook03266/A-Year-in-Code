# Dependencies
# Networking
import requests

# Types
from typing import Optional, Dict

# Environment Variables
import os

# Debug environment flag
is_debug = str(os.getenv('DEBUG')) == 'True'

# API
foncii_api_key = str(os.getenv('FONCII_API_KEY'))
prod_api_endpoint = str(os.getenv('FONCII_PROD_SERVER_ENDPOINT'))
dev_api_endpoint = str(os.getenv('FONCII_DEV_SERVER_ENDPOINT'))

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

    def perform_query(self, query: Dict[str, any], variables: Dict[str, any]) -> Optional[Dict[str, any]]:
        # GraphQL query with variables
        query_operation = {
            'query': query,
            'variables': variables
        }

        # Make a GET request to the GraphQL API endpoint
        response = requests.post(self.api_endpoint, 
                                 json=query_operation,
                                 headers=self.HEADERS)

        # Check if the request was successful
        if response.status_code == 200:
            return response.json()
        else:
            # Log error and move on
            print(f"[FonciiAPIService][perform_query] Error occurred: {response.status_code} | {response.text}")
            return None
        
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

    # Queries 
    # Note: Pass False for useGoogleFallback if you don't want to use the Google Places API as a fallback
    def find_google_place_id_for_place_search_query(self, search_query: str, useGoogleFallback: bool = True) -> Optional[str]:
        print("[find_place_id]")
        print(search_query)

        query = """
            query FindGooglePlaceIDForPlaceSearchQuery($searchQuery: String!, $useGoogleFallback: Boolean) {
                findGooglePlaceIDForPlaceSearchQuery(searchQuery: $searchQuery, useGoogleFallback: $useGoogleFallback) {
                    googlePlaceID
                    similarityScore
                    description
                } 
            }
        """

        variables = {
            "searchQuery": search_query,
            "useGoogleFallback": useGoogleFallback
        }

        response = self.api_service.perform_query(query, variables)
        output = None

        if (response):
            data = response['data']

            # Some result was found, the returned data is not undefined, parse the result
            if (data):
                result = data['findGooglePlaceIDForPlaceSearchQuery']

                # Parsing the output and mapping it to expected keys to access elsewhere
                if (result):
                    output = {
                        'google_place_id': result['googlePlaceID'],
                        'description': result['description'],
                        'similarity_score': result['similarityScore']
                    }

        return output

    # Mutations
    def ingest_instagram_user(self, instagram_user_info: Dict[str, any]):
        # Debug logging
        print("[ingest_instagram_user]")
        print(instagram_user_info)

        mutation = """
            mutation IngestDiscoveredInstagramUser($input: DiscoveredInstagramUserInput!) {
            ingestDiscoveredInstagramUser(input: $input) {
                    id
                    firstName
                    email
                    creationDate
                    authProviders
                    lastName
                    mapName
                    phoneNumber
                    profilePictureURL
                    referralCode
                    username
                }
            }
        """

        variables = {
            "input": instagram_user_info
        }

        return self.api_service.perform_mutation(mutation, variables)
    
    def ingest_instagram_posts(self, username: str, posts: list[Dict[str, any]]):
        # Debug logging
        print("[ingest_instagram_posts]", 'Username: ', username, ' Posts: ', len(posts))

        mutation = """
            mutation IngestDiscoveredInstagramPosts($input: DiscoveredInstagramPostsInput) {
                ingestDiscoveredInstagramPosts(input: $input) {
                    id
                    mediaIsVideo
                    isFavorited
                    dataSource {
                    caption
                    creationDate
                    liveSourceUID
                    media {
                        mediaURL
                        videoMediaThumbnailURL
                        mediaType
                    }
                    permalink
                    provider
                    sourceUID
                    secondaryMedia {
                        mediaType
                        mediaURL
                        videoMediaThumbnailURL
                    }
                    }
                    creationDate
                    userID
                    lastUpdated
                    customUserProperties {
                    categories
                    notes
                    rating
                    }
                }
            }
        """

        # Define batch size / Using batching to prevent 413 Payload too large errors
        batch_size = 40
        batches_uploaded = 0

        # Loop through the list in batches
        for i in range(0, len(posts), batch_size):
            batches_uploaded += 1
            print(f"Uploading batch: {batches_uploaded}")

            # Get a slice of the list for the current batch by offsetting the list by the current batch size
            # and slicing the list up to the current batch
            current_batch = posts[i:i + batch_size]

            variables = {
            "input": {
                'username': username,
                'posts': current_batch
                }
            }

            # Perform mutation for the current batch
            success = self.api_service.perform_mutation(mutation, variables) != None

            if not success:
                return False  # Break the loop or handle the failure as needed

        return True  # Return True if all batches were successfully uploaded
    
    def ingest_classified_instagram_posts(self, username: str, posts: list[Dict[str, any]]):
        # Debug logging
        print("[ingest_classified_instagram_posts]", 'Username: ', username, ' Posts: ', len(posts))

        mutation = """
            mutation IngestClassifiedDiscoveredInstagramPosts($input: ClassifiedDiscoveredInstagramPostsInput) {
                ingestClassifiedDiscoveredInstagramPosts(input: $input) {
                    id
                    mediaIsVideo
                    isFavorited
                    dataSource {
                    caption
                    creationDate
                    liveSourceUID
                    media {
                        mediaURL
                        videoMediaThumbnailURL
                        mediaType
                    }
                    permalink
                    provider
                    sourceUID
                    secondaryMedia {
                        mediaType
                        mediaURL
                        videoMediaThumbnailURL
                    }
                    }
                    creationDate
                    userID
                    lastUpdated
                    customUserProperties {
                    categories
                    notes
                    rating
                    }
                }
            }
        """

        # Define batch size / Using batching to prevent 413 Payload too large errors
        batch_size = 40
        batches_uploaded = 0

        # Loop through the list in batches
        for i in range(0, len(posts), batch_size):
            batches_uploaded += 1
            print(f"Uploading batch: {batches_uploaded}")

            # Get a slice of the list for the current batch by offsetting the list by the current batch size
            # and slicing the list up to the current batch
            current_batch = posts[i:i + batch_size]

            variables = {
            "input": {
                'username': username,
                'posts': current_batch
                }
            }

            # Perform mutation for the current batch
            success = self.api_service.perform_mutation(mutation, variables) != None

            if not success:
                return False  # Break the loop or handle the failure as needed

        return True  # Return True if all batches were successfully uploaded