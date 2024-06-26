<div align="center">

# Foncii-Sentiment-Analysis Microservice

</div>
<div align="center">

[![CircleCI](https://dl.circleci.com/status-badge/img/gh/foncii-org/foncii-sas/tree/master.svg?style=svg&circle-token=2ec689b864c7f1187c3b2713cd42c24e1e650b54)](https://dl.circleci.com/status-badge/redirect/gh/foncii-org/foncii-sas/tree/master)

<img src="https://user-images.githubusercontent.com/63657230/230322521-95e49c78-5bf3-4001-a001-aadf2b34fe96.png" width = "500">

</div>
<div align="left">
 
## Intro:
This Flask application is a microservice used by our main backend service to calculate sentiment analysis scores for customer reviews, and publications about
restaurants in order to formulate a truly concise take on a restaurant's overall quality. The application is deployed through App Engine in a flexible environment
where can vertically scale up or down our cores, memory, disk size etc to optimize and increase performance at will. Google App Engine allows us to effortlessly 
horizontally scale our microservices in the form of additional instances to handle the required throughput. Our Foncii-Sentiment-Analysis microservice or
Foncii-SAS is fast and reliable, with millisecond response times following cold instance starts, but still we hope to improve this service as time goes on.

## Collaboration Rules:
- For updates create a new branch from the latest development build
- When done with a task, create a PR, and merge the separate branch back to development and close the separate branch
- When the latest development build is tested and deemed stable, merge to main and this will automatically deploy to App Engine via Circle CI
- Do not checkout or try to merge directly into main, the latest changes will be on the development branch
 
 ## Sentiment Analysis Model:
 https://huggingface.co/nlptown/bert-base-multilingual-uncased-sentiment
 
 #### Please note this is intended to be an internal facing API and should not be accessed by the public, which is why an API key is necessary at this time for accessing it. In the future we might specify Firewall restrictions, or rely on shared network meshes where only internal IP addresses are targeted.

</div>
