// Dependencies
// Framework
import React from "react";

// Components
import Image from "next/image";
import Link from "next/link";

// Assets
import { ImageRepository } from "../../../../../public/assets/images/ImageRepository";

// Utils
import { cn } from "../../../../utilities/development/DevUtils";

export default function RestaurantFeaturedInLinkButton({
  title,
  icon,
  description,
  rating,
  externalLink,
  onClick,
}: {
  title: string;
  icon: string;
  description?: string;
  /** A rating out of 5 for the associated restaurant */
  rating?: number;
  externalLink?: string;
  onClick?: () => void;
}) {
  // Convenience
  const formattedRating = (): string => {
    if (!rating) return "N/A";

    return `${rating.toFixed(1)} / 5.0`;
  };

  // Subcomponents
  const IconImageView = (): React.ReactNode => {
    if (!icon) return;

    return (
      <Image
        src={icon}
        alt={`${title} Icon`}
        height={32}
        width={32}
        className={`h-[32px] w-[32px] transition-all ease-in-out duration-200 rounded-full bg-permanent_white shadow-lg`}
        unselectable="on"
        unoptimized
      />
    );
  };

  const TitleLabel = (): React.ReactNode => {
    return (<h3 className="font-semibold text-permanent_white text-[16px] w-fit h-fit leading-normal line-clamp-1">{title}</h3>);
  };

  const DescriptionLabel = (): React.ReactNode => {
    if (!description) return;

    return (<p className="font-normal text-permanent_white text-[12px] w-fit h-fit line-clamp-1">{description}</p>);
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
          unoptimized
        />
        <p className="text-[16px] text-permanent_white font-semibold w-fit h-fit shrink-0">
          {formattedRating()}
        </p>
      </div>
    );
  };

  const ExternalLinkIcon = (): React.ReactNode => {
    if (!externalLink) return;

    return (
      <button className={`h-fit w-fit hover:opacity-75`}>
        <Image
          src={ImageRepository.UtilityIcons.ExternalLinkIcon}
          alt={`External Link Icon`}
          className={`h-[24px] w-[24px] transition-all ease-in-out duration-200`}
          unselectable="on"
        />
      </button>
    );
  };

  const TitleSection = (): React.ReactNode => {
    return (
      <div className="flex flex-row gap-x-[4px] items-center justify-start w-fit h-fit">
        <TitleLabel />
        {RatingLabel()}
      </div>
    );
  };

  const Content = (): React.ReactNode => {
    return (
      <div className="flex flex-col w-full">
        {TitleSection()}
        <DescriptionLabel />
      </div>
    );
  };

  const ButtonContent = (): React.ReactNode => {
    return (
      <div
        className={`flex flex-row gap-x-[8px] w-full h-full justify-items-stretch items-center`}
      >
        {IconImageView()}
        {Content()}
        {ExternalLinkIcon()}
      </div>
    );
  };

  return (
    <div className={cn(`flex flow-col shadow-xl px-[10px] pb-[8px] pt-[6px] w-full h-[56px] bg-light_dark_grey rounded-[10px] shrink-0 transition-all transform-gpu ease-in-out`, externalLink ? "hover:opacity-75" : "")}>
      {externalLink ? (
        <Link
          href={externalLink ?? "#"}
          onClick={onClick}
          target="_blank"
          rel="noreferrer"
          className="w-full"
        >
          {ButtonContent()}
        </Link>
      ) : (
        <button onClick={onClick} className="w-full">
          {ButtonContent()}
        </button>
      )}
    </div>
  );
}
