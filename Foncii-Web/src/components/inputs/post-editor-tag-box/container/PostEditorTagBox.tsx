/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Hooks
import { useEffect, useRef, useState } from "react";

// Assets
import { ImageRepository } from "../../../../../public/assets/images/ImageRepository";

// Components
// Local
import PostEditorTagBoxChip from "../chip/PostEditorTagBoxChip";
import PostTagEditorAutocompleteSuggestion from "../auto-complete-suggestion/PostTagEditorAutocompleteSuggestion";

// External
import Image from "next/image";

// Services
import { FonciiAPIClientAdapter } from "../../../../services/foncii-api/adapters/fonciiAPIClientAdapter";

// Utils
import { isInRange } from "../../../../utilities/math/commonMath";
import { cn } from "../../../../utilities/development/DevUtils";

interface PostEditorTagBoxProps {
  initialTextInput?: string;
  initialTags?: string[];
  tagsDidChangeCallback: (tags: string[]) => void;
}

const PostEditorTagBox = ({
  initialTextInput = "",
  initialTags = [],
  tagsDidChangeCallback,
}: PostEditorTagBoxProps) => {
  // Services
  const apiService = new FonciiAPIClientAdapter();

  // Component State
  const [textInput, setTextInput] = useState(initialTextInput);
  const [currentTags, setCurrentTags] = useState(initialTags);
  const [isFocused, setIsFocused] = useState(false);

  // Autocomplete data
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<
    string[]
  >([]);

  // Limits
  const minTagLength = 3, // 3 Characters minimum | enforced on client side only
    maxTagLength = 25;

  // Side Effects
  useEffect(() => {
    // Publish change events
    tagsDidChangeCallback(currentTags);
  }, [currentTags]);

  // Fetch new autocomplete suggestions when the text input changes
  useEffect(() => {
    fetchAutocompleteSuggestions();
  }, [textInput]);

  // Subcomponent Reference
  const textInputRef = useRef<HTMLInputElement>(null);

  // Text Descriptions
  const tagInstructionsDescription = `Min - ${minTagLength} Characters | Max - ${maxTagLength} Characters`;

  // Properties
  const placeholderText = `Craft tags to guide viewers to ideal spots`;

  // Business Logic
  const fetchAutocompleteSuggestions = async () => {
    // Don't fetch if the text input is too short
    if (textInput.length < minTagLength) return;

    const autocompleteSuggestions =
      await apiService.userTagAutoCompleteSuggestions(textInput);
    setAutocompleteSuggestions(autocompleteSuggestions);
  };

  // Action Handlers
  const handleTextFieldSubmission = () => {
    // Add a new tag to the tag collection if possible
    const newTag = textInput ?? "",
      tagLength = newTag.length;

    if (isInRange(tagLength, maxTagLength, minTagLength)) {
      const currentTagCollection = new Set(currentTags);

      if (!currentTagCollection.has(newTag)) {
        toggleTag(newTag);

        // Clear text input since tag has been added
        setTextInput("");
      }
    }
  };

  const handleTextInputChange = (e: any) => {
    const newTextInput = e.target.value;

    setTextInput(newTextInput);
  };

  const handleFocusRequest = () => {
    const textField = textInputRef.current;

    if (textField != undefined) textField.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Check if the Enter key is pressed
    if (e.key === "Enter") {
      // Resign the focus from the text area if the text field is empty
      if (!hasText()) e.currentTarget.blur();

      // Submit the fields contents (this method will handle any validation)
      handleTextFieldSubmission();
    }
  };

  /** Deletes the given tag from the current set */
  const handleTagDeletion = (value: string) => {
    toggleTag(value);
  };

  const clearButtonAction = () => {
    setTextInput("");
  };

  // Convenience
  /**
   * @returns True if the text input has any text, false otherwise.
   */
  const hasText = (): boolean => {
    return textInput.length > 0;
  };

  const clearButtonActive = (): boolean => {
    return hasText();
  };

  const shouldDisplayAutocompleteSuggestions = (): boolean => {
    return hasText() && autocompleteSuggestions.length > 0;
  };

  // Tag Collection Logic
  /**
   * Toggles the presence of the tag in the current tag set
   *
   * @param tag
   */
  const toggleTag = (tag: string) => {
    const tagLength = tag.length,
      currentTagCollection = new Set(currentTags);

    if (isInRange(tagLength, maxTagLength, minTagLength)) {
      if (!currentTagCollection.has(tag)) {
        currentTagCollection.add(tag);
      } else {
        currentTagCollection.delete(tag);
      }

      // Update tag set
      setCurrentTags([...currentTagCollection]);
    } else {
      // Remove any illegal tags (tags that violate the limits)
      currentTagCollection.delete(tag);
    }
  };

  /**
   * Adds the tag to the current tag set if it's not already present
   *
   * @param tag
   */
  const addTag = (tag: string) => {
    const tagLength = tag.length,
      currentTagCollection = new Set(currentTags);

    if (isInRange(tagLength, maxTagLength, minTagLength)) {
      if (!currentTagCollection.has(tag)) {
        currentTagCollection.add(tag);
      }

      // Update tag set
      setCurrentTags([...currentTagCollection]);
    } else {
      // Remove any illegal tags (tags that violate the limits)
      currentTagCollection.delete(tag);
    }
  };

  // Subcomponents
  const AutocompleteSuggestions = (): React.ReactNode => {
    return (
      <div
        className={cn(
          "flex flex-row overflow-x-auto overflow-y-hidden h-fit w-full gap-[5px] transition-all ease-in-out",
          shouldDisplayAutocompleteSuggestions() ? "h-[42px]" : "h-0"
        )}
      >
        {autocompleteSuggestions.map((tag, index) => {
          return (
            <PostTagEditorAutocompleteSuggestion
              key={index}
              title={tag}
              value={tag}
              onSelect={addTag}
            />
          );
        })}
      </div>
    );
  };

  const TagCollection = (): React.ReactNode => {
    return (
      <>
        {currentTags.map((tag, index) => {
          return (
            <PostEditorTagBoxChip
              key={index}
              title={tag}
              value={tag}
              onDelete={handleTagDeletion}
            />
          );
        })}
      </>
    );
  };

  // Tells the users what to expect when filling out the tags field
  const InstructionsText = (): React.ReactNode => {
    if (!isFocused) return;

    return (<p className={`text-neutral text-[12px] font-normal`}>{tagInstructionsDescription}</p>);
  };

  const ClearButton = (): React.ReactNode => {
    let icon = ImageRepository.UtilityIcons.CloseXmarkUtilityIcon;

    return (
      <button
        onClick={clearButtonAction}
        disabled={!clearButtonActive()}
        className={`h-[24px] w-[24px] flex justify-center items-center p-[5px] z-[100]`}
      >
        <Image
          src={icon}
          alt="Clear Icon"
          width={24}
          height={24}
          className={cn(`transition-all`, clearButtonActive() ? "opacity-100" : "opacity-0")}
        />
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-y-[10px] transition-all ease-in-out h-fit max-h-[200px] w-full">
      <div
        className={cn(`py-[10px] px-[10px] flex flex-wrap flex-row gap-[5px] items-center justify-start cursor-pointer drop-shadow-lg w-full h-fit border-[1px] bg-black rounded-lg transition-all`, isFocused ? 'border-primary' : 'border-medium_dark_grey')}
        onClick={handleFocusRequest}
      >
        <div className="justify-center h-fit w-full flex flex-row items-center gap-[10px]">
          <input
            name="Tag Box Input"
            placeholder={placeholderText}
            value={textInput}
            onChange={handleTextInputChange}
            autoComplete="true"
            autoCorrect="false"
            autoCapitalize="false"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            maxLength={maxTagLength}
            spellCheck="false"
            aria-label="Tag Box Input"
            className={`h-fit w-full py-[10px] text-left bg-transparent text-[16px] font-normal bg-permanent_white resize-none outline-none`}
            onKeyDown={handleKeyDown}
            ref={textInputRef}
          />
          {ClearButton()}
        </div>

        {AutocompleteSuggestions()}
        {TagCollection()}
      </div>
      {InstructionsText()}
    </div>
  );
};

export default PostEditorTagBox;
