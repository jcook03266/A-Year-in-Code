// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import RadioToggleButton from "./RadioToggleButton";

// Component Story
export default {
  title: "Buttons/Toggle Buttons/Radio Toggle Button",
  tags: ["autodocs"],
  component: RadioToggleButton,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <RadioToggleButton {...args} />;

export const Default = Template.bind({});
export const Toggled = Template.bind({});

Default.args = {
  title: "All",
  toggled: false,
  onToggleAction: () => {},
};

Toggled.args = {
  title: "Favorites",
  toggled: true,
  onToggleAction: () => {},
};
