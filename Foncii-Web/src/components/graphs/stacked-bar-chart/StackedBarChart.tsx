// Dependencies
// Hooks
import { useMemo } from "react";

// Components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  ChartData,
} from "chart.js";
import { Bar } from "react-chartjs-2";

// Utilities
import { uppercaseFirstLetter } from "../../../utilities/formatting/textContentFormatting";

// Local Types
export type StackedBarChartDataset = {
  /** The name / title of this dataset */
  label: string;
  /** Numeric data point to display and what will also determine the relative range of the graph itself */
  data: number[];
  /** The RGB or RGBA color to distinguish this entry's bar segments from the others with ex.) rgb(53, 162, 235) */
  backgroundColor: string;
};

interface StackedBarChartProps {
  className?: string;
  /** Entity Distribution | Name (Label) + Count */
  datasets: StackedBarChartDataset[];
  /**
   * The categorical labels for each data point / what to display as the title on the graph's X axis
   * Note: This must be the same width as the `data` attribute for each dataset in the `datasets` array
   */
  labels: string[];
}

export enum StackedBarChartColors {
  Green = 0,
  Yellow = 1,
  Gray = 2,
}

export function getStackedBarChartColor(color: StackedBarChartColors) {
  switch (color) {
    case StackedBarChartColors.Green:
      return "rgba(125, 215, 161, 1)";
    case StackedBarChartColors.Yellow:
      return "rgba(252, 233, 181, 1)";
    case StackedBarChartColors.Gray:
      return "rgba(222, 226, 237, 1)";
  }
}

export function assignStackedBarChartBackgroundColorFor(index: number) {
  switch (index) {
    case 0:
      return getStackedBarChartColor(StackedBarChartColors.Green);
    case 1:
      return getStackedBarChartColor(StackedBarChartColors.Yellow);
    case 2:
    default:
      return getStackedBarChartColor(StackedBarChartColors.Gray);
  }
}

export default function StackedBarChart({
  className,
  datasets,
  labels,
}: StackedBarChartProps) {
  // Setup
  ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

  // Formatting
  const formattedLabels = useMemo(() => {
    return labels.map(uppercaseFirstLetter);
  }, [labels]);

  // Adding styling properties to each bar
  const styledDataset = useMemo(() => {
    return datasets.map((dataset) => {
      return {
        ...dataset,
        borderSkipped: false,
        barThickness: 18,
      };
    });
  }, [datasets]);

  // Configuration
  const data: ChartData<"bar", number[], string> = {
    labels: formattedLabels,
    // Reversed to order the stack from left to right top to bottom
    datasets: styledDataset.reverse(),
  };

  const options = {
    responsive: true,
    // Disable gridlines and stack the bars on top of one another
    scales: {
      x: {
        stacked: true,
        ticks: {
          color: "rgba(255, 255, 255, 1)",
        },
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
      },
      y: {
        stacked: true,
        ticks: {
          color: "rgba(164, 168, 183, 1)",
        },
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
      },
    },
  };

  return <Bar className={className} data={data} options={options} />;
}
