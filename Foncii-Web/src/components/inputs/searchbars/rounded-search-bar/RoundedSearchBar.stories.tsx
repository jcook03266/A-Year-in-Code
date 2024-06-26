// Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import RoundedSearchBar from "./RoundedSearchBar";

// Component Story
export default {
  title: "Inputs/Search Bars/Rounded Search Bar",
  tags: ["autodocs"],
  component: RoundedSearchBar,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <RoundedSearchBar {...args} />;

export const Default = Template.bind({});

Default.args = {
  initialTextInput: "",
  placeholder: undefined,
};
