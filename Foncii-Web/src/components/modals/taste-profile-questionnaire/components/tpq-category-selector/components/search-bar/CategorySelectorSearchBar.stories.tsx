// Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import CategorySelectorSearchBar from "./CategorySelectorSearchBar";

// Component Story
export default {
  title:
    "Modals/Taste Profile Questionnaire/Components/Taste Profile Questionnaire Category Selector/Components/Taste Profile Questionnaire Category Selector Search Bar",
  tags: ["autodocs"],
  component: CategorySelectorSearchBar,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => (
  <CategorySelectorSearchBar {...args} />
);

export const Default = Template.bind({});

Default.args = {
  textInputDidChangeCallback: (textInput: string) => {
    console.log(
      `[CategorySelectorSearchBar] Real-time search bar update: ${textInput}`
    );
  },
  onClearAction: () =>
    console.log("[CategorySelectorSearchBar] Clear Action Triggered"),
};
