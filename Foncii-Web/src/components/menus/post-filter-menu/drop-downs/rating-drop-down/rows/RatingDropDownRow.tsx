// Dependencies
// Types
import { StaticImport } from "next/dist/shared/lib/get-img-props";

// Framework
import React, { useRef, useState } from "react";

// Styling
import { ColorEnum } from "../../../../../../../public/assets/ColorRepository";

// Components
import SliderIcon from "./SliderIcon";

// External
import { Slider } from "@mui/base/Slider";

// Utilities
import { clampNumber } from "../../../../../../utilities/math/commonMath";

// Types
interface SelectionDropDownRowProps {
  title: string;
  icon?: StaticImport;
  initialValue?: number;
  /**
   * When the value of the slider updates the parent
   * component can listen to this change and update accordingly
   */
  onValueCommitCallback?: (value: number) => void;
}

export default function RatingDropDownRow({
  title,
  icon,
  initialValue = 0,
  onValueCommitCallback,
}: SelectionDropDownRowProps): React.ReactNode {
  // State
  const [currentValue, setCurrentValue] = useState(initialValue);

  // Limits
  const maxValue = 5,
    minValue = 1,
    stepSize = 0.1;

  // Action Handlers
  const onValueChangeHandler = (
    _: React.SyntheticEvent | Event,
    newValue: number | number[]
  ) => {
    let rating = newValue as number;

    // Don't reflect of out of bound values, shunt any < 1 values to 0 and any > 5 values to 5
    if (rating == undefined) {
      rating = 0;
    }

    rating = clampNumber(rating, minValue, maxValue);

    setCurrentValue(rating);
  };

  const onValueCommitHandler = (
    _: React.SyntheticEvent | Event,
    newValue: number | number[]
  ) => {
    let rating = newValue as number;

    // Don't reflect of out of bound values, shunt any < 1 values to 0 and any > 5 values to 5
    if (rating == undefined) {
      rating = 0;
    }

    rating = clampNumber(rating, minValue, maxValue);

    setCurrentValue(rating);
    onValueCommitCallback?.(rating);
  };

  // Subcomponents
  const RatingSlider = (): JSX.Element => {
    interface SliderValueLabelProps {
      children: React.ReactElement;
    }

    const SliderValueLabel = ({ children }: SliderValueLabelProps) => {
      return (
        <span className="absolute top-[-32px] left-[-7px] w-[28px] pointer-events-none">
          <SliderIcon title={title} currentValue={currentValue} icon={icon} />
        </span>
      );
    };

    return (
      <Slider
        className="pointer-events-auto"
        value={currentValue}
        defaultValue={initialValue}
        onChange={onValueChangeHandler}
        onChangeCommitted={onValueCommitHandler}
        marks={[
          {
            value: 1,
            label: "1",
          },
          {
            value: 1.5,
            label: "·",
          },
          {
            value: 2,
            label: 2,
          },
          {
            value: 2.5,
            label: "·",
          },
          {
            value: 3,
            label: 3,
          },
          {
            value: 3.5,
            label: "·",
          },
          {
            value: 4,
            label: 4,
          },
          {
            value: 4.5,
            label: "·",
          },
          {
            value: 5,
            label: 5,
          },
        ]}
        step={stepSize}
        min={minValue}
        max={maxValue}
        slotProps={{
          thumb: {
            className: `w-4 h-4 -mt-[6px] pointer-events-auto -ml-1 flex items-center justify-center bg-${ColorEnum.permanent_white} rounded-full shadow absolute`,
          },
          root: {
            className: "w-full relative inline-block h-2 cursor-pointer",
          },
          rail: {
            className: `bg-${ColorEnum.neutral} h-1 w-full rounded-full block absolute`,
          },
          track: {
            className: `bg-${ColorEnum.primary} h-1 absolute rounded-full`,
          },
          markLabel: {
            className: `text-[10px] text-${ColorEnum.light_dark_grey} absolute mt-[8px]`,
          },
        }}
        slots={{
          valueLabel: SliderValueLabel,
        }}
      />
    );
  };

  return <div className="flex flex-col py-[16px]">{RatingSlider()}</div>;
}
