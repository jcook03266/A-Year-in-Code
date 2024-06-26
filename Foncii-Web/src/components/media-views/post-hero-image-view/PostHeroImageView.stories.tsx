// Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Mock Data
import { MockFMPostData } from "../../../types/mocks/mock-gql-types";

// Imports
import PostHeroImageView from "./PostHeroImageView";

// Component Story
export default {
  title: "Media Views/Post Hero Image View",
  tags: ["autodocs"],
  component: PostHeroImageView,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <PostHeroImageView {...args} />;

export const Default = Template.bind({});

Default.args = {
  post: MockFMPostData,
};
