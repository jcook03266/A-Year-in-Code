// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Mock Data
import { MockFMUserData } from "../../../types/mocks/mock-gql-types";

// Imports
import RestaurantRatingLabel from "./RestaurantRatingLabel";

// Assets
import { ImageRepository } from "../../../../public/assets/images/ImageRepository";

// Components
// Local
import UserAvatarImageView from "../../media-views/user-avatar-image-view/UserAvatarImageView";

// External
import Image from "next/image";

// Types
import { ComponentSize } from "../../../types/component-types";

// Component Story
export default {
  title: "Labels/Restaurant Rating Label",
  //👇 Enables auto-generated documentation for the component story
  tags: ["autodocs"],
  component: RestaurantRatingLabel,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <RestaurantRatingLabel {...args} />;

export const CreatorRating = Template.bind({});
export const GoogleRating = Template.bind({});
export const YelpRating = Template.bind({});

CreatorRating.args = {
  rating: 4.5,
  children: <UserAvatarImageView user={MockFMUserData} />,
};

GoogleRating.args = {
  rating: 1.3,
  children: (
    <Image
      src={ImageRepository.CompanyLogos.GoogleLogo}
      width={1920}
      height={1080}
      alt="Google Logo"
    />
  ),
};

YelpRating.args = {
  rating: 2.6,
  children: (
    <Image
      src={ImageRepository.CompanyLogos.YelpLogo}
      width={1920}
      height={1080}
      alt="Yelp Logo"
    />
  ),
};
