// Dependencies
// Components
import RoundedSearchBar from "../../../../../../inputs/searchbars/rounded-search-bar/RoundedSearchBar";

interface CategorySelectorSearchBarProps {
  textInputDidChangeCallback: (textInput: string) => void;
  onClearAction?: () => void;
  placeholder?: string;
}

export default function CategorySelectorSearchBar({
  textInputDidChangeCallback,
  onClearAction,
  placeholder = "What are you looking for?",
}: CategorySelectorSearchBarProps) {
  return (
    <RoundedSearchBar
      placeholder={placeholder}
      textInputDidChangeCallback={textInputDidChangeCallback}
      onClearAction={onClearAction}
      className={"h-[40px] w-full sticky top-0 z-[1]"}
      subscribeToURLState={false}
    />
  );
}
