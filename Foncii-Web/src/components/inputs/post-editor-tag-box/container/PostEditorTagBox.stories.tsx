// Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import PostEditorTagBox from "./PostEditorTagBox";

// Component Story
export default {
  title: "Inputs/Post Editor Tag Box/Container",
  tags: ["autodocs"],
  component: PostEditorTagBox,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <PostEditorTagBox {...args} />;

export const Default = Template.bind({});

Default.args = {
  initialTextInput: "",
  initialTags: ["Best Food", "Food Crawl", "Italiano!"],
  tagsDidChangeCallback: (tags: string[]) => {
    console.log("New Tags", tags);
  },
};
