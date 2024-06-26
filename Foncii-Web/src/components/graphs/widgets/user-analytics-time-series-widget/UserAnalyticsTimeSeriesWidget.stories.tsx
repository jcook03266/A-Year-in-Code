// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import UADTimeSeriesWidget from "./UserAnalyticsTimeSeriesWidget";

// Mocks
import { MockReservationIntentsWeeklyDataset } from "../../../../types/mocks/mock-gql-types";

// Component Story
export default {
  title: "Graphs/Widgets/User Analytics Time Series Widget",
  tags: ["autodocs"],
  component: UADTimeSeriesWidget,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <UADTimeSeriesWidget {...args} />;

export const Default = Template.bind({});

Default.args = {
  dataset: MockReservationIntentsWeeklyDataset,
  title: "Reservation Intents",
  totalEventCount: 1263,
  relativeEventCountChange: 212,
  totalEventCounterTitle: "Reservations",
  informationToolTipDescription:
    "The number of times a person has attempted to make a restaurant reservation through your Foncii Map.",
};
