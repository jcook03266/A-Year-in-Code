// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import PostImportIntegrationContext from "./PostImportIntegrationContext";

// Component Story
export default {
  title: "Menus/User Menu/Contexts/Post Import Integration Context",
  tags: ["autodocs"],
  component: PostImportIntegrationContext,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => (
  <PostImportIntegrationContext {...args} />
);

export const Default = Template.bind({});

Default.args = {};
