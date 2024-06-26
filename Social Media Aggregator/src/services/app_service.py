# Dependencies
# API
from flask import Flask, request
from flask_restful import abort

# Types
from enum import Enum

# Utils
import functools
import json

# Services
import src.services.pipeline_driver as pipeline_driver

# Environment
import os

# Load env variables
is_debug = str(os.getenv('DEBUG')) == 'True'
port = int(os.getenv('PORT', 8000))
host = str(os.getenv('HOST'))

# A truth table for the usual error codes thrown by this API
class HTTPStatusCodes(Enum):
    # Request went through with no issues
    ok = 200
    # Server can't fulfill the request for arbitrary some reason
    bad_request = 400
    # Client's access to this service is unauthorized
    forbidden = 403
    # Target resource not found
    not_found = 404
    # The data transported to the server is too large for us to handle
    payload_too_large = 413
    # Some internal process failed and the request could not be completed
    internal_server_error = 500

# Keys for the values returned by the supported endpoints
class SupportedKeys(Enum):
    data = "data"

# This API's supported endpoints
class Endpoints(Enum):
    # Instagram Post Ingestion (Classification + Non-classification) | Import Pipeline
    # Request: POST
    # For ingesting place / restaurant classified (auto-gen) posts into an existing Foncii user's map
    classify_and_ingest_posts_ig = "/classify_and_ingest_posts_ig"
    # Request: POST
    # For ingesting posts into an existing Foncii user's map
    ingest_posts_ig = "/ingest_posts_ig"
    
    # Instagram New User Ingestion + Post Ingestion (Classification + Non-classification) | Ad-hoc Foncii user + Foncii map generation
    # Request: POST
    # For creating a new completely auto-generated map around some Instagram user account not yet present on Foncii
    ingest_new_user_classify_ingest_posts_ig = "/ingest_new_user_classify_ingest_posts_ig"
    # Request: POST
    # For creating a new non-auto-generated map around some Instagram user account not yet present on Foncii
    ingest_new_user_ingest_posts_ig = "/ingest_new_user_ingest_posts_ig"

    # Instagram New User Ingestion | Ad-hoc Foncii user
    # Request: POST
    # For creating a new Foncii user from some Instagram user account not yet present on Foncii
    ingest_new_user_ig = "/ingest_new_user_ig"

class SharedRequestBodyKeys(Enum):
    instagram_username = "instagramUsername"
    foncii_username = "fonciiUsername"
    post_amount = "postAmount"

# Authorization wrapper to prevent external unauthorized access to this service
def api_required(func):
    @functools.wraps(func)
    def decorator(*args, **kwargs):
        # Note: When testing w/ RapidAPI pass the key as 'API-KEY'
        API_KEY_FIELD_KEY = "API_KEY"

        # Parse the API key from the request
        if request.headers:
            parsed_api_key = request.headers.get(API_KEY_FIELD_KEY)
        else:
            return {"message": "Please provide an API key"}, HTTPStatusCodes.bad_request.value

        # Check if API key is correct and valid
        if AppService.is_api_key_valid(parsed_api_key):
            return func(*args, **kwargs)
        else:
            return {"message": "The provided API key is not valid"}, HTTPStatusCodes.forbidden.value

    return decorator

class AppService:
    # Properties
    app = Flask(__name__)
    BASE_URL = f"http://{host}:{port}/"

    # Environment Variables
    stored_api_key = str(os.getenv('API_KEY'))

    def __init__(self):
        pass

    def start(self):
        self.app.run(host=host,
                     port=port,
                     debug=is_debug)

    # -- Request Method Resolver Routing --
    @app.route(Endpoints.classify_and_ingest_posts_ig.value, methods=['POST'])
    @api_required
    def classify_and_ingest_posts_ig():
        # Parse raw request JSON body data, decode, unwrap optional
        raw_data = request.get_data()
        encoding = "utf-8"
        decoded_data = raw_data.decode(encoding)

        # Parsing
        instagram_username = ""
        foncii_username = ""
        post_amount = 0

        # Parse the JSON string and retrieve the value of the "text" key
        try:
            data = json.loads(decoded_data)

            instagram_username = data.get(SharedRequestBodyKeys.instagram_username.value, "")
            foncii_username = data.get(SharedRequestBodyKeys.foncii_username.value, "")
            post_amount = int(data.get(SharedRequestBodyKeys.post_amount.value, 0))
            
        except json.JSONDecodeError:
            abort(HTTPStatusCodes.bad_request.value)

        # Exception Handling | Reject falsy values
        if not instagram_username or not foncii_username or not post_amount:
            abort(HTTPStatusCodes.bad_request.value)
            
        ingested_classified_posts = pipeline_driver.user_post_ingest_classify_pipeline(
            instagram_username=instagram_username,
            foncii_username=foncii_username, 
            post_amount=post_amount
            )
        
        # Returns 
        return {SupportedKeys.data.value: ingested_classified_posts}, HTTPStatusCodes.bad_request.value if ingested_classified_posts == None else HTTPStatusCodes.ok.value

    @app.route(Endpoints.ingest_posts_ig.value, methods=['POST'])
    @api_required
    def ingest_posts_ig():
        # Parse raw request JSON body data, decode, unwrap optional
        raw_data = request.get_data()
        encoding = "utf-8"
        decoded_data = raw_data.decode(encoding)

        # Parsing
        instagram_username = ""
        foncii_username = ""
        post_amount = 0

        # Parse the JSON string and retrieve the value of the "text" key
        try:
            data = json.loads(decoded_data)

            instagram_username = data.get(SharedRequestBodyKeys.instagram_username.value, "")
            foncii_username = data.get(SharedRequestBodyKeys.foncii_username.value, "")
            post_amount = int(data.get(SharedRequestBodyKeys.post_amount.value, 0))
            
        except json.JSONDecodeError:
            abort(HTTPStatusCodes.bad_request.value)

        # Exception Handling | Reject falsy values
        if not instagram_username or not foncii_username or not post_amount:
            abort(HTTPStatusCodes.bad_request.value)

        ingested_posts = pipeline_driver.user_post_ingestion_pipeline(
            instagram_username=instagram_username,
            foncii_username=foncii_username, 
            post_amount=post_amount
            )
        
        # Returns 
        return {SupportedKeys.data.value: ingested_posts}, HTTPStatusCodes.bad_request.value if ingested_posts == None else HTTPStatusCodes.ok.value
    
    @app.route(Endpoints.ingest_new_user_classify_ingest_posts_ig.value, methods=['POST'])
    @api_required
    def ingest_new_user_classify_ingest_posts_ig():
        # Parse raw request JSON body data, decode, unwrap optional
        raw_data = request.get_data()
        encoding = "utf-8"
        decoded_data = raw_data.decode(encoding)

        # Parsing
        instagram_username = ""
        post_amount = 0

        # Parse the JSON string and retrieve the value of the "text" key
        try:
            data = json.loads(decoded_data)

            instagram_username = data.get(SharedRequestBodyKeys.instagram_username.value, "")
            post_amount = int(data.get(SharedRequestBodyKeys.post_amount.value, 0))
            
        except json.JSONDecodeError:
            abort(HTTPStatusCodes.bad_request.value)

        # Exception Handling | Reject falsy values
        if not instagram_username or not post_amount:
            abort(HTTPStatusCodes.bad_request.value)

        ingested_classified_posts = pipeline_driver.auto_gen_novel_user_classification_pipeline(
            instagram_username=instagram_username,
            post_amount=post_amount
            )
        
        return {SupportedKeys.data.value: ingested_classified_posts}, HTTPStatusCodes.bad_request.value if ingested_classified_posts == None else HTTPStatusCodes.ok.value
    
    @app.route(Endpoints.ingest_new_user_ingest_posts_ig.value, methods=['POST'])
    @api_required
    def ingest_new_user_ingest_posts_ig():
        # Parse raw request JSON body data, decode, unwrap optional
        raw_data = request.get_data()
        encoding = "utf-8"
        decoded_data = raw_data.decode(encoding)

        # Parsing
        instagram_username = ""
        post_amount = 0

        # Parse the JSON string and retrieve the value of the "text" key
        try:
            data = json.loads(decoded_data)

            instagram_username = data.get(SharedRequestBodyKeys.instagram_username.value, "")
            post_amount = int(data.get(SharedRequestBodyKeys.post_amount.value, 0))
            
        except json.JSONDecodeError:
            abort(HTTPStatusCodes.bad_request.value)

        # Exception Handling | Reject falsy values
        if not instagram_username or not post_amount:
            abort(HTTPStatusCodes.bad_request.value)

        ingested_posts = pipeline_driver.auto_gen_novel_user_pipeline(
            instagram_username=instagram_username,
            post_amount=post_amount
            )
        
        # Returns 
        return {SupportedKeys.data.value: ingested_posts}, HTTPStatusCodes.bad_request.value if ingested_posts == None else HTTPStatusCodes.ok.value
    
    @app.route(Endpoints.ingest_new_user_ig.value, methods=['POST'])
    @api_required
    def ingest_new_user_ig():
        # Parse raw request JSON body data, decode, unwrap optional
        raw_data = request.get_data()
        encoding = "utf-8"
        decoded_data = raw_data.decode(encoding)

        # Parsing
        instagram_username = ""

        # Parse the JSON string and retrieve the value of the "text" key
        try:
            data = json.loads(decoded_data)
            instagram_username = data.get(SharedRequestBodyKeys.instagram_username.value, "")
        except json.JSONDecodeError:
            abort(HTTPStatusCodes.bad_request.value)

        # Exception Handling | Reject falsy values
        if not instagram_username:
            abort(HTTPStatusCodes.bad_request.value)

        ingested_user = pipeline_driver.ingest_user(instagram_username=instagram_username)

        # Returns 
        return {SupportedKeys.data.value: ingested_user}, HTTPStatusCodes.bad_request.value if ingested_user == None else HTTPStatusCodes.ok.value

    # Validates the given API key against the environment key
    @staticmethod
    def is_api_key_valid(api_key) -> bool:
        return AppService.stored_api_key == api_key