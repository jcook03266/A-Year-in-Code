// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import FixedRoundedCTAButton from "./FixedRoundedCTAButton";

// Types
import { ComponentSize } from "../../../../types/component-types";

// Component Story
/**
 * ## Media Resizing Independent Component
 * Configurable with fixed dimensions passed as an argument.
 */
export default {
  title: "Buttons/Call To Action/Fixed Rounded CTA Button",
  tags: ["autodocs"],
  component: FixedRoundedCTAButton,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <FixedRoundedCTAButton {...args} />;

export const Small = Template.bind({});
export const Large = Template.bind({});

Small.args = {
  title: "Get Directions",
  onClickAction: () => console.log("Button Pressed"),
  size: ComponentSize.small,
};

Large.args = {
  title: "Get Directions",
  size: ComponentSize.large,
};
