# Dependencies
# Instagram scraper
from hikerapi import Client

# Utils
import time

# Environment Variables
import os
HIKER_API_KEY = str(os.getenv('HIKER_API_KEY'))

class InstaScraper:
    # Properties
    client = None

    def __init__(self):
        self.client = self.create_client()

    # Instagram Session / Settings 
    def create_client(self):
        client = Client(token=HIKER_API_KEY)
        return client

    def get_user_id(self, username: str):
        user_id = self.client.user_by_username_v1(username)['pk']
        return user_id
    
    def get_user_info(self, username: str):
        user_info = self.client.user_by_username_v1(username)
        return user_info
    
    """
    Paginates through user media asynchronously by a specified amount
    and cursor.

    Note: end_cursor Is the media to start paginating from
    """
    def get_paginated_posts(self, user_id: str, end_cursor: str | None):
        start_time = time.time()  
        posts = self.client.user_medias_chunk_v1(user_id=user_id, end_cursor=end_cursor)
        
        # Performance Metrics Logging
        end_time = time.time() 
        elapsed_time = end_time - start_time
        print(f"[get_paginated_posts] Finished in {elapsed_time} seconds.")

        return posts