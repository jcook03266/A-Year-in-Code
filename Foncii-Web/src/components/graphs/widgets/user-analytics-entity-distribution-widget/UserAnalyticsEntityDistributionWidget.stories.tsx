// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import UADEntityDistributionWidget, {
  UADEntityDistributionWidgetColorSchemes,
  UADEntityDistributionWidgetVariants,
} from "./UserAnalyticsEntityDistributionWidget";

// Mocks
import { MockTopTagsDistribution } from "../../../../types/mocks/mock-gql-types";

// Component Story
export default {
  title: "Graphs/Widgets/User Analytics Entity Distribution Widget",
  tags: ["autodocs"],
  component: UADEntityDistributionWidget,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => (
  <UADEntityDistributionWidget {...args} />
);

export const Default = Template.bind({});

Default.args = {
  title: "Top Tags",
  datasetCounterTitle: "Total Tags",
  dataset: MockTopTagsDistribution,
  colorScheme: UADEntityDistributionWidgetColorSchemes.Red,
  variant: UADEntityDistributionWidgetVariants.Large,
};
