// Dependencies
// Components
import FonciiToolTip from "../../../../../../components/tool-tips/FonciiToolTip";
import CheckMarkToggle from "../../../../../../components/buttons/toggle-buttons/check-mark-toggle-button/CheckMarkToggle";

// Styling
import { ColorEnum } from "../../../../../../../public/assets/ColorRepository";

// Types
interface SelectionDropDownRowProps {
  value: string;
  tooltipTitle: string;
  valueOccurrenceFrequency: number;
  toggled: boolean;
  onToggleAction: () => void;
  disabled?: boolean;
}

/**
 * Row containing a title and a number representing the amount of data points that match this
 * option's criteria, this component can be selected and disabled, with the selection state being
 * controlled by the parent component in which this component is embedded within
 */
export default function SelectionDropDownRow({
  value,
  tooltipTitle,
  valueOccurrenceFrequency,
  toggled,
  onToggleAction,
  disabled = false,
}: SelectionDropDownRowProps): React.ReactNode {
  // Subcomponents
  const ItemFrequencyCounter = (): React.ReactNode => {
    return (
      <p
        className={`flex w-min text-${ColorEnum.medium} font-normal text-center text-[15px]`}
      >
        {valueOccurrenceFrequency}
      </p>
    );
  };

  const OptionTitle = (): React.ReactNode => {
    return (
      <p
        className={`flex w-full line-clamp-1 font-normal text-left text-[14px] text-${ColorEnum.permanent_white}`}
      >
        {value}
      </p>
    );
  };

  return (
    <FonciiToolTip title={tooltipTitle}>
      <button
        className={`h-fit w-full justify-start items-center flex flex-row gap-x-[8px] p-[8px] transition-opacity ease-in-out hover:opacity-75`}
        onClick={onToggleAction}
        disabled={disabled}
      >
        <CheckMarkToggle toggled={toggled} className="rounded" />
        {OptionTitle()}
        <ItemFrequencyCounter />
      </button>
    </FonciiToolTip>
  );
}
