// Dependencies
// Framework
import Script from "next/script";
import dynamic from "next/dynamic";

// Types
import { Metadata } from "next";

// Components
import FonciiFullLogoIcon from "../../components/icons/foncii-icons/foncii-maps/full-logo-icon/FonciiFullLogoIcon";
import GalleryPanel from "../../components/panels/gallery-panel/GalleryPanel";
import UserDynamicIslandWidget from "../../components/menus/user-menu/widgets/UserDynamicIslandWidget";

// Dynamic
const UserReferralModal = dynamic(
  () => import("../../components/modals/user-referral/UserReferralModal"),
  { ssr: false }
);
const UserSideMenuWidget = dynamic(
  () => import("../../components/menus/user-menu/widgets/UserSideMenuWidget"),
  { ssr: false }
);
const ManualMapUpdateButton = dynamic(
  () =>
    import(
      "../../components/map-components/manual-map-update-button/ManualMapUpdateButton"
    ),
  { ssr: true }
);
const AuthModal = dynamic(
  () => import("../../components/modals/auth-modal/AuthModal"),
  { ssr: false }
);
const ReservationModal = dynamic(
  () => import("../../components/modals/reservations/UserReservedModal"),
  { ssr: false }
);
const ImportExperienceLoaderModal = dynamic(
  () =>
    import(
      "../../components/modals/import-experience-loader-modal/ImportExperienceLoaderModal"
    ),
  { ssr: false }
);

// Dynamic Metadata
type ExplorePageProps = {
  searchParams: { [key: string]: string | string[] | undefined };
};

// Meta Tag Generators
import {
  explorePageMetaTagGenerator,
  postDetailViewMetaTagGenerator,
  restaurantDetailViewMetaTagGenerator,
} from "../../repositories/meta-data-generators";

// Structured Data Generators
import {
  organizationStructuredDataGenerator,
  structuredWebSiteDataGenerator,
} from "../../repositories/structured-data-generators";

// Dynamic Metadata
export async function generateMetadata({
  searchParams,
}: ExplorePageProps): Promise<Metadata> {
  // Parsing
  // URL State Properties
  const { p, r } = searchParams,
    postID = p ? String(p) : undefined,
    restaurantID = r ? String(r) : undefined;

  // Conditional metadata
  const postDetailViewDisplayed = postID != undefined,
    restaurantDetailViewDisplayed = restaurantID != undefined;

  if (postDetailViewDisplayed) {
    return postDetailViewMetaTagGenerator({ params: { postID } });
  } else if (restaurantDetailViewDisplayed) {
    return restaurantDetailViewMetaTagGenerator({ params: { restaurantID } });
  } else {
    return explorePageMetaTagGenerator();
  }
}

export default async function Explore({ searchParams }: ExplorePageProps) {
  // State Management
  // URL State
  const { ur, auth, rsc } = searchParams,
    displayUserReferralModal = ur == "true",
    displayAuthModal = auth == "true",
    displayReservationModal = rsc == "true";

  // Convenience
  const displayingUserReferralModal = (): boolean =>
    displayUserReferralModal == true;
  const displayingAuthModal = (): boolean => displayAuthModal == true;
  const displayingReservationModal = (): boolean => displayReservationModal == true;

  // Subcomponents
  // Redirects the user to the explore page aka this page.
  const FonciiMapsAttribution = (): React.ReactNode => {
    return (
      <div className="hidden md:flex fixed top-0 left-0 pt-[20px] pl-[20px] w-[175px]">
        <FonciiFullLogoIcon withLink />
      </div>
    );
  };

  const ContentSection = (): React.ReactNode => {
    return (
      <div className="flex h-full w-full z-[10]">
        <div className="flex flex-col z-[10] w-full">
          <span className="hidden md:block">{FonciiMapsAttribution()}</span>

          <div className="fixed transition-all duration-500 top-[16px] xl:opacity-100 xl:w-[calc(100dvw-590px)] w-full flex items-center justify-center h-fit m-auto ease-in-out pointer-events-none opacity-0">
            <UserDynamicIslandWidget />
          </div>

          <div className="fixed xl:w-[calc(100dvw-590px)] w-full flex items-center justify-center h-fit pt-[12px] bottom-[220px] md:bottom-[260px] xl:bottom-[40px] m-auto transition-all ease-in-out pointer-events-none">
            <ManualMapUpdateButton />
          </div>

          <GalleryPanel />
        </div>
      </div>
    );
  };

  const Modals = (): React.ReactNode | undefined => {
    if (displayingUserReferralModal()) {
      return <UserReferralModal />;
    } else if (displayingAuthModal()) {
      return <AuthModal />;
    } else if (displayingReservationModal()) {
      return <ReservationModal />;
    } else {
      return <ImportExperienceLoaderModal />;
    }
  };

  // Homepage specific dynamically generated structured data
  const StructuredDataScripts = () => {
    return (
      <>
        <Script
          id="structured-organization-data-markup"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: organizationStructuredDataGenerator(),
          }}
        />

        <Script
          id="structured-WebSite-search-data-markup"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: structuredWebSiteDataGenerator() }}
        />
      </>
    );
  };

  return (
    <main>
      {StructuredDataScripts()}
      {ContentSection()}
      <Modals />
      <UserSideMenuWidget />
    </main>
  );
}
