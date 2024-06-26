// Dependencies
// Types
import { Publication } from "../../../../../../../__generated__/graphql";

// Hooks
import React, { useState } from "react";

// Components
import RestaurantFeaturedInLinkButton from "../../../../../../../components/buttons/links/restaurant-featured-in-link-button/RestaurantFeaturedInLinkButton";
import ShowMoreButton from "../../../../../../../components/buttons/toggle-buttons/expand-button/ShowMoreButton";

// Constants
const STACK_SIZE = 3;

/**
 * Represents a stack of publications
 */
const PublicationStack = ({
  publications,
  publicatonName,
  trackPublicationLinkClickEvent,
}: {
  publications: Publication[];
  publicatonName: string;
  trackPublicationLinkClickEvent: ({
    publication,
    destinationURL,
  }: {
    publication: string;
    destinationURL: string;
  }) => void;
}) => {
  const [expanded, setExpanded] = useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const renderPublications = () => {
    const urlActionable = publications.length === 1 || expanded;
    const multipleActionable = publications.length !== 1 && urlActionable;
    return (
      <div>
        <div
          className={`flex flex-row w-full justify-between transition-all transform-gpu ease-in-out ${
            multipleActionable
              ? "h-full pointer-events-auto pb-[16px]"
              : "h-0 pointer-events-none"
          }`}
        >
          <h4
            className={`text-permanent_white text-[16px] font-normal ${
              multipleActionable ? "opacity-[100%]" : "opacity-[0%]"
            }`}
          >
            {publicatonName}
          </h4>
          <ShowMoreButton
            showMore={false}
            onClickAction={handleExpandClick}
            className={`${
              multipleActionable ? "opacity-[70%]" : "opacity-[0%]"
            } text-[14px]`}
          />
        </div>
        <div
          className={`flex flex-col transition-all transform-gpu ease-in-out ${
            urlActionable ? "gap-y-[8px]" : ``
          }`}
        >
          {publications.map((publication, index) => (
            <div
              key={index}
              className={`flex w-[100%] transition-all transform-gpu ease-in-out ${
                urlActionable || index === 0
                  ? ``
                  : index < STACK_SIZE
                  ? `-mt-[47px]`
                  : "h-0 opacity-[0%] pointer-events-none"
              }`}
              style={{
                zIndex: -index,
              }}
            >
              <div
                className={`flex flex-col h-full mx-auto transition-all transform-gpu ease-in-out ${
                  urlActionable
                    ? "w-full"
                    : `w-[${100 - Math.min(index, STACK_SIZE - 1) * 5}%]`
                }`}
              >
                <RestaurantFeaturedInLinkButton
                  key={index}
                  title={publication.title ?? ""}
                  icon={publication.faviconLink}
                  externalLink={urlActionable ? publication.url : undefined}
                  description={publication.description ?? undefined}
                  onClick={() => {
                    if (urlActionable) {
                      trackPublicationLinkClickEvent({
                        publication: publicatonName,
                        destinationURL: publication.url,
                      });
                    } else {
                      handleExpandClick();
                    }
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return renderPublications();
};

export default PublicationStack;
