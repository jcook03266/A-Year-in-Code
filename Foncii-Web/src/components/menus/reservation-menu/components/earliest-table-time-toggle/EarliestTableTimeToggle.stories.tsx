// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import EarliestTableTimeToggle from "./EarliestTableTimeToggle";

// Mock Data
import { MockReservationAvailabilities } from "../../../../../types/mocks/mock-gql-types";

// Component Story
export default {
  title: "Menus/Reservation Menu/Components/Earliest Table Time Toggle",
  tags: ["autodocs"],
  component: EarliestTableTimeToggle,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <EarliestTableTimeToggle {...args} />;

export const Default = Template.bind({});

Default.args = {
  availabilities: MockReservationAvailabilities,
  toggleStateDidChange: (newToggleState: boolean) => {
    console.log(
      `[EarliestTableTimeToggle] New Toggle State: ${newToggleState}`
    );
  },
};
