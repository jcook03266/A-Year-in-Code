// Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import UndergoingMaintenanceOverlay from "./UndergoingMaintenanceOverlay";

// Component Story
export default {
  title: "Overlays/Undergoing Maintenance Overlay",
  tags: ["autodocs"],
  component: UndergoingMaintenanceOverlay,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => (
  <UndergoingMaintenanceOverlay {...args} />
);

export const Default = Template.bind({});

Default.args = {};
