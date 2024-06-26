# Dependencies
import sys
import os
from src.services.app_service import Endpoints, AppService, SupportedKeys, HTTPStatusCodes
import pytest
import json

# Construct Python path env variable
# Get the directory of the current script (tests/test_app.py)
current_dir = os.path.dirname(os.path.abspath(__file__))

# Add the parent directory of the current directory to the Python path
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)

# Required Instances
app_service = AppService()

# API Authorization Creds
api_key = AppService.stored_api_key
headers = {AppService.API_KEY_FIELD_KEY: AppService.stored_api_key}

## Simple test plan that tests the review and article endpoints to ensure they operate within the expected range of values
@pytest.fixture()
def app():
    # Get app, set testing flag to true to enable stack tracing
    app = app_service.app
    os.environ["TESTING"] = "True"

    yield app

@pytest.fixture()
def client(app):
    return app.test_client()

@pytest.fixture()
def run(app):
    return app.test_cli_runner()

def test_review_sentiment_score_calculation(client):
    # Resources
    sample_review_data = {"text": "This is a sample article for testing purposes."}
    
    # Make a POST request to the review endpoint with the sample data
    response = client.post(
        Endpoints.get_sentiment_score_for_review.value,
        json=sample_review_data,
        headers=headers
        )

    response_json = json.loads(response.data.decode('utf-8'))

    # Verify that the response code is 200 OK
    assert(response.status_code == HTTPStatusCodes.ok.value)

    # Verify that the sentiment score is within the expected range
    sentiment_score = response_json[SupportedKeys.get_sentiment_score_for_review_key.value]
    assert(1 <= sentiment_score <= 5)

def test_article_sentiment_score_calculation(client):
    # Resources
    sample_article_data = {
        "text": "This is a sample article for testing purposes."}

    # Make a POST request to the article endpoint with the sample data
    response = client.post(
        Endpoints.get_sentiment_score_for_article.value,
        json=sample_article_data,
        headers=headers
        )

    response_json = json.loads(response.data.decode('utf-8'))

    # Verify that the response code is 200 OK
    assert(response.status_code == HTTPStatusCodes.ok.value)

    # Verify that the average sentiment score is within the expected range
    average_score = response_json[SupportedKeys.get_sentiment_score_for_article_key.value]
    assert(1 <= average_score <= 5)

