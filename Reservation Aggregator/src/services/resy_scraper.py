# Dependencies
# Types
from typing import Optional, Dict

# Parsing
from urllib.parse import urlparse, urlunparse

# Selenium Web Driver Tools
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoSuchElementException, TimeoutException

# Services
from src.services.foncii_api_service import FonciiAPIServiceAdapter

"""
Simple interactor service class for scraping resy's website
"""
class ResyScraper:
    # Properties
    # Constant URLS
    DEFAULT_URL = "https://resy.com/"
    NYC_CITIES_PAGE_URL = "https://resy.com/cities/ny"

    # Services
    api_service = FonciiAPIServiceAdapter()

    def __init__(self):
        self.web_driver = self.init_web_driver()

    def init_web_driver(self):
        # Set up the Chrome options for headless browsing
        chrome_options = Options()
        chrome_options.add_argument("--headless")  # Run Chrome in headless mode
        # Disable GPU acceleration for headless mode
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--no-sandbox")  # Bypass OS security model
        chrome_options.add_argument("--window-size=1920x1080")  # Set window size

        # Initialize the Chrome webdriver with the options
        web_driver = webdriver.Chrome(options=chrome_options)

        return web_driver

    # Scraping workflows
    """
    Aggregates all restaurant details for all restaurants across all 'popular' cities on Resy's site
    and uploads this data to the main API to be parsed and persisted as a part of Foncii's reservation integration
    """
    def start_popular_city_restaurant_aggregation_workflow(self):
        self.start_web_driver()

        # Parse the popular city selectors to traverse through
        city_selectors = self.parse_city_selectors()
        
        # Visit each restaurant page and parse all relevant details
        restaurant_page_details: list[Dict[str, any]]  = []

        # Iterate through each city selector to toggle the context of the city and view all restaurants within that city     
        for city_button in city_selectors:
            self.toggle_city_selector_drop_down()
            self.click_city_selection_button(city_button)

            # Aggregate the restaurant links from the current city
            aggregated_restaurant_links: list[str] = self.aggregate_restaurant_page_links()
            local_restaurant_page_details: list[Dict[str, any]]  = []

            for restaurant_page_link in aggregated_restaurant_links:
                parsed_restaurant_page_details = self.parse_restaurant_page_details_for(restaurant_page_link)

                if parsed_restaurant_page_details is not None:
                    print(f"Successfully parsed restaurant page details for {restaurant_page_link}")
                    
                    local_restaurant_page_details.append(parsed_restaurant_page_details)
                else:
                    print(f"Failed to parse restaurant page details for {restaurant_page_link}")

            # Upload aggregated restaurant data to the API
            print(f"Uploading restaurant reservation details for city: {city_button.text}")
            self.api_service.upload_resy_restaurant_reservation_details(local_restaurant_page_details)
            print("Upload complete")

            # Add the aggregated restaurant page details for this city to the overall list
            restaurant_page_details.append(local_restaurant_page_details)

            # Done aggregating restaurants from the current city, move on to the next
            print(f"Finished aggregating restaurant details for city: {city_button.text} | {len(local_restaurant_page_details)} Restaurant Detail Pages Restaurants Parsed")
            self.stop_web_driver()
            
        print(f"Finished Workflow: [start_popular_city_restaurant_aggregation_workflow] | {len(restaurant_page_details)} Restaurant Detail pages parsed across {len(city_selectors)} cities")
        
    """
    Aggregates all restaurant details for all restaurants across New York City on Resy's site
    and uploads this data to the main API to be parsed and persisted as a part of Foncii's reservation integration.
    This method is land-locked specifically to NYC to keep our initial scraping experiment to a minimum scope
    and to fine-tune any issues as they arise.
    """
    def start_nyc_restaurant_aggregation_workflow(self):
        self.start_web_driver()
        self.navigate_to_nyc_cities_page()

        # Visit each restaurant page and parse all relevant details
        restaurant_page_details: list[Dict[str, any]] = []

        # Aggregate the restaurant links from the current city
        aggregated_restaurant_links = self.aggregate_restaurant_page_links()

        for restaurant_page_link in aggregated_restaurant_links:
            parsed_restaurant_page_details = self.parse_restaurant_page_details_for(restaurant_page_link)

            if parsed_restaurant_page_details is not None:
                print(f"Successfully parsed restaurant page details for {restaurant_page_link}")
                 
                restaurant_page_details.append(parsed_restaurant_page_details)
            else:
                print(f"Failed to parse restaurant page details for {restaurant_page_link}")

        # Done aggregating restaurants from the current city
        self.stop_web_driver()

        # Upload aggregated restaurant data to the API
        print(f"Uploading restaurant reservation details for NYC")
        self.api_service.upload_resy_restaurant_reservation_details(restaurant_page_details)
        print("Upload complete")

        print(f"Finished Workflow: [start_popular_city_restaurant_aggregation_workflow] | {len(restaurant_page_details)} Restaurant Detail pages parsed across NYC")

    # Control Flow #
    def start_web_driver(self):
        # Open the base / default URL navigated to upon startup of the browser
        print(f"Starting web driver at {self.DEFAULT_URL}")

        self.navigate_to_home_page()

    def stop_web_driver(self):
        print("Stopping web driver")

        self.web_driver.quit()

    # Site Navigation
    # For when the script first starts / needs to navigate back when done traversing a separate part of the site
    def navigate_to_home_page(self):
        try:
            print("Navigating to home page")
            self.web_driver.get(self.DEFAULT_URL)

            """
            Wait for a known element to load in properly to determine whether or not the page has fully loaded 
            vs time.sleep for added speed / efficiency
            """
            WebDriverWait(self.web_driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'button.CitiesList__anchor')))

            print("Home page loaded")
        except TimeoutException:
            print("Home page failed to load in time")

    # Navigate to the restaurant details page
    def navigate_to_restaurant_details_page(self, restaurant_details_page_link: str):
        try:
            print(f"Navigating to restaurants detail page @:{restaurant_details_page_link}")
            self.web_driver.get(restaurant_details_page_link)

            # Wait until the venu page title loads to determine whether or not the page has fully loaded | 20 seconds ~ Slightly longer to allow for details to load
            WebDriverWait(self.web_driver, 20).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'h1.VenuePage__venue-title')))

            print("Restaurant detail page loaded")
        except TimeoutException:
            print("Restaurant detail page failed to load in time")

    """
    Used by the nyc aggregation work flow to navigate to the restaurants list for NYC instead of traversing all popular cities
    """
    def navigate_to_nyc_cities_page(self):
        try:
            print("Navigating to NYC Cities page")
            self.web_driver.get(self.NYC_CITIES_PAGE_URL)

            WebDriverWait(self.web_driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR,'h3.SearchResultsContainer__metadata--facet-container__value.color--text-primary')))

            print("NYC Cities page loaded")
        except TimeoutException:
            print("NYC Cities page failed to load in time")

    # Aggregation #
    def aggregate_restaurant_page_links(self) -> list[str]: 
            # Navigate to the restaurants list | View All list, not a special collection with only select restaurants within
            self.toggle_search_bar_auto_complete_drop_down()
            self.click_view_all_restaurants_button()

            print(f"Parsing restaurant list page @:{self.web_driver.current_url}")

            # Aggregate the list items and paginate all possible pages
            aggregated_restaurant_links = []
            pages_traversed = 0
            can_paginate = True

            while can_paginate:
                # Aggregate links to all of the pages to visit
                aggregated_restaurant_links.extend(self.parse_restaurant_page_links())
        
                # Done aggregating this current page, move on to the next page (if any) 
                can_paginate = self.paginate_restaurants_list_forward()
                pages_traversed += 1

                print(f"Current Pagination Index: {pages_traversed}")
                print(f"Restaurant page links aggregated: {len(aggregated_restaurant_links)}")

            return aggregated_restaurant_links
        
    # Parsing #
    def parse_restaurant_page_details_for(self, restaurant_details_page_link: str) -> Optional[Dict[str, str]]:
            try:
                self.navigate_to_restaurant_details_page(restaurant_details_page_link)

                # Wait until the venu page title loads to determine whether or not the page has fully loaded
                WebDriverWait(self.web_driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, 'h1.VenuePage__venue-title')))

                # Meta-tag Parsing | Venue ID from Venue Hero OG Image
                meta_tag = self.web_driver.find_element(By.XPATH,"//meta[@property='og:image']")

                # Get the value of the content attribute
                image_content = meta_tag.get_attribute('content')
                parsed_image_content = image_content.split('/')
                venue_id = None

                if len(parsed_image_content) >= 7:
                    venue_id = image_content.split('/')[6]

                """
                Important: Triggering this code block in headless mode results in the element not being able to be found
                To find the element and run this code block normally, the driver must run with the GUI rendered (slower), for now we're just going
                to run the script in headless mode for simplicity, but if the venue_id can't be parsed properly across many occurrences then we'll experiment
                with running the script with the GUI enabled.
                """
                # # Try parsing the Venue ID from one of the reservation time slot buttons (if there are any time slots currently available)
                # if venue_id is None:
                #     WebDriverWait(self.web_driver, 10).until(
                #     EC.presence_of_element_located((By.CSS_SELECTOR, 'div.ReservationButtonList"')))
                    
                #     reservation_time_slot_button = self.web_driver.find_element(
                #     By.XPATH, "//*[contains(@id,'rgs://rgs/')]")

                #     reservation_time_slot_button_id = reservation_time_slot_button.get_attribute("id")
                #     venue_id = reservation_time_slot_button_id.split('/')[3] if len(reservation_time_slot_button_id.split('/')) >= 2 else None

                # Throw an error if the venue ID can't be parsed at all
                if venue_id is None:
                    raise ValueError("Venue ID could not be parsed from the restaurant details page")

                # URL Parsing | External URL
                parsed_url = urlparse(restaurant_details_page_link)

                # Reconstruct the URL without query parameters
                base_venue_page_url = urlunparse((parsed_url.scheme, parsed_url.netloc, parsed_url.path, '', '', ''))
    
                # Venue Page Title Parsing | Venue Name
                restaurant_name = self.web_driver.find_element(
                By.CSS_SELECTOR, "h1.VenuePage__venue-title").text

                # URL Parsing | Venu Alias
                path_segments = parsed_url.path.split('/')
                venue_alias = path_segments[-1]  # Get the last segment of the path

                # Venue Location Summary Parsing | Auto-complete Details
                venue_location_summary = self.web_driver.find_element(
                By.CSS_SELECTOR, "div.VenueLocationSummary__content__info").text.replace('\n', ', ') # Transform into a CSV string to easily plug into an autocomplete method or database query later

                # Parse all necessary details from this page and return
                return {
                    "name": restaurant_name,
                    "venueID": venue_id,
                    "venueAlias": venue_alias,
                    "externalURL": base_venue_page_url, # The link to the restaurant details page itself that's being parsed w/o specific params
                    "locationDetails": venue_location_summary, # Address / Location / Restaurant information to use when matching this data to our own
                }
            
            except (TimeoutException, NoSuchElementException, ValueError) as e:
                print(f"[parse_restaurant_page_details_for] An error occurred: {e}")

                # An element could not be parsed, throw out entire result as all parsed information here is required 
                return None

    """     
    Parses the popular city selection buttons into a list of all of the individual city selectors to traverse for
    """
    def parse_city_selectors(self):
        city_selectors = []

        try:
            print("Parsing city selectors")

            # Wait for the required elements to load properly
            WebDriverWait(self.web_driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'button.CitiesList__anchor')))

            city_selectors = self.web_driver.find_elements(
                By.CSS_SELECTOR, "button.CitiesList__anchor")
        except TimeoutException:
            print("City selectors not interactable")
        
        return city_selectors
    
    """
    Parses the list of restaurant page links from the restaurants list page into a list of href strings
    """
    def parse_restaurant_page_links(self):
        restaurant_page_link_elements = []

        try:
            print("Parsing restaurant list page links")

            # Wait for the required elements to load properly
            WebDriverWait(self.web_driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'a.SearchResult__container-link')))
            
            restaurant_page_link_elements = self.web_driver.find_elements(
            By.CSS_SELECTOR, "a.SearchResult__container-link")
        
            # Map the hrefs from each element into a list of all of the restaurant page links in string form
            restaurant_page_links = [element.get_attribute("href") for element in restaurant_page_link_elements]

        except TimeoutException:
            print("Restaurant list page not interactable")
        
        return restaurant_page_links

    # Web Interactor #
    # Home page / Cities page interactions # - Interactions Specifically meant for when the driver is on the homepage at '/'
    """
    This toggles the city selector drop down menu which allows the web driver to 
    interact with the city selection buttons
    """
    def toggle_city_selector_drop_down(self):
        try:
            button = WebDriverWait(self.web_driver, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "div.Selector__title")))

            button.click()

            print("City selector menu toggled")
        except TimeoutException:
            print("City selector menu not interactable")

    """
    Toggles the passed city selection button element by clicking it;
    this interaction changes the context of the page to that of the selected city
    allowing the web driver to traverse to the paginatable list of all supported restaurants 
    for that specific city
    """
    def click_city_selection_button(self, city_selection_button):
        try:
            button = WebDriverWait(self.web_driver, 10).until(
            EC.element_to_be_clickable(city_selection_button))

            button.click()

            print("City selection button toggled")
        except TimeoutException:
            print("City selection button not interactable")

    def toggle_search_bar_auto_complete_drop_down(self):
        try:
            input = WebDriverWait(self.web_driver, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "input.react-autosuggest__input")))

            input.click()

            print("Search bar auto-complete drop down toggled")
        except TimeoutException:
            print("Search bar auto-complete drop down not interactable")
    
    def click_view_all_restaurants_button(self):
        try:
            button = WebDriverWait(self.web_driver, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "a.RestingContainer__view-all-link")))

            button.click()

            print("View all restaurants button clicked")
        except TimeoutException:
            print("View all restaurants button not interactable")
    # Home page / Cities page interactions # - Interactions Specifically meant for when the driver is on the homepage at '/'

    """
    View All Restaurants List interactions # - Interactions meant for when the driver is viewing a list of restaurants 
    for a target city ex.) https://resy.com/cities/dc | All restaurants list for DC, where the list is manually paginatable
    """
    def paginate_restaurants_list_forward(self) -> bool:
        can_paginate = True

        try:
            # Wait for the required elements to load properly
            WebDriverWait(self.web_driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'li.Pagination__next')))
            
            # Try to determine if the pagination button is disabled ~ the .disabled class is active
            _ = self.web_driver.find_element(
            By.CSS_SELECTOR, "li.Pagination__next.disabled")
        
            # If the element is found, pagination might not be possible
            can_paginate = False
            print("Pagination complete, can't paginate forward as the button is disabled")
        except NoSuchElementException:
            # If NoSuchElementException is raised, pagination is be possible
            can_paginate = True
            print("Paginating forward, more pages to load ahead.")

        # Pagination forward button isn't disabled, click it
        if can_paginate:
            try:
                button = self.web_driver.find_element(
                By.CSS_SELECTOR, "a[aria-label='Next page']")
            
                """
                Click the button via JS execution, this button / anchor can't be clicked using the .click() method for 
                some external reason, so we need to use the .execute_script() method to trigger the click event
                """
                self.web_driver.execute_script("arguments[0].click();", button) 

                # Pagination successful
                print("Paginate forward button triggered")
            except TimeoutException:
                # Pagination not possible / Failed
                print("Paginate forward button not interactable")
                can_paginate = False

        return can_paginate

    
