// Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Mock Data
import { ConfigurableMockFonciiRestaurantData } from "../../../../types/mocks/mock-gql-types";

// Imports
import LargeFormatFonciiRestaurantCard from "./LargeFormatFonciiRestaurantCard";

// Component Story
export default {
  title:
    "Restaurant Entities/Fonci Restaurants/Large Format Foncii Restaurant Card",
  tags: ["autodocs"],
  component: LargeFormatFonciiRestaurantCard,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => (
  <LargeFormatFonciiRestaurantCard {...args} />
);

export const Default = Template.bind({});

Default.args = {
  fonciiRestaurant: ConfigurableMockFonciiRestaurantData(),
};
