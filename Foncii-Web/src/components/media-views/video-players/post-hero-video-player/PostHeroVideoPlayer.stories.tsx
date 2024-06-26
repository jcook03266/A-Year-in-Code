// Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Mock Data
import { MockVideoFMPostData } from "../../../../types/mocks/mock-gql-types";

// Imports
import PostHeroVideoPlayer from "./PostHeroVideoPlayer";

// Component Story
export default {
  title: "Media Views/Post Hero Video Player",
  tags: ["autodocs"],
  component: PostHeroVideoPlayer,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <PostHeroVideoPlayer {...args} />;

export const Default = Template.bind({});

Default.args = {
  post: MockVideoFMPostData,
};
