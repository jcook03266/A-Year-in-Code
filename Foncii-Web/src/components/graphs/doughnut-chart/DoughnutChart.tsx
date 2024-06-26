// Dependencies
// Hooks
import { useCallback, useMemo } from "react";

// Components
import { Chart as ChartJS, ChartData, ArcElement, Tooltip } from "chart.js";
import { Doughnut } from "react-chartjs-2";

// Local Types
export type DoughnutChartDataset = {
  [label: string]: number;
};

interface DoughnutChartProps {
  className?: string;
  /** Entity Distribution | Name (Label) + Count */
  dataset: DoughnutChartDataset;
  /** What each dataset label means in the context of the chart (ex.) # of views) */
  labelDescription?: string;
  /** An array of the RGB or RGBA color of each individual segment */
  segmentColors: string[];
}

export default function DoughnutChart({
  className,
  dataset,
  labelDescription,
  segmentColors,
}: DoughnutChartProps) {
  // Setup
  ChartJS.register(ArcElement, Tooltip);

  // Convenience
  const computeTotalEntityCount = useMemo(() => {
    return Object.values(dataset).reduce((curr, acc) => acc + curr, 0);
  }, [dataset]);

  const computeDistributionPercentage = useCallback(
    () => (entityCount: number) => {
      const total = computeTotalEntityCount;
      return (entityCount / total) * 100;
    },
    [computeTotalEntityCount]
  );

  const generateParsedLabelName = useCallback(
    () => (entity: { label: string; count: number }) => {
      const percentage = computeDistributionPercentage()(entity.count);

      return `${entity.label} (${percentage.toFixed(2)}%)`;
    },
    [computeDistributionPercentage]
  );

  // Parsing
  const parsedLabels = useMemo(() => {
      return Object.entries(dataset).map(([label, count]) => {
        return generateParsedLabelName()({ label, count });
      });
    }, [dataset, generateParsedLabelName]),
    parsedData = useMemo(() => {
      return Object.values(dataset);
    }, [dataset]);

  // Configuration
  const data: ChartData<"doughnut", number[], string> = {
    labels: parsedLabels,
    datasets: [
      {
        label: labelDescription,
        data: parsedData,
        spacing: 2,
        backgroundColor: segmentColors,
        borderWidth: 0,
      },
    ],
  };

  const options = {
    cutout: "70%",
  };

  return <Doughnut className={className} data={data} options={options} />;
}
