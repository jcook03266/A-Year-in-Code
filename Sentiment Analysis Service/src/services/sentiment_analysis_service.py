# Dependencies
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

# Provides a simple method of analyzing the sentiment of a piece of text and
# outputting a single value indicative of the overall attitude of any string up to 512 characters
class SentimentAnalysisService:
    # Properties
    # Constants
    PRETRAINED_MODEL_NAME = 'nlptown/bert-base-multilingual-uncased-sentiment'
    # Max amount of chars is 512, but you can loop over multiple iterations of a string and
    # get the average sentiment score
    NLP_PIPELINE_MAX_TOKENS = 512

    # Instantiate Tokenizer + Model
    tokenizer = AutoTokenizer.from_pretrained(PRETRAINED_MODEL_NAME)
    model = AutoModelForSequenceClassification.from_pretrained(
        PRETRAINED_MODEL_NAME)

    def __init__(self):
        pass

    """
    Generates a score from 1 <-> 5 (inclusive), bad <-> good, that indicates the overall
    sentiment / attiude of the author of the text string towards whatever applicable context the 
    string was derived from, based on the diction of the writing.

    Parameters:
      statement - A string of words, maybe a review from Yelp or Google, you decide!
    """
    def generate_sentiment_score(self, text_string: str) -> int:
        truncated_text_string = text_string[:self.NLP_PIPELINE_MAX_TOKENS]

        # Encode statement string, and return Pytorch configured tensors
        tokens = self.tokenizer.encode(
            truncated_text_string, return_tensors='pt')

        # Produces a one-hot encoded list ~ array[4] of scores, with the indices corresponding to the
        # individual sentiment rating classifications [0,1,2,4] ~ [very bad, bad, neutral, good]
        # or some variation of this and the float inside being the probability of that index being
        # the classification of the sentiment for this statement
        classified_results = self.model(tokens)

        # Extract sentiment score
        # Get the maximum value from the list, this value represents the target
        # sentiment classifcation for the given input
        max_arg = torch.argmax(classified_results.logits)

        # Convert sentiment score from 0 to 1 indexed -> [0-4] -> [1-5]
        # Conforms to the usual rating system used by platforms ~ Yelp, Google
        sentiment_score = int(max_arg) + 1

        return sentiment_score
