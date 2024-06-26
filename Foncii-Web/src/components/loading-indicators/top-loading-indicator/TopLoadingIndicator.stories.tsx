// Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import { TopLoadingIndicator } from "./TopLoadingIndicator";

// Component Story
export default {
  title: "Loading Indicators/Top Loading Indicator",
  tags: ["autodocs"],
  component: TopLoadingIndicator,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <TopLoadingIndicator {...args} />;

export const Default = Template.bind({});

Default.args = {};
