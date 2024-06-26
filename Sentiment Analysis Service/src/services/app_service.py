# Dependencies
# API
from flask import Flask, request
from flask_restful import abort

# Types
from enum import Enum

# Utils
import json
import functools
import math

# Services
from .sentiment_analysis_service import SentimentAnalysisService

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

# This API's supported endpoints
class Endpoints(Enum):
    # Request: POST
    get_sentiment_score_for_review = "/get-sentiment-score-for-review"
    # Request: POST
    get_sentiment_score_for_article = "/get-sentiment-score-for-article"

# Keys for the values returned by the supported endpoints
class SupportedKeys(Enum):
    get_sentiment_score_for_review_key = "Sentiment Score"
    get_sentiment_score_for_article_key = "Average Sentiment Score"

# Authorization wrapper to prevent external unauthorized access to this service
def api_required(func):
    @functools.wraps(func)
    def decorator(*args, **kwargs):
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

# A simple REST API meant for internal communication between this micro-service and
# the main GraphQL service that powers the backend
class AppService:
    # Properties
    app = Flask(__name__)
    service = SentimentAnalysisService()
    BASE_URL = f"http://{host}:{port}/"

    # Environment Variables
    stored_api_key = str(os.getenv('API_KEY'))

    # Constants
    API_KEY_FIELD_KEY = "API_KEY"

    def __init__(self):
        pass

    def start(self):
        self.app.run(host=host,
                     port=port,
                     debug=is_debug)

    # -- Request Method Resolver Routing --

    # Endpoint performs sentiment analysis on the given text string and returns the
    # sentiment score for that string of words in the following JSON response:
    # {"Sentiment Score": {Int}}
    # Reviews shouldn't be that long winded so we don't expect them to be longer than 512 chars which is the max
    # amount of tokens supported by the NLP model, so if the review exceeds this amount then the model only uses
    # the first 512 characters to analyze the review, no 413 error is thrown as this is a lossy function and any extra data is thrown out
    @app.route(Endpoints.get_sentiment_score_for_review.value, methods=['POST'])
    @api_required
    def get_sentiment_score_for_review():
        TEXT_FIELD_KEY = "text"

        # Parse raw request JSON body data, decode, unwrap optional, and run sentiment analysis
        raw_data = request.get_data()
        encoding = "utf-8"
        text = raw_data.decode(encoding)
        unwrapped_text = ""

        # Parse the JSON string and retrieve the value of the "text" key
        try:
            data = json.loads(text)
            unwrapped_text = data.get(TEXT_FIELD_KEY, "")
        except json.JSONDecodeError:
            abort(HTTPStatusCodes.bad_request.value)

        # Exception Handling
        if not unwrapped_text:
            abort(HTTPStatusCodes.bad_request.value)

        sentiment_score = AppService.service.generate_sentiment_score(
            unwrapped_text)
        
        # If the sentiment score is NaN then set it to 0
        if math.isnan(sentiment_score):
            sentiment_score = 0;

        return {SupportedKeys.get_sentiment_score_for_review_key.value: sentiment_score}, HTTPStatusCodes.ok.value

    # Endpoint parses a lengthy article and gives back the average sentiment score
    # for the entire article as a single line JSON, with the average being
    # an integer for better simplicity and parity with the other endpoints that also return ints
    # {"Average Sentiment Score": {Int}}
    # Articles are long so we anticipate a lengthy payload, up to 20x the max character count, anything over this
    # will encounter and error 413 code due to the payload being too large to process by our server, make sure the PL is < this limit
    # This limitation is also the reason why this is a post request instead of get as the body is used to transport large data
    @app.route(Endpoints.get_sentiment_score_for_article.value, methods=['POST'])
    @api_required
    def get_sentiment_score_for_article():
        MAX_TOKEN_COUNT = 512
        TEXT_FIELD_KEY = "text"

        # Parse raw request JSON body data, decode, unwrap optional, and run sentiment analysis
        raw_data = request.get_data()
        encoding = "utf-8"
        text = raw_data.decode(encoding)
        unwrapped_text = ""

        # Parse the JSON string and retrieve the value of the "text" key
        try:
            data = json.loads(text)
            unwrapped_text = data.get(TEXT_FIELD_KEY, "")
        except json.JSONDecodeError:
            abort(HTTPStatusCodes.bad_request.value)

        # Exception Handling
        if not unwrapped_text:
            abort(HTTPStatusCodes.bad_request.value)

        # Partition the article and accumulate the total sentiment score
        text_length = len(unwrapped_text)
        total_partitions = int(
            text_length / MAX_TOKEN_COUNT) if int(text_length / MAX_TOKEN_COUNT) > 0 else 1
        total_sentiment_score = 0
        average_sentiment_score = 0

        if total_partitions > 20:
            abort(HTTPStatusCodes.payload_too_large.value)

        for i in range(total_partitions):
            curr_offset = i * MAX_TOKEN_COUNT

            # the text is offset by current index * 512, and limited to 512 characters at a time
            sentiment_score = AppService.service.generate_sentiment_score(
                unwrapped_text[curr_offset: MAX_TOKEN_COUNT])

            total_sentiment_score += sentiment_score

        # Cast to int to conform to the expected discrete value range [1...5]
        average_sentiment_score = int(total_sentiment_score / total_partitions)

        # If the average sentiment score is NaN then set it to 0
        if math.isnan(average_sentiment_score):
            average_sentiment_score = 0;

        return {SupportedKeys.get_sentiment_score_for_article_key.value: average_sentiment_score}, HTTPStatusCodes.ok.value

    # Validates the given API key against the environment key
    @staticmethod
    def is_api_key_valid(api_key) -> bool:
        return AppService.stored_api_key == api_key
