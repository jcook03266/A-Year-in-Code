// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import { MapUserLocationPinPointer } from "./MapUserLocationPinPointer";

export default {
  title: "Map Components/Map Controls/Map User Location Pin Pointer",
  tags: ["autodocs"],
  component: MapUserLocationPinPointer,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => (
  <MapUserLocationPinPointer {...args} />
);

export const Default = Template.bind({});
Default.args = {};
