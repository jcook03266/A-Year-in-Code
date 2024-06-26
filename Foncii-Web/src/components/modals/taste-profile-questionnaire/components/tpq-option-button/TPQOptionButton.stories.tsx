// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import TPQOptionButton from "./TPQOptionButton";

export default {
  title:
    "Modals/Taste Profile Questionnaire/Components/Taste Profile Questionnaire Option Button",
  tags: ["autodocs"],
  component: TPQOptionButton,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <TPQOptionButton {...args} />;

export const Default = Template.bind({});

Default.args = {
  title: "I like the ambiance",
  children: <p>I like the ambiance</p>,
  onClick: () => {},
  isSelected: false,
};
