import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Foncii Maps",
    short_name: "Foncii",
    description:
      "Foncii: Get personalized restaurant recommendations in seconds. Foncii is the foodie friend you wish you had.",
    start_url: "/",
    display: "standalone",
    theme_color: "#191D2C",
    background_color: "#1E2334",
    icons: [
      {
        src: "favicon.ico",
        sizes: "64x64 32x32 24x24 16x16",
        type: "image/x-icon",
      },
      {
        src: "logo192.png",
        type: "image/png",
        sizes: "192x192",
      },
      {
        src: "logo512.png",
        type: "image/png",
        sizes: "512x512",
      },
    ],
  };
}
