// Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Mock Data
import { MockFMUserData } from "../../../types/mocks/mock-gql-types";

// Imports
import CreatorUsernameLabel from "./CreatorUsernameLabel";

// Component Story
export default {
  title: "Labels/Creator Username Label",
  tags: ["autodocs"],
  component: CreatorUsernameLabel,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <CreatorUsernameLabel {...args} />;

export const Default = Template.bind({});

Default.args = {
  creator: MockFMUserData,
};
