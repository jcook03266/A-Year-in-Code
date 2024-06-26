// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import ReservationWidget from "./ReservationWidget";

// Mock Data
import { MockReservationAvailabilities } from "../../../../types/mocks/mock-gql-types";

// Component Story
export default {
  title: "Menus/Reservation Menu/Components/Reservation Widget",
  tags: ["autodocs"],
  component: ReservationWidget,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <ReservationWidget {...args} />;

export const FilterMenu = Template.bind({});
export const DetailView = Template.bind({});

FilterMenu.args = {
  reservationAvailabilities: undefined,
  targetReservationDate: new Date(),
  targetPartySize: 2,
};

DetailView.args = {
  reservationAvailabilities: MockReservationAvailabilities,
  targetReservationDate: new Date(),
  targetPartySize: 2,
};
