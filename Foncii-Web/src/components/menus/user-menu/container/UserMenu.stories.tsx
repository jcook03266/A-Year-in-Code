// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import UserMenu from "./UserMenu";

// Component Story
export default {
  title: "Menus/User Menu/Container ",
  tags: ["autodocs"],
  component: UserMenu,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <UserMenu {...args} />;

export const Default = Template.bind({});

Default.args = {};
