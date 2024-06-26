// Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import PlacesAutocompleteWidgetRow from "./PlacesAutocompleteWidgetRow";

// Component Story
export default {
  title: "Places Autocomplete Widget/Row",
  tags: ["autodocs"],
  component: PlacesAutocompleteWidgetRow,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => (
  <PlacesAutocompleteWidgetRow {...args} />
);

export const Default = Template.bind({});
export const Selected = Template.bind({});

Default.args = {
  title: "Sushi Sushi, 123 Main St, Seattle, WA 98109",
  value: "12345678910",
  selected: false,
};

Selected.args = {
  title: "Sushi Sushi, 123 Main St, Seattle, WA 98109",
  value: "12345678910",
  selected: true,
};
