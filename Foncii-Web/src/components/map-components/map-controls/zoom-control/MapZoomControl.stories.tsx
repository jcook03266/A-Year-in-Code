// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import { MapZoomControl } from "./MapZoomControl";

export default {
  title: "Map Components/Map Controls/Map Zoom Control",
  tags: ["autodocs"],
  component: MapZoomControl,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <MapZoomControl {...args} />;

export const Default = Template.bind({});
Default.args = {};
