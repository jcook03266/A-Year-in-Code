// Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import TPQCategorySelector from "./TPQCategorySelector";

// Component Story
export default {
  title:
    "Modals/Taste Profile Questionnaire/Components/Taste Profile Questionnaire Category Selector",
  tags: ["autodocs"],
  component: TPQCategorySelector,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <TPQCategorySelector {...args} />;

export const Default = Template.bind({});
export const Selected = Template.bind({});

Default.args = {
  categories: [
    {
      id: 1,
      title: "Dairy Free",
      imageURL:
        "https://cdn.foncii.com/static-assets/dietary-restriction-icons/dairy_free.jpg",
    },
    {
      id: 2,
      title: "Halal",
      imageURL:
        "https://cdn.foncii.com/static-assets/dietary-restriction-icons/halal.jpg",
    },
    {
      id: 3,
      title: "Keto",
      imageURL:
        "https://cdn.foncii.com/static-assets/dietary-restriction-icons/keto.jpg",
    },
    {
      id: 4,
      title: "Paleo",
      imageURL:
        "https://cdn.foncii.com/static-assets/dietary-restriction-icons/paleo.jpg",
    },
  ],
  selectedCategories: [],
  onSelect: (id: string, currentSelectionState: boolean) => {
    console.log(
      `[TPQCategorySelector] Action triggered ${id}, ${currentSelectionState}`
    );
  },
};

Selected.args = {
  categories: [
    {
      id: 1,
      title: "Dairy Free",
      imageURL:
        "https://cdn.foncii.com/static-assets/dietary-restriction-icons/dairy_free.jpg",
    },
    {
      id: 2,
      title: "Halal",
      imageURL:
        "https://cdn.foncii.com/static-assets/dietary-restriction-icons/halal.jpg",
    },
    {
      id: 3,
      title: "Keto",
      imageURL:
        "https://cdn.foncii.com/static-assets/dietary-restriction-icons/keto.jpg",
    },
    {
      id: 4,
      title: "Paleo",
      imageURL:
        "https://cdn.foncii.com/static-assets/dietary-restriction-icons/paleo.jpg",
    },
  ],
  selectedCategories: [
    {
      id: 3,
      title: "Keto",
      imageURL:
        "https://cdn.foncii.com/static-assets/dietary-restriction-icons/keto.jpg",
    },
  ],
  onSelect: (id: string, currentSelectionState: boolean) => {
    console.log(
      `[TPQCategorySelector] Action triggered ${id}, ${currentSelectionState}`
    );
  },
};
