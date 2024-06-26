"use client";
// Dependencies
// Types
import { FmUserPost } from "../../../../__generated__/graphql";

// Redux
import { getFonciiUserSlice } from "../../../../redux/operations/selectors";
import { UserPostsActions } from "../../../../redux/operations/dispatchers";

// Components
import FonciiToolTip from "../../../tool-tips/FonciiToolTip";

// Styling
import ColorRepository, {
  ColorEnum,
} from "../../../../../public/assets/ColorRepository";

// Hooks
import { useRouteObserver } from "../../../../hooks/UseRouteObserver";

// Utils
import { cn } from "../../../../utilities/development/DevUtils";

interface FavoritePostButtonProps {
  post: FmUserPost;
}

export const FavoritePostButton = ({
  post,
}: FavoritePostButtonProps): React.ReactNode => {
  // State Management
  const fonciiUser = getFonciiUserSlice()();

  // Properties
  const creator = post.creator ?? undefined;

  // Observers
  const routeObserver = useRouteObserver();

  // Actions
  const favoritePostAction = () => {
    if (!isCurrentUserPostAuthor()) return;
    UserPostsActions.setFavoritedStateForPost(post, !isFavorited());
  };

  // Convenience
  const isFavorited = (): boolean => {
    return post.isFavorited;
  };

  const isCurrentUserPostAuthor = (): boolean => {
    return creator?.id == fonciiUser.user?.id;
  };

  // Only authors viewing their own gallery can interact with the favorite button / allow it to be rendered whe viewing their own post
  const canUserInteractWithButton = (): boolean => {
    return (
      routeObserver.isGalleryBeingViewedByAuthor() && isCurrentUserPostAuthor()
    );
  };

  // Show the icon when the viewer is the author, or is a visitor and the post has been favorited
  // non-author viewers cannot toggle the button of course. This gesture just gives a special highlight
  // to the author's personal favorites.
  return canUserInteractWithButton() || isFavorited() ? (
    <FonciiToolTip
      title={
        isFavorited()
          ? "Unfavorite this experience"
          : "Favorite this experience"
      }
    >
      <button
        className={cn(isCurrentUserPostAuthor()
          ? "hover:opacity-50 ease-in-out transition-all active:scale-90"
          : ""
          , 'w-fit h-fit pointer-events-auto items-center justify-center')}
        onClick={favoritePostAction}
        disabled={!isCurrentUserPostAuthor()}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill={
            ColorRepository.colors[
            isFavorited() ? ColorEnum.gold : ColorEnum.transparent
            ]
          }
        >
          <path
            d="M23.2865 8.28977C23.1552 8.41294 23.0265 8.52924 22.9004 8.63874C22.6755 8.83399 22.437 9.00316 22.1847 9.14686C21.9434 9.28428 21.6945 9.38252 21.4369 9.44333C21.1727 9.50569 20.8515 9.54674 20.4687 9.56218C20.2284 9.56163 20.0021 9.54019 19.7892 9.49912L19.5291 9.44894L19.3415 9.63595L14.7706 14.1922L14.5492 14.4129L14.6507 14.7086C14.7453 14.9844 14.8146 15.2675 14.8583 15.5584C14.9029 15.8546 14.9251 16.1503 14.9251 16.4457C14.9251 16.9338 14.8761 17.3657 14.7828 17.7448C14.6872 18.1333 14.5518 18.4974 14.3771 18.8385C14.203 19.1784 13.9843 19.5023 13.7194 19.8104C13.5364 20.0232 13.3414 20.2415 13.1345 20.4651L8.84344 16.1878L8.49014 15.8356L8.13715 16.1881L1.37088 22.9446L0.78785 23.1369L0.979757 22.5588L7.7577 15.8144L8.11358 15.4603L7.75801 15.1058L3.46308 10.8246C3.6817 10.6191 3.89615 10.4291 4.10642 10.2545C4.41658 9.99682 4.74343 9.7811 5.08711 9.60616C5.43206 9.43058 5.80059 9.29075 6.19365 9.18726C6.56789 9.08872 6.99985 9.03994 7.49396 9.0474L7.49396 9.04746H7.50151C7.79809 9.04746 8.09499 9.06962 8.39239 9.11409C8.68449 9.15777 8.96879 9.22682 9.24566 9.32124L9.53987 9.42157L9.76002 9.20212L14.3309 4.64588L14.5195 4.45788L14.4687 4.19646C14.427 3.9817 14.4055 3.75327 14.4055 3.51035C14.4055 3.15093 14.4424 2.84121 14.5104 2.577C14.5796 2.30796 14.6832 2.05316 14.8217 1.81149C14.9666 1.55881 15.1327 1.32498 15.32 1.10948C15.4298 0.98325 15.5508 0.850342 15.6831 0.710711L23.2865 8.28977Z"
            stroke={
              ColorRepository.colors[
              isFavorited() ? ColorEnum.gold : ColorEnum.permanent_white
              ]
            }
          />
        </svg>
      </button>
    </FonciiToolTip>
  ) : undefined;
};
