/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Types
import { AuthForms, AuthModalFormProps } from "../AuthModal";

// Hooks
import React, { InputHTMLAttributes, useEffect, useState } from "react";

// Components
import DynamicRoundedCTAButton from "../../../../components/buttons/call-to-action/dynamic-rounded-cta-button/DynamicRoundedCTAButton";
import FormInputTextField, {
  FormInputTextFieldProps,
} from "../../../../components/inputs/form-input-text-field/FormInputTextField";
import FonciiToolTip from "../../../../components/tool-tips/FonciiToolTip";

// Services
import { FonciiAPIClientAdapter } from "../../../../services/foncii-api/adapters/fonciiAPIClientAdapter";

// Utilities
import {
  RegexPatterns,
  isInputValidAgainstPattern,
} from "../../../../utilities/common/regex";

// Managers
import AuthenticationManager from "../../../../managers/authenticationManager";

export default function AuthModalResetPasswordForm({
  switchToAuthForm,
}: AuthModalFormProps) {
  // Managers
  const authenticationManager = new AuthenticationManager();

  // Services
  const clientAPIService = new FonciiAPIClientAdapter();

  // State Management
  // Redux
  const [isLoading, setIsLoading] = useState(false);

  // Properties
  // Validated inputs to pass to the backend
  const [email, setEmail] = useState<string | undefined>(undefined);

  // Requirements
  const [userEmailExists, setEmailExists] = useState<Boolean>(false);

  // Text Field Configurations
  const ResetPasswordFormTextFieldConfigurations = {
    emailTextFieldConfig: (): FormInputTextFieldProps &
      InputHTMLAttributes<HTMLInputElement> => {
      return {
        id: "Email",
        placeholder: "Email",
        textInputValidator: emailTextFieldInputValidator,
        type: "email",
        inputMode: "email",
        name: "Email",
      };
    },
  };

  // Input Validators
  // These async validators fire when the user types in the input
  const emailTextFieldInputValidator = async (
    textInput: string
  ): Promise<Boolean> => {
    const email = textInput;
    let emailExists: Boolean = false;

    if (isInputValidAgainstPattern(email, RegexPatterns.EmailRegex)) {
      emailExists = await clientAPIService.performDoesEmailExist(email);
      setEmail(emailExists ? email : undefined);
    }

    setEmail(emailExists ? email : undefined);
    setEmailExists(emailExists);

    return emailExists;
  };

  // Convenience
  const areFormRequirementsFulfilled = (): Boolean => {
    return userEmailExists;
  };

  const canSubmit = (): Boolean => {
    return areFormRequirementsFulfilled() && !isLoading;
  };

  // Actions
  const navigateToLogInForm = () => {
    switchToAuthForm(AuthForms.LogIn);
  };

  const sendPasswordResetEmailAction = async () => {
    setIsLoading(false);
    if (!areFormRequirementsFulfilled() || !email) return;
    setIsLoading(true);

    const didSucceed = await authenticationManager.sendResetPasswordEmailLink(
      email
    );

    setIsLoading(false);

    // Go back to the log in screen for the user to log in with the new password after they reset it via email
    if (didSucceed) navigateToLogInForm();
  };

  // Subcomponents
  const FormSubmissionButton = (): React.ReactNode => {
    return (
      <DynamicRoundedCTAButton
        disabled={!canSubmit()}
        loading={isLoading}
        title="Reset Password"
        type="submit"
        onClickAction={sendPasswordResetEmailAction}
        className={
          "h-[60px] w-full rounded-[10px] p-0 md:p-0 xl:p-0 max-w-none"
        }
      />
    );
  };

  // Sections
  const CallToActionSection = (): React.ReactNode => {
    return (
      <div className="flex flex-col gap-y-[8px] items-start justify-center w-full transition-all ease-in-out">
        <h3 className="text-permanent_white font-medium text-[24px] xl:text-[26px]">
          Reset your password
        </h3>
      </div>
    );
  };

  const PromptSection = (): React.ReactNode => {
    return (
      <div className="flex flex-col gap-y-[8px] items-center justify-center h-fit w-full">
        <h4 className="text-neutral font-normal text-[14px] xs:text-[16px] text-start">{`Forgot your password? No problem, enter your email and we’ll send you a link for you to follow in order to reset your password.`}</h4>
      </div>
    );
  };

  const FormFieldsSection = (): React.ReactNode => {
    return (
      <div className="flex flex-col items-start justify-center w-full transition-all ease-in-out">
        {/** Email Input */}
        {
          <FormInputTextField
            {...ResetPasswordFormTextFieldConfigurations.emailTextFieldConfig()}
            autoFocus
            className="rounded-[10px]"
          />
        }
        {/** Email Input */}
      </div>
    );
  };

  const BackToLoginButton = (): React.ReactNode => {
    return (
      <FonciiToolTip title="Go back to the log in screen">
        <button
          className="flex flex-col gap-y-[8px] items-center justify-center h-fit w-full hover:opacity-75 hover:text-primary text-neutral transition-all ease-in-out active:scale-95"
          onClick={navigateToLogInForm}
        >
          <p className=" font-normal text-[14px] xs:text-[16px] text-start">{`Back to log in`}</p>
        </button>
      </FonciiToolTip>
    );
  };

  const ContentSection = (): React.ReactNode => {
    return (
      <div className="flex flex-col h-full gap-y-[16px] items-center justify-center transition-all ease-in-out">
        {CallToActionSection()}
        {FormFieldsSection()}
        {PromptSection()}
        {FormSubmissionButton()}
        {BackToLoginButton()}
      </div>
    );
  };

  return <div className="w-full h-full">{ContentSection()}</div>;
}
