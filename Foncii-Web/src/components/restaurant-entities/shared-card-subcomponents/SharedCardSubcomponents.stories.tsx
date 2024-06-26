// Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Mock Data
import { MockRestaurantData } from "../../../types/mocks/mock-gql-types";

// Imports
import { RestaurantPropertiesSection } from "./SharedCardSubcomponents";

// Component Story
export default {
  title: "Restaurant Entities/Shared Card Subcomponents",
  tags: ["autodocs"],
  component: RestaurantPropertiesSection,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => (
  <RestaurantPropertiesSection {...args} />
);

export const Default = Template.bind({});

Default.args = {
  restaurant: MockRestaurantData,
};
