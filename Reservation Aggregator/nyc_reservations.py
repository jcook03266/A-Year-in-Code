# Dependencies
# File system
import os

# Services
from src.services.resy_scraper import ResyScraper

# Add the parent directory of the current directory to the Python path
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
os.environ["PYTHONPATH"] = parent_dir + ":" + os.environ.get("PYTHONPATH", "")

# Script entry point
def start():
    resy_scraper = ResyScraper()
    resy_scraper.start_nyc_restaurant_aggregation_workflow()

if __name__ == "__main__":
    start()