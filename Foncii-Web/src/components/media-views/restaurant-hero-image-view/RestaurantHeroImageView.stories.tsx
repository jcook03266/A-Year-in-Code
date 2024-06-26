// Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Mock Data
import { MockRestaurantData } from "../../../types/mocks/mock-gql-types";

// Imports
import RestaurantHeroImageView from "./RestaurantHeroImageView";

// Component Story
export default {
  title: "Media Views/Restaurant Hero Image View",
  tags: ["autodocs"],
  component: RestaurantHeroImageView,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <RestaurantHeroImageView {...args} />;

export const Default = Template.bind({});

Default.args = {
  restaurant: MockRestaurantData,
};
