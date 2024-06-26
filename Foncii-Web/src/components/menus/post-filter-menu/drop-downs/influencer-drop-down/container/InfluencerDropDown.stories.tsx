// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import InfluencerDropDown from "./InfluencerDropDown";

// Component Story
export default {
  title: "Menus/Post Filter Menu/Drop Downs/More Drop Down",
  tags: ["autodocs"],
  component: InfluencerDropDown,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <InfluencerDropDown {...args} />;

export const Default = Template.bind({});

Default.args = {};
