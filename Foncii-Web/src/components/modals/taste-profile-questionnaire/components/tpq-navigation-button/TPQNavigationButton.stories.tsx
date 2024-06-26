// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import TPQNavigationButton, {
  TPQNavigationButtonDirection,
} from "./TPQNavigationButton";

export default {
  title:
    "Modals/Taste Profile Questionnaire/Components/Taste Profile Questionnaire Navigation Button",
  tags: ["autodocs"],
  component: TPQNavigationButton,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <TPQNavigationButton {...args} />;

export const Backward = Template.bind({});
export const Forward = Template.bind({});

Backward.args = {
  direction: TPQNavigationButtonDirection.backward,
  onClick: () => {},
};

Forward.args = {
  direction: TPQNavigationButtonDirection.forward,
  onClick: () => {},
};
