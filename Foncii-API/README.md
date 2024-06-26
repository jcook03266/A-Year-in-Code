<div align="center">

# Foncii API

[![CircleCI](https://dl.circleci.com/status-badge/img/gh/foncii-org/foncii-api/tree/master.svg?style=shield&circle-token=8ce8adccfa5656ed86032c471f454820df6a1436)](https://dl.circleci.com/status-badge/redirect/gh/foncii-org/foncii-api/tree/master)
[![Platforms description badge](https://img.shields.io/badge/Node.js-18.15.0%20LTS-brightgreen.svg)](https://shields.io/)

</div>
<div align="left">
 
## Intro:
This is the primary backend layer of Foncii's platforms ~ Foncii Maps and the Foncii app. Foncii API uses GraphQL as its communication channel between clients and server instances. You can view the schema below as well as read some of the documents touching on the logic behind a lot of this API's functionalities.

Foncii API is operated as a cluster of serverless instances that all respond to short lived requests as needed, with any long running processes being passed off to the multiple Foncii microservices (ex. Foncii Media Service) this central backend layer interfaces with. The overall goal of this application is to be fast, responsive, and cost effective as we scale the needs of our platform in the near future.

It's paramount we document this API as much as possible given the frequency of improvements and feature developments we churn through to get Foncii Maps and the app to production quality. I encourage adding more docs like the ones below whenever deemed fit.

- [Apollo Studio](https://studio.apollographql.com/graph/foodie-supergraph/variant/main/home)
- [Schema Documentation](https://studio.apollographql.com/graph/foodie-supergraph/variant/main/schema/reference)
- [Database](https://cloud.mongodb.com/v2/6500cad1a2317e0f32b576a6#/overview)
- [User Authentication](https://console.firebase.google.com/u/0/project/foncii-maps/authentication/users)

Needs updating:

- [Foncii Data Aggregation Proof of Concept](https://foncii.atlassian.net/wiki/spaces/FA/pages/5734461/Aggregating+Restaurant+Data+for+Foncii)
- [NoSQL Server Documentation](https://foncii.atlassian.net/wiki/spaces/FA/pages/3899446/Foncii+NoSQL+Database+Model)

#### Please keep in mind that these documents may not always be the most up to date, we try our best to document all changes to the code repository, but the latest changes can be viewed here in this repository from the development branch.

</div>
