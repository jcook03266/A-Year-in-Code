// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import UserMenuRow from "./UserMenuRow";

// Assets
import { ImageRepository } from "../../../../../public/assets/images/ImageRepository";

// Component Story
export default {
  title: "Menus/User Menu/Row ",
  tags: ["autodocs"],
  component: UserMenuRow,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <UserMenuRow {...args} />;

export const Default = Template.bind({});

Default.args = {
  label: "Update Profile Picture",
  icon: ImageRepository.UserMenuIcons.UpdatePFPIcon,
  onClickAction: () => {
    console.log("User menu row option clicked");
  },
};
