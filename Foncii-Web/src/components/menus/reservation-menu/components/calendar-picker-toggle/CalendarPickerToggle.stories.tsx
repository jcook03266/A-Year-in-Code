// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import CalendarPickerToggle from "./CalendarPickerToggle";

// Component Story
export default {
  title: "Menus/Reservation Menu/Components/Calendar Picker Toggle",
  tags: ["autodocs"],
  component: CalendarPickerToggle,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <CalendarPickerToggle {...args} />;

export const Default = Template.bind({});

Default.args = {
  targetReservationDate: new Date(),
  toggleStateDidChange: (newToggleState: boolean) => {
    console.log(`[CalendarPickerToggle] New Toggle State: ${newToggleState}`);
  },
};
