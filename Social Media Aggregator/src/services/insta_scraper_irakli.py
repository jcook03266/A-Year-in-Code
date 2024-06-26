# Dependencies
# Instagram scraper
from instagrapi import Client

import os

def get_user_id(cl, user):
    user_id = cl.user_id_from_username(user)
    return user_id

def get_posts(cl, user_id, n_posts):
    medias = cl.user_medias_v1(user_id, n_posts)
    return medias

class InstaScraper():
    # Properties
    client = None

    # Constants
    USERNAME, PASSWORD = 'epicga_', 'epicgames26'

    def __init__(self):
        # Create a new session.json file if it doesn't exist. Otherwise, load the existing session.json file.
        if not os.path.exists("session_irakli.json"):
            self.client = self.create_session(self.USERNAME, self.PASSWORD)
        else: 
            self.client = self.load_session(self.USERNAME, self.PASSWORD)

    # Instagram Session / Settings 
    def create_session(self, username, password):
            client = Client()
            client.delay_range = [1, 3]
            client.login(username, password)
            client.dump_settings("session_irakli.json")

            return client

    def load_session(self, username, password):
            client = Client()
            client.load_settings("session_irakli.json")
            client.login(username, password)

            return client

    def get_media(self, username: str, number_posts: int):
        user_id = get_user_id(self.client, username)
        media = get_posts(self.client, user_id, number_posts)
    
        return media
