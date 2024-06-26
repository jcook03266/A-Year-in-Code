// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import ReservationTimeTable from "./ReservationTimeTable";

// Mock Data
import { MockReservationAvailabilities } from "../../../../../types/mocks/mock-gql-types";

// Component Story
export default {
  title: "Menus/Reservation Menu/Components/Reservation Time Table",
  tags: ["autodocs"],
  component: ReservationTimeTable,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <ReservationTimeTable {...args} />;

export const Default = Template.bind({});
export const NoReservations = Template.bind({});

Default.args = {
  reservationAvailabilities: MockReservationAvailabilities,
};

NoReservations.args = {
  reservationAvailabilities: [],
};
