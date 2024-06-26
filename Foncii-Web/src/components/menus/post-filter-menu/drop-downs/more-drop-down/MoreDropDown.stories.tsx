// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import MoreDropDown from "./MoreDropDown";

// Component Story
export default {
  title: "Menus/Post Filter Menu/Drop Downs/More Drop Down",
  tags: ["autodocs"],
  component: MoreDropDown,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <MoreDropDown {...args} />;

export const Default = Template.bind({});

Default.args = {};
