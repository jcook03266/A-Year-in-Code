// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import InfluencerDropDownRow from "./InfluencerDropDownRow";

// Component Story
export default {
  title: "Menus/Post Filter Menu/Drop Downs/More Drop Down",
  tags: ["autodocs"],
  component: InfluencerDropDownRow,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <InfluencerDropDownRow {...args} />;

export const Default = Template.bind({});

Default.args = {};
