// Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import NavigationHeader from "./NavigationHeader";

// Component Story
export default {
  title: "Headers/Navigation Header",
  tags: ["autodocs"],
  component: NavigationHeader,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <NavigationHeader {...args} />;

export const Default = Template.bind({});

Default.args = {};
