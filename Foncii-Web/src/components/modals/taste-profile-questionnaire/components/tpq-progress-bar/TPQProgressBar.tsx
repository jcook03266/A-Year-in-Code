/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Assets
import { ImageRepository } from "../../../../../../public/assets/images/ImageRepository";

// Hooks
import { useEffect } from "react";

// Components
// Local
import FonciiToolTip from "../../../../../components/tool-tips/FonciiToolTip";

// External
import Image from "next/image";

// Types
interface TPQProgressBarProps {
  /** The current page index reported by the parent component, this is simply displayed on the progress bar */
  currentPageIndex: number;
  /** The total amount of pages the progress bar will visualize */
  pageCount: number;
  /** A list of numbers representing the indices of the pages that are 'complete' by some external metric */
  completedPagesIndices?: number[];
  /** A function that is called when the user clicks on one of the page indicators, can be used to navigate between pages externally */
  onPageIndicatorClick?: (pageIndex: number) => void;
}

// Tracks the user's progress in the taste profile questionnaire in a visual format
export default function TPQProgressBar({
  currentPageIndex = 0,
  pageCount,
  completedPagesIndices = [],
  onPageIndicatorClick,
}: TPQProgressBarProps) {
  // State Management
  // Refresh when the page index changes from the parent component
  useEffect(() => {}, [currentPageIndex]);

  // Properties
  const formattedCompletionProgressString = (): string => {
    return ((completedPagesIndices.length / pageCount) * 100).toFixed(2); // Percentage of pages completed
  };

  // Convenience
  const isPageComplete = (pageIndex: number): boolean => {
    return completedPagesIndices.includes(pageIndex);
  };

  const isPageActive = (pageIndex: number): boolean => {
    return pageIndex == currentPageIndex;
  };

  // True if the user has traversed to or past the page indicator where the given segment ends at, false otherwise
  // this is used to determine whether or not to color the segment to inform the user that it has been traversed
  const hasSegmentBeenTraversed = (segmentIndex: number): boolean => {
    const terminalPageIndicatorIndex = segmentIndex + 1; // The page indicator where the segment ends

    return currentPageIndex >= terminalPageIndicatorIndex;
  };

  // Subcomponents
  const PageIndicator = ({
    pageIndex,
  }: {
    pageIndex: number;
  }): React.ReactNode => {
    const pageActive = isPageActive(pageIndex),
      pageComplete = isPageComplete(pageIndex);

    // States:
    // 1.) Active, 1st possible state, a page can be active and complete, but this active UI must be shown over the complete UI
    // 2.) Complete
    // 3.) Inactive, last possible state
    const PageIndicatorInterior = (): React.ReactNode => {
      const icon = ImageRepository.UtilityIcons.WhiteCheckMarkIcon;

      return (
        <div
          className={`flex items-center justify-center ${
            pageActive || pageComplete ? "bg-primary" : "scale-0"
          } transition-all ease-in-out duration-500 rounded-full overflow-hidden ${
            pageComplete ? "w-full h-full" : "w-[5px] h-[5px]"
          }`}
        >
          <Image
            src={icon}
            alt="White Checkmark Icon"
            width={10}
            height={10}
            className={`h-[10px] w-[10px] ${
              pageComplete ? "opacity-100" : "opacity-0"
            } transition-all ease-in-out duration-200`}
            unoptimized
            unselectable="on"
          />
        </div>
      );
    };

    return (
      <FonciiToolTip title={`Navigate to page ${pageIndex + 1}`}>
        <button
          key={pageIndex}
          onClick={() => onPageIndicatorClick?.(pageIndex)}
          className={`flex shrink-0 h-[16px] w-[16px] rounded-full border-[2px] shadow-lg ${
            pageActive || pageComplete ? "border-primary" : "border-medium"
          } items-center justify-center transition-all ease-in-out duration-200 hover:opacity-75 active:scale-90`}
        >
          {PageIndicatorInterior()}
        </button>
      </FonciiToolTip>
    );
  };

  const ProgressBarSegment = ({
    segmentIndex,
  }: {
    segmentIndex: number;
  }): React.ReactNode => {
    const segmentTraversed = hasSegmentBeenTraversed(segmentIndex);

    // Animatable filler that grows to its required width when the segment is traversed, shrinks back to 0 when the segment is not traversed
    const SegmentBarFiller = (): React.ReactNode => {
      return (
        <div
          className={`${
            segmentTraversed
              ? "w-[16px] xs:w-[32px] bg-primary"
              : "w-[0px] bg-transparent"
          } transition-all ease-in-out duration-500`}
        />
      );
    };

    return (
      <div
        key={`segment-${segmentIndex}`}
        className="flex w-[16px] xs:w-[32px] h-[2px] bg-medium transition-all ease-in-out hover:opacity-75"
      >
        {/** Call the component this way to enable animations for it */}
        {SegmentBarFiller()}
      </div>
    );
  };

  return (
    <div className="flex flex-row flex-nowrap">
      {[...Array(pageCount)].map((_, pageIndex) => {
        // Don't place a segment after the last page indicator
        const isLastPage = pageIndex == pageCount - 1;

        return (
          <div
            key={`page-indicator-${pageIndex}`}
            className="flex flex-row items-center justify-center h-fit w-fit"
          >
            {/** Page indicator */}
            {PageIndicator({ pageIndex })}

            {/** Progress bar segment */}
            {!isLastPage
              ? ProgressBarSegment({ segmentIndex: pageIndex })
              : null}
          </div>
        );
      })}
    </div>
  );
}
