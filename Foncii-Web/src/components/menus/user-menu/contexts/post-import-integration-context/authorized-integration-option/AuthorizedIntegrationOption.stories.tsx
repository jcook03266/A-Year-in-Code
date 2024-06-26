// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import AuthorizedIntegrationOption from "./AuthorizedIntegrationOption";

// Types
import { FmIntegrationProviders } from "../../../../../../__generated__/graphql";

// Component Story
export default {
  title:
    "Menus/User Menu/Contexts/Post Import Integration Context/Authorized Integration Option",
  tags: ["autodocs"],
  component: AuthorizedIntegrationOption,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => (
  <AuthorizedIntegrationOption {...args} />
);

export const Default = Template.bind({});

Default.args = {
  integrationProvider: FmIntegrationProviders.Instagram,
};
