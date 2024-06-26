/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Hooks
import { useEffect, useRef, useState } from "react";
import { useRouterSearchParams } from "../../../../hooks/UseRouterSearchParamsHook";

// Styling
import ColorRepository from "../../../../../public/assets/ColorRepository";

// Assets
import { ImageRepository } from "../../../../../public/assets/images/ImageRepository";

// Components
import Image from "next/image";

// URL State Persistence
import { SharedURLParameters } from "../../../../core-foncii-maps/properties/NavigationProperties";

// Utils
import {
  RegexPatterns,
  isInputValidAgainstPattern,
} from "../../../../utilities/common/regex";
import { cn } from "../../../../utilities/development/DevUtils";

interface RoundedSearchBarProps {
  initialTextInput?: string;
  placeholder?: string;
  textInputDidChangeCallback?: (textInput: string) => void;
  textFieldDidDismissCallback?: (textInput: string) => void;
  onFocusChange?: (isFocused: boolean) => void; // Informs parent component of the focus state change here
  onClearAction?: () => void; // Action to be performed when the clear button is pressed, default is null
  isLoading?: boolean;
  className?: string;
  autoFocus?: boolean; // True if this search bar should be automatically focused when rendered, false otherwise, default is false
  subscribeToURLState?: boolean;
  clearTextFieldInputFlag?: any;
}

// Input component specific for handling search specific entries
// Filters out any unwanted text content automatically using REGEX
export default function RoundedSearchBar({
  initialTextInput = "",
  placeholder,
  textInputDidChangeCallback,
  textFieldDidDismissCallback,
  onFocusChange,
  onClearAction,
  isLoading = false,
  className,
  autoFocus = false,
  subscribeToURLState = true,
  clearTextFieldInputFlag = undefined,
}: RoundedSearchBarProps) {
  // Component State
  const [textInput, setTextInput] = useState(initialTextInput);
  const [isFocused, setIsFocused] = useState(false);

  // URL-State Persistence
  const routerSearchParams = useRouterSearchParams();

  // Publisher output
  useEffect(() => {
    textInputSubscription();
  }, [textInput]);

  // Update the local text input state with the global state from the URL
  useEffect(() => {
    if (!subscribeToURLState) return;
    const persistentTextInput =
      (routerSearchParams.getParamValue(SharedURLParameters.search) as
        | string
        | undefined) ?? "";

    setTextInput(persistentTextInput);
  }, [routerSearchParams.getParamValue(SharedURLParameters.search)]);

  // Clears the text field from an external flag when the flag's value changes
  useEffect(() => {
    clearButtonAction();
  }, [clearTextFieldInputFlag]);

  // Subcomponent Reference
  const textInputRef = useRef<HTMLInputElement>(null);

  // Properties
  const placeholderText = placeholder ?? "Search";

  // Assets
  const searchIcon = ImageRepository.UtilityIcons.SearchUtilityIcon,
    clearIcon = ImageRepository.UtilityIcons.CloseXmarkUtilityIcon;

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

  // Action Handlers
  const handleTextFieldFocusEvent = (e: any) => {
    setIsFocused(true);
    onFocusChange?.(true);
  };

  const handleTextFieldBlurEvent = (e: any) => {
    setIsFocused(false);
    onFocusChange?.(false);
  };

  const handleTextFieldDismissal = (e: any) => {
    const newTextInput = (e.target.value as string) ?? "",
      cleanedUpTextInput = newTextInput.toLowerCase().trim();

    // Validate the given input, character limit is not included since it's already handled by the component
    if (
      !isInputValidAgainstPattern(
        cleanedUpTextInput,
        RegexPatterns.SearchBarRegex
      )
    )
      return;

    textFieldDidDismissCallback?.(cleanedUpTextInput);
  };

  const handleTextInputChange = (e: any) => {
    const newTextInput = (e.target.value as string) ?? "",
      cleanedUpTextInput = newTextInput.toLowerCase().trim();

    // Validate the given input, character limit is not included since it's already handled by the component
    if (
      !isInputValidAgainstPattern(
        cleanedUpTextInput,
        RegexPatterns.SearchBarRegex
      )
    )
      return;

    // Maintain the casing of the original input and any trailing chars
    setTextInput(newTextInput);
  };

  const handleFocusRequest = () => {
    const textField = textInputRef.current;
    if (textField != undefined) textField.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Check if the Enter key is pressed
    if (e.key === "Enter") {
      handleTextFieldDismissal(e);

      // Resign the focus from the text input
      e.currentTarget.blur();
    }
  };

  const clearButtonAction = () => {
    onClearAction?.();
    setTextInput("");
  };

  // State Binding
  /**
   * @returns { string } -> The latest text content of this component,
   * to be listened to by other components where that text content is needed.
   */
  const textInputSubscription = (): void => {
    textInputDidChangeCallback?.(textInput);
  };

  const LoadingIndicator = (): React.ReactNode => {
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

  const LeftFieldIcon = (): React.ReactNode => {
    return isLoading ? (
      LoadingIndicator()
    ) : (
      <Image
        src={searchIcon}
        alt="Search Icon"
        width={24}
        height={24}
        className="h-[24px] w-[24px] p-[5px]"
      />
    );
  };

  const RightFieldUtilitiyIcons = (): React.ReactNode => {
    return (
      <div className="flex flex-row gap-x-[10px] items-center">
        <button
          onClick={clearButtonAction}
          disabled={!clearButtonActive()}
          className={`h-[22px] w-[22px] flex justify-center items-center p-[5px] z-[100]`}
        >
          <Image
            src={clearIcon}
            alt="Clear Icon"
            width={22}
            height={22}
            className={`${
              clearButtonActive() ? "opacity-100" : "opacity-0"
            } transition-all`}
          />
        </button>
      </div>
    );
  };

  return (
    /** Exterior Container */
    <div
      className={cn(
        "cursor-pointer drop-shadow-lg border-[1px] rounded-[10px] shrink-0 bg-black bg-opacity-50 backdrop-blur-2xl transition-all",
        isFocused ? "border-primary" : "border-medium_dark_grey",
        className
      )}
      onClick={handleFocusRequest}
    >
      {/** Interior Container */}
      <div
        className="px-[15px] justify-center h-full w-full flex flex-row items-center gap-[10px]"
        onClick={handleFocusRequest}
      >
        {LeftFieldIcon()}

        <input
          name="Search Bar"
          id="Search Bar"
          placeholder={placeholderText}
          inputMode="search"
          type="search"
          value={textInput}
          onChange={handleTextInputChange}
          autoFocus={autoFocus}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          onFocus={handleTextFieldFocusEvent}
          onBlur={handleTextFieldBlurEvent}
          maxLength={200}
          spellCheck="false"
          aria-label="Search"
          className={`w-full leading-relaxed text-left bg-transparent bg-permanent_white font-normal text-[16px] resize-none whitespace-nowrap outline-none overflow-hidden`}
          ref={textInputRef}
          onKeyDown={handleKeyDown}
        />

        {RightFieldUtilitiyIcons()}
      </div>
      {/** Interior Container */}
    </div>
    /** Exterior Container */
  );
}
