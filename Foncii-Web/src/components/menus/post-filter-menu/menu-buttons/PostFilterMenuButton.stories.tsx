// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import { PostFilterMenuButton } from "./PostFilterMenuButton";

// Assets
import { ImageRepository } from "../../../../../public/assets/images/ImageRepository";

// Component Story
export default {
  title: "Menus/Post Filter Menu/Menu Buttons",
  tags: ["autodocs"],
  component: PostFilterMenuButton,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <PostFilterMenuButton {...args} />;

export const OpenNowFilter = Template.bind({});
export const CuisineFilter = Template.bind({});
export const RatingsFilter = Template.bind({});
export const PriceFilter = Template.bind({});
export const MoreFilters = Template.bind({});
export const MoreFiltersApplied = Template.bind({});

OpenNowFilter.args = {
  title: "Open",
  icon: ImageRepository.FilterIcons.OpenNowFilterIcon,
  filterIsApplied: false,
};

CuisineFilter.args = {
  title: "Cuisine",
  icon: ImageRepository.FilterIcons.CuisineFiltersIcon,
  filterIsApplied: true,
};

RatingsFilter.args = {
  title: "Rating",
  icon: ImageRepository.FilterIcons.RatingFiltersIcon,
  filterIsApplied: false,
};

PriceFilter.args = {
  title: "Price",
  icon: ImageRepository.FilterIcons.PriceFiltersIcon,
  filterIsApplied: false,
};

MoreFilters.args = {
  icon: ImageRepository.FilterIcons.MoreFiltersIcon,
  filterIsApplied: false,
};

MoreFiltersApplied.args = {
  icon: ImageRepository.FilterIcons.MoreFiltersIcon,
  filterIsApplied: true,
};
