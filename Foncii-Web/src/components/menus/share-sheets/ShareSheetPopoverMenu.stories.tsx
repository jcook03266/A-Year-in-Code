// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import ShareSheetPopoverMenu from "./ShareSheetPopoverMenu";

// Component Story
export default {
  title: "Menus/Share Sheets/Share Sheet Popover Menu",
  tags: ["autodocs"],
  component: ShareSheetPopoverMenu,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <ShareSheetPopoverMenu {...args} />;

export const Default = Template.bind({});

Default.args = {
  url: "https://foncii.com/jjc03266?p=KiwXAIeLTYcCfYQ6Swh6&pos=40.743%2C-74.016&z=9",
  subject: "Jjc03266's Post | Foncii Maps",
};
