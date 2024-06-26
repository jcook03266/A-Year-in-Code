// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import FonciiSocialLinkButton, {
  FonciiSocialMedias,
} from "./FonciiSocialLinkButton";

export default {
  title: "Buttons/Links/Foncii Social Link Button",
  tags: ["autodocs"],
  component: FonciiSocialLinkButton,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <FonciiSocialLinkButton {...args} />;

export const FonciiInstagramSocialLink = Template.bind({});
export const FonciiTwitterSocialLink = Template.bind({});
export const FonciiMediumSocialLink = Template.bind({});

FonciiInstagramSocialLink.args = {
  socialMedia: FonciiSocialMedias.instagram,
};

FonciiTwitterSocialLink.args = {
  socialMedia: FonciiSocialMedias.twitter,
};

FonciiMediumSocialLink.args = {
  socialMedia: FonciiSocialMedias.medium,
};
