// Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import PostEditorTagBoxChip from "./PostEditorTagBoxChip";

// Component Story
export default {
  title: "Inputs/Post Editor Tag Box/Chip",
  tags: ["autodocs"],
  component: PostEditorTagBoxChip,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <PostEditorTagBoxChip {...args} />;

export const Default = Template.bind({});

Default.args = {
  title: "Best Food Ever",
  value: "Best Food Ever",
  onDelete: (value: string) => console.log("Deleted", value),
  onclick: (value: string) => console.log("Clicked", value),
};
