// Dependencies
// Framework
import dynamic from "next/dynamic";

// Styling
// Local Style Sheets
import "../../public/styles/global.css";

// Types
import type { Metadata, Viewport } from "next";

// Context Providers
import ReduxProvider from "../providers/reduxProvider";
import FonciiProvider from "../providers/fonciiProvider";

// Components
// Dynamic
const MainMap = dynamic(
  () => import("../components/map-components/main-map/MainMap"),
  { ssr: false }
);
const NavigationHeader = dynamic(
  () => import("../components/headers/navigation-header/NavigationHeader"),
  { ssr: false }
);

// Global Overlays
import { TopLoadingIndicator } from "../components/loading-indicators/top-loading-indicator/TopLoadingIndicator";
import { GlobalInterstitialOverlay } from "../components/overlays/global-interstitial-overlay/GlobalInterstitialOverlay";
import NotificationCenter from "../components/notification-center/NotificationCenter";
import { StagingAuthorizationOverlay } from "../components/overlays/staging-authorization-overlay/StagingAuthorizationOverlay";
import UndergoingMaintenanceOverlay from "../components/overlays/undergoing-maintenance-overlay/UndergoingMaintenanceOverlay";

// Dynamic Metadata
// https://nextjs.org/docs/app/api-reference/functions/generate-metadata
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: {
      template: "%s | Foncii",
      default: "Foncii", // a default is required when creating a template
    },
    keywords:
      "Foncii, Foncii Maps, Maps, Restaurants, Food, Cuisines, TikTok, Google, Google Maps",
    openGraph: {
      type: "website",
      images: [
        "https://cdn.foncii.com/foncii-maps/media/static-media/foncii-maps-hero.jpg",
      ],
    },
    description:
      "Foncii: Get personalized restaurant recommendations in seconds. Foncii is the foodie friend you wish you had.",
    manifest: "./manifest.json",
    icons: {
      apple: "/apple-icon.png",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#EB5757",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ReduxProvider>
          <FonciiProvider>
            <MainMap>
              <NotificationCenter />
              <UndergoingMaintenanceOverlay />
              <StagingAuthorizationOverlay />
              <GlobalInterstitialOverlay />
              <TopLoadingIndicator />
              <NavigationHeader />
              {children}
            </MainMap>
          </FonciiProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
