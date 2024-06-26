// Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import { StagingAuthorizationOverlay } from "./StagingAuthorizationOverlay";

// Component Story
export default {
  title: "Overlays/Staging Authorization Overlay",
  tags: ["autodocs"],
  component: StagingAuthorizationOverlay,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => (
  <StagingAuthorizationOverlay {...args} />
);

export const Default = Template.bind({});

Default.args = {};
