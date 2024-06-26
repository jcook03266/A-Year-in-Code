// Dependencies
// Components
import FonciiToolTip from "../../../../components/tool-tips/FonciiToolTip";
import CloseUtilityButton from "../../../../components/buttons/utility-buttons/close-button/CloseUtilityButton";

// Local Types
interface PostEditorTagBoxChipProps {
  title: string;
  value: string;
  onDelete?: (value: string) => void;
}

export default function PostEditorTagBoxChip({
  title,
  value,
  onDelete,
}: PostEditorTagBoxChipProps) {
  // Subcomponents
  const DeleteButton = (): React.ReactNode => {
    return (
      <CloseUtilityButton
        onClick={() => onDelete?.(value)}
        title="Remove this tag"
        className="h-full w-[20px]"
      />
    );
  };

  return (
    <FonciiToolTip title={title}>
      <div
        className={`flex justify-between items-center w-fit h-fit gap-x-[10px]
            bg-black bg-opacity-60 rounded-full px-[10px] py-[5px]
            hover:opacity-50 hover:border-medium_dark_grey
            transition-all ease-in-out hover:scale-[1.02]
            border-permanent_white border-[1px]
            shrink-0
        `}
      >
        <p className={`text-white text-[12px] font-semibold shrink-0`}>{title}</p>
        {DeleteButton()}
      </div>
    </FonciiToolTip>
  );
}
