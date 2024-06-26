/** @type {import('next').NextConfig} */

const childProcess = require("child_process");
let lastCommitHash = "";
try {
  lastCommitHash = childProcess
    .execSync("git rev-parse --short HEAD")
    .toString()
    .trim();
} catch (e) {
  console.error(e);
}

const nextConfig = {
  reactStrictMode: true, // Note this renders components twice in dev to detect defects, be aware of this when useEffect fires twice
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  generateBuildId: async () => {
    // Return custom build ID, like the latest git commit hash
    console.log("COMMIT HASH FOR BUILD ID: " + lastCommitHash);
    return JSON.stringify(lastCommitHash);
  },

  // Learn more here: https://nextjs.org/docs/pages/api-reference/next-config-js/redirects
  async redirects() {
    return [
      {
        source: "/explore", // Exact path match
        destination: "/",
        permanent: true, // /explore is a simple path most people might enter to navigate to the explore page,
        // so a permanent redirect is valid just to allow people some redundancy
      },
      {
        source: "/landing",
        destination: "/", // Temp redirect to the home page until the landing page is unindexed
        permanent: false,
      },
      {
        source: "/login",
        destination: "/?af=0&auth=true", // Auth modal w/ log in form
        permanent: true,
      },
      {
        source: "/signup",
        destination: "/?af=1&auth=true", // Auth modal w/ sign up form
        permanent: true,
      },
      {
        source: "/reset-password",
        destination: "/?af=2&auth=true", // Auth modal w/ reset password form
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
