### Donations of Appreciation ♥️☕️
If this repo helped you, then you can buy me a coffee to say thanks! <3

[Buy Me A Coffee](https://buymeacoffee.com/jus.ck)

## A-Year-in-Code | Building Foncii

### Intentions
> This codebase is meant to showcase my versatility, ingenuity, and dedication as a life-long problem solver. I spent a little over a year building Foncii from the ground up, going from wireframe to system design, from iOS to web, from a team of 1 to 5+, and from a developer to a Co-Founder and lead engineer. I learned so many things over my thousands of hours of pure dedication. I experimented, I failed, I tried again, and I prevailed over every challenge that came my way. Building this product was a great experience despite the many personal hardships in my life over the past year because it allowed me to distract myself by taking ownership of multiple processes, codebases, and design systems to bring this idea to fruition. The experience I've gained, the layers of effective communication I've acquired, and the skills I've honed throughout this journey are substantial, and I hope to grow and flourish even more in my next experiences despite this platform not working out in the end. It was fun, but the fun never stops as an engineer.

---

## Foncii
The virtual success of this company was comprised of two main goals: to provide consumers like you and me with the most detailed and straightforward experience possible when finding places to eat, and to provide a marketplace for foodie influencers and restaurants to come together and talk business. Foncii's business model operates on four points: the consumer, the restaurant, the influencer, and the platform (us). With all these parties involved, Foncii operates as a self-sustaining platform, allowing regular consumers to explore the culinary landscape of the world without limitation, granting small to large foodie influencers a means of monetizing their brands, and allowing restaurants to gauge tangible metrics of how well influencer marketing campaigns work for their business with concrete data instead of the point and shoot approach that comes with using PR agencies.

<div align="center">
<img src="https://github.com/jcook03266/A-Year-of-Code/assets/63657230/d12054df-4528-4c7b-866a-b010ab713df9"> 
</div>

## Foncii-API | Development Life Cycle: (February 2023 - May 2024)
**https://api.foncii.com/**
> Foncii's API was built with Node.js and TypeScript. The API itself is a combination of Express.js middleware and Apollo GraphQL. The primary `/graphql` endpoint served GQL post requests like normal, and some exposed REST endpoints were left in to allow server-to-server communication as well as act as destinations for CRON job triggers. Custom JWT authentication, session management, and other fine-grained access control gateways were integrated into the API to prevent misuse from bad actors and track user activity by identifying each request. Additionally, the API codebase features an SDL generator, such that whenever the schema is updated the SDL can be regenerated by running the generation script. 

> The data layer of the API is served by a dedicated MongoDB cluster, with each connection/instance being pooled by the API's database manager class until all operations are resolved and their respective connections released. To limit response times and cut down on latency the server uses Apollo's LRU cache to serve repeat requests; a distributed cache (e.g. Redis) wasn't used in this case since the userbase of the product was still very small and this optimization wasn't necessary yet. The server was deployed using Google Compute Engine, namely App Engine Flex to scale both vertically and horizontally as a function of the server's traffic load.

> The API is the default destination for any aggregated restaurants, reservation integrations, articles, awards and social media profiles as well as posts. NLP is performed on various data points to vectorize them and allow vector search for restaurants, users, and posts alike. Sentiment analysis is also used via a separate microservice to rate articles, Google and Yelp reviews, as well as reviews from creators in order to further enhance the Foncii restaurant recommendation engine used to present ranked restaurant candidates to users.

> Note: Users are created and managed through Firebase and mirrored by our database.

---

> Foncii-API GraphQL SDL

<div align="center">
<img src="https://github.com/jcook03266/A-Year-of-Code/assets/63657230/4f85a6d6-b9d4-4513-b8cf-6bb1b2a8a2ca"> 
</div>

---

## Foncii-iOS | Development Life Cycle: (March 2023 - June 2023)

> Foncii's iOS application was the initial MVP of the Foncii platform before it pivoted to being a web app. The app was built with SwiftUI, UIKit, Combine, SPM, XCTest, UserDefaults, TCA for state management, Apollo-iOS for interfacing with our API, and various other external libraries. The view-logic presentation architecture used was MVVM, and the navigation architecture was a mix of the router and coordinator patterns combined to allow simple, modular, and trackable navigation for deep-linking and or crash recovery through the use of extensible protocols and generic typing. Additionally, custom view transition/presentation logic was also developed to present views from parent views hosted in different view hierarchies. Albeit, this is a very nuanced and bug-prone approach to view presentation so I'd recommend going with a library that best supports what you're trying to achieve because this feature requires a lot of maintenance due to the transient nature of SwiftUI's design system and interoperability with UIKit API.

> Originally the app was supposed to be used as a mini data aggregator, meaning the restaurants presented on Foncii's platform were all going to be populated on an eventual consistency basis such that when enough users join Foncii over time they fill in the gaps naturally without us incurring additional costs, since most people dine around where they live. This idea was scrapped and we relied on either manually filling in thousands of restaurants around popular metropolitan areas through creators/users when they associated restaurants with their posts or searched for them on the explore page, or using our geospatial search data aggregation pipeline, using Yelp and Google's APIs in tandem.

> The app provides multiple caching layers for different data types. For images a fixed cache was used to store photos as needed and evict old photos using abstract LIFO principles. For data, the Apollo LRU cache was used to store the data of repeatable queries with explicit cache control policies for each query. The app also features a neat little debug panel for developer use, allowing the developer to sign in and out with a test account, view queries and mutations, and analyze other metrics in real-time. Again, this product was shelved indefinitely to focus on the Foncii-Maps web app which then transitioned into the web version of this application over time, but progress was very fast and everything worked as expected with industry-standard quality, coding standards, and design principles emphasized.

---

## Demos
**Launch Screen + Login**
---
#### Videos
> Launch Screen -> Splash Screen -> Login / Sign-Up Screen
<div align="center">
<video src="https://github.com/jcook03266/A-Year-of-Code/assets/63657230/95258c73-0f98-4cf9-81e6-2f66094ea030" />
</div>

> OTP Screen + Generic Error System Dialog
<div align="center">
<video src="https://github.com/jcook03266/A-Year-of-Code/assets/63657230/fb0e0de5-bc45-42ca-b961-a96462f3b014" />
</div>

**Onboarding + Interstitial Permission Delegate Screens**
---
#### Videos
> Location Permissions + Restaurant Indexing Flow
<div align="center">
<video src="https://github.com/jcook03266/A-Year-of-Code/assets/63657230/6a025adc-4eb9-4ce6-95e9-e7ea51779a8c" />
</div>

Favorite Restaurant Selector - Taste Profile Creation Flow
<div align="center">
<video src="https://github.com/jcook03266/A-Year-of-Code/assets/63657230/e8679b33-5cea-4892-84dc-985546ccefcf" />
</div>

#### Photos
> Reservation Configurator Sheet + My Profile Screen

<div align="center">

<img src="https://github.com/jcook03266/A-Year-of-Code/assets/63657230/66bb68e2-0a48-440a-b78b-c698456feae4" width = "400">
<img src="https://github.com/jcook03266/A-Year-of-Code/assets/63657230/eb0edcd0-a6ef-4a88-9df2-847bad5fb116" width = "400">
 
</div>

**Main Feed**
---
#### Videos
<div align="center">
<video src="https://github.com/jcook03266/A-Year-of-Code/assets/63657230/86aaaf49-784f-43f4-adea-c6e427beaa14" />
</div>
  
**Developer Debug Panel**
---
#### Videos
<div align="center">
<video src="https://github.com/jcook03266/A-Year-of-Code/assets/63657230/7d06e880-ecb9-4f57-bc97-92fe5c1cf805" />
</div>

**Password Reset Flow**
---
#### Videos
<div align="center">
<video src="https://github.com/jcook03266/A-Year-of-Code/assets/63657230/8995bf53-4db1-4737-917c-f02747f49d29" />
</div>

---

## Foncii-Web | Development Life Cycle: (June 2023 - May 2024)
**https://foncii.com/**

> Created with Next.js, React, Redux, React-Apollo, and TypeScript, the Foncii web app is a powerful platform for discovering the best restaurants locally or globally. Foncii is a multi-modal NLP and vector search powered search engine that takes the pain out of finding the best restaurant and reserving a table, anytime. Reliable and fast, Foncii's credibility rivals only word of mouth as it combines prestigious editorials, awards, reservation slots, and social media posts from across the world to paint the most realistic picture of each and every restaurant. Combining the power of Google, Yelp, Instagram, Eater, Resy, and many other key players in the restaurant space, Foncii is the premiere search engine for foodies, and marketplace for foodie influencers and restaurants alike.

> Become a registered user or stay anonymous, Foncii works both ways. When you become a user you curate your own taste profile by telling us what your typical dining experience is like, your favorite spots to eat, and any allergy preferences. That taste profile is then used to rank all restaurants within a given space and produce 50 or so candidates from 1000+ choices based on what you like, what others like, and what we deem a quality experience. This rank is backed by our computed score called the percent-match score which is basically how much we think you'll like a restaurant based on everything you've told us, and your recent activity. And if you find a spot you like you can favorite it and share it with a friend after you book a rare reservation directly through Foncii.

> The web app is very performant and optimized, using the client-side Apollo LRU cache to retrieve and combine denormalized query results immediately based on repeatable queries. Alongside this, React-Redux persists your state between sessions by securely saving the state tree at regular intervals. High-quality images and videos are served by the Foncii CDN which is backed by the Foncii Media microservice which allows for real-time image resizing and optimization. The Foncii Media microservice propagates dynamic images to the CDN for fast and easy access after a request is made, and this works in tandem with client-side optimizations through Next.js to present hundreds of images with little to no noticeable latency whatsoever.

---

## Demos
**Sign-Up + Login**
---
#### Videos
<div align="center">

<video src="https://github.com/jcook03266/A-Year-of-Code/assets/63657230/52cea304-6038-43d3-8fde-f4ca367fae23" />
<video src="https://github.com/jcook03266/A-Year-of-Code/assets/63657230/d0003861-f3c9-4975-a29e-814109b0246e" />

</div>

**Explore + Creator Gallery Page**
---
#### Videos
<div align="center">

<video src="https://github.com/jcook03266/A-Year-of-Code/assets/63657230/ff1f39b0-b6ee-45de-99b3-51b132178efe" />
<video src="https://github.com/jcook03266/A-Year-of-Code/assets/63657230/3eb9cfe5-77c0-45d2-a9e0-9ee07f276e2b" />
<video src="https://github.com/jcook03266/A-Year-of-Code/assets/63657230/5fe2ee61-7613-49c3-a9d6-8001a8335537" />
<video src="https://github.com/jcook03266/A-Year-of-Code/assets/63657230/27fa462e-029d-4c2f-9030-4aca46d56bd4" />

</div>

#### Photos
> Explore Page
<div align="center">
<img src="https://github.com/jcook03266/A-Year-of-Code/assets/63657230/a71174c2-cfd2-44a9-bb0c-bdaa8bd46b1f">
</div>

> List / Grid Gallery View
<div align="center">
<img width="400" src="https://github.com/jcook03266/A-Year-of-Code/assets/63657230/99ba505e-9258-4a72-9acf-563bb5a3476b">
<img width="400" src="https://github.com/jcook03266/A-Year-of-Code/assets/63657230/17c63fd4-cea4-49be-82ef-e399d90123fb">
</div>

> Creator Analytics
<div align="center">
<img src="https://github.com/jcook03266/A-Year-of-Code/assets/63657230/39f42bfd-04fd-4721-847f-4dced977fbe0">
</div>

**Taste Profile Quiz**
---
#### Videos
<div align="center">

<video src="https://github.com/jcook03266/A-Year-of-Code/assets/63657230/f1555460-842a-41ec-8239-b9bd0d199808" />

</div>

**Detail Views**
---
#### Photos
> Restaurant Detail View
<div align="center">
<img src="https://github.com/jcook03266/A-Year-of-Code/assets/63657230/866c6ad1-aebe-444d-b6e7-0c52bde96621">
</div>

> Experience Editor Detail View
<div align="center">
<img src="https://github.com/jcook03266/A-Year-of-Code/assets/63657230/6ab1370d-d8bc-4311-8107-49b2f7cfa48a">
</div>

**Menus**
---
#### Photos
> Side Menu
<div align="center">
<img src="https://github.com/jcook03266/A-Year-of-Code/assets/63657230/9059650a-aaec-499d-bfa8-f6f0324c96b4">
</div>

> More Menu
<div align="center">
<img src="https://github.com/jcook03266/A-Year-of-Code/assets/63657230/44ad490f-9c12-4894-8ae7-48e7e55ce1a6">
</div>

**Modals**
---
#### Photos
<div align="center">
<img src="https://github.com/jcook03266/A-Year-of-Code/assets/63657230/1028ac99-f6b5-46db-93db-29bb65402a05">
</div>

> Note: All secrets managed by Google Secret Manager. No exposed secrets are within any of the codebases.
