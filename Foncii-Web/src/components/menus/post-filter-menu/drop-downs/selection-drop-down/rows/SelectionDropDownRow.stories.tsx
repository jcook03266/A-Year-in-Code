// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import SelectionDropDownRow from "./SelectionDropDownRow";

// Component Story
export default {
  title: "Menus/Post Filter Menu/Drop Downs/Selection Drop Down/Row",
  tags: ["autodocs"],
  component: SelectionDropDownRow,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <SelectionDropDownRow {...args} />;

export const Default = Template.bind({});
export const Selected = Template.bind({});
export const Disabled = Template.bind({});

Default.args = {
  onSelectAction: () => {},
  value: "Italian",
  valueOccurrenceFrequency: 10,
  selected: false,
};

Selected.args = {
  onSelectAction: () => {},
  value: "Italian",
  valueOccurrenceFrequency: 20,
  selected: true,
};

Disabled.args = {
  onSelectAction: () => {},
  value: "Italian",
  valueOccurrenceFrequency: 1,
  disabled: true,
};
