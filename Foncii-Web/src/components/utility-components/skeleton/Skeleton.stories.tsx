// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import Skeleton from "./Skeleton";

export default {
  title: "Utility Components/Skeleton",
  tags: ["autodocs"],
  component: Skeleton,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <Skeleton {...args} />;

export const Default = Template.bind({});

Default.args = {
  className: "w-[200px] h-[200px]",
};
