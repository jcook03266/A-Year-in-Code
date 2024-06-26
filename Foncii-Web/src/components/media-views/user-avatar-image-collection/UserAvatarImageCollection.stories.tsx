// Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Mock Data
import { MockFMUserData } from "../../../types/mocks/mock-gql-types";

// Imports
import UserAvatarImageCollection from "./UserAvatarImageCollection";

// Component Story
export default {
  title: "Media Views/User Avatar Image Collection",
  tags: ["autodocs"],
  component: UserAvatarImageCollection,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => (
  <UserAvatarImageCollection {...args} />
);

export const Default = Template.bind({});
export const WithAdditionalCountIndicator = Template.bind({});
export const WithoutAdditionalCountIndicator = Template.bind({});

Default.args = {};

WithAdditionalCountIndicator.args = {
  users: [MockFMUserData, MockFMUserData, MockFMUserData],
};

WithoutAdditionalCountIndicator.args = {
  users: [MockFMUserData, MockFMUserData, MockFMUserData, MockFMUserData],
};
