// Dependencies
// Components
import FonciiToolTip from "../../../tool-tips/FonciiToolTip";

// Local Types
interface PostTagEditorAutocompleteSuggestionProps {
  title: string;
  value: string;
  onSelect?: (value: string) => void;
}

export default function PostTagEditorAutocompleteSuggestion({
  title,
  value,
  onSelect,
}: PostTagEditorAutocompleteSuggestionProps) {
  return (
    <FonciiToolTip title={title}>
      <div
        onClick={() => onSelect?.(value)}
        className={`flex justify-between items-center w-fit h-fit gap-x-[10px]
            bg-transparent bg-opacity-60 rounded-full px-[10px] py-[5px]
            hover:opacity-50 active:scale-90 hover:border-medium
            transition-all ease-in-out hover:scale-[1.02]
            border-medium_dark_grey border-[1px]
            shrink-0
        `}
      >
        <p className={`text-medium text-[12px] font-semibold shrink-0`}>{title}</p>
      </div>
    </FonciiToolTip>
  );
}
