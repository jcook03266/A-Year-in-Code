// Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import FonciiFullLogoIcon from "./FonciiFullLogoIcon";

// Component Story
export default {
  title: "Icons/Foncii Icons/Foncii Maps/Foncii Full Logo Icon",
  tags: ["autodocs"],
  component: FonciiFullLogoIcon,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <FonciiFullLogoIcon {...args} />;

export const Default = Template.bind({});
export const WithoutLink = Template.bind({});

Default.args = {};
WithoutLink.args = {
  withLink: false,
};
