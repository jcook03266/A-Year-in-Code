// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import CalendarPicker from "./CalendarPicker";

// Component Story
export default {
  title: "Menus/Reservation Menu/Components/Calendar Picker",
  tags: ["autodocs"],
  component: CalendarPicker,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <CalendarPicker {...args} />;

export const Default = Template.bind({});

Default.args = {
  targetReservationDate: new Date(),
  dateSelectionDidChange: (date: Date) => {
    console.log(`[CalendarPicker] New Reservation Date Selected: ${date}`);
  },
};
