// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import CloseUtilityButton from "./CloseUtilityButton";

// Component Story
export default {
  title: "Buttons/Utility Buttons/Close Button",
  tags: ["autodocs"],
  component: CloseUtilityButton,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <CloseUtilityButton {...args} />;

export const Default = Template.bind({});

Default.args = {
  onClick: () => {
    console.log("Close Button Pressed.");
  },
};
