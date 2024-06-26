// Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Mock Data
import { MockFMUserData } from "../../../types/mocks/mock-gql-types";

// Imports
import GalleryAuthorHeader from "./GalleryAuthorHeader";

// Component Story
export default {
  title: "User Posts/Gallery Author Header",
  tags: ["autodocs"],
  component: GalleryAuthorHeader,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <GalleryAuthorHeader {...args} />;

export const Default = Template.bind({});
export const WithPercentMatchScore = Template.bind({});

Default.args = {
  user: MockFMUserData,
};

WithPercentMatchScore.args = {
  user: MockFMUserData,
  percentMatchScore: 50,
};
