# Dependencies
import sys
import os
import requests
from src.services.app_service import Endpoints, AppService

# Construct Python path env variable
# Get the directory of the current script (tests/test_app.py)
current_dir = os.path.dirname(os.path.abspath(__file__))

# Add the parent directory of the current directory to the Python path
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)

# To run these test functions, use this terminal command: python src/tests/sandbox.py
# Simulataneous sentiment analysis of multiple reviews
def review_sentiment_score_endpoint():
    # Test Data
    data = [
    {"text": "hello world"},
    {"text": "this is great"},
    {"text": "this is HORRIBLE!"},
    {"text": "this place SUCKS :))"},
    {"text": "I didn't really like it that much, but good chicken!"},
    ]

    for i in range(len(data)):
        response = requests.post(AppService.BASE_URL +
                                Endpoints.get_sentiment_score_for_review.value, 
                                None,
                                data[i])
        
        print(f"Review Sentiment Score Endpoint Output {i + 1}:")
        print(response)

        print(f"Serialized Response Data {i + 1}:")
        print(response.json())


# Sentiment analysis of an article
def article_sentiment_score_endpoint():
    # Katz's Deli Publication
    # Insider News: https://www.insider.com/new-york-city-famous-pastrami-sandwich-katzs-delicatessen-review-2022-2#despite-being-very-hungry-when-i-walked-in-the-door-i-could-only-finish-half-of-the-sandwich-9
    # ~ 7000 Characters
    sample_article = {"text": """
        I ate NYC's most famous sandwich at Katz's Delicatessen, and I thought it was worth the hype
        After a quick subway ride from my apartment in Brooklyn, I arrived at Katz's Delicatessen in the Lower East Side of Manhattan.
        Despite living in New York City for almost three years now, I've never been to Katz's Delicatessen. The famous deli, which opened its doors in 1888, is known as the oldest deli in New York and arguably the most famous deli in the entire country. 
        The restaurant has been frequented by scores of celebrities and politicians over the years and was even featured in the classic 1989 romantic comedy "When Harry Met Sally..." — Katz's is where the iconic "I'll have what she's having" scene took place.
        Today, Katz's Delicatessen is a go-to spot for tourists visiting New York City, and I was about to try it for the first time.
        I arrived at lunchtime on a Friday and the deli was packed.
        The restaurant was swarming with people waiting in line to order and sitting at tables eating. As a first-timer, I was a bit overwhelmed. I was also admittedly a bit concerned about being in such a busy place while the COVID-19 pandemic is still ongoing.
        However, given that I'm fully vaccinated and have a booster shot, that cases in New York City are declining, and the fact that I recently had COVID, I figured I was as protected as I possibly could be. I decided to stick it out and sit inside the restaurant, though this was a personal choice and everyone should determine what they feel most comfortable doing. 
        I got in line and waited my turn to order.
        I decided to go with the deli's most famous sandwich: pastrami on rye bread. It cost $24.95, excluding tax and tip.
        Instead of paying after I ordered, I was given a ticket to take to the cashier at the end of my meal.
        At a separate counter, I ordered a Diet Pepsi. This was added to my ticket, bringing the price of my meal to $27.90, excluding tax and a tip. 
        I was given my sandwich and a side of free pickles on a tray.
        Given that the restaurant was so busy, I was admittedly a bit nervous about getting my meal to dine in — I was alone, so I didn't have anyone to save me a seat at a table.
        After walking with my food into the dining room, a kind couple informed me that they were about to leave and I could have their table. It turned out to be one over from the iconic "When Harry Met Sally..." table.
        In honor of the movie, which premiered 33 years ago, Katz's hangs a sign over the table Meg Ryan and Billy Crystal's characters ate at in the movie. It reads, "Where Harry Met Sally...Hope you have what she had! Enjoy!"
        As an avid fan of the movie, I was excited by this, and I imagine other fans would be just as into the idea of sitting at their table.
        However, I know from watching the movie that Harry and Sally didn't technically meet at Katz's. Instead, they met when Sally offered Harry a ride into New York after they both graduated from college in Chicago. I decided to give Katz's a pass and assume they meant it's where the pair met for lunch.
        The sandwich was simple but very large.
        The sandwich came with a slathering of deli mustard on each piece of bread. The pastrami was juicy, unbelievably tender, and fell apart with each bite.
        Katz's refers to its pastrami sandwiches as "legendary for a reason." Right away, I could see why patrons flock to the restaurant for its mile-high sandwiches.
        The sandwich came with a slathering of deli mustard on each piece of bread. The pastrami was juicy, unbelievably tender, and fell apart with each bite.
        The pastrami really stood out to me. The outer layer of the meat had a delicious crust, similar to brisket I've had in the past.
        The rye bread perfectly complemented the pastrami. It was soft without getting soggy from the mustard, and it held the ambitiously thick sandwich together well.
        Despite being very hungry when I walked in the door, I could only finish half of the sandwich.
        The sandwich was so large that I thought it definitely could have been split between two people. However, looking around the restaurant, I saw that a majority of customers ordered their own sandwich and chose not to split with anyone.
        I thought this was interesting especially given how expensive the sandwich was, in my opinion. I expected it to be pricier than a typical sandwich given Katz's famous reputation, but I never thought I would pay almost $25 for a sandwich — no matter how thick and delicious it was.
        The high price is likely due to the cost of making pastrami and is less related to the restaurant's fame, as I initially thought. To make pastrami, the meat is first brined in a manner similar to how corned beef is made, then seasoned, dried, and smoked. According to CNBC, a recent report by the Bureau of Labor Statistics stated that the price of beef and veal increased 20.1% between October 2020 and October 2021, which could also have led to the sandwich being more expensive than I anticipated.
        I received a very generous portion of pastrami on my sandwich. So, on later reflection, I determined the price was probably reasonable and close to the industry standard price. Another New York City deli, Sarge's Delicatessen and Diner, prices their hot pastrami sandwich at $21.95 — and the sandwiches look to be about the same size.
        Still, even with all of that information in mind, I wouldn't often treat myself to a sandwich that costs $20 or more. It may be a completely reasonable price for some people, but I would usually avoid spending so much on lunch.
        Insider has reached out to Katz's Delicatessen about the cost of the sandwich.
        I also tried the pickles, which were a mixture of full sour pickles and half sour pickles.
        I preferred the full sour pickles for their briny, tart taste while still having a distinct crunch. I thought the half sour pickles were too similar to regular cucumber spears, but that's just my personal taste.
        Overall, I was glad I finally got around to eating at Katz's Delicatessen.
        If you're visiting New York or simply want to eat at one of the most famous delis in the country, it's definitely worth taking a trip to Katz's Delicatessen and trying one of their iconic sandwiches. 
        However, for an average New Yorker, I'm not sure I would eat at Katz's outside of a special occasion.
        Don't get me wrong, the sandwich I tried was delicious, but I'm not sure I would pay $25 for a sandwich on any given day. In the end, I thought the sandwich was definitely worth the hype and the price point was justified. However, it was simply out of my personal budget for a quick bite to eat.
        """
    }

    article_sentiment_response = requests.post(AppService.BASE_URL + 
                                               Endpoints.get_sentiment_score_for_article.value,
                                               None,
                                               sample_article)
    
    print("Article Sentiment Score Endpoint Response:")
    print(article_sentiment_response)

    print("Serialized Response Data:")
    print(article_sentiment_response.json())

review_sentiment_score_endpoint()
#test_article_sentiment_score_endpoint()
