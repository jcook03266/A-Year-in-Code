// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import CheckMarkToggleButton from "./CheckMarkToggleButton";

// Component Story
export default {
  title: "Buttons/Toggle Buttons/Check Mark Toggle Button",
  tags: ["autodocs"],
  component: CheckMarkToggleButton,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <CheckMarkToggleButton {...args} />;

export const Default = Template.bind({});
export const Toggled = Template.bind({});
export const Disabled = Template.bind({});

Default.args = {
  onClickAction: () => console.log("[CheckMarkToggleButton] Clicked"),
};

Toggled.args = {
  onClickAction: () => console.log("[CheckMarkToggleButton] Clicked"),
  toggled: true,
};

Disabled.args = {
  onClickAction: () => console.log("[CheckMarkToggleButton] Clicked"),
  disabled: true,
};
