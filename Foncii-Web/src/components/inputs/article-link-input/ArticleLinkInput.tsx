/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Hooks
import { useState, useRef, ChangeEvent, useEffect } from "react";

// Styling
import { ColorEnum } from "../../../../public/assets/ColorRepository";

// Assets
import { ImageRepository } from "../../../../public/assets/images/ImageRepository";

// External
import Image from "next/image";

// Utilities
import { cn } from "../../../utilities/development/DevUtils";
import {
  RegexPatterns,
  isInputValidAgainstPattern,
} from "../../../utilities/common/regex";

// Types
interface ArticleLinkInputProps {
  initialValue?: string;
  onInputChange: (link: string) => void;
  /** Optional callback to trigger when the delete (clear) button is pressed */
  onDelete?: () => void;
}

const ArticleLinkInput = ({
  initialValue = "",
  onInputChange,
  onDelete,
}: ArticleLinkInputProps) => {
  // Component State
  const [link, setLink] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);

  // Publish realtime input changes to parent component
  useEffect(() => {
    onInputChange(link);
  }, [link]);

  // Subcomponent Reference
  const linkInputRef = useRef<HTMLInputElement>(null);

  // Limits
  // Article Link Input
  const minArticleLinkLength = 1,
    maxArticleLinkLength = 256;

  // Properties
  const placeholderText = `https://example.com/`;

  // Assets
  const validInputIcon = ImageRepository.ValidationIcons.GreenCheckMarkIcon,
    invalidInputIcon = ImageRepository.ValidationIcons.RedXMarkIcon;

  // Dimensions
  const cornerRadius = "rounded-lg";

  // Styling
  const backgroundColor = `bg-${ColorEnum.black}`,
    foregroundContainerColor = `bg-${ColorEnum.transparent}`,
    dropShadow = "drop-shadow-lg",
    textColor = `bg-${ColorEnum.permanent_white}`;

  // Font
  const textSize = "text-[16px]",
    textWeight = "font-normal",
    textProperties = `${textSize} ${textWeight} ${textColor}`;

  // Action Handlers
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setLink(e.target.value);
  };

  const handleFocusRequest = () => {
    const linkInput = linkInputRef.current;
    if (linkInput) linkInput.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Check if the Enter key is pressed
    if (e.key === "Enter") {
      // Resign the focus from the text input
      e.currentTarget.blur();
    }
  };

  // Actions
  const deleteButtonAction = () => {
    setLink("");
    onDelete?.();
  };

  // Convenience
  const isCurrentInputAValidURL = (): boolean => {
    return isInputValidAgainstPattern(link, RegexPatterns.URLRegexPattern);
  };

  const currentInputMeetsMinLengthRequirement = (): boolean => {
    return link.length >= minArticleLinkLength;
  };

  const hasText = (): boolean => {
    return link.length > 0;
  };

  const deleteButtonActive = (): boolean => {
    return hasText();
  };

  // Subcomponents
  const DeleteButton = (): React.ReactNode => {
    const icon = ImageRepository.UtilityIcons.CloseXmarkUtilityIcon;

    return (
      <button
        onClick={deleteButtonAction}
        disabled={!deleteButtonActive()}
        className={`h-[24px] w-[24px] flex justify-center items-center p-[5px] z-[100]`}
      >
        <Image
          src={icon}
          alt="Clear Icon"
          width={24}
          height={24}
          className={cn(
            deleteButtonActive() ? "opacity-100" : "opacity-0",
            "transition-all"
          )}
        />
      </button>
    );
  };

  const ValidationIndicator = (): React.ReactNode => {
    const currentValidationStateIcon = isCurrentInputAValidURL()
      ? validInputIcon
      : invalidInputIcon;

    // Don't show the validation UI when the user is first typing / pasting their URL
    const shouldDisplay = currentInputMeetsMinLengthRequirement();

    return (
      <div
        className={`flex items-center justify-center h-[20px] w-[20px] shrink-0 ${
          shouldDisplay ? "" : "hidden"
        }`}
      >
        <Image
          src={currentValidationStateIcon}
          alt="Input Validation State Icon"
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center transition-all ease-in-out w-full">
      <div
        className={`h-[54px] w-full cursor-pointer border-[1px] border-medium_dark_grey ${dropShadow} ${backgroundColor} ${cornerRadius} transition-all`}
        onClick={handleFocusRequest}
      >
        {/** Interior Container */}
        <div className="px-[20px] justify-center h-full w-full flex flex-row items-center gap-[10px]">
          <input
            name="Article link input"
            placeholder={placeholderText}
            inputMode={"url"}
            type={"url"}
            value={link}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            maxLength={maxArticleLinkLength}
            aria-label="Article Link Input"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            className={`w-full leading-relaxed text-left ${foregroundContainerColor} ${textProperties} resize-none whitespace-nowrap outline-none overflow-hidden`}
            ref={linkInputRef}
            onKeyDown={handleKeyDown}
          />
          {ValidationIndicator()}
          {DeleteButton()}
        </div>
      </div>
    </div>
  );
};

export default ArticleLinkInput;
