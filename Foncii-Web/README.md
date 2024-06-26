[![CircleCI](https://dl.circleci.com/status-badge/img/gh/foncii-org/foncii-maps-mvp/tree/development.svg?style=svg&circle-token=c4c4c4ef89b71b071c7fb8793b50665b6eee41ac)](https://dl.circleci.com/status-badge/redirect/gh/foncii-org/foncii-maps-mvp/tree/development)

# Foncii Maps MVP

This is the minimum viable product for Foncii Maps. It has been adapted from the original codebase from the ground up and is designed to be modular, testable, and extensible. This project uses Next.JS, Tailwind CSS, Storybook, and other tools.

# Instructions For Deploying

Foncii Maps is deployed using Google App Engine (GAE) to deploy the latest stable changes. The deployment job is only triggered when changes are pushed to the main branch, so to trigger the deploy you have to merge the changes from the development branch back to main via a PR where the automated CI/CD pipeline provided by CircleCI will handle building and deployment process.

### Monitoring:

- Updates to this repo are published to Slack via the Github Integration

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
