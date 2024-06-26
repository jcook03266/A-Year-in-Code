/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Types
import {
  ArticlePublication,
  FmUserPost,
  FonciiRestaurant,
  Publication,
  RestaurantAward,
} from "../../../../../../__generated__/graphql";
import {
  MediaServerImageFitParams,
  MediaServerImageFormatParams,
} from "../../../../../../services/media/service-adapters/cloudStorageServiceAdapter";

// Components
// Local
import RestaurantDistanceLabel from "../../../../../../components/labels/restaurant-distance-label/RestaurantDistanceLabel";
import RestaurantFeaturedInLinkButton from "../../../../../../components/buttons/links/restaurant-featured-in-link-button/RestaurantFeaturedInLinkButton";
import InfluencerInsightsLinkButton from "../../../../../../components/buttons/links/influencer-insights-link-button/InfluencerInsightsLinkButton";
import RestaurantHoursWidget from "./components/RestaurantHoursWidget";
import CategoryChip from "../../../../../../components/chips/categorychip/CategoryChip";
import FonciiRestaurantCard from "../../../../../../components/restaurant-entities/foncii-restaurants/regular-format/FonciiRestaurantCard";
import GalleryPostCard from "../../../../../../components/restaurant-entities/gallery-page/GalleryPostCard";
import PublicationStack from "./components/PublicationStack";

// External
import Image from "next/image";
import Link from "next/link";

// Services
import AnalyticsService, {
  AnalyticsEvents,
} from "../../../../../../services/analytics/analyticsService";

// Hooks
import { useEffect, useMemo, useState } from "react";
import { useRouterSearchParams } from "../../../../../../hooks/UseRouterSearchParamsHook";
import { useRouter } from "next/navigation";
import useEntityFilters from "../../../../../../hooks/UseEntityFilters";

// Formatting
import {
  formattedCreatorUsername,
  possessiveFormattedUsernameCopy,
  uppercaseFirstLetter,
} from "../../../../../../utilities/formatting/textContentFormatting";
import {
  PriceLevels,
  convertNumericPriceLevelToDollarSigns,
} from "../../../../../../extensions/Restaurant+Extensions";

// Assets
import { ImageRepository } from "../../../../../../../public/assets/images/ImageRepository";

// Redux
import { FonciiRestaurantActions } from "../../../../../../redux/operations/dispatchers";
import { getPostFiltersSlice } from "../../../../../../redux/operations/selectors";

// Formatting
import { DateFormatter } from "../../../../../../utilities/formatting/miscFormatters";

// Navigation
import {
  ExternalLinks,
  NavigationProperties,
  PostFilterURLParameters,
  currentPageCanonicalURL,
} from "../../../../../../core-foncii-maps/properties/NavigationProperties";

// Animation
import { AnimatePresence, motion } from "framer-motion";

// Utilities
import { resizableImageRequestBuilder } from "../../../../../../utilities/tooling/resizableImageRequestBuilder";
import { cn } from "../../../../../../utilities/development/DevUtils";

export default function SharedRestaurantDetailSections({
  fonciiRestaurant,
  post,
}: {
  fonciiRestaurant?: FonciiRestaurant;
  post?: FmUserPost;
}): React.ReactNode {
  // State Management
  // Redux
  const restaurantEntityFilters = getPostFiltersSlice()();

  // Secondary data
  const [associatedPosts, setAssociatedPosts] = useState<FmUserPost[]>([]);
  const [similarRestaurants, setSimilarRestaurants] = useState<
    FonciiRestaurant[]
  >([]);

  // Routing
  const routerSearchParams = useRouterSearchParams();

  // Filtering
  const entityFilters = useEntityFilters();

  // Navigation
  const router = useRouter();

  // Parsing
  // Restaurant data [shared]
  const restaurant = fonciiRestaurant?.restaurant,
    restaurantID = restaurant?.id,
    description = restaurant?.description,
    categories = restaurant?.categories ?? [],
    priceLevel = restaurant?.priceLevel,
    formattedAddress = restaurant?.addressProperties.formattedAddress,
    city = restaurant?.addressProperties.city,
    phoneNumber = restaurant?.phoneNumber,
    operatingHours = restaurant?.operatingHours ?? undefined,
    isOpen = fonciiRestaurant?.isOpen ?? false,
    utcOffset = fonciiRestaurant?.restaurant.utcOffset ?? undefined, // In minutes
    associatedArticlePublications = useMemo(() => {
      return (
        [...(fonciiRestaurant?.associatedArticlePublicationEdges ?? [])] ?? []
      );
    }, [fonciiRestaurant?.associatedArticlePublicationEdges]),
    associatedRestaurantAwards = useMemo(() => {
      return (
        [...(fonciiRestaurant?.associatedRestaurantAwardEdges ?? [])] ?? []
      );
    }, [fonciiRestaurant?.associatedRestaurantAwardEdges]);

  // Post Creator [For posts]
  const postCreator = post?.creator,
    postCreatorID = postCreator?.id,
    postID = post?.id;

  // Load required secondary data when component mounts
  useEffect(() => {
    loadSecondaryData();
  }, [fonciiRestaurant]);

  // Business Logic
  const loadSecondaryData = async () => {
    if (!restaurantID) return;

    const [posts, restaurants] = await Promise.all([
      FonciiRestaurantActions.findAssociatedPostsFor({
        fonciiRestaurantID: restaurantID,
        creatorID: post?.creator.id,
        postsToExclude: isAUserPost ? [post?.id ?? ""] : undefined,
      }),
      FonciiRestaurantActions.findRestaurantsSimilarTo(restaurantID),
    ]);

    // Update local state with fetched data
    setAssociatedPosts(posts);
    setSimilarRestaurants(restaurants);

    // Update global store
    restaurants.forEach((restaurant) => {
      FonciiRestaurantActions.appendRestaurant(restaurant);
    });
  };

  function trackPublicationLinkClickEvent({
    publication,
    destinationURL,
  }: {
    publication: string;
    destinationURL: string;
  }) {
    if (!fonciiRestaurant) return;

    // Parsing
    const fonciiRestaurantID = fonciiRestaurant.restaurant.id,
      postID = post?.id,
      percentMatchScore = fonciiRestaurant.percentMatchScore,
      qualityScore = fonciiRestaurant.qualityScore;

    AnalyticsService.shared
      .trackArticlePublicationClick({
        publication,
        fonciiRestaurantID,
        postID,
        percentMatchScore,
        qualityScore,
        destinationURL,
        sourceURL: currentPageCanonicalURL(location),
      });
  }

  // Action Handlers
  const handleCustomTagToggle = (tag: string): void => {
    const updatedFilters: PostFilters = { ...entityFilters.getStoredFilters() },
      customCategoriesSet = new Set(updatedFilters.customCategories);

    if (customCategoriesSet.has(tag)) {
      customCategoriesSet.delete(tag);
    } else {
      customCategoriesSet.add(tag);
    }

    let categoryArray = [...customCategoriesSet];
    updatedFilters.customCategories = categoryArray;

    // Update URL state and local store
    routerSearchParams.setParams({
      [PostFilterURLParameters.customUserTags]: categoryArray,
    });
    entityFilters.updateFilters(updatedFilters);
  };

  // Actions
  const onUserPostClickAction = (post: FmUserPost) => {
    // Parsing
    const postID = post.id,
      username = post.creator.username;

    if (restaurantEntityFilters.currentlySelectedPostID != postID) {
      AnalyticsService.shared.trackGenericEvent(AnalyticsEvents.POST_SELECTED, {
        fonciiRestaurantID: restaurantID,
        postID: isAUserPost ? postID : undefined,
        selectionSource: "associated-posts-user-post-card",
        origin: currentPageCanonicalURL(location),
      });
    }

    // Don't persist the current URL state, this will be hydrated automatically
    // The card's onClick handles disabling any unused / conflicting URL state properties already
    router.push(
      NavigationProperties.galleryPageModalPostDetailViewLink({
        username,
        postID,
        returnURL: location.href,
      })
    );
  };

  const onFonciiRestaurantClickAction = (
    fonciiRestaurant: FonciiRestaurant
  ) => {
    // Parsing
    const restaurantID = fonciiRestaurant.restaurant.id;

    if (restaurantEntityFilters.currentlySelectedPostID != restaurantID) {
      AnalyticsService.shared.trackGenericEvent(
        AnalyticsEvents.FONCII_RESTAURANT_SELECTED,
        {
          fonciiRestaurantID: restaurantID,
          postID: isAUserPost ? postID : undefined,
          selectionSource: "similar-restaurants-foncii-restaurant-card",
          origin: currentPageCanonicalURL(location),
        }
      );
    }

    // Don't persist the current URL state, this will be hydrated automatically
    // The card's onClick handles disabling any unused / conflicting URL state properties already
    router.push(
      NavigationProperties.explorePageModalRestaurantDetailViewLink({
        restaurantID,
        returnURL: location.href,
      })
    );
  };

  // Convenience
  const isAUserPost = postCreator != undefined;

  /**
   * Filters out the post creator (if any) from the influencer insights, this is
   * done when querying the DB, but this is an extra precaution in order to prevent the user
   * from being an influencer insight on their own post
   *
   * @returns -> User posts from 'influencers' that have given their input on the associated restaurant
   */
  const processedInfluencerInsights = useMemo((): FmUserPost[] => {
    const influencerInsights = fonciiRestaurant?.influencerInsightEdges ?? [];

    // No user to filter out of the influencer insights
    if (!isAUserPost) return influencerInsights;

    // Filter and sort so that the order is the same every time it's loaded
    return influencerInsights
      .filter((influencerInsight) => {
        influencerInsight.creator.id != postCreator?.id;
      })
      .sort((a, b) => {
        return b.id.localeCompare(a.id);
      });
  }, [fonciiRestaurant?.influencerInsightEdges, isAUserPost, postCreator?.id]);

  // Sorted alphabetically
  const processedAssociatedArticlePublications = useMemo((): [
    string,
    Publication[]
  ][] => {
    const articles = [...associatedArticlePublications];
    // Step 1: Group by publication
    const groupedPublications = articles.reduce((acc, article) => {
      const key = article.publication;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(article);
      return acc;
    }, {} as Record<string, ArticlePublication[]>);

    // Step 2: Sort each group by title
    for (const groupKey in groupedPublications) {
      if (Object.prototype.hasOwnProperty.call(groupedPublications, groupKey)) {
        groupedPublications[groupKey].sort((a, b) =>
          a.title.localeCompare(b.title)
        );
      }
    }

    // Step 3: Sort groups by the number of publications
    return Object.entries(groupedPublications).sort(
      ([, groupA], [, groupB]) => groupB.length - groupA.length
    );
  }, [associatedArticlePublications]);

  const processedAssociatedRestaurantAwards = useMemo((): [
    string,
    Publication[]
  ][] => {
    const awards = [...associatedRestaurantAwards];
    // Step 1: Group by publication
    const groupedAwards = awards.reduce((acc, award) => {
      const key = award.organization;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(award);
      return acc;
    }, {} as Record<string, RestaurantAward[]>);

    // Step 2: Sort each group by title
    for (const groupKey in groupedAwards) {
      if (Object.prototype.hasOwnProperty.call(groupedAwards, groupKey)) {
        groupedAwards[groupKey].sort((a, b) => a.title.localeCompare(b.title));
      }
    }

    // Step 3: Sort groups by the number of publications
    return Object.entries(groupedAwards).sort(
      ([, groupA], [, groupB]) => groupB.length - groupA.length
    );
  }, [associatedRestaurantAwards]);

  // Subcomponents
  const RestaurantDescription = (): React.ReactNode => {
    if (!description) return;

    return (
      <p className="text-[16px] font-normal text-permanent_white shrink-0 h-fit w-full">
        {description}
      </p>
    );
  };

  const PrimaryCategoryLabel = (): React.ReactNode => {
    const primaryCuisine = categories[0];

    if (!primaryCuisine) return;
    else
      return (
        <p className="font-semibold text-[16px] text-permanent_white line-clamp-1 pl-[16px] pr-[16px]">
          {uppercaseFirstLetter(primaryCuisine)}
        </p>
      );
  };

  const PriceLevelLabel = (): React.ReactNode => {
    const dollarSignConversion =
      convertNumericPriceLevelToDollarSigns(priceLevel),
      priceLevelDescription =
        priceLevel != PriceLevels.none ? dollarSignConversion : "N/A";

    return (
      <p
        className={`font-semibold text-[16px] text-permanent_white line-clamp-1 pr-[16px] shrink-0`}
      >
        {priceLevelDescription}
      </p>
    );
  };

  const CityLabel = (): React.ReactNode => {
    return (
      <p
        className={`font-semibold text-[16px] text-permanent_white line-clamp-1 px-[16px] shrink-0`}
      >
        {city}
      </p>
    );
  };

  const AddressLabel = (): React.ReactNode => {
    if (!formattedAddress) return;

    return RestaurantContactInfoSectionRow(
      ImageRepository.UtilityIcons.MapPinIconOutline,
      formattedAddress
    );
  };

  const phoneNumberContactLink = (): React.ReactNode => {
    if (!phoneNumber) return;

    return (
      <div className="flex flex-row gap-x-[16px] underline">
        <Link
          href={ExternalLinks.createPhoneNumberLink(phoneNumber)}
          target="_blank"
          rel="noreferrer"
          className="hover:opacity-60 transition-opacity ease-in-out"
          onClick={
            // Analytics
            () =>
              AnalyticsService.shared.trackGenericEvent(
                AnalyticsEvents.DETAIL_VIEW_PHONE_LINK_CLICKED,
                {
                  restaurantID,
                  postCreatorID,
                  postID,
                  origin: currentPageCanonicalURL(location),
                  phoneNumber,
                }
              )
          }
        >
          {RestaurantContactInfoSectionRow(
            ImageRepository.UtilityIcons.PhoneIcon,
            phoneNumber
          )}
        </Link>
      </div>
    );
  };

  const RestaurantContactInfoSectionRow = (
    icon: any,
    text?: string
  ): React.ReactNode => {
    return text ? (
      <div className="gap-x-[8px] flex flex-row w-fit items-center">
        <Image
          width={20}
          height={20}
          className="w-[20px] h-[20px]"
          src={icon}
          alt="Restaurant Contact Info Icon"
        />
        <p
          className={`text-[16px] font-normal text-permanent_white line-clamp-1`}
        >
          {text}
        </p>
      </div>
    ) : undefined;
  };

  const RestaurantPropertiesSection = (): React.ReactNode => {
    /** Cuisine / Price / Distance Information */
    return (
      <div
        className={cn(`flex flex-col gap-y-[20px]`, description ? "pt-[16px]" : "")}
      >
        <div className="flex flex-row items-start justify-start divide-x-[1px] divide-permanent_white">
          <PriceLevelLabel />
          <PrimaryCategoryLabel />
          <CityLabel />

          <span className="pl-[16px]">
            <RestaurantDistanceLabel
              restaurant={restaurant}
              className={"text-[16px] font-semibold"}
            />
          </span>
        </div>

        {AddressLabel()}
        <RestaurantHoursWidget
          operatingHours={operatingHours}
          isOpen={isOpen}
          utcOffset={utcOffset}
        />
        {phoneNumberContactLink()}
      </div>
    );
  };

  // For user posts only
  const PostCreatorSection = (): React.ReactNode => {
    // Precondition failure, no user data available
    if (!post || !postCreator) return;

    // Parsing
    const rating = post.customUserProperties?.rating,
      username = postCreator.username,
      userProfilePicture = postCreator.profilePictureURL,
      notes = post.customUserProperties?.notes,
      tags = post.customUserProperties.categories ?? [];

    // Convenience
    const formattedRating = (): string => {
      if (!rating) return "N/A";

      return `${rating.toFixed(1)} / 5.0`;
    };

    // Subcomponents
    const AvatarImageView = (): React.ReactNode => {
      const avatarImageURL = () => {
        if (userProfilePicture) {
          return resizableImageRequestBuilder({
            baseImageURL: userProfilePicture,
            imageResizingProps: {
              height: 400,
              width: 400,
              fit: MediaServerImageFitParams.cover,
              format: MediaServerImageFormatParams.f3,
            },
          });
        } else return ImageRepository.Placeholders.FonciiLogoPostFallback;
      };

      return (
        <Image
          fetchPriority="high"
          src={avatarImageURL()}
          alt={`${possessiveFormattedUsernameCopy(username)} profile picture`}
          height={140}
          width={140}
          className={`object-cover w-[120px] h-[120px] md:h-[140px] md:w-[140px] transition-all ease-in-out duration-200 shadow-lg bg-black shrink-0`}
          unselectable="on"
        />
      );
    };
    const UsernameLabel = (): React.ReactNode => {
      return (
        <h3 className="font-semibold text-permanent_white text-[20px] w-fit h-fit line-clamp-1 transition-all ease-in-out leading-relaxed">
          @{formattedCreatorUsername(username)}
        </h3>
      );
    };

    const NotesLabel = (): React.ReactNode => {
      if (!notes) return;

      // Center the notes when they're below the given threshold, above this fold the notes will be aligned at the top
      const scrollableNotes = notes.length >= 200;

      // Highlight the hash tags
      const attributedNotes =
        `"` +
        notes.replace(
          /(^|\W)([@#]\w+(?:[-']\w+)*)(?=\W|$)/g,
          `$1<span class='text-primary opacity-90 hover:opacity-75 ease-in-out transition-all cursor-default'>$2</span>`
        ) +
        `"`;

      return (
        <div
          className={cn(`flex w-fit h-full overflow-y-auto overflow-x-hidden`, scrollableNotes ? "" : "items-center")}
        >
          <p
            className="font-normal text-permanent_white text-[16px] w-full h-fit py-[8px] break-words"
            dangerouslySetInnerHTML={{ __html: attributedNotes }}
          />
        </div>
      );
    };

    const RatingLabel = (): React.ReactNode => {
      if (!rating) return;

      return (
        <div className="flex flex-row gap-x-[4px] items-center justify-center w-fit h-fit shrink-0">
          <Image
            src={ImageRepository.UtilityIcons.FonciiSalmonRedStarIcon}
            alt={`Foncii Star Rating Icon`}
            height={16}
            width={16}
            className={`h-fit w-fit transition-all ease-in-out duration-200`}
            unselectable="on"
          />
          <p className="text-[16px] text-permanent_white font-semibold w-fit h-fit shrink-0">
            {formattedRating()}
          </p>
        </div>
      );
    };

    const UsernameSection = (): React.ReactNode => {
      return (
        <div className="flex flex-row gap-x-[4px] items-center justify-start w-fit h-fit shrink-0">
          <UsernameLabel />
          {RatingLabel()}
        </div>
      );
    };

    // Not rendered when no notes or tags are provided
    const UserContent = (): React.ReactNode => {
      if (!notes || notes.length == 0) return;

      return (
        <div className="flex flex-col w-full h-full px-[16px]">
          <NotesLabel />
        </div>
      );
    };

    const TagCollection = (): React.ReactNode => {
      if (tags.length == 0) return;

      return (
        <div className="flex flex-wrap gap-[8px] items-center justify-start shrink-0">
          {tags.map((tag) => {
            return (
              <CategoryChip
                key={tag}
                title={tag}
                onClickAction={() => handleCustomTagToggle(tag)}
              />
            );
          })}
        </div>
      );
    };

    return (
      <div className="flex flex-col gap-y-[8px] w-full h-fit shrink-0 pt-[16px]">
        {UsernameSection()}

        <div className="overflow-hidden shadow-xl flex flex-row w-full h-[120px] md:h-[140px] cursor-default transition-all ease-in-out bg-light_dark_grey rounded-[10px] justify-items-stretch items-start">
          {AvatarImageView()}
          {UserContent()}
        </div>

        <TagCollection />
      </div>
    );
  };

  const Publications = ({
    processedPublications,
    title,
  }: {
    processedPublications: [string, Publication[]][];
    title: "Awards" | "Publications";
  }): React.ReactNode => {
    if (processedPublications.length == 0) return;

    const groups = processedPublications.map(
      ([publicationName, publications], topIndex) => {
        return (
          <PublicationStack
            publications={publications}
            publicatonName={publicationName}
            key={topIndex}
            trackPublicationLinkClickEvent={trackPublicationLinkClickEvent}
          />
        );
      }
    );

    return (
      <>
        <h3 className="text-permanent_white text-[18px] font-normal">
          {title}
        </h3>
        <div className="flex flex-col w-full gap-y-[16px]">{groups}</div>
      </>
    );
  };

  const Articles = (): React.ReactNode => {
    return Publications({
      processedPublications: processedAssociatedArticlePublications,
      title: "Publications",
    });
  };

  const Ratings = (): React.ReactNode => {
    const googleRating = restaurant?.googleProperties?.rating ?? undefined,
      googleExternalURL =
        restaurant?.googleProperties?.externalURL ??
        ExternalLinks.createGoogleSearchLinkForRestaurant(restaurant),
      yelpRating = restaurant?.yelpProperties?.rating ?? undefined,
      yelpExternalURL =
        restaurant?.yelpProperties?.externalURL ??
        ExternalLinks.createYelpSearchLinkForRestaurant(restaurant);

    if (!googleRating && !yelpRating) return;

    return (
      <>
        <h3 className="text-permanent_white text-[16px] font-normal">
          Other ratings
        </h3>
        {/** Google */}
        {googleRating ? (
          <RestaurantFeaturedInLinkButton
            title="Google"
            icon={ImageRepository.CompanyLogos.GoogleLogo}
            rating={googleRating}
            externalLink={googleExternalURL}
          />
        ) : undefined}

        {/** Yelp */}
        {yelpRating ? (
          <RestaurantFeaturedInLinkButton
            title="Yelp"
            icon={ImageRepository.CompanyLogos.YelpLogo}
            rating={yelpRating}
            externalLink={yelpExternalURL}
          />
        ) : undefined}
      </>
    );
  };

  const Awards = (): React.ReactNode => {
    return Publications({
      processedPublications: processedAssociatedRestaurantAwards,
      title: "Awards",
    });
  };

  const FeaturedInSection = (): React.ReactNode => {
    const googleRating = restaurant?.googleProperties?.rating ?? undefined,
      yelpRating = restaurant?.yelpProperties?.rating ?? undefined;

    // Precondition failure, no external associated data to present to the user
    if (
      !googleRating &&
      !yelpRating &&
      associatedArticlePublications?.length == 0 &&
      associatedRestaurantAwards?.length == 0
    )
      return;

    return (
      <AnimatePresence>
        <motion.div
          key={`FeaturedInSection`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="flex flex-col gap-y-[16px] pt-[16px]"
        >
          <h3 className="text-permanent_white text-[20px] font-normal">
            Recognized by
          </h3>

          {Articles()}
          {Ratings()}
          {Awards()}
        </motion.div>
      </AnimatePresence>
    );
  };

  const InfluencerInsightsSection = (): React.ReactNode => {
    const influencerInsights = processedInfluencerInsights;

    // Precondition failure, no user data available
    if (influencerInsights.length == 0) return;

    const dynamicText = isAUserPost
      ? `Here's what other influencers are saying:`
      : `Here's what influencers are saying:`;

    return (
      <AnimatePresence>
        <motion.div
          key={`InfluencerInsightsSection`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="flex flex-col gap-y-[16px] pt-[16px]"
        >
          <h3 className="text-permanent_white text-[20px] font-normal">
            {dynamicText}
          </h3>
          {influencerInsights.map((post) => {
            return (
              <InfluencerInsightsLinkButton
                key={post.id}
                influencerPost={post}
              />
            );
          })}
        </motion.div>
      </AnimatePresence>
    );
  };

  const PreviousVisitsSection = (): React.ReactNode => {
    // Precondition failure, no data available or not in a post page
    if (associatedPosts.length == 0 || !post) return;

    const title = `${post.creator.username}'${post.creator.username.slice(-1) === "s" ? "" : "s"} previous visits:`;

    return (
      <AnimatePresence>
        <motion.div
          key={`AssociatedPostsSection`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeIn" }}
          className="flex flex-col gap-y-[16px] pt-[16px]"
        >
          <h3 className="text-permanent_white text-[20px] font-normal">
            {title}
          </h3>
          <div className="w-full h-fit pb-[16px] overflow-x-auto overflow-y-hidden transition-all ease-in-out">
            <div className="flex flex-row gap-x-[16px] w-fit h-fit">
              {associatedPosts.map((post, index) => {
                return (
                  <GalleryPostCard
                    key={index}
                    post={post}
                    sourceFonciiRestaurantID={restaurantID}
                    sourcePostID={postID}
                    disableSaveRestaurantButton
                    onClickAction={() => onUserPostClickAction(post)}
                    includeHeader
                  />
                );
              })}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  };

  const SimilarRestaurantsSection = (): React.ReactNode => {
    // Precondition failure, no data available
    if (similarRestaurants.length == 0) return;

    const title = `You might also enjoy:`;

    return (
      <AnimatePresence>
        <motion.div
          key={`SimilarRestaurantsSection`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeIn" }}
          className="flex flex-col gap-y-[16px] pt-[16px]"
        >
          <h3 className="text-permanent_white text-[20px] font-normal">
            {title}
          </h3>
          <div className="w-full h-fit py-[8px] overflow-x-auto overflow-y-hidden transition-all ease-in-out">
            <div className="flex flex-row gap-x-[16px] w-fit h-fit">
              {similarRestaurants.map((fonciiRestaurant, index) => {
                return (
                  <FonciiRestaurantCard
                    key={index}
                    fonciiRestaurant={fonciiRestaurant}
                    disableSaveRestaurantButton
                    sourceFonciiRestaurantID={restaurantID}
                    sourcePostID={postID}
                    onClickAction={() =>
                      onFonciiRestaurantClickAction(fonciiRestaurant)
                    }
                  />
                );
              })}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // Metadata related to post creation / update event logging timestamps
  const TemporalMetadataSection = (): React.ReactNode => {
    if (isAUserPost && !post) return;

    const originalPostCreationDate = isAUserPost
      ? post!.dataSource?.creationDate ?? post!.creationDate
      : restaurant?.creationDate,
      formattedCreationDate = originalPostCreationDate
        ? DateFormatter.formatDateToMDY(new Date(originalPostCreationDate))
        : "";

    const lastUpdatedDate = isAUserPost
      ? post!.lastUpdated
      : restaurant?.lastUpdated,
      formattedLastUpdatedDate = lastUpdatedDate
        ? DateFormatter.formatDateToMDY(new Date(lastUpdatedDate))
        : "";

    return (
      <div className="flex flex-row gap-x-[4px] text-neutral text-[12px] font-normal h-fit w-full pt-[16px]">
        <p>{`${isAUserPost ? "Posted On" : "Added to Foncii On"}: ${formattedCreationDate}`}</p>
        <p>|</p>
        <p>{`Last Updated: ${formattedLastUpdatedDate}`}</p>
      </div>
    );
  };

  return fonciiRestaurant ? (
    <div className="flex flex-col gap-y-[16px] divide-y-[1px] divide-medium">
      {RestaurantDescription()}
      {RestaurantPropertiesSection()}
      {PostCreatorSection()}
      {FeaturedInSection()}
      {InfluencerInsightsSection()}
      {PreviousVisitsSection()}
      {SimilarRestaurantsSection()}
      {TemporalMetadataSection()}
    </div>
  ) : undefined;
}
