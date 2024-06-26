// Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Mock Data
import { ConfigurableMockFonciiRestaurantData } from "../../../../types/mocks/mock-gql-types";

// Imports
import FonciiRestaurantCard from "./FonciiRestaurantCard";

// Component Story
export default {
  title: "Restaurant Entities/Fonci Restaurants/Foncii Restaurant Card",
  tags: ["autodocs"],
  component: FonciiRestaurantCard,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <FonciiRestaurantCard {...args} />;

export const Default = Template.bind({});

Default.args = {
  fonciiRestaurant: ConfigurableMockFonciiRestaurantData(),
};
