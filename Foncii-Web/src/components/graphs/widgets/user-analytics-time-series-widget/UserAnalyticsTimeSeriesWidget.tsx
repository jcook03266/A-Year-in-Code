// Dependencies
// Types
import { UserAnalyticsDashboardTimeSeriesEntry } from "../../../../__generated__/graphql";

// Hooks
import { useMemo } from "react";

// Components
// Local
import StackedBarChart, {
  StackedBarChartDataset,
  assignStackedBarChartBackgroundColorFor,
} from "../../stacked-bar-chart/StackedBarChart";
import FonciiToolTip from "../../../../components/tool-tips/FonciiToolTip";
import CircularLoadingIndicator from "../../../../components/loading-indicators/circular-loading-indicator/CircularLoadingIndicator";

// External
import Image from "next/image";

// Utilities
import { cn } from "../../../../utilities/development/DevUtils";
import { uppercaseFirstLetterOnly } from "../../../../utilities/formatting/textContentFormatting";
import { ClassNameValue } from "tailwind-merge";

// Assets
import { ImageRepository } from "../../../../../public/assets/images/ImageRepository";

// Local Types
interface UADTimeSeriesWidgetProps {
  className?: ClassNameValue;
  dataset?: UserAnalyticsDashboardTimeSeriesEntry[];
  /** The title of this chart */
  title: string;
  /** The total amount of data points / events represented by the time series dataset given */
  totalEventCount?: number;
  /** How much the amount of data points / events has changed relative to some previous point in time */
  relativeEventCountChange?: number;
  totalEventCounterTitle: string;
  /** Information about this graph to display as a tool tip */
  informationToolTipDescription: string;
  isLoading?: boolean;
}

export default function UADTimeSeriesWidget({
  className,
  dataset = [],
  title,
  totalEventCount = 0,
  relativeEventCountChange = 0,
  totalEventCounterTitle,
  informationToolTipDescription,
  isLoading = false
}: UADTimeSeriesWidgetProps) {
  // Convenience
  const shouldDisplayNoDataPrompt = () => {
    return dataset.length == 0;
  };

  const shouldDisplaySomePrompt = () => {
    return shouldDisplayNoDataPrompt() || isLoading;
  };

  const transformedDataset = useMemo(() => {
    const timeSeriesDatasets: StackedBarChartDataset[] = [];

    dataset.map((timeSeriesEntry, index) => {
      const label = timeSeriesEntry.category,
        data = timeSeriesEntry.data;

      if (label != undefined && data) {
        timeSeriesDatasets.push({
          label,
          data,
          backgroundColor: assignStackedBarChartBackgroundColorFor(index),
        });
      }
    });

    return timeSeriesDatasets;
  }, [dataset]);

  // Parsing
  const parsedLabels = useMemo(() => {
    return (dataset[0]?.timestamps ?? []);
  }, [dataset]);

  const parsedCategories = useMemo(() => {
    return dataset.map((timeSeriesEntry) => timeSeriesEntry.category);
  }, [dataset]);

  // Subcomponents
  const TitleLabel = () => {
    return (
      <p className="font-semibold gap-y-[16px] text-permanent_white line-clamp-1 text-[20px] w-fit h-fit cursor-default">
        {uppercaseFirstLetterOnly(title)}
      </p>
    );
  };

  const TimeSeriesTotalEventCounter = () => {
    const title = `${totalEventCount} ${totalEventCounterTitle}`;

    return (
      <FonciiToolTip title="Total over the current timespan">
        <div className="bg-medium py-[4px] px-[8px] h-fit w-fit flex items-center justify-center rounded-[4px]">
          <p className="text-permanent_white text-[12px] font-normal line-clamp-1">
            {title}
          </p>
        </div>
      </FonciiToolTip>
    );
  };

  const TimeSeriesRelativeEventCountChangeLabel = () => {
    const isChangePositive = relativeEventCountChange >= 0,
      title = `${isChangePositive ? "+" : ""} ${relativeEventCountChange}`;

    return (
      <FonciiToolTip title="Relative change over time">
        <div className="h-fit w-fit flex items-center justify-center">
          <p className="text-primary text-[12px] font-normal line-clamp-1">
            {title}
          </p>
        </div>
      </FonciiToolTip>
    );
  };

  const TimeSeriesMetricsSection = () => {
    return (
      <div className="flex flex-row gap-x-[8px] items-center justify-center w-fit h-fit cursor-default">
        <TimeSeriesTotalEventCounter />
        <TimeSeriesRelativeEventCountChangeLabel />
      </div>
    );
  };

  const CategoryCard = ({
    category,
    backgroundColor,
  }: {
    category: string;
    backgroundColor: string;
  }) => {
    return (
      <div
        className="flex items-center justify-center rounded-[4px] w-fit h-fit py-[4px] px-[8px] cursor-default"
        style={{ backgroundColor }}
      >
        <p className="text-[12px] font-normal text-permanent_black">
          {category}
        </p>
      </div>
    );
  };

  const InformationButton = () => {
    // Precondition failure, nothing to show
    if (!informationToolTipDescription) return;

    return (
      <FonciiToolTip title={informationToolTipDescription}>
        <button className="h-[18px] w-[18px] hover:opacity-75 transition-all flex items-center justify-center">
          <Image
            height={18}
            width={18}
            className="h-[18px] w-[18px]"
            alt="Information button icon"
            src={ImageRepository.UtilityIcons.CircularInfoIcon}
          />
        </button>
      </FonciiToolTip>
    );
  };

  // Sections
  const TopSection = () => {
    return (
      <div className="flex flex-row gap-x-[20px] justify-between items-center w-full h-fit">
        <TitleLabel />

        <div className="flex flex-row gap-x-[20px] justify-center items-center w-fit h-fit">
          <TimeSeriesMetricsSection />

          {InformationButton()}
        </div>
      </div>
    );
  };

  const CategoryList = () => {
    return (
      <div className={cn("flex flex-wrap h-fit w-fit gap-[8px] p-[4px]")}>
        {parsedCategories.map((category, index) => {
          const backgroundColor =
            assignStackedBarChartBackgroundColorFor(index);

          return category ? (
            <CategoryCard
              key={index}
              category={category}
              backgroundColor={backgroundColor}
            />
          ) : undefined;
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
        className,
        "flex justify-center w-full h-fit min-h-[270px] flex-col gap-[12px] items-center relative bg-black shadow-xl rounded-[12px] p-[16px]"
      )}
    >
      {shouldDisplaySomePrompt() ? (
        <CurrentPrompt />
      ) : (
        <>
          {TopSection()}

          <StackedBarChart
            className={"h-[200px] w-full"}
            datasets={transformedDataset}
            labels={parsedLabels}
          />

          <CategoryList />
        </>
      )}
    </div>
  );
}
