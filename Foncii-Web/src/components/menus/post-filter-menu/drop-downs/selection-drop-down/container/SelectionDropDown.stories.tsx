// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import SelectionDropDown from "./SelectionDropDown";

// Component Story
export default {
  title: "Menus/Post Filter Menu/Drop Downs/Selection Drop Down/Container",
  tags: ["autodocs"],
  component: SelectionDropDown,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <SelectionDropDown {...args} />;

export const WithTitle = Template.bind({});
export const WithoutTitle = Template.bind({});

WithTitle.args = {
  headerTitle: "Cuisine Filter",
  referenceData: [
    "Italian",
    "Japanese",
    "Chinese",
    "Korean",
    "Thai",
    "Indian",
    "Vietnamese",
    "American",
    "Mexican",
    "Greek",
    "French",
    "Spanish",
    "German",
    "Italian",
    "Russian",
    "Brazilian",
    "Moroccan",
    "Brazilian",
  ],
  currentData: [
    "Italian",
    "Japanese",
    "Chinese",
    "Mexican",
    "Greek",
    "French",
    "Spanish",
    "German",
    "Italian",
    "Russian",
    "Brazilian",
    "Moroccan",
    "Brazilian",
  ],
  selectedData: ["Italian", "Mexican"],
  onSelectAction: () => {},
  clearAction: () => {},
};

WithoutTitle.args = {
  referenceData: [
    "Italian",
    "Japanese",
    "Chinese",
    "Korean",
    "Thai",
    "Indian",
    "Vietnamese",
    "American",
    "Mexican",
    "Greek",
    "French",
    "Spanish",
    "German",
    "Italian",
    "Russian",
    "Brazilian",
    "Moroccan",
    "Brazilian",
  ],
  currentData: [
    "Italian",
    "Japanese",
    "Chinese",
    "Mexican",
    "Greek",
    "French",
    "Spanish",
    "German",
    "Italian",
    "Russian",
    "Brazilian",
    "Moroccan",
    "Brazilian",
  ],
  selectedData: ["Italian", "Mexican"],
  onSelectAction: () => {},
  clearAction: () => {},
};
