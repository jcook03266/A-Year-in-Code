// Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import CategorySelectorCard from "./CategorySelectorCard";

// Component Story
export default {
  title:
    "Modals/Taste Profile Questionnaire/Components/Taste Profile Questionnaire Category Selector/Components/Taste Profile Questionnaire Category Selector Card",
  tags: ["autodocs"],
  component: CategorySelectorCard,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <CategorySelectorCard {...args} />;

export const Default = Template.bind({});
export const Selected = Template.bind({});

Default.args = {
  id: 1,
  title: "Dairy Free",
  imageURL:
    "https://cdn.foncii.com/static-assets/dietary-restriction-icons/dairy_free.jpg",
  selected: false,
  onSelect: (id: string, currentSelectionState: boolean) => {
    console.log(
      `[CategorySelectorCard] Action triggered ${id}, ${currentSelectionState}`
    );
  },
};

Selected.args = {
  id: 2,
  title: "Halal",
  imageURL:
    "https://cdn.foncii.com/static-assets/dietary-restriction-icons/halal.jpg",
  selected: true,
  onSelect: (id: string, currentSelectionState: boolean) => {
    console.log(
      `[CategorySelectorCard] Action triggered ${id}, ${currentSelectionState}`
    );
  },
};
