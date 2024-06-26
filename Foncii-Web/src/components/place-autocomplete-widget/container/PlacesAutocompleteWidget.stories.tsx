// Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import PlacesAutocompleteWidget from "./PlacesAutocompleteWidget";

// Component Story
export default {
  title: "Places Autocomplete Widget/Container",
  tags: ["autodocs"],
  component: PlacesAutocompleteWidget,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <PlacesAutocompleteWidget {...args} />;

export const Default = Template.bind({});
export const EditingAssociatedRestaurant = Template.bind({});

Default.args = {
  onSelect: (placeID: string) => {
    console.log(placeID);
  },
};

EditingAssociatedRestaurant.args = {
  onSelect: (placeID: string) => {
    console.log(placeID);
  },
  initialTextInput: "Udon Lab",
  initialSelectedSearchResultPlaceID: "ChIJd5vacIZZwokRTh-F-IAp1O8",
};
