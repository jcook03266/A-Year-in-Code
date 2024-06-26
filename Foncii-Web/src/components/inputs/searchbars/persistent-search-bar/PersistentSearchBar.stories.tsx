// Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import PersistentSearchBar from "./PersistentSearchBar";

// Component Story
export default {
  title: "Inputs/Search Bars/Persistent Search Bar",
  tags: ["autodocs"],
  component: PersistentSearchBar,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <PersistentSearchBar {...args} />;

export const Default = Template.bind({});
export const Explore = Template.bind({});

Default.args = {};

Explore.args = {
  placeholder: "Find your next experience",
};
