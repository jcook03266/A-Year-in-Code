// Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import RestaurantPublicationRecognitionLabel from "./RestaurantPublicationRecognitionLabel";

// Mock Data
import { MockArticlePublicationData } from "../../../types/mocks/mock-gql-types";

// Component Story
export default {
  title: "Labels/Restaurant Publication Recognition Label",
  tags: ["autodocs"],
  component: RestaurantPublicationRecognitionLabel,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => (
  <RestaurantPublicationRecognitionLabel {...args} />
);

export const Default = Template.bind({});
export const WithAdditionalCountIndicator = Template.bind({});
export const WithoutAdditionalCountIndicator = Template.bind({});

Default.args = {};

WithAdditionalCountIndicator.args = {
  articlePublications: [
    MockArticlePublicationData,
    MockArticlePublicationData,
    MockArticlePublicationData,
  ],
};

WithoutAdditionalCountIndicator.args = {
  articlePublications: [
    MockArticlePublicationData,
    MockArticlePublicationData,
    MockArticlePublicationData,
    MockArticlePublicationData,
  ],
};
