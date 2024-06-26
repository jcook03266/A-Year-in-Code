# Dependencies
# File system
import os

# Utils
import datetime
from dateutil import parser

# Data Processing
import pandas as pd

# Types
from typing import Dict
from instagrapi.types import Media

# Progress Bar
from tqdm import tqdm

# Environment Variables
import os

# Load env variables
# Debug environment flag
is_debug = str(os.getenv('DEBUG')) == 'True'

# Services
from src.services.insta_scraper_hiker import InstaScraper
from src.services.foncii_api_service import FonciiAPIServiceAdapter
from src.services.get_place_id import create_dataframe, find_restaurant_for_yes, find_restaurant_for_maybe, find_restaurant_for_no, create_dict_from_lists

# Add the parent directory of the current directory to the Python path
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
os.environ["PYTHONPATH"] = parent_dir + ":" + os.environ.get("PYTHONPATH", "")

# Service defs
api_service = FonciiAPIServiceAdapter()
instascraper = InstaScraper()

"""
Creates a new user based on the Instagram account given (if a user under the same username doesn't already exist)
and runs the post classification ingestion pipeline to essentially build their entire map for them + restaurants, so 
no extra work is needed from the end user.
"""
def auto_gen_novel_user_classification_pipeline(instagram_username: str, post_amount: int):
    # Precondition check, return early if post amount is not a positive non-zero number
    if (post_amount <= 0):
        return []

    user = ingest_user(instagram_username=instagram_username)

    # Ensure the novel user was created, if the user isn't novel then the pipeline will fail as existing user accounts should be
    # updated using [user_post_ingest_classify_pipeline]  
    if (user):
        return user_post_ingest_classify_pipeline(instagram_username=instagram_username, foncii_username=instagram_username, post_amount=post_amount)
    else:
        print('[Error][auto_gen_novel_user_pipeline] Novel user not ingested, pipeline failed')

"""
Creates a new user based on the Instagram account given (if a user under the same username doesn't already exist)
and runs the post classification ingestion pipeline to essentially build their entire map for them - restaurants,
that has to be done separately. [auto_gen_novel_user_classification_pipeline] does this automatically though.
"""
def auto_gen_novel_user_pipeline(instagram_username: str, post_amount: int):
    # Precondition check, return early if post amount is not a positive non-zero number
    if (post_amount <= 0):
        return []
    
    user = ingest_user(instagram_username=instagram_username)

    # Ensure the novel user was created, if the user isn't novel then the pipeline will fail as existing user accounts should be
    # updated using [user_post_ingestion_pipeline]
    if (user):
        return user_post_ingestion_pipeline(instagram_username=instagram_username, foncii_username=instagram_username, post_amount=post_amount)
    else:
        print('[Error][auto_gen_novel_user_pipeline] Novel user not ingested, pipeline failed')

"""
Fetches, parses and assigns GPIDs to posts that have been classified with google places. After processing 
the posts, they're then uploaded to Foncii. This is basically for populating a user's entire map without them
touching it.
"""
def user_post_ingest_classify_pipeline(instagram_username: str, foncii_username: str, post_amount: int):
    # Precondition check, return early if post amount is not a positive non-zero number
    if (post_amount <= 0):
        return []
    
    # Fetch posts
    posts = __aggregate_user_posts(instagram_username=instagram_username, post_amount=post_amount)
    parsed_posts = __parse_user_posts(posts=posts, instagram_username=instagram_username)

    # Classify posts with google place IDs
    classified_posts_df, post_id_to_ig_mentions_mapping = __classify_posts_with_gpids_and_ig_mentions(posts)

    # Mapping post IDs to GPIDs
    mapped_post_ids_to_place_ids = {}
    mapped_post_ids_to_place_id_ig_mention_mappings = {}

    for k in range(len(classified_posts_df)):
        # Properties
        post_id = classified_posts_df.iloc[k]['postID']
        place_ids = classified_posts_df.iloc[k]['place_id']
        
        # Mapping
        mapped_post_ids_to_place_ids[post_id] = place_ids
        mapped_post_ids_to_place_id_ig_mention_mappings[post_id] = post_id_to_ig_mentions_mapping[post_id]

    # Updating parsed posts with their associated GPIDs
    for l in range(len(parsed_posts)):
        # Parsing
        post_id = parsed_posts[l]['dataSource']['liveSourceUID']

        # Find associated place ids (if any). Note each post can be associated with multiple 
        # places so the place_ids field is an array of potential matches. If no matches then the 
        # array is blank.
        place_ids = mapped_post_ids_to_place_ids.get(post_id)
        place_id_ig_mention_mappings = mapped_post_ids_to_place_id_ig_mention_mappings.get(post_id)

        # Updating parsed post object
        if (place_ids):
            parsed_posts[l]['googlePlaceIDs'] = place_ids
        else:
            parsed_posts[l]['googlePlaceIDs'] = []

        if (place_id_ig_mention_mappings):
            parsed_posts[l]['gpidToInstagramHandleMappings'] = place_id_ig_mention_mappings
        else:
            parsed_posts[l]['gpidToInstagramHandleMappings'] = []

    return api_service.ingest_classified_instagram_posts(foncii_username, parsed_posts)

"""
Maps the raw Instagram media to GPIDs (Google Place IDs) based on
the text content associated with them.
"""
def __classify_posts_with_gpids_and_ig_mentions(posts: list[Media]):
    # Remote file system properties
    bucket_name = str(os.getenv('GC_BUCKET_NAME'))
    file_path = str(os.getenv('GC_FILE_PATH'))

    # Create post dataframe
    df = create_dataframe(posts)
    df_yes = df[df.easy_map == 'Yes'].copy()
    df_maybe = df[df.easy_map == 'Maybe'].copy()
    df_no = df[df.easy_map == 'No'].copy()
    
    if not df_yes.empty:
        df_yes = find_restaurant_for_yes(df_yes)
    if not df_maybe.empty:
        df_maybe = find_restaurant_for_maybe(df_maybe, bucket_name, file_path)
    if not df_no.empty:
        df_no = find_restaurant_for_no(df_no, bucket_name, file_path)

    df = pd.concat([df_yes, df_maybe, df_no])

    # Only select the rows with a place_id
    df = df[df['place_id'].apply(lambda x: len(x) > 0)]

    # Mapping post IDs to ig mention + GPID mapping array
    post_id_to_ig_mentions_mapping = {}
    for k in range(len(df)):
        post_id = df.iloc[k]['postID']
        ig_mentions = df.iloc[k]['ig_mentions']
        gpids = df.iloc[k]['place_id']
        gpids_to_ig_mentions_mapping = create_dict_from_lists(gpids, ig_mentions)

        post_id_to_ig_mentions_mapping[post_id] = []
        for key, value in gpids_to_ig_mentions_mapping.items():
            # Parsing
            gpid = key
            ig_mention = value

            # Only append the mapping if the ig_mention is valid aka not None
            if (ig_mention):
                post_id_to_ig_mentions_mapping[post_id].append({
                    'googlePlaceID': gpid,
                    'instagramHandle': ig_mention
                })

    return df, post_id_to_ig_mentions_mapping

"""
Fetches and ingests Instagram user posts / media into the Foncii ecosystem. This pipeline is
used to populate an existing Foncii user's account with posts, but it doesn't classify them with
restaurants, that's done by [user_post_ingest_classify_pipeline]
"""
def user_post_ingestion_pipeline(instagram_username: str, foncii_username: str, post_amount: int):
    # Precondition check, return early if post amount is not a positive non-zero number
    if (post_amount <= 0):
        return []
    
    posts = __aggregate_user_posts(instagram_username=instagram_username, post_amount=post_amount)
    parsed_posts = __parse_user_posts(posts=posts, instagram_username=instagram_username)
    ingested_posts = __ingest_parsed_user_posts(foncii_username=foncii_username, parsed_posts=parsed_posts)

    return ingested_posts

"""
Pulls the user's Instagram account info and ingests it into the Foncii ecosystem to
create a new user under their alias if one doesn't already exist.
"""
def ingest_user(instagram_username: str) -> bool:
    # Scrape public user account info
    user_info = instascraper.get_user_info(instagram_username)
    parsed_user_info = {
        'username': user_info['username'],
        'fullName': user_info['full_name'],
        'phoneNumber': user_info['contact_phone_number'],
        'email': user_info['public_email'],
        'profilePictureURL': user_info['profile_pic_url_hd'],
    }

    # Create a new user from this account info on Foncii (if the user doesn't already exist)
    return api_service.ingest_instagram_user(parsed_user_info)

"""
Fetch and accumulate user posts into a single array to pipe into other pipelines 
and applicable methods
"""
def __aggregate_user_posts(instagram_username: str, post_amount: int, stop_at_post_with_live_source_uid: str | None = None):
    # Precondition check, return early if post amount is not a positive non-zero number
    if (post_amount <= 0):
        return []
    
    # Limits
    # The max post creation date / age should be less than or equal to 2 years
    # Anything older than this is not ingested.
    # Current datetime
    date_now = datetime.datetime.now()

    # Subtract two years
    two_years_ago = date_now - datetime.timedelta(days=365*2)

    # Convert to milliseconds
    two_years_ago_ms = int(two_years_ago.timestamp() * 1000)
    MAX_POST_AGE = two_years_ago_ms
    
    # Constants
    # Used for edge cases when determining if the loop should break early
    # when an old post is detected
    MIN_POST_AMOUNT = 30

    # Accumulator
    aggregated_posts = []

    # Pagination control
    # pk / uid of the post to stop at
    post_cursor = None

    # Obtain user's id if the username belongs to a valid user
    instagram_user_id = instascraper.get_user_id(instagram_username)

    # Aggregate up to desired amount of posts or until the maximum post creation date is reached
    while (len(aggregated_posts) < post_amount):
        posts, post_cursor = instascraper.get_paginated_posts(
            user_id=instagram_user_id, 
            end_cursor=post_cursor
            )
        
        # Accumulator
        postsToAccumulate = []

        # Post aggregation limiters
        # Post max age limiter
        # Rejects posts that are older than two years and breaks out of the loop early
        post_is_too_old = False

        # Cursor stop flag flow control
        # Stop paginating if the permalink code of the post to stop at appears in the results.
        end_cursor_found = False

        # Minimum post amount limiter for edge cases
        min_post_amount_reached = False

        for post in posts:
            # Parsing
            post_creation_date = post['taken_at']
            live_source_uid = post['code']

            # Transforming
            parsed_post_creation_date = parser.parse(post_creation_date)
            # Convert from seconds to ms
            post_creation_date_ms = int(parsed_post_creation_date.timestamp() * 1000)

            # Determine if the minimum post amount was reached (1 full request)
            min_post_amount_reached = len(aggregated_posts) >= MIN_POST_AMOUNT

             # Check to see if the stop_at_post_id is in the results (if required)
            if (stop_at_post_with_live_source_uid != None):
                end_cursor_found = live_source_uid == stop_at_post_with_live_source_uid

            # Post max age limiter
            post_is_too_old = post_creation_date_ms < MAX_POST_AGE

            # Only break out if an old post is found after the min post amount is reached
            # This captures edge cases where a user may have a super old post pinned at 
            # the top of their gallery that might cause the scraper to return early due to a false positive.
            should_break_out_from_old_post = (post_is_too_old == True and min_post_amount_reached == True)

            # Accumulate valid posts, and break out early if a post violates any of the two limiters
            if (should_break_out_from_old_post == False  and end_cursor_found == False):
                postsToAccumulate.append(post)
            else:
                break

        aggregated_posts.extend(postsToAccumulate)
        
        # Break out of the pagination loop early if there's nothing left to paginate or if 
        # the end cursor stop flag is triggered and or if the oldest possible post was reached
        if (
            len(posts) == 0 
            or post_cursor == None 
            or end_cursor_found == True 
            or post_is_too_old == True
            ):
            # Debug logging
            print('Ending pagination early', 
                  'post_is_too_old: ', post_is_too_old, 
                  'end_cursor_found: ', end_cursor_found,
                  'Remaining post count: ', abs(len(aggregated_posts) - len(posts)))
            
            break
    
    return aggregated_posts

"""
Ingests parsed Instagram posts / media into the Foncii ecosystem by
piping them into the Foncii API to be resolved by the api
"""
def __ingest_parsed_user_posts(foncii_username: str, parsed_posts: list[Dict[str, any]]):
    return api_service.ingest_instagram_posts(foncii_username, parsed_posts)

"""
Parses Instagram posts / media into an expected format suitable
for ingestion into the Foncii ecosystem via the API
"""
def __parse_user_posts(posts: list[Media], instagram_username: str):
    # Accumulator
    parsed_posts = []

    for post in tqdm(posts):
    # Parsing
        post_media = post['resources']

        def parse_post_media(post_media, is_carousel: bool = False) -> Dict[str, any] :
            video_url = str(post_media['video_url']) if (post_media['video_url'] != None) else None
            image_url = str(post_media['thumbnail_url'])  if (post_media['thumbnail_url'] != None) else None

            # Image and video media parsing
            video_thumbnail_url = image_url if (video_url != None) else None
            parsed_media_url = video_url if (video_url != None) else image_url
            media_type = 'VIDEO' if (video_url != None) else 'IMAGE'

            if (is_carousel):
                media_type = 'CAROUSEL_ALBUM'

            parsed_media = {
                'mediaURL' : parsed_media_url,
                'videoMediaThumbnailURL' : video_thumbnail_url,
                'mediaType' : media_type
            }

            return parsed_media

        # Media
        # Parse main media directly from the post
        # Note: For carousels the main media is the first element in the resources array, and for singular posts it's in the post object itself
        found_main_post_media = post_media[0] if len(post_media) != 0 else post
        is_carousel = len(post_media) != 0

        main_media = parse_post_media(found_main_post_media, is_carousel),
        # Parse secondary media from resources field, skip the first resource as this is already provided by the post for main media
        secondary_media = [(parse_post_media(media)) for media in post_media[1:]] if len(post_media) > 1 else None

        # Permalink Generation
        post_permalink_code = post['code']
        # Instagram stub + username + og post ID is the permanent location of the post itself
        permalink = f"https://www.instagram.com/{instagram_username}/p/{post_permalink_code}/"

        data_source = {
            'liveSourceUID': post_permalink_code,
            'sourceUID': post_permalink_code,
            'caption': post['caption_text'],
            'permalink': permalink,
            'creationDate': post['taken_at'],
            'media': main_media[0],
            'secondaryMedia': secondary_media
        }

        # Append parsed posts to accumulator
        parsed_posts.append({ 'dataSource': data_source })

    return parsed_posts