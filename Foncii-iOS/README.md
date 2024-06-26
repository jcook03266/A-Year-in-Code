<div align="center">

# foncii-ios
[![Swift Version badge](https://img.shields.io/badge/Swift-5.7.1-orange.svg)](https://shields.io/)
[![Platforms description badge](https://img.shields.io/badge/Platform-iOS-blue.svg)](https://shields.io/)
<!-- [![CircleCI](https://dl.circleci.com/status-badge/img/gh/fonciiapp/foncii-ios/tree/development.svg?style=svg&circle-token=fb48c17087a82d555727740db1898f7911ae3920)](https://dl.circleci.com/status-badge/redirect/gh/fonciiapp/foncii-ios/tree/development) -->

<img src="https://github.com/fonciiapp/foncii-ios/blob/development/resources/fonciiHero.jpg" width = "500">

</div>

<div align="left">
 
## Intro:

This is the codebase for the iOS variant of Foncii's mobile application. All new changes and fixes are made continuously through this repository and managed on maintained branches corresponding to different levels of development. 
  
### Our branching system
- For the latest release version of the application, the main branch is used to store all concurrent changes and updates which will be pushed to TestFlight and then the app store. 
  
- For the bleeding edge unreleased version of the application, the development branch is where the reviewed changes go before being moved to the main branch after being thoroughly vetted for any breaking changes by our CI/CD pipeline and QA. 
  
### For New Collaborators
Every new feature, request, or bug fix must be isolated to its own branch and merged into the development branch when ready and properly tested. Each new pull request must conform to the specified template found here: https://github.com/fonciiapp/foncii-ios/blob/development/docs/pull_request_template.md
  
### Why use a PR template?
Having a template for each pull request speeds up the code review life cycle by having an expected set of parameters for code reviewers to analyze and check off on to ensure only quality changes get merged into development, and then production level branches.
  
### [Issue / Ticket Tracking](https://foncii.atlassian.net/jira/software/projects/FA/boards/1)   
Foncii currently uses Jira for issue tracking / sprint planning. So for any ticket you have to create a corresponding branch with that ticket number attached, and then also specify this in any pull request attached to said ticket. Doing so is simple with Jira's Git integration where you can create a new branch in the selected issue screen.
  
### For any questions or concerns please contact:
[@jcook03266](https://github.com/jcook03266) | jcook03266@gmail.com

</div>
