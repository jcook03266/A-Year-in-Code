// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import MainMap from "./MainMap.jsx";

// Component Story
export default {
  title: "Map Components/Main Map",
  tags: ["autodocs"],
  component: MainMap,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <MainMap {...args} />;

export const Default = Template.bind({});

Default.args = {};
