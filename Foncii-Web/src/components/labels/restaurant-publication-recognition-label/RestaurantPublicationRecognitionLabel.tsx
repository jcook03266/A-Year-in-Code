"use client";
// Dependencies
// Types
import {
  ArticlePublication,
  RestaurantAward,
} from "../../../__generated__/graphql";

// Components
// Local
import FonciiToolTip from "../../../components/tool-tips/FonciiToolTip";

// External
import Image from "next/image";
import Link from "next/link";

/**
 * Label that showcases the different publications
 * passed to it.
 *
 * @param publications
 * @param isLoading -> Toggle this to true if loading the publications remotely,
 * false when not loading.
 */
function RestaurantPublicationRecognitionLabel({
  publications = undefined,
}: {
  publications?: (RestaurantAward | ArticlePublication)[];
}) {
  // Properties
  // Cut-off after 3 publications back to back and display the numeric bubble to indicate more
  const maxPublicationsToShow = 3;

  // The number to display for the `additionalProviderIndicatorBubble` subcomponent's text content
  const additionalProviderCount = (): number => {
    if (!sortedArticlePublications()) return 0;

    return Math.max(
      0,
      sortedArticlePublications().length - maxPublicationsToShow
    );
  };

  // Conditional Logic
  // Only display this label when defined and valid dimensional data is passed
  const shouldRender = (): boolean => {
    return (
      sortedArticlePublications() != undefined &&
      sortedArticlePublications()?.length > 0
    );
  };

  const shouldDisplayAdditionalProviderIndicator = (): boolean => {
    return additionalProviderCount() > 0;
  };

  // Sort the articles by publication name so they appear in the same order every time they're rendered
  const sortedArticlePublications = () => {
    if (!publications) return [];

    const softUniqueCopy = [...publications].reduce((acc, publication) => {
      const key =
        "organization" in publication
          ? publication.organization
          : publication.publication;
      if (!acc[key]) {
        acc[key] = publication;
      } else {
        // return a.publication.localeCompare(b.publication, undefined, { ignorePunctuation: true });
        acc[key] =
          new Date(acc[key].scrapeDate) > new Date(publication.scrapeDate)
            ? acc[key]
            : publication;
      }
      return acc;
    }, {} as Record<string, RestaurantAward | ArticlePublication>);

    return Object.entries(softUniqueCopy)
      .sort(([, publicationA], [, publicaitonB]) =>
        new Date(publicationA.scrapeDate) > new Date(publicaitonB.scrapeDate)
          ? 1
          : -1
      )
      .map((record) => record[1]);
  };

  // Subcomponents
  // Displays the favicon / logo of the provider, also doubles as a link to the publication's website itself if the user clicks on it, not the article
  const publicationProviderBubble = (
    publication: RestaurantAward | ArticlePublication,
    index: number = 0
  ): React.ReactElement => {
    const zIndex = index + 1;
    const referer =
      "organization" in publication
        ? publication.organization
        : publication.publication;

    return (
      <Link key={index} href={publication.url} target="_blank">
        <div
          className={`flex items-center justify-center rounded-full h-[18px] w-[18px] bg-permanent_white drop-shadow-lg hover:opacity-50 transition ease-in-out`}
          style={{
            zIndex,
            marginLeft: index > 0 ? "-5px" : "0px",
          }}
        >
          <FonciiToolTip title={referer}>
            <Image
              id={referer}
              src={publication.faviconLink}
              alt={`${referer} Logo`}
              width={11}
              height={11}
              unoptimized
              className="w-[12px] h-[12px] bg-permanent_white"
              unselectable="on"
            />
          </FonciiToolTip>
        </div>
      </Link>
    );
  };

  // Numeric counter that displays the amount of article providers not rendered but still associated with a restaurant
  const additionalProvidersIndicatorBubble = (): React.ReactElement | null => {
    if (!shouldDisplayAdditionalProviderIndicator()) return null;

    const zIndex = maxPublicationsToShow + 1;

    return (
      <FonciiToolTip
        title={`${additionalProviderCount()} Additional Publication${
          additionalProviderCount() > 1 ? "s" : ""
        }`}
      >
        <div
          className={`flex flex-shrink justify-center items-center bg-primary rounded-full w-[18px] h-[18px] text-left text-ellipsis drop-shadow-lg`}
          style={{
            zIndex,
            marginLeft: "-5px",
          }}
        >
          <p
            className={`text-permanent_white font-normal text-[9px]`}
          >{`+${additionalProviderCount()}`}</p>
        </div>
      </FonciiToolTip>
    );
  };

  const publicationProviderCollection = (): React.ReactElement => {
    return (
      <div className="flex flex-row flex-nowrap items-center justify-center">
        {sortedArticlePublications()
          .slice(0, maxPublicationsToShow)
          .map((publication, index) => {
            return publicationProviderBubble(publication, index);
          })}
        {additionalProvidersIndicatorBubble()}
      </div>
    );
  };

  return (
    <FonciiToolTip
      title={
        shouldRender()
          ? "Publications This Establishment is Featured In"
          : undefined
      }
    >
      <div
        className={`flex flex-shrink-0 flex-row flex-nowrap gap-x-[8px] items-center justify-start w-full ${
          shouldRender()
            ? "relative h-[20px] opacity-100"
            : "h-[0px] opacity-0 fixed"
        } transition-all ease-in pointer-events-auto`}
      >
        <p className={`text-permanent_white font-normal text-[16px]`}>
          Recognized by
        </p>
        {publicationProviderCollection()}
      </div>
    </FonciiToolTip>
  );
}

export default RestaurantPublicationRecognitionLabel;
