// Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import PercentMatchLabel from "./PercentMatchLabel";

// Component Story
export default {
  title: "Labels/Percent Match Score Label",
  tags: ["autodocs"],
  component: PercentMatchLabel,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <PercentMatchLabel {...args} />;

export const Default = Template.bind({});

Default.args = {
  percentMatchScore: 0.9,
};
