// Dependencies
// Types
import { UserAnalyticsDashboardEntityDistribution } from "../../../../__generated__/graphql";

// Hooks
import { useMemo } from "react";

// Components
import DoughnutChart, {
  DoughnutChartDataset,
} from "../../doughnut-chart/DoughnutChart";
import FonciiToolTip from "../../../tool-tips/FonciiToolTip";
import CircularLoadingIndicator from "../../../../components/loading-indicators/circular-loading-indicator/CircularLoadingIndicator";

// Utilities
import { cn } from "../../../../utilities/development/DevUtils";
import { uppercaseFirstLetterOnly } from "../../../../utilities/formatting/textContentFormatting";
import { ClassNameValue } from "tailwind-merge";
import { abbreviateNumber } from "../../../../utilities/formatting/textContentFormatting";

// Local Types
interface UADEntityDistributionWidgetProps {
  className?: ClassNameValue;
  /** Entity Distribution | Name (Label) + Count */
  dataset?: UserAnalyticsDashboardEntityDistribution[];
  /** The total number of categories in the dataset including the ones in the passed in partial dataset  */
  entireDatasetTotalCount?: number
  /** The title of this chart */
  title: string;
  /** The title to display inside of the chart to indicate the meaning of the counter value (ex. Total Views) */
  datasetCounterTitle: string;
  /** What each label means in the context of the chart (ex.) # of views), leave blank to not display it */
  labelDescription?: string;
  /** The color scheme to use for the chart and the other components displayed by this widget */
  colorScheme?: UADEntityDistributionWidgetColorSchemes;
  /** The size and behavior of the widget's dimensions */
  variant?: UADEntityDistributionWidgetVariants;
  isLoading?: boolean;
}

export enum UADEntityDistributionWidgetColorSchemes {
  Red,
  Green,
  Blue,
}

export enum UADEntityDistributionWidgetVariants {
  /** Takes up entire width of container */
  Large,
  /** Constrains itself to its own specified bounds / size */
  Compact,
  /** Dynamically resizable, fits the container its in */
  Responsive,
}

export default function UADEntityDistributionWidget({
  className,
  dataset = [],
  entireDatasetTotalCount = 0,
  title,
  datasetCounterTitle,
  labelDescription,
  colorScheme = UADEntityDistributionWidgetColorSchemes.Blue,
  variant = UADEntityDistributionWidgetVariants.Large,
  isLoading = false,
}: UADEntityDistributionWidgetProps) {
  // Styling
  const variantStyling = () => {
    let className =
      "p-[16px] min-w-[260px] max-w-[600px] min-h-[250px] justify-center ";

    switch (variant) {
      case UADEntityDistributionWidgetVariants.Large:
        className += "justify-start w-full h-fit px-[20px]";
        break;
      case UADEntityDistributionWidgetVariants.Compact:
        className += "w-[260px] max-w-[260px] h-fit";
        break;
      case UADEntityDistributionWidgetVariants.Responsive:
        className += "w-fit h-fit";
        break;
    }

    return className;
  };

  // Properties
  const segmentColors = () => {
    switch (colorScheme) {
      case UADEntityDistributionWidgetColorSchemes.Red:
        return [
          "rgba(255, 218, 214, 1)",
          "rgba(255, 137, 125, 1)",
          "rgba(255, 180, 171, 1)",
          "rgba(255, 84, 73, 1)",
        ];
      case UADEntityDistributionWidgetColorSchemes.Green:
        return [
          "rgba(218, 230, 216, 1)",
          "rgba(162, 174, 162, 1)",
          "rgba(111, 122, 110, 1)",
          "rgba(63, 74, 63, 1)",
        ];
      case UADEntityDistributionWidgetColorSchemes.Blue:
        return [
          "rgba(220, 225, 255, 1)",
          "rgba(181, 196, 255, 1)",
          "rgba(52, 68, 121, 1)",
          "rgba(28, 45, 97, 1)",
        ];
    }
  };

  const cardBackgroundColors = () => {
    switch (colorScheme) {
      case UADEntityDistributionWidgetColorSchemes.Red:
        return [
          "rgba(255, 218, 214, 1)",
          "rgba(255, 137, 125, 1)",
          "rgba(255, 180, 171, 1)",
          "rgba(255, 84, 73, 1)",
        ];
      case UADEntityDistributionWidgetColorSchemes.Green:
        return [
          "rgba(218, 230, 216, 1)",
          "rgba(162, 174, 162, 1)",
          "rgba(111, 122, 110, 1)",
          "rgba(63, 74, 63, 1)",
        ];
      case UADEntityDistributionWidgetColorSchemes.Blue:
        return [
          "rgba(220, 225, 255, 1)",
          "rgba(181, 196, 255, 1)",
          "rgba(52, 68, 121, 1)",
          "rgba(28, 45, 97, 1)",
        ];
    }
  };

  const cardForegroundColors = () => {
    switch (colorScheme) {
      case UADEntityDistributionWidgetColorSchemes.Red:
        return [
          "rgba(25, 29, 44, 1)",
          "rgba(25, 29, 44, 1)",
          "rgba(25, 29, 44, 1)",
          "rgba(255, 255, 255, 1)",
        ];
      case UADEntityDistributionWidgetColorSchemes.Green:
        return [
          "rgba(25, 29, 44, 1)",
          "rgba(25, 29, 44, 1)",
          "rgba(25, 29, 44, 1)",
          "rgba(255, 255, 255, 1)",
        ];
      case UADEntityDistributionWidgetColorSchemes.Blue:
        return [
          "rgba(25, 29, 44, 1)",
          "rgba(25, 29, 44, 1)",
          "rgba(255, 255, 255, 1)",
          "rgba(255, 255, 255, 1)",
        ];
    }
  };

  // Convenience
  const shouldDisplayNoDataPrompt = () => {
    return dataset.length == 0;
  };

  const shouldDisplaySomePrompt = () => {
    return shouldDisplayNoDataPrompt() || isLoading;
  };

  const transformedDataset = useMemo(() => {
    const distributionDataset: DoughnutChartDataset = {};

    dataset.map((entity) => {
      distributionDataset[entity.category] = entity.count;
    });

    return distributionDataset;
  }, [dataset]);

  const transformedDatasetTotalCount = useMemo(() => {
    return Object.values(transformedDataset).reduce(
      (curr, acc) => acc + curr,
      0
    );
  }, [transformedDataset]);

  const computeTotalEntityCount = useMemo(() => {
    if (entireDatasetTotalCount) {
      // Real total given
      return entireDatasetTotalCount;
    }
    else {
      // Real total not given for some reason, use the partial dataset to compute the partial total
      return transformedDatasetTotalCount;
    }
  }, [entireDatasetTotalCount, transformedDatasetTotalCount]);

  const computeTotalOtherEntityCount = useMemo(() => {
    return computeTotalEntityCount - transformedDatasetTotalCount; // Total - Partial Total
  }, [computeTotalEntityCount, transformedDatasetTotalCount]);

  const normalizedDataset = useMemo(() => {
    const normalizedDataset = transformedDataset;

    // Append the 'Other' entity to the dataset to reflect the total count of the other entities that 
    // aren't present in the distribution (if any). 
    if (entireDatasetTotalCount && computeTotalOtherEntityCount > 1)
      normalizedDataset['Other'] = computeTotalOtherEntityCount;

    return normalizedDataset;
  }, [computeTotalOtherEntityCount, entireDatasetTotalCount, transformedDataset]);

  // Subcomponents
  const CountDescription = () => {
    const abbreviatedCount = abbreviateNumber(computeTotalEntityCount);

    return (
      <p className="font-normal text-permanent_white text-[28px] line-clamp-1">
        {abbreviatedCount}
      </p>
    );
  };

  const TitleLabel = () => {
    return (
      <p className="font-normal text-permanent_white line-clamp-1 text-[18px] w-full h-fit cursor-default">
        {uppercaseFirstLetterOnly(title)}
      </p>
    );
  };

  const DatasetCounterTitleLabel = () => {
    return (
      <p className="font-normal text-neutral line-clamp-2 text-[10px]">
        {datasetCounterTitle.toUpperCase()}
      </p>
    );
  };

  const InternalDescriptor = () => {
    return (
      <div
        className={cn(
          "flex flex-col p-[45px] h-full w-full items-center justify-center text-center"
        )}
      >
        <CountDescription />
        <DatasetCounterTitleLabel />
      </div>
    );
  };

  const EntityDescriptionCard = ({
    title,
    index,
  }: {
    title: string;
    index: number;
  }) => {
    // Properties
    const backgroundColor = cardBackgroundColors()[index],
      foregroundColor = cardForegroundColors()[index];

    return (
      <FonciiToolTip title={title}>
        <div
          className={cn(
            variant == UADEntityDistributionWidgetVariants.Large
              ? "pl-[12px]"
              : "",
            "rounded-[8px] py-[4px] px-[8px] w-fit h-fit flex items-center justify-center cursor-default"
          )}
          style={{ backgroundColor, color: foregroundColor }}
        >
          <p className="font-normal text-[12px] line-clamp-1">
            {title.toUpperCase()}
          </p>
        </div>
      </FonciiToolTip>
    );
  };

  const EntityCardCollection = () => {
    return (
      <div className={cn("flex flex-wrap h-fit w-fit gap-[8px] p-[4px]",
        variant == UADEntityDistributionWidgetVariants.Large ? 'sm:max-w-[300px] max-w-[240px]' : ''
      )}>
        {Object.entries(normalizedDataset).map(([label, _], index) => {
          return (
            <EntityDescriptionCard key={index} title={label} index={index} />
          );
        })}
      </div>
    );
  };

  const NoDataPrompt = () => {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-permanent_white text-[16px] font-normal">
          No Metrics Available
        </p>
      </div>
    );
  };

  const LoadingPrompt = () => {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <CircularLoadingIndicator
          isLoading={isLoading}
          className="min-w-[44px] min-h-[44px]"
        />
      </div>
    );
  };

  const CurrentPrompt = () => {
    if (isLoading) {
      return <LoadingPrompt />;
    } else if (shouldDisplayNoDataPrompt()) {
      return <NoDataPrompt />;
    } else return;
  };

  return (
    <div
      className={cn(
        variantStyling(),
        "flex flex-wrap gap-[12px] items-center relative bg-black shadow-xl rounded-[12px]",
        className
      )}
    >
      {shouldDisplaySomePrompt() ? (
        <CurrentPrompt />
      ) : (
        <>
          <TitleLabel />

          <div
            className={cn(
              "flex items-center justify-center relative w-[175px] h-[175px]"
            )}
          >
            <DoughnutChart
              className={"absolute h-full w-full"}
              dataset={normalizedDataset}
              labelDescription={labelDescription}
              segmentColors={segmentColors()}
            />
            <InternalDescriptor />
          </div>

          <EntityCardCollection />
        </>
      )}
    </div>
  );
}
