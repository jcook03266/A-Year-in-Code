// Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import OAuthButton from "./OAuthButton";

// Types
import { AuthProviders } from "../../../../__generated__/graphql";

export default {
  title: "Buttons/Call To Action/OAuth Button",
  tags: ["autodocs"],
  component: OAuthButton,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <OAuthButton {...args} />;

export const Google = Template.bind({});
export const Facebook = Template.bind({});
export const Twitter = Template.bind({});

Google.args = {
  provider: AuthProviders.Google,
};

Facebook.args = {
  provider: AuthProviders.Facebook,
};

Twitter.args = {
  provider: AuthProviders.Twitter,
};
