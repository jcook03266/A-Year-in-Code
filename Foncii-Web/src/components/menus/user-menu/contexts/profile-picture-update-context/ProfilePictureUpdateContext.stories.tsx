// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import ProfilePictureUpdateContext from "./ProfilePictureUpdateContext";

// Component Story
export default {
  title: "Menus/User Menu/Contexts/Profile Picture Update Context",
  tags: ["autodocs"],
  component: ProfilePictureUpdateContext,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => (
  <ProfilePictureUpdateContext {...args} />
);

export const Default = Template.bind({});

Default.args = {};
