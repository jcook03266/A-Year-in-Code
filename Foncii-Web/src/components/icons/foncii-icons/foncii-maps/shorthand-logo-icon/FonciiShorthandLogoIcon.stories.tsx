// Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import FonciiShorthandLogoIcon from "./FonciiShorthandLogoIcon";

// Component Story
export default {
  title: "Icons/Foncii Icons/Foncii Maps/Foncii Shorthand Logo Icon",
  tags: ["autodocs"],
  component: FonciiShorthandLogoIcon,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <FonciiShorthandLogoIcon {...args} />;

export const Default = Template.bind({});
export const WithoutLink = Template.bind({});

Default.args = {};
WithoutLink.args = {
  withLink: false,
};
