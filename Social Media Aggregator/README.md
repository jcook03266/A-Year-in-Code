# Foncii Insta-Scraper 

## Cloud Run Deployment Instructions:
Enter this command in the root folder's terminal:

`gcloud run deploy`
- This deploys from the current directory.

### Config
- Service name: insta-scraper | Just press enter
- Region: 32 | Enter 32 to select us-central1 / Iowa
- Artifact Registry Docker Creation: Y | Enter y to confirm the creation of a docker repo hosted at us-east4 to store built containers. This is required when deploying from source.

### Deployment Documentation:
https://cloud.google.com/run/docs/quickstarts/build-and-deploy/deploy-python-service