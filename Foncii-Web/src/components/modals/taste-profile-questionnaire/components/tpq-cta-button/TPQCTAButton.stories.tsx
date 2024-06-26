// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import TPQCTAButton from "./TPQCTAButton";

export default {
  title:
    "Modals/Taste Profile Questionnaire/Components/Taste Profile Questionnaire Call To Action Button",
  tags: ["autodocs"],
  component: TPQCTAButton,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <TPQCTAButton {...args} />;

export const Default = Template.bind({});

Default.args = {
  title: "Get Started",
  onClick: () => {},
};
