/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Hooks
import React, { useEffect, useRef, useState } from "react";

// Styling
import { ColorEnum } from "../../../../public/assets/ColorRepository";

interface PostEditorTextBoxProps {
  initialTextInput?: string;
  revertableTextInput?: string; // Some text copy to revert back to when the user presses the revert button
  placeholder?: string;
  textInputDidChangeCallback: (value: string) => void; // When the value of the textfield updates the parent
  // component can listen to this change and update accordingly
  maxTextInputLength?: number;
  showButtons?: boolean;
}

// A large format text editor made specifically for instances such as the notes editor in the post detail view
const PostEditorTextBox = ({
  initialTextInput = "",
  revertableTextInput = initialTextInput,
  placeholder,
  textInputDidChangeCallback,
  showButtons = true,
  maxTextInputLength = 3000, // 3000 ~ Max length for notes input in the backend, just be sure to not go above this value
}: PostEditorTextBoxProps) => {
  // Component State
  const [textInput, setTextInput] = useState(initialTextInput);
  const [isFocused, setIsFocused] = useState(false);

  // Side Effects
  useEffect(() => {
    // Publish change events upon text input updates
    textInputDidChangeCallback(textInput);
  }, [textInput]);

  // Subcomponent Reference
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  // Properties
  const placeholderText = placeholder ?? "Enter text here.";

  // Dimensions
  const borderWidth = "border-[1px]",
    cornerRadius = "rounded-lg";

  // Styling
  const backgroundColor = `bg-${ColorEnum.black}`,
    foregroundContainerColor = `bg-${ColorEnum.transparent}`,
    borderColor = `border-${
      isFocused ? ColorEnum.primary : ColorEnum.medium_dark_grey
    }`,
    dropShadow = "drop-shadow-lg",
    textColor = `bg-${ColorEnum.permanent_white}`;

  // Font
  const textSize = "text-[16px]",
    textWeight = "font-normal",
    textProperties = `${textSize} ${textWeight} ${textColor}`;

  // Text Descriptions
  const characterCounterTextDescription = (): string => {
    return `${totalCharacters()}/${maxTextInputLength}`;
  };

  const charactersRemainingWarningDescription = (): string => {
    if (characterLimitReached()) return "Character Limit Reached";

    return `${charactersRemaining()} Characters Remaining`;
  };

  // Convenience
  /**
   * @returns True if the text input has any text, false otherwise.
   */
  const hasText = (): boolean => {
    return textInput.length > 0;
  };

  const charactersRemaining = (): number => {
    return maxTextInputLength - textInput.length;
  };

  const totalCharacters = (): number => {
    return textInput.length;
  };

  const characterLimitAlmostReached = (): boolean => {
    return charactersRemaining() <= maxTextInputLength / 2;
  };

  const characterLimitReached = (): boolean => {
    return charactersRemaining() <= 0;
  };

  const characterCounterActive = (): boolean => {
    return hasText() && isFocused;
  };

  // The current input differs from the revertable input, meaning that the user has made changes to the input
  // therefore they can revert back to the revertable input if true, false otherwise and they cannot revert.
  const canRevertInput = (): boolean => {
    return revertableTextInput != textInput;
  };

  // Action Handlers
  const handleTextInputChange = (e: any) => {
    let newTextInput = e.target.value;

    // Don't add more characters if the character limit is reached, only allow deletions
    if (characterLimitReached() && newTextInput.length >= maxTextInputLength)
      return;

    // Set local component state and inform parent of update as well
    setTextInput(newTextInput);
  };

  const handleFocusRequest = () => {
    const textField = textInputRef.current;

    if (textField != undefined) textField.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Check if the Escape key is pressed
    if (e.key === "Escape") {
      // Resign the focus from the text area
      e.currentTarget.blur();
    }
  };

  // Actions
  const revertInputAction = (): void => {
    setTextInput(revertableTextInput);
  };

  const clearInputAction = (): void => {
    setTextInput("");
  };

  // Subcomponents
  const CharacterCounter = (): React.ReactNode => {
    return (
      <div
        className={`flex flex-col gap-y-[10px] w-full h-fit items-end transition-all ease-in-out ${
          characterCounterActive() ? `opacity-100 flex` : `opacity-0`
        }`}
      >
        <div className="flex h-fit w-fit px-[20px] py-[2.5px] bg-primary text-permanent_white rounded-full">
          <p className="line-clamp-1 text-[12px] font-normal text-center text-permanent_white">
            {characterCounterTextDescription()}
          </p>
        </div>

        <p
          className={`${
            characterLimitAlmostReached() ? "scale-100" : "scale-0"
          } transition-all ease-in-out duration-500 line-clamp-1 text-[12px] font-normal text-center ${
            characterLimitReached()
              ? "text-invalid_red"
              : "text-permanent_white"
          }`}
        >
          {charactersRemainingWarningDescription()}
        </p>
      </div>
    );
  };

  const ClearButton = (): React.ReactNode => {
    if (!hasText()) return;

    return (
      <button
        className={`active:scale-90 flex h-fit w-fit px-[20px] py-[2.5px] bg-primary text-permanent_white rounded-full transition-all ease-in-out hover:opacity-80`}
        onClick={clearInputAction}
      >
        <p className="line-clamp-1 text-[12px] font-normal text-center text-permanent_white">
          Clear
        </p>
      </button>
    );
  };

  // Reverts back to the specified original text copy
  const ResetButton = (): React.ReactNode => {
    if (!canRevertInput()) return;

    return (
      <button
        className={`active:scale-90 flex h-fit w-fit px-[20px] py-[2.5px] bg-medium_dark_grey text-permanent_white rounded-full transition-all ease-in-out hover:opacity-80`}
        onClick={revertInputAction}
      >
        <p className="line-clamp-1 text-[12px] font-normal text-center text-permanent_white">
          Reset
        </p>
      </button>
    );
  };

  const EditButtonsSection = (): React.ReactNode => {
    return (
      <div className="flex flex-row gap-x-[10px] w-full h-fit items-start">
        {ClearButton()}
        {ResetButton()}
      </div>
    );
  };

  const BottomSection = (): React.ReactNode => {
    return (
      <div className="w-full h-fit flex flex-row justify-between">
        {EditButtonsSection()}
        {CharacterCounter()}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-y-[10px] transition-all ease-in-out h-fit w-full">
      <div
        className={`cursor-pointer ${dropShadow} border w-full h-fit ${borderWidth} ${backgroundColor} ${borderColor} ${cornerRadius} transition-all`}
        onClick={handleFocusRequest}
      >
        <div className="flex flex-col gap-y-[10px] items-center justify-center">
          <textarea
            name="Text Box Input"
            rows={5}
            wrap="true"
            placeholder={placeholderText}
            value={textInput}
            onChange={handleTextInputChange}
            autoComplete="true"
            autoCorrect="true"
            autoCapitalize="true"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            maxLength={maxTextInputLength}
            spellCheck="true"
            aria-label="Text Input"
            className={`p-[14px] w-full text-left ${foregroundContainerColor} ${textProperties} resize-none outline-none`}
            onKeyDown={handleKeyDown}
            ref={textInputRef}
          />
        </div>
      </div>
      {showButtons ? BottomSection() : undefined}
    </div>
  );
};

export default PostEditorTextBox;
