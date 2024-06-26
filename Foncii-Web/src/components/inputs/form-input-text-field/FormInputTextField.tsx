/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Hooks
import { InputHTMLAttributes, useRef, useState } from "react";

// Styling
import ColorRepository from "../../../../public/assets/ColorRepository";

// Assets
import { ImageRepository } from "../../../../public/assets/images/ImageRepository";

// Components
// Local
import CloseUtilityButton from "../../../components/buttons/utility-buttons/close-button/CloseUtilityButton";
import FonciiToolTip from "../../../components/tool-tips/FonciiToolTip";
import RefreshUtilityButton from "../../../components/buttons/utility-buttons/refresh-button/RefreshUtilityButton";

// External
import Image from "next/image";

// Utilities
import { cn } from "../../../utilities/development/DevUtils";

// Local Types
export interface FormInputTextFieldProps {
  initialTextInput?: string;
  instructions?: string; // Optional instructions to display when the field is focused
  loaderEnabled?: boolean; // True if the load should show when some async validation process is being awaited, false otherwise. It's recommended to hide the loader for fast validation handlers since the loader will flash in and out. Default is false.
  isRequired?: boolean; // True -> Field must be filled when submitting a form (not implemented yet), false otherwise, default is true
  textInputValidator?: (textInput: string) => Promise<Boolean>; // Optional validator used to determined whether or not the field is currently valid or not, its existence implies the field is validatable
  placeholder: string; // Required text description used to inform the user about the field's functionality
  className?: string; // Optional styling to apply to this component
  onInputChange?: (textInput: string) => void; // Optional custom On-change callback for listening to the text field's latest input
  onRefresh?: () => string; // Optional custom On-refresh callback for user clicking a refresh button
  autoFocus?: boolean; // True if this search bar should be automatically focused when rendered, false otherwise, default is false
  validate_empty?: boolean;
}

// Form input component used for login / sign up forms
// to handle user information.

/**
 * Form input component used for login / sign up forms to handle user information.
 * Can be marked as validated if `onSubmitValidator` is passed with a valid
 * boolean condition returned.
 *
 * Be sure to configure the type, input mode and other properties for the different
 * kind of fields to make sure the browser's keyboard / interstitial logic works properly.
 *
 * Note: Specify type as 'password' to enable the input visibility toggle.
 */
export default function FormInputTextField({
  initialTextInput = "",
  instructions = undefined,
  loaderEnabled = false,
  isRequired = true,
  textInputValidator = undefined,
  placeholder,
  className,
  onInputChange,
  onRefresh = undefined,
  autoFocus = false,
  validate_empty = false,
  type = "text",
  inputMode = "text",
  name,
  ...props
}: FormInputTextFieldProps & InputHTMLAttributes<HTMLInputElement>) {
  // Initial State
  const isInputProtected = (): Boolean => type == "password";

  // Component State
  const [textInput, setTextInput] = useState(initialTextInput);
  const [isFocused, setIsFocused] = useState(false);
  const [inputIsValid, setInputIsValid] = useState<Boolean>(true); // Input is always assumed to be valid by default (empty) unless stated otherwise.
  const [inputIsHidden, setInputIsHidden] = useState<Boolean>(
    isInputProtected()
  );
  const [currentInputType, setCurrentInputType] = useState(type);
  const [isLoading, setIsLoading] = useState(false);
  const [didValidate, setDidValidate] = useState(false); // True if validation was done at least once

  // Subcomponent Reference
  const textInputRef = useRef<HTMLInputElement>(null);

  // Assets
  const validInputIcon = ImageRepository.ValidationIcons.GreenCheckMarkIcon,
    invalidInputIcon = ImageRepository.ValidationIcons.RedXMarkIcon;

  // Dimensions
  const cornerRadius = "rounded-[10px]";

  // Styling
  const backgroundColor = `backdrop-blur-lg bg-black bg-opacity-70`,
    foregroundContainerColor = `bg-transparent`,
    dropShadow = "drop-shadow-lg",
    textColor = `bg-permanent_white`;

  // Font
  const textSize = "text-[16px]", // Don't use anything below 16, iOS webkit auto zooms-in when the font is smaller than this
    textWeight = "font-normal",
    textProperties = `${textSize} ${textWeight} ${textColor}`;

  // Convenience
  const isValidatable = (): boolean => {
    return textInputValidator != undefined;
  };

  const shouldDisplayInstructions = (): boolean => {
    return instructions != undefined && isFocused;
  };

  const loadingIndicatorActive = (): boolean => {
    return isLoading && loaderEnabled;
  };

  /**
   * @returns True if the text input has any text, false otherwise.
   */
  const hasText = (): boolean => {
    return textInput.length > 0;
  };

  // Actions
  const toggleInputVisibility = (inputHidden: boolean) => {
    setInputIsHidden(inputHidden);
    setCurrentInputType(inputHidden ? type : "text");
  };

  // Action Handlers
  const handleTextInputChange = async (e: any) => {
    const newTextInput = (e.target.value as string) ?? "",
      cleanedUpTextInput = newTextInput.trim();

    onInputChange?.(cleanedUpTextInput);
    setTextInput(cleanedUpTextInput);
    validateInput(cleanedUpTextInput); // Note: Don't feed this the 'newTextInput', it will be one char behind every keystroke
  };

  // Validate the latest input (if validator specified)
  const validateInput = async (textInput: string) => {
    if (textInputValidator) {
      setIsLoading(true);
      setInputIsValid(await textInputValidator(textInput));
      setIsLoading(false);

      setDidValidate(true);
    }
  };

  const handleFocusRequest = () => {
    const textField = textInputRef.current;
    if (textField != undefined) textField.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Check if the Enter key is pressed
    if (e.key === "Enter") {
      // Resign the focus from the text input
      e.currentTarget.blur();
    }
  };

  const clearButtonAction = () => {
    const newInput = "";

    setTextInput(newInput);
    validateInput(newInput);
  };

  const refreshButtonAction = () => {
    const newInput = (onRefresh && onRefresh()) || "";

    setTextInput(newInput);
    validateInput(newInput);
  };

  const LoadingIndicator = (): React.ReactNode => {
    if (!loaderEnabled) return;

    return (
      <div
        className={`flex h-fit items-center justify-center ${
          isLoading ? "" : "hidden"
        }`}
      >
        <svg
          aria-hidden="true"
          role="status"
          className="inline w-[22px] h-[22px] text-white animate-spin"
          viewBox="0 0 100 101"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
            fill={ColorRepository.colors["medium_dark_grey"]}
          />
          <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
            fill={ColorRepository.colors.primary}
          />
        </svg>
      </div>
    );
  };

  const FieldInstructions = (): React.ReactNode => {
    return (
      <div
        className={`${
          shouldDisplayInstructions() ? "h-[40px]" : "h-[0]"
        } transition-all ease-in-out justify-center items-center text-start text-[14px] text-neutral font-normal line-clamp-2`}
      >
        <p>{instructions}</p>
      </div>
    );
  };

  const FieldValidationIndicator = (): React.ReactNode => {
    if (!isValidatable()) return;

    // Dynamic icon
    const currentValidationStateIcon = inputIsValid
      ? validInputIcon
      : invalidInputIcon;

    // Properties
    const shouldDisplay = didValidate && (hasText() || validate_empty);

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

  const InputVisibilityToggle = (): React.ReactNode => {
    if (!isInputProtected()) return;

    return (
      <FonciiToolTip
        title={inputIsHidden ? "Show protected input" : "Hide protected input"}
      >
        <button
          onClick={() => toggleInputVisibility(!inputIsHidden)}
          className={`h-fit w-fit shrink-0 transition-all ease-in-out active:scale-90 hover:opacity-75`}
        >
          <p className="text-[12px] font-normal shrink-0 text-permanent_white">
            {inputIsHidden ? "Show" : "Hide"}
          </p>
        </button>
      </FonciiToolTip>
    );
  };

  const ClearInputButton = (): React.ReactNode => {
    if (!hasText()) return;

    return (
      <CloseUtilityButton
        onClick={clearButtonAction}
        className={`h-[20px] w-[20px] shrink-0 transition-all`}
        title="Clear input"
      />
    );
  };

  const RefreshInputButton = (): React.ReactNode => {
    if (onRefresh == undefined) return;

    return (
      <RefreshUtilityButton
        onClick={refreshButtonAction}
        className={`h-[20px] w-[20px] shrink-0 transition-all`}
        title="Generate another"
      />
    );
  };

  const RightFieldUtilitiyIcons = (): React.ReactNode => {
    const currentIndicator = loadingIndicatorActive()
      ? LoadingIndicator()
      : FieldValidationIndicator();

    return (
      <div className="flex flex-row gap-x-[10px] items-center">
        {currentIndicator}
        {InputVisibilityToggle()}
        {ClearInputButton()}
        {RefreshInputButton()}
      </div>
    );
  };

  return (
    /** Exterior Container */
    <div
      className={cn(
        "flex flex-col items-center justify-center transition-all ease-in-out w-full",
        shouldDisplayInstructions() ? "gap-y-[4px] pb-[8px]" : ""
      )}
    >
      <div
        className={`h-[54px] w-full cursor-pointer border-[1px] border-medium_dark_grey ${dropShadow} ${backgroundColor} ${cornerRadius} transition-all ${className}`}
      >
        {/** Interior Container */}
        <div className="px-[20px] justify-center h-full w-full flex flex-row items-center gap-[10px]">
          <input
            {...props}
            title={`${name} input`}
            name={name}
            onClick={handleFocusRequest}
            placeholder={placeholder}
            inputMode={inputMode}
            type={currentInputType}
            value={textInput}
            onChange={handleTextInputChange}
            autoFocus={autoFocus}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            maxLength={200} // Arbitrary character limit, this is an input field so the validity of its contents are subjective.
            spellCheck="false"
            aria-label={`${name} Form Input Textfield`}
            className={`w-full leading-relaxed text-left ${foregroundContainerColor} ${textProperties} resize-none whitespace-nowrap outline-none overflow-hidden`}
            ref={textInputRef}
            onKeyDown={handleKeyDown}
          />
          {RightFieldUtilitiyIcons()}
        </div>
        {/** Interior Container */}
      </div>
      {FieldInstructions()}
    </div>
    /** Exterior Container */
  );
}
