// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import RefreshUtilityButton from "./RefreshUtilityButton";

// Component Story
export default {
  title: "Buttons/Utility Buttons/Refresh Button",
  tags: ["autodocs"],
  component: RefreshUtilityButton,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <RefreshUtilityButton {...args} />;

export const Default = Template.bind({});

Default.args = {
  onClick: () => {
    console.log("Close Button Pressed.");
  },
};
