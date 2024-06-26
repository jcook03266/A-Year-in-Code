// Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import PostEditorTextBox from "./PostEditorTextBox";

// Component Story
export default {
  title: "Inputs/Post Editor Text Box",
  tags: ["autodocs"],
  component: PostEditorTextBox,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <PostEditorTextBox {...args} />;

export const Default = Template.bind({});

Default.args = {
  initialTextInput: "",
  revertableTextInput: "An interesting original note about my experience",
  placeholder: "Leave a note about your experience.",
  textInputDidChangeCallback: (value: string) => {
    console.log(value);
  },
  maxTextInputLength: 100,
};
