// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import RatingDropDownRow from "./RatingDropDownRow";

// Assets
import { ImageRepository } from "../../../../../../../public/assets/images/ImageRepository";

// Component Story
export default {
  title: "Menus/Post Filter Menu/Drop Downs/Rating Drop Down/Row",
  tags: ["autodocs"],
  component: RatingDropDownRow,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <RatingDropDownRow {...args} />;

export const CreatorRatingFilter = Template.bind({});
export const YelpRatingFilter = Template.bind({});
export const GoogleRatingFilter = Template.bind({});

CreatorRatingFilter.args = {
  title: "FonciiCEO",
};

GoogleRatingFilter.args = {
  title: "Google",
  icon: ImageRepository.CompanyLogos.GoogleLogo,
};

YelpRatingFilter.args = {
  title: "Yelp",
  icon: ImageRepository.CompanyLogos.YelpLogo,
};
