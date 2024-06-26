// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import { MapControlBox } from "./MapControlBox";

export default {
  title: "Map Components/Map Controls/Map Control Box",
  tags: ["autodocs"],
  component: MapControlBox,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <MapControlBox {...args} />;

export const Default = Template.bind({});
Default.args = {};
