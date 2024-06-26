// Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import RestaurantDistanceLabel, {
  DistanceUnits,
} from "./RestaurantDistanceLabel";

// Mock Data
import {
  MockCoordinatePointData,
  MockRestaurantData,
} from "../../../types/mocks/mock-gql-types";

// Component Story
export default {
  title: "Labels/Restaurant Distance Label",
  //👇 Enables auto-generated documentation for the component story
  tags: ["autodocs"],
  component: RestaurantDistanceLabel,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <RestaurantDistanceLabel {...args} />;

export const Default = Template.bind({});
export const Imperial = Template.bind({});
export const Metric = Template.bind({});
export const LongDistance = Template.bind({});

Default.args = {
  restaurant: MockRestaurantData,
  currentClientCoordinates: MockCoordinatePointData,
  preferredDistanceUnit: DistanceUnits.miles,
};

Imperial.args = {
  restaurant: MockRestaurantData,
  preferredDistanceUnit: DistanceUnits.miles,
};

Metric.args = {
  restaurant: MockRestaurantData,
  preferredDistanceUnit: DistanceUnits.kilometers,
};
