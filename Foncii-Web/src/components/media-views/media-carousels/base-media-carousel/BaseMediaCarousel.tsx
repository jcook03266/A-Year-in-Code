/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Hooks
import { useEffect, useRef, useState } from "react";

// Components
import Image from "next/image";

// Assets
import { ImageRepository } from "../../../../../public/assets/images/ImageRepository";

// Utilities
import { cn } from "../../../../utilities/development/DevUtils";
import { ClassNameValue } from "tailwind-merge";

export default function BaseMediaCarousel({
  contentProviderID,
  totalPages,
  children,
  className,
  onPageIndexChangeCallback,
}: {
  contentProviderID: string;
  totalPages: number;
  children?: React.ReactNode;
  className: ClassNameValue;
  onPageIndexChangeCallback?: (pageIndex: number) => void;
}) {
  // State Management
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // UI References
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const carouselContentRef = useRef<HTMLDivElement>(null);

  // UI Sizing
  const [width, setWidth] = useState<number>();
  const [height, setHeight] = useState<number>();

  // State for tracking dragging
  const [draggingStarted, setDraggingStarted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);

  // Reset the carousel content offset when the component's content provider changes
  useEffect(() => {
    resetCarouselContentOffset();
  }, [contentProviderID]);

  useEffect(() => {
    updateCarouselContentOffset(currentPageIndex);
    onPageIndexChangeCallback?.(currentPageIndex);
  }, [currentPageIndex]);

  useEffect(() => {
    updateCarouselContentOffset(currentPageIndex);
  }, [height, width]);

  useEffect(() => {
    // Div ref must be initialized
    if (!mainContainerRef.current) return;

    // Observe the resizing of the main container and respond to differences in height / width
    const resizeObserver = new ResizeObserver(() => {
      if (mainContainerRef?.current?.offsetWidth !== width) {
        setWidth(mainContainerRef?.current?.offsetWidth ?? 0);
      }
      if (mainContainerRef?.current?.offsetHeight !== height) {
        setHeight(mainContainerRef?.current?.offsetHeight ?? 0);
      }
    });

    resizeObserver.observe(mainContainerRef.current);

    // Clean up observer on unmount
    return () => resizeObserver.disconnect();
  }, [mainContainerRef.current]);

  // Attach event listeners for dragging and touches outside main container
  useEffect(() => {
    const containerRef = mainContainerRef.current;
    if (!containerRef) return;

    // Drag event listeners
    containerRef.addEventListener("mousedown", handleDragStart);
    containerRef.addEventListener("mousemove", handleDragMove);
    containerRef.addEventListener("mouseup", handleDragEnd);

    // Touch event listeners (mobile)
    containerRef.addEventListener("touchstart", handleDragStart);
    containerRef.addEventListener("touchmove", handleDragMove);
    containerRef.addEventListener("touchend", handleDragEnd);

    // Event listener for clicks on the document
    document.addEventListener("mouseup", handleClickOutside);
    document.addEventListener("touchend", handleClickOutside);

    return () => {
      containerRef.removeEventListener("mousedown", handleDragStart);
      containerRef.removeEventListener("mousemove", handleDragMove);
      containerRef.removeEventListener("mouseup", handleDragEnd);

      containerRef.removeEventListener("touchstart", handleDragStart);
      containerRef.removeEventListener("touchmove", handleDragMove);
      containerRef.removeEventListener("touchend", handleDragEnd);

      document.addEventListener("mouseup", handleClickOutside);
      document.addEventListener("touchend", handleClickOutside);
    };
  }, [draggingStarted, dragStartX]);

  // Properties
  const maxPageIndex = totalPages - 1,
    minPageIndex = 0;

  // Event handlers
  // Function to handle click outside the main container
  const handleClickOutside = (event: any) => {
    if (
      mainContainerRef.current &&
      !mainContainerRef.current.contains(event.target)
    ) {
      // Clicked outside the main container, end any dragging events
      handleDragEnd();
    }
  };

  // Event handlers for dragging
  const handleDragStart = (event: any) => {
    const classListValue = event.target.classList.value;
    // Video player overlay is absolute and Image is relative. Controls are neither
    if (
      classListValue.includes("absolute") ||
      classListValue.includes("relative")
    ) {
      const clientX =
        event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
      setDraggingStarted(true);
      setDragStartX(clientX);
    }
  };

  const handleDragMove = (event: MouseEvent | TouchEvent) => {
    if (
      !draggingStarted ||
      width == undefined ||
      carouselContentRef.current == undefined
    )
      return;

    const clientX =
        event instanceof MouseEvent ? event.clientX : event.touches[0].clientX,
      deltaX = clientX - dragStartX,
      scrollOffset = currentPageIndex * width - deltaX;

    // Update scroll view with updated offset
    carouselContentRef.current.scrollTo({
      left: scrollOffset,
      behavior: "auto",
    });

    setIsDragging(true);
  };

  const handleDragEnd = () => {
    if (
      !draggingStarted ||
      width == undefined ||
      carouselContentRef.current == undefined
    )
      return;

    // Page increment threshold (user must drag a 4th of the container's width to go to the next page automatically)
    const threshold = width / 4;

    // Calculate the drag distance
    const deltaX =
      carouselContentRef.current.scrollLeft - currentPageIndex * width;

    // Navigate forward if above positive threshold (dragging right), and backward if below negative threshold (dragging left)
    if (deltaX > threshold) {
      navigateForward();
    } else if (deltaX < -threshold) {
      navigateBackward();
    } else {
      // Reset scroll offset to center the current page
      updateCarouselContentOffset(currentPageIndex, true);
    }

    setDraggingStarted(false);
    setIsDragging(false);
  };

  function updateCarouselContentOffset(
    pageIndex: number,
    animated: boolean = true
  ) {
    const carouselContentReference = carouselContentRef.current,
      mainContainerReference = mainContainerRef.current;

    if (!carouselContentReference || !mainContainerReference) return;

    const containerWidth = mainContainerReference.clientWidth,
      scrollOffset = pageIndex * containerWidth;

    carouselContentReference.scrollTo({
      left: scrollOffset,
      behavior: animated ? "smooth" : "instant",
    });
  }

  // Actions
  const setPageIndex = (pageIndex: number) => {
    setCurrentPageIndex(pageIndex);
  };

  const resetCarouselContentOffset = () => {
    setPageIndex(minPageIndex);
    updateCarouselContentOffset(minPageIndex, false);
  };

  const navigateForward = () => {
    const newPageIndex = Math.min(currentPageIndex + 1, maxPageIndex);
    setPageIndex(newPageIndex);
  };

  const navigateBackward = () => {
    const newPageIndex = Math.max(currentPageIndex - 1, minPageIndex);
    setPageIndex(newPageIndex);
  };

  // Convenience
  const isLastPage = currentPageIndex === maxPageIndex,
    isFirstPage = currentPageIndex === minPageIndex;

  const shouldDisplayPageIndicator = (): boolean => {
    return totalPages > 1;
  };

  const mediaUserInteractionPossible = (): boolean => {
    return !isDragging;
  };

  // Subcomponents
  const PageIndicator = (): React.ReactNode => {
    if (!shouldDisplayPageIndicator()) return;

    return (
      <div className="w-full h-fit bottom-[18px] flex items-center justify-center shrink-0">
        <div className="w-fit h-fit flex flex-row gap-x-[18px] px-[18px] py-[8px]">
          {Array.from({ length: totalPages }).map((_, index) => {
            return <PageIndicatorDot key={index} pageIndex={index} />;
          })}
        </div>
      </div>
    );
  };

  const PageIndicatorDot = ({
    pageIndex,
  }: {
    pageIndex: number;
  }): React.ReactNode => {
    const isActive = pageIndex == currentPageIndex;

    return (
      <button
        title={`Page ${pageIndex + 1}`}
        className={cn(
          isActive ? "bg-neutral" : "bg-medium_dark_grey",
          "h-[8px] rounded-full w-[8px] shrink-0 hover:scale-120 hover:opacity-75 active:scale-90 transition-all ease-in-out"
        )}
        onClick={() => setPageIndex(pageIndex)}
      />
    );
  };

  const ForwardNavigationButton = (): React.ReactNode => {
    return (
      <div
        className={cn(
          "absolute right-0 pr-[8px] transition-all ease-in-out duration-300",
          isLastPage ? "scale-0 pointer-events-none" : ""
        )}
      >
        {GenericNavigationArrowButton({
          onClick: navigateForward,
          forwardArrow: true,
        })}
      </div>
    );
  };

  const BackwardNavigationButton = (): React.ReactNode => {
    return (
      <div
        className={cn(
          "absolute left-0 pl-[8px] transition-all ease-in-out duration-300",
          isFirstPage ? "scale-0 pointer-events-none" : ""
        )}
      >
        {GenericNavigationArrowButton({
          onClick: navigateBackward,
          forwardArrow: false,
        })}
      </div>
    );
  };

  const GenericNavigationArrowButton = ({
    onClick,
    forwardArrow,
  }: {
    onClick: () => void;
    forwardArrow: boolean;
  }): React.ReactNode => {
    return (
      <button
        onClick={onClick}
        className="pointer-events-auto flex items-center justify-center h-[30px] w-[30px] bg-black bg-opacity-50 shadow-lg rounded-full transition-all ease-in-out active:scale-90 shrink-0"
      >
        <Image
          src={
            forwardArrow
              ? ImageRepository.UtilityIcons.RightChevronNavigationIcon
              : ImageRepository.UtilityIcons.LeftChevronNavigationIcon
          }
          className="h-[16px] w-fit shrink-0"
          alt="Navigation Button Direction Indicator Arrow"
        />
      </button>
    );
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-y-[8px] w-full items-center justify-center"
      )}
    >
      {/** Scroll View */}
      <div
        className={cn(
          "flex w-full items-center bg-black justify-center overflow-hidden transition-all ease-in-out duration-500",
          className
        )}
        ref={mainContainerRef}
      >
        {/** Carousel Content */}
        <div
          className={cn(
            "w-full h-full select-none overflow-hidden flex flex-row",
            mediaUserInteractionPossible()
              ? "pointer-events-auto"
              : "pointer-events-none"
          )}
          ref={carouselContentRef}
        >
          {children}
        </div>

        {/** Navigation Buttons */}
        {ForwardNavigationButton()}
        {BackwardNavigationButton()}
      </div>
      <PageIndicator />
    </div>
  );
}
