// Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Mock Data
import { MockFMUserData } from "../../../types/mocks/mock-gql-types";

// Imports
import InfluencerMatchAvatar from "./InfluencerMatchAvatar";

// Component Story
export default {
  title: "Media Views/Influencer Match Avatar",
  tags: ["autodocs"],
  component: InfluencerMatchAvatar,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <InfluencerMatchAvatar {...args} />;

export const Default = Template.bind({});
export const WithScore = Template.bind({});

Default.args = {
  user: MockFMUserData,
};

WithScore.args = {
  user: MockFMUserData,
  percentMatchScore: 85,
};
