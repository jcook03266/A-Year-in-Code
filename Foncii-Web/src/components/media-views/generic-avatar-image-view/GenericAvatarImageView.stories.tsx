// Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import GenericAvatarImageView from "./GenericAvatarImageView";

// Component Story
export default {
  title: "Media Views/Generic Avatar Image View",
  tags: ["autodocs"],
  component: GenericAvatarImageView,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <GenericAvatarImageView {...args} />;

export const Default = Template.bind({});

Default.args = {};
