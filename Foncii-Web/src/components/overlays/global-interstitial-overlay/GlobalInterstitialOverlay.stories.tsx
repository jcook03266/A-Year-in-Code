// Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import { GlobalInterstitialOverlay } from "./GlobalInterstitialOverlay";

// Component Story
export default {
  title: "Overlays/Global Interstitial Overlay",
  tags: ["autodocs"],
  component: GlobalInterstitialOverlay,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => (
  <GlobalInterstitialOverlay {...args} />
);

export const Default = Template.bind({});

Default.args = {};
