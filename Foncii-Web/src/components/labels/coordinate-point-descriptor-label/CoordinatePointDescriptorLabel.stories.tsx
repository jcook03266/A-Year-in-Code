// Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Mock Data
import { MockCoordinatePointData } from "../../../types/mocks/mock-gql-types";

// Imports
import CoordinatePointDescriptorLabel from "./CoordinatePointDescriptorLabel";

// Component Story
export default {
  title: "Labels/Coordinate Point Descriptor Label",
  tags: ["autodocs"],
  component: CoordinatePointDescriptorLabel,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => (
  <CoordinatePointDescriptorLabel {...args} />
);

export const Default = Template.bind({});

Default.args = {
  coordinatePoint: MockCoordinatePointData,
};
