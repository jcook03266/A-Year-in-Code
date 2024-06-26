# Import librairies
import pandas as pd
import json
from tqdm import tqdm
import re
import difflib
import googlemaps
import os
from google.cloud import storage
import json

# Services
from src.services.insta_scraper_irakli import InstaScraper
from src.services.foncii_api_service import FonciiAPIServiceAdapter

# Environment Variables
# Add the parent directory of the current directory to the Python path
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
os.environ["PYTHONPATH"] = parent_dir + ":" + os.environ.get("PYTHONPATH", "")

# Load env variables
# Debug environment flag
is_debug = str(os.getenv('DEBUG')) == 'True'

def extract_words_after_at(paragraph):
    """Extract the mention."""
    # This regular expression looks for '@' followed by any sequence of characters 
    # that are word characters (letters, digits, or underscores)
    mentions = re.findall(r'@([A-Za-z0-9_.]{1,30})', paragraph)
    
    # Find all matches in the paragraph
    return list(set(mentions))

def extract_caption_emoji(text):
    """Extract the text after a pin emoji."""
    extracted_text = re.search(r'📍(.*?)\n', text)
    location = extracted_text.group(1) if extracted_text else ""
    return location

def find_overlap(list1, list2):
    """Find overlapping strings in two lists."""
    return list(set(list1) & set(list2))

def contains_digit(s):
    """Return True if a string contains a digit."""
    for char in s:
        if char.isdigit():
            return True
    return False

def good_match_score(df_name, google_name, is_easy_map):
    """Calculate the similarity between two strings."""
    # Calculate the similarity
    if is_easy_map in ['No', 'Maybe', 'Unlikely']:
        similarity = difflib.SequenceMatcher(None, df_name.lower(), google_name.replace(' ','').lower()[:len(df_name)]).ratio() 
    else:
        similarity = difflib.SequenceMatcher(None, df_name.lower(), google_name.lower()).ratio()
    return similarity 

def create_dict_from_lists(L1, L2):
    return dict(zip(L1, L2))

def google_maps_api(query):
    """Returns the details of a place using Google place API."""    
    GOOGLE_MAPS_API_KEY = str(os.getenv('GOOGLE_MAPS_API_KEY'))
    fields = ['place_id', 'name', 'types']
    gmaps = googlemaps.Client(key=GOOGLE_MAPS_API_KEY)
    res = gmaps.find_place(
        query, 
        input_type = 'textquery',
        fields = fields)
    return res

def level_confidence(score):
    if score >= 0.75:
        return 'High'
    elif score >= 0.65:
        return 'Medium'
    elif score >=0.5:
        return 'Low'
    else:
        return ''

def get_true_matches(row):
    """Get the place_id for which the google name is similar to the name from Instagram."""
    try:
        true_indices = [i for i, x in enumerate(row['score']) if x >= 0.55]
        place_ids = [row['place_id'][i] for i in true_indices]
        google_names = [row['google_name'][i] for i in true_indices]
        scores = [row['score'][i] for i in true_indices]
        confidences = [level_confidence(row['score'][i]) for i in true_indices]
        ig_mentions = [row['ig_mentions'][i] for i in true_indices]
    except IndexError as e:
        print(f"Error in row: {row.name}, {e}")
        place_ids, google_names, scores, confidences, ig_mentions = [], [], [], [], []
    return place_ids, google_names, scores, confidences, ig_mentions

def download_json_from_gcs(bucket_name, file_path):
    """Downloads a JSON file from the specified path in a GCS bucket."""
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(file_path)

    json_data = json.loads(blob.download_as_string())
    return json_data

def upload_dict_to_gcs(bucket_name, dict_data, file_path):
    """Uploads a dictionary as a JSON file to a specified path in a GCS bucket."""
    # Convert dictionary to JSON string
    json_data = json.dumps(dict_data)

    # Create a storage client
    storage_client = storage.Client()

    # Reference the specified bucket
    bucket = storage_client.bucket(bucket_name)

    # Create a blob (file) in the specified path
    blob = bucket.blob(file_path)

    # Upload the JSON data
    blob.upload_from_string(
        data=json_data,
        content_type='application/json'
    )
    print(f"Dictionary uploaded to {file_path} in bucket {bucket_name}.")

def create_dataframe(medias):
    """Function that create a dataframe that gives details for each post."""
    
    L = []
    for media in tqdm(medias):
        
        mentions = extract_words_after_at(media['caption_text'])  
        usertags = list(set([x['user']['username'] for x in media['usertags']]))
    
        if media['video_url']:
                type = 'Reel'
        else:
                type = 'Image'
    
        if media['location'] :
        
            caption = media['caption_text']
            name = media['location']['name']
            postid = media['code']
            address = media['location']['address']
            city = media['location']['city']
            date = media['taken_at']
                
            L.append((postid, caption , mentions, usertags, name, address, city, type, date))
            continue
    
        else:
            
            postid = media['code']
            caption = media['caption_text']
            date = media['taken_at']
            L.append((postid, caption , mentions ,usertags, '', '', '', type, date))
    
    df = pd.DataFrame(L, columns = ['postID', 'caption', 'mentions', 'usertags', 'name', 'address', 'city', 'type','date'])

    # Get only posts from 2021
    df = df[df.date > '2021']

    df['all_tags'] = (df['mentions'] + df['usertags']).apply(lambda x: list(set(x)))
    
    #df['overlap_mention_tag'] = df.apply(lambda row: find_overlap(row['mentions'], row['usertags']), axis=1)
    
    df['easy_map'] = df.apply(
        lambda row: 'Yes' if (row['name'] != '' and row['address'] != '' and contains_digit(row['address'])) 
                    #else ('Maybe') if (row['name'] != '' and (len(row['usertags']) != 0 or len(row['mentions']) != 0))
                    else ('Maybe') if (len(row['all_tags']) > 0 and len(row['all_tags']) < 10)
                    #else ('Unlikely') if ((len(row['mentions']) != 0 and len(row['mentions']) < 5) 
                                          #or (len(row['usertags']) != 0 and len(row['usertags']) < 5))
                    else 'No',
        axis=1
    )
    
    return df


def find_restaurant_for_yes(df, threshold = 0.3):
    """Return a dataframe with the place id associated with 'Yes' easy_map values."""

    # Call the Foncii API
    api_service = FonciiAPIServiceAdapter()

    score = []
    place_ids = []
    display_name_google = []
    for k in tqdm(range(len(df))):
        
        query = f"{df.iloc[k]['name']} {df.iloc[k]['address']} {df.iloc[k]['city']}".replace('  ',' ')
        
        # Find a matching restaurant via the API
        result = api_service.find_google_place_id_for_place_search_query(query, useGoogleFallback = False)

        # Optional unwrapping
        google_place_id = None
        description = None
        similarity_score = None

        if (result):
            google_place_id = result['google_place_id']
            description = result['description']
            similarity_score = result['similarity_score']
        
        # If restaurant exists in the API
        if google_place_id:
            name_google = ''
            place_ids.append([google_place_id])
            score.append([100])
            display_name_google.append([''])
        
        # Do the google place API call
        else:
            res = google_maps_api(query)
            if 'candidates' in res and len(res['candidates']) > 0:
                types = res['candidates'][0]['types']
                list_types = ['restaurant', 'food', 'bar', 'cafe', 'bakery', 'meal_delivery', 'meal_takeaway']
                if any(item in types for item in list_types):
                    name_google = res['candidates'][0]['name']
                    is_easy_map = df['easy_map'].iloc[k]
                    name = df.iloc[k]['name']
                    score_match = good_match_score(name,name_google, is_easy_map)
                    place_ids.append([res['candidates'][0]['place_id']])
                    score.append([score_match])
                    display_name_google.append([name_google])
                else:
                    place_ids.append([''])
                    score.append([0])
                    display_name_google.append([''])
            else:
                place_ids.append([''])
                score.append([0])
                display_name_google.append([''])
                                           
    # Add the new columns
    df['place_id'] = place_ids
    df['score'] = score
    df['google_name'] = display_name_google 
    df['ig_mentions'] = [[""]] * len(place_ids)

    # Only select the place_id that have a similarity between the Instagram restaurant name and Google name
    results = df.apply(lambda row: get_true_matches(row), axis=1)
    
    place_ids = [result[0] for result in results]
    google_names = [result[1] for result in results]
    score = [result[2] for result in results]
    confidence = [result[3] for result in results]
    ig_mentions = [result[4] for result in results]
    
    df['place_id'] = place_ids
    df['google_name'] = google_names
    df['score'] = score
    df['confidence'] = confidence
    df['ig_mentions'] = ig_mentions
    
    return df

def find_restaurant_for_maybe(df, bucket_name, file_path, threshold = 0.6):
    """Return a dataframe with the place id associated with 'Maybe' easy_map values."""


    dic_usertags = download_json_from_gcs(bucket_name, file_path)
    
    score = []
    place_ids = []
    display_name_google = []
    ig_mentions = []

    for k in tqdm(range(len(df))):
        
        #usertags = list(set(df.iloc[k]['usertags'] + df.iloc[k]['mentions']))
        usertags =  df.iloc[k]['all_tags']
        i_place_ids = []
        i_score = []
        i_display_name_google = []
        i_ig_mentions = []
    
        for usertag in usertags:
            
            # If we have the info on usertag
            if usertag in dic_usertags:
                print(f'{usertag} in dic_usertags')
                if dic_usertags[usertag]['score'] >= threshold:
                    place_id = dic_usertags[usertag]['place_id']
                    name_google = dic_usertags[usertag]['name']
                    score_match = dic_usertags[usertag]['score']
                    i_score.append(score_match)
                    i_place_ids.append(place_id)
                    i_display_name_google.append(name_google)
                    i_ig_mentions.append(usertag)
                else:
                    i_score.append(0)
                    i_place_ids.append('')
                    i_display_name_google.append('')
                    i_ig_mentions.append('')
    
            # Usertag not seen
            else:
                query = f"{usertag} {df.iloc[k]['name']} {df.iloc[k]['city']}".replace('  ',' ')
                res = google_maps_api(query)
                
                if 'candidates' in res and len(res['candidates']) > 0:
                    types = res['candidates'][0]['types']
                    list_types = ['restaurant', 'food', 'bar', 'cafe', 'bakery', 'meal_delivery', 'meal_takeaway']
                    if any(item in types for item in list_types):
                        name_google = res['candidates'][0]['name']
                        is_easy_map = df['easy_map'].iloc[k]
                        score_match = good_match_score(usertag, name_google, is_easy_map)
                        place_id = res['candidates'][0]['place_id']
                        i_place_ids.append(place_id)
                        i_score.append(score_match)
                        i_display_name_google.append(name_google)
                        i_ig_mentions.append(usertag)
    
                        # Save the usertag in the dictionnary
                        if usertag not in dic_usertags:
                            dic_usertags[usertag] = {}
                        dic_usertags[usertag]['score'] = score_match
                        dic_usertags[usertag]['place_id'] = place_id
                        dic_usertags[usertag]['name'] = name_google
                        dic_usertags[usertag]['type'] = types
                        
                    else:
                        i_place_ids.append('')
                        i_score.append(0)
                        i_display_name_google.append('')
                        i_ig_mentions.append('')
                        
                        # Save in the dictionary the tag that is not food-related
                        if usertag not in dic_usertags:
                            dic_usertags[usertag] = {}
                        dic_usertags[usertag]['score'] = 0
                        dic_usertags[usertag]['place_id'] = ''
                        dic_usertags[usertag]['name'] = ''
                        dic_usertags[usertag]['type'] = types
                        
                else:
                    i_place_ids.append('')
                    i_score.append(0)
                    i_display_name_google.append('')
                    i_ig_mentions.append('')
        
        score.append(i_score)
        place_ids.append(i_place_ids)
        display_name_google.append(i_display_name_google)
        ig_mentions.append(i_ig_mentions)

    # Update the dics_usertag in Google Cloud Storage
    upload_dict_to_gcs(bucket_name, dic_usertags, file_path)
                                           
    # Add the new columns
    df['place_id'] = place_ids
    df['score'] = score
    df['google_name'] = display_name_google 
    df['ig_mentions'] = ig_mentions
    
    # Threahold for 'Yes' is 0.3
    #df = df[df['score'] >= threshold]
    
    results = df.apply(lambda row: get_true_matches(row), axis=1)
    
    place_ids = [result[0] for result in results]
    google_names = [result[1] for result in results]
    score = [result[2] for result in results]
    confidence = [result[3] for result in results]
    ig_mentions = [result[4] for result in results]
    
    df['place_id'] = place_ids
    df['google_name'] = google_names
    df['score'] = score
    df['confidence'] = confidence
    df['ig_mentions'] = ig_mentions

    return df

def find_restaurant_for_no(df, bucket_name, file_path, threshold = 0.7):
    """Return a dataframe with the place id associated with 'No' easy_map values."""

    dic_usertags = download_json_from_gcs(bucket_name, file_path)
    
    score = []
    place_ids = []
    display_name_google = []
    ig_mentions = []

    for k in tqdm(range(len(df))):
    
        usertags = list(set(df.iloc[k]['usertags'] + df.iloc[k]['mentions']))
        i_place_ids = []
        i_score = []
        i_display_name_google = []
        i_ig_mentions = []
    
        # No location + tag
        if usertags:
            
            for usertag in usertags:
                
                # Look if we have this usertag in the dictionnary
                if usertag in dic_usertags:
                     
                     if dic_usertags[usertag]['score'] >= threshold:
                         place_id = dic_usertags[usertag]['place_id']
                         name_google = dic_usertags[usertag]['name']
                         score_match = dic_usertags[usertag]['score']
                         i_score.append(score_match)
                         i_place_ids.append(place_id)
                         i_display_name_google.append(name_google)
                         i_ig_mentions.append(usertag)

                    # Not higher than threshold
                     else:
                        i_score.append(0)
                        i_place_ids.append('')
                        i_display_name_google.append('')
                        i_ig_mentions.append('')
            
                else:
                    i_score.append(0)
                    i_place_ids.append('')
                    i_display_name_google.append('')
                    i_ig_mentions.append('')
    
    
            score.append(i_score)
            place_ids.append(i_place_ids)
            display_name_google.append(i_display_name_google)
            ig_mentions.append(i_ig_mentions)

    
        # No usertag in the post
        else:
            score.append([0])
            place_ids.append([''])
            display_name_google.append([''])
            ig_mentions.append([''])
    
    # Add the new columns
    df['place_id'] = place_ids
    df['score'] = score
    df['google_name'] = display_name_google  
    df['ig_mentions'] = ig_mentions

    
    # Threahold for 'Yes' is 0.5
    #df = df[df['score'] >= threshold]
    
    results = df.apply(lambda row: get_true_matches(row), axis=1)
    
    place_ids = [result[0] for result in results]
    google_names = [result[1] for result in results]
    score = [result[2] for result in results]
    confidence = [result[3] for result in results]
    ig_mentions = [result[4] for result in results]
    
    df['place_id'] = place_ids
    df['google_name'] = google_names
    df['score'] = score
    df['confidence'] = confidence
    df['ig_mentions'] = ig_mentions
    

    return df


def main(username, number_posts):

    instascraper = InstaScraper()

    # Gloabl Variables
    bucket_name = str(os.getenv('GC_BUCKET_NAME'))
    file_path = str(os.getenv('GC_FILE_PATH'))
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "cred.json"

    # Get the user's posts
    medias = instascraper.get_media(username, number_posts)

    # Create the user's post DataFrame
    df = create_dataframe(medias)

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

    # Mapping only the postID and the placeID
    parsed_place_id = []
    for k in range(len(df)):
        parsed_place_id.append({df.iloc[k]['postID'] : df.iloc[k].place_id,
                                'ig_mentions': create_dict_from_lists(df.iloc[k].place_id, df.iloc[k]['ig_mentions'])})

    return parsed_place_id
    
