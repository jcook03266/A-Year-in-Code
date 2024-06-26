// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import { PostSourcePermaLink } from "./PostSourcePermaLink";

// Mock Data
import { MockFMPostData } from "../../../../types/mocks/mock-gql-types";

// Component Story
export default {
  title: "Buttons/User Post Buttons/Post Source Perma-Link",
  tags: ["autodocs"],
  component: PostSourcePermaLink,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <PostSourcePermaLink {...args} />;

export const Default = Template.bind({});

Default.args = {
  post: MockFMPostData,
};
