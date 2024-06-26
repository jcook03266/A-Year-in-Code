// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import DoughnutChart from "./DoughnutChart";

// Mocks
import { MockTopTagsDistribution } from "../../../types/mocks/mock-gql-types";

// Component Story
export default {
  title: "Graphs/Doughnut Chart",
  tags: ["autodocs"],
  component: DoughnutChart,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <DoughnutChart {...args} />;

export const Default = Template.bind({});

Default.args = {
  dataset: MockTopTagsDistribution,
  labelDescription: " Posts with this tag",
  segmentColors: [
    "rgba(220, 225, 255, 1)",
    "rgba(181, 196, 255, 1)",
    "rgba(52, 68, 121, 1)",
    "rgba(28, 45, 97, 1)",
  ],
};
