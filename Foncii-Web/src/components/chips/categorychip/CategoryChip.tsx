// Dependencies
// Components
import FonciiToolTip from "../../tool-tips/FonciiToolTip";

// Types
interface ChipProps {
  title: string;
  onClickAction?: () => void;
}

export default function CategoryChip({
  title,
  onClickAction = () => {},
}: ChipProps) {
  return (
    <FonciiToolTip title={title}>
      <button
        onClick={onClickAction}
        className={`flex justify-center items-center w-fit h-fit
            bg-primary rounded-full px-[10px] py-[4px]
            hover:opacity-75 transition ease-in-out
            shrink-0`}
      >
        <p className={`text-white text-[14px] font-normal`}> {title} </p>
      </button>
    </FonciiToolTip>
  );
}
