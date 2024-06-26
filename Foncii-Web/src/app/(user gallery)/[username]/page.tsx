// Dependencies
// Framework
import dynamic from "next/dynamic";

// Types
import { Metadata } from "next";

// Components
import FonciiFullLogoIcon from "../../../components/icons/foncii-icons/foncii-maps/full-logo-icon/FonciiFullLogoIcon";
import GalleryPanel from "../../../components/panels/gallery-panel/GalleryPanel";
import GalleryAuthorHeader from "../../../components/user-posts/gallery-author-header/GalleryAuthorHeader";
import UserDynamicIslandWidget from "../../../components/menus/user-menu/widgets/UserDynamicIslandWidget";

// Dynamic
const UserReferralModal = dynamic(
  () => import("../../../components/modals/user-referral/UserReferralModal"),
  { ssr: false }
);
const UserSideMenuWidget = dynamic(
  () =>
    import("../../../components/menus/user-menu/widgets/UserSideMenuWidget"),
  { ssr: false }
);
const PostCreationButton = dynamic(
  () =>
    import(
      "../../../components/buttons/utility-buttons/post-creation-button/PostCreationButton"
    ),
  { ssr: false }
);
const AuthModal = dynamic(
  () => import("../../../components/modals/auth-modal/AuthModal"),
  { ssr: false }
);

// Dynamic Metadata
type UserGalleryPageProps = {
  params: { username: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

// Meta Tag Generators
import {
  galleryPageMetaTagGenerator,
  postDetailViewMetaTagGenerator,
  restaurantDetailViewMetaTagGenerator,
} from "../../../repositories/meta-data-generators";

// Services
import { FonciiAPIServerAdapter } from "../../../services/foncii-api/adapters/fonciiAPIServerAdapter";

// Navigation
import { notFound } from "next/navigation";

// Dynamic Metadata
export async function generateMetadata({
  params,
  searchParams,
}: UserGalleryPageProps): Promise<Metadata> {
  // Parsing
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
    return galleryPageMetaTagGenerator({ params });
  }
}

export default async function UserGallery({
  params,
  searchParams,
}: UserGalleryPageProps) {
  // State Management
  // URL State Properties
  const { ur, auth } = searchParams,
    displayUserReferralModal = ur == "true",
    displayAuthModal = auth == "true",
    username = params.username;

  // Determine if the requested user exists
  const serverAPI = new FonciiAPIServerAdapter({}),
    user = await serverAPI.performFindUserByUsername(username);

  // Trigger 404 since the target gallery doesn't exist
  if (!user) {
    notFound();
  }

  // Convenience
  const displayingUserReferralModal = (): boolean =>
    displayUserReferralModal == true;
  const displayingAuthModal = (): boolean => displayAuthModal == true;

  // Subcomponents
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
        <div className="flex flex-col z-[10] w-full transition-all ease-in-out duration-300">
          <span className="hidden md:block">{FonciiMapsAttribution()}</span>

          <div className="fixed duration-500 top-[16px] xl:opacity-100 xl:w-[calc(100dvw-590px)] w-full flex items-center justify-center h-fit m-auto transition-all ease-in-out pointer-events-none opacity-0">
            <UserDynamicIslandWidget />
          </div>

          <span className="xl:hidden fixed pt-[12px] pl-[8px]">
            <GalleryAuthorHeader hideWhenListViewEnabled />
          </span>

          <GalleryPanel />
          <PostCreationButton className="fixed bottom-[24px] right-[24px]" />
        </div>
      </div>
    );
  };

  const Modals = (): React.ReactNode | undefined => {
    if (displayingUserReferralModal()) {
      return <UserReferralModal />;
    } else if (displayingAuthModal()) {
      return <AuthModal />;
    }
  };

  return (
    <main>
      {ContentSection()}
      <Modals />
      <UserSideMenuWidget />
    </main>
  );
}
