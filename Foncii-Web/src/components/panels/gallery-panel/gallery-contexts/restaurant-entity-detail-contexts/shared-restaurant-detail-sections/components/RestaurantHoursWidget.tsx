"use client";
// Dependencies
// Types
import { OperatingHours } from "../../../../../../../__generated__/graphql";

// Components
// Local
import FonciiToolTip from "../../../../../../../components/tool-tips/FonciiToolTip";

// External
import Image from "next/image";

// Hooks
import React, { useState } from "react";

// Assets
import { ImageRepository } from "../../../../../../../../public/assets/images/ImageRepository";

// Utilities
import {
  determineNextClosingTime,
  determineNextOpeningTime,
  isBusinessOpen,
  isClosingSoon,
  isOpeningSoon,
} from "../../../../../../../utilities/common/time";
import { cn } from "../../../../../../../utilities/development/DevUtils";

export default function RestaurantHoursWidget({
  operatingHours,
  utcOffset, // In minutes
  isOpen,
}: {
  operatingHours?: OperatingHours;
  utcOffset?: number;
  isOpen: boolean;
}) {
  // State Management
  const [expanded, setExpanded] = useState(false);

  // Properties
  const currentDay = new Date().toLocaleDateString("en-US", {
    weekday: "long",
  }) as keyof OperatingHours;

  // Nothing to render
  if (!operatingHours) return;

  // When the restaurant will next open / close
  const nextOpenStatus = (): string | undefined => {
    if (isOpen) {
      const nextOpeningTime = determineNextClosingTime({
          operatingHours: operatingHours as any,
          utcOffset: utcOffset ?? 0,
        }),
        closingSoon = isClosingSoon({
          operatingHours: operatingHours as any,
          utcOffset: utcOffset ?? 0,
        });

      if (!nextOpeningTime || !utcOffset) return undefined;

      // Parsing
      const { hour12, minutes, meridianTime } = nextOpeningTime,
        formattedTime = `${hour12}:${minutes < 10 ? `0${minutes}` : minutes}`;

      return `Closes ${
        closingSoon ? "soon" : ""
      } at ${formattedTime} ${meridianTime}`;
    } else {
      const nextOpeningTime = determineNextOpeningTime({
          operatingHours: operatingHours as any,
          utcOffset: utcOffset ?? 0,
        }),
        openingSoon = isOpeningSoon({
          operatingHours: operatingHours as any,
          utcOffset: utcOffset ?? 0,
        });

      if (!nextOpeningTime || !utcOffset) return undefined;

      // Parsing
      const { day, hour12, minutes, meridianTime } = nextOpeningTime,
        formattedTime = `${hour12}:${minutes < 10 ? `0${minutes}` : minutes}`;

      if (day == currentDay)
        return `Opens ${
          openingSoon ? "soon" : ""
        } at ${formattedTime} ${meridianTime}`;
      else return `Opens ${day} at ${formattedTime} ${meridianTime}`;
    }
  };

  // Action Handlers
  const toggleExpanded = () => setExpanded(!expanded);

  // Subcomponents
  const ToggleButton = (): React.ReactNode => {
    return (
      <button onClick={toggleExpanded}>
        <Image
          src={ImageRepository.FilterIcons.UpwardChevronIcon}
          alt="Toggle Button Indicator"
          width={16}
          height={16}
          className={`${
            expanded ? "" : "rotate-180"
          } transition-all ease-in-out w-[16px] h-[16px] hover:opacity-75 active:scale-90`}
        />
      </button>
    );
  };

  return (
    <div className="flex flex-col w-full h-fit shrink-0 transition-all ease-in-out duration-300">
      <div className="gap-x-[8px] flex flex-row w-fit items-center line-clamp-1">
        <Image
          width={20}
          height={20}
          className="w-[20px] h-[20px]"
          src={ImageRepository.UtilityIcons.ClockIcon}
          alt="Operating Hours Info Icon"
          loading="eager"
          fetchPriority="high"
        />

        <p className={`text-[16px] font-normal text-permanent_white`}>
          {utcOffset ? (isOpen ? `Open Now` : `Closed`) : "See Time Table"}
        </p>

        {nextOpenStatus() ? (
          <p
            className={`text-[16px] font-normal text-permanent_white`}
          >{`|`}</p>
        ) : undefined}

        <p className={`text-[16px] font-normal text-permanent_white`}>
          {nextOpenStatus() ? nextOpenStatus() : undefined}
        </p>

        {ToggleButton()}
      </div>

      <div
        className={cn(
          "overflow-x-auto overflow-y-hidden w-full transition-all ease-in-out h-[210px]",
          expanded ? "h-[226px] pt-[16px]" : "h-[0px]"
        )}
      >
        <table
          className="flex shrink-0 h-fit w-full items-center justify-start"
          style={{ width: "max-content" }}
        >
          <tbody
            className="flex flex-col shrink-0 h-fit w-full gap-y-[8px] transition-all ease-in-out"
            style={{ width: "max-content" }}
          >
            {Object.entries(operatingHours)
              .filter((element) => element[0] != "__typename") // Remove generated elements
              .map(([day, hours], index) => {
                const hoursAreCurrent = day == currentDay;

                return (
                  <FonciiToolTip key={index} title={`${day} | ${hours}`}>
                    <tr
                      key={index}
                      className={`border-collapse gap-x-[16px] flex flex-row shrink-0 w-full justify-between text-[16px] font-normal transition-all cursor-default ease-in-out duration-500 items-center ${
                        hoursAreCurrent
                          ? "bg-primary rounded-[8px] shadow-lg py-[4px] text-permanent_white"
                          : "text-medium"
                      }`}
                    >
                      <td>{`${day}`}</td>
                      <td>{`${hours}`}</td>
                    </tr>
                  </FonciiToolTip>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
