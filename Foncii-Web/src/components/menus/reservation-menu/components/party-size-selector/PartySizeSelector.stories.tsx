// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import PartySizeSelector from "./PartySizeSelector";

// Component Story
export default {
  title: "Menus/Reservation Menu/Components/Party Size Selector",
  tags: ["autodocs"],
  component: PartySizeSelector,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <PartySizeSelector {...args} />;

export const Default = Template.bind({});

Default.args = {
  onPartySizeChange: (size: number): void => {
    console.log(`[PartySizeSelector] New Party Size: ${size}`);
  },
};
