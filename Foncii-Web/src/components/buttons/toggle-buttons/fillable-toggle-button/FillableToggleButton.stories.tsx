// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import FillableToggleButton from "./FillableToggleButton";

// Component Story
export default {
  title: "Buttons/Toggle Buttons/Fillable Toggle Button",
  tags: ["autodocs"],
  component: FillableToggleButton,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <FillableToggleButton {...args} />;

export const PriceLevelFilter = Template.bind({});
export const PriceLevelFilterToggled = Template.bind({});

export const TagFilter = Template.bind({});
export const TagFilterToggled = Template.bind({});

PriceLevelFilter.args = {
  title: "$$$",
  toggled: false,
  onToggleAction: () => {},
};

PriceLevelFilterToggled.args = {
  title: "$$$",
  toggled: true,
  onToggleAction: () => {},
};

TagFilter.args = {
  title: "Food Crawl 2K23!",
  toggled: false,
  onToggleAction: () => {},
};

TagFilterToggled.args = {
  title: "Food Crawl 2K23!",
  toggled: true,
  onToggleAction: () => {},
};
