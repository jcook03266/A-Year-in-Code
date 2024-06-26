// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import PostFilterMenu from "./PostFilterMenu";

// Component Story
export default {
  title: "Menus/Post Filter Menu/Menu",
  tags: ["autodocs"],
  component: PostFilterMenu,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <PostFilterMenu {...args} />;

export const Default = Template.bind({});

Default.args = {};
