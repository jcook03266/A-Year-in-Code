// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import CategoryChip from "./CategoryChip";

// Types
import { ComponentSize } from "../../../types/component-types";

// Component Story
export default {
  title: "Chips/Category Chip",
  tags: ["autodocs"],
  component: CategoryChip,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <CategoryChip {...args} />;

export const Default = Template.bind({});

Default.args = {
  title: "SF's Best Eateries",
  size: ComponentSize.large,
};
