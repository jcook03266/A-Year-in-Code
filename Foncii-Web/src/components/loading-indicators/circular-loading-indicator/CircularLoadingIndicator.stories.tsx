// Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import CircularLoadingIndicator from "./CircularLoadingIndicator";

// Component Story
export default {
  title: "Loading Indicators/Circular Loading Indicator",
  tags: ["autodocs"],
  component: CircularLoadingIndicator,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <CircularLoadingIndicator {...args} />;

export const Default = Template.bind({});
export const Loading = Template.bind({});

Default.args = {};
Loading.args = {
  isLoading: true,
};
