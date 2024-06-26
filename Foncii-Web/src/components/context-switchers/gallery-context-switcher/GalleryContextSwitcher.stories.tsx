// Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import GalleryContextSwitcher from "./GalleryContextSwitcher";

// Component Story
export default {
  title: "Context Switchers/Gallery Context Switcher",
  tags: ["autodocs"],
  component: GalleryContextSwitcher,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <GalleryContextSwitcher {...args} />;

export const Default = Template.bind({});

Default.args = {};
