// Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Mock Data
import { MockFMUserData } from "../../../types/mocks/mock-gql-types";

// Imports
import UserAvatarImageView from "./UserAvatarImageView";

// Component Story
export default {
  title: "Media Views/User Avatar Image View",
  tags: ["autodocs"],
  component: UserAvatarImageView,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <UserAvatarImageView {...args} />;

export const Default = Template.bind({});
export const WithLink = Template.bind({});

Default.args = {
  user: MockFMUserData,
};

WithLink.args = {
  user: MockFMUserData,
  withLink: true,
};
