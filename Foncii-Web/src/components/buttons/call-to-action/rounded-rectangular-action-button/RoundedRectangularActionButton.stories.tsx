// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import RoundedRectangularActionButton from "./RoundedRectangularActionButton";

// Styling
import { ColorEnum } from "../../../../../public/assets/ColorRepository";

export default {
  title: "Buttons/Call To Action/Rounded Rectangular Action Button",
  tags: ["autodocs"],
  component: RoundedRectangularActionButton,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => (
  <RoundedRectangularActionButton {...args} />
);

export const Default = Template.bind({});
export const Loading = Template.bind({});
export const Disabled = Template.bind({});

Default.args = {
  title: "Connect",
  color: ColorEnum.medium_dark_grey,
  onClickAction: () => {},
};

Loading.args = {
  ...Default.args,
  isLoading: true,
};

Disabled.args = {
  ...Default.args,
  disabled: true,
};
