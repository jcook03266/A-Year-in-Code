// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import DynamicRoundedCTAButton from "./DynamicRoundedCTAButton";

// Component Story
/**
 * Media Resizing Responsive Component
 * Responds to media resizes dynamically, no fixed sizes are set
 * only use this dynamic button where you want the button to be responsive so not
 * in a fixed dimension card.
 */
export default {
  title: "Buttons/Call To Action/Dynamic Rounded CTA Button",
  tags: ["autodocs"],
  component: DynamicRoundedCTAButton,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <DynamicRoundedCTAButton {...args} />;

export const Default = Template.bind({});

Default.args = {
  title: "Update Search",
  onClickAction: () => console.log("Button Pressed"),
};
