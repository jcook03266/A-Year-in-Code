// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import BackButton from "./BackButton";

// Component Story
export default {
  title: "Buttons/Back Button",
  tags: ["autodocs"],
  component: BackButton,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <BackButton {...args} />;

export const Default = Template.bind({});
export const WithoutTitle = Template.bind({});

Default.args = {};

WithoutTitle.args = {
  withTitle: false,
};
