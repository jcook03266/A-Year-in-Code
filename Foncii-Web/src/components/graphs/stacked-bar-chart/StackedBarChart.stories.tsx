// Package Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import DoughnutChart, {
  StackedBarChartColors,
  getStackedBarChartColor,
} from "./StackedBarChart";

// Component Story
export default {
  title: "Graphs/Stacked Bar Chart",
  tags: ["autodocs"],
  component: DoughnutChart,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <DoughnutChart {...args} />;

export const Default = Template.bind({});

Default.args = {
  datasets: [
    {
      label: "Yes",
      data: [25, 2, 10, 12, 22, 30, 0],
      backgroundColor: getStackedBarChartColor(StackedBarChartColors.Green),
    },
    {
      label: "Just Looking",
      data: [96, 102, 32, 46, 15, 102, 20],
      backgroundColor: getStackedBarChartColor(StackedBarChartColors.Yellow),
    },
    {
      label: "No",
      data: [121, 234, 59, 43, 21, 201, 42],
      backgroundColor: getStackedBarChartColor(StackedBarChartColors.Gray),
    },
  ],
  labels: ["M", "T", "W", "Th", "F", "Sa", "S"],
};
