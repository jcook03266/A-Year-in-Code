# Dependencies
# Services
from src.services.app_service import AppService

# Environment
import os

# Add the parent directory of the current directory to the Python path
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
os.environ["PYTHONPATH"] = parent_dir + ":" + os.environ.get("PYTHONPATH", "")
    
# App entry point
app_service = AppService()
app = app_service.app

def start():
    app_service.start()

if __name__ == "__main__":
    start()