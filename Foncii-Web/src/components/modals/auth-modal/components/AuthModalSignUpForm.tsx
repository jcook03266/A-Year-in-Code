/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Types
import { AuthForms, AuthModalFormProps } from "../AuthModal";
import { AuthProviders } from "../../../../__generated__/graphql";
import * as _ from "lodash";

// Hooks
import React, { InputHTMLAttributes, useState } from "react";
import { useSearchParams } from "next/navigation";

// Components
// Local
import DynamicRoundedCTAButton from "../../../../components/buttons/call-to-action/dynamic-rounded-cta-button/DynamicRoundedCTAButton";
import FormInputTextField, {
  FormInputTextFieldProps,
} from "../../../../components/inputs/form-input-text-field/FormInputTextField";
import OAuthButton, {
  OAuthButtonVariants,
} from "../../../../components/buttons/call-to-action/oauth-button/OAuthButton";

// External
import Link from "next/link";

// Services
import { FonciiAPIClientAdapter } from "../../../../services/foncii-api/adapters/fonciiAPIClientAdapter";

// Utilities
import {
  RegexPatterns,
  isInputValidAgainstPattern,
} from "../../../../utilities/common/regex";
import {
  foods,
  shakespeareAdjectives,
} from "../../../../utilities/common/wordLists";

// Navigation
import {
  OriginAssociatedDomainLinks,
  SignUpURLParameters,
} from "../../../../core-foncii-maps/properties/NavigationProperties";

// Managers
import AuthenticationManager from "../../../../managers/authenticationManager";

export default function AuthModalSignUpForm({
  switchToAuthForm,
}: AuthModalFormProps) {
  // Managers
  const authenticationManager = new AuthenticationManager();

  // Services
  const clientAPIService = new FonciiAPIClientAdapter();

  // State Management
  const [isLoading, setIsLoading] = useState(false);

  // URL State
  const searchParams = useSearchParams();

  // Properties
  const referralCode = (): string | undefined =>
    searchParams.get(SignUpURLParameters.referralCode) as string;
  const randomUserName = (): string =>
    _.sample(shakespeareAdjectives) +
    "_" +
    _.sample(foods) +
    "_" +
    (Math.floor(Math.random() * 9000) + 1000);

  // Validated inputs to pass to the backend to provision the new user's account.
  const [email, setEmail] = useState<string | undefined>(undefined),
    [username, setUsername] = useState<string | undefined>(randomUserName()), // Required - place a random string filler to make signup process easy
    [password, setPassword] = useState<string | undefined>(undefined),
    [firstName, setFirstName] = useState<string | undefined>(undefined),
    [lastName, setLastName] = useState<string | undefined>(undefined);

  // Requirements
  const [emailIsUnique, setEmailIsUnique] = useState(false),
    [usernameIsUnique, setUsernameIsUnique] = useState(true), // User name is generated to start with
    [passwordIsValid, setPasswordIsValid] = useState(false),
    [firstNameIsValid, setFirstNameIsValid] = useState(false),
    [lastNameIsValid, setLastNameIsValid] = useState(false);

  // Migration Flag
  // const [accountMigrationAvailable, setAccountMigrationAvailable] = useState(false);

  // Text Field Configurations
  const SignUpFormTextFieldConfigurations = {
    firstNameTextFieldConfig: (): FormInputTextFieldProps &
      InputHTMLAttributes<HTMLInputElement> => {
      return {
        id: "First Name",
        placeholder: "First Name",
        textInputValidator: firstNameTextFieldInputValidator,
        type: "text",
        inputMode: "text",
        name: "First Name",
      };
    },
    lastNameTextFieldConfig: (): FormInputTextFieldProps &
      InputHTMLAttributes<HTMLInputElement> => {
      return {
        id: "Last Name",
        placeholder: "Last Name",
        textInputValidator: lastNameTextFieldInputValidator,
        type: "text",
        inputMode: "text",
        name: "Last Name",
      };
    },
    usernameTextFieldConfig: (): FormInputTextFieldProps &
      InputHTMLAttributes<HTMLInputElement> => {
      return {
        id: "Username",
        placeholder: "Username",
        instructions:
          "Usernames must be lowercase, non empty, start with a letter, limited to 30 characters and only (letters, digits, periods, or underscores) are allowed.",
        textInputValidator: usernameTextFieldInputValidator,
        onRefresh: randomUserName,
        type: "text",
        inputMode: "text",
        name: "Username",
        initialTextInput: username,
      };
    },
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
    passwordTextFieldConfig: (): FormInputTextFieldProps &
      InputHTMLAttributes<HTMLInputElement> => {
      return {
        id: "Password",
        placeholder: "Password",
        instructions:
          "Passwords must have an uppercase letter, lowercase letter, a number, a symbol and be 8 characters long",
        textInputValidator: passwordTextFieldInputValidator,
        type: "password",
        inputMode: "text",
        name: "Password",
      };
    },
  };

  // Input Validators
  // These async validators fire when the user types in the input
  const emailTextFieldInputValidator = async (
    textInput: string
  ): Promise<Boolean> => {
    const email = textInput;

    // Validate that the email passes the standard REGEX for emails
    if (!isInputValidAgainstPattern(email, RegexPatterns.EmailRegex)) {
      setEmail(undefined);
      setEmailIsUnique(false);

      return false;
    }

    // Validate that the email is unique, we obviously don't want to fire this for inputs that
    // don't pass REGEX in order to not waste database operations and server time.
    // the result from this is the overall result of the email's validity.
    const emailExists = await clientAPIService.performDoesEmailExist(email);

    // Set valid input variable and update the uniqueness state
    setEmail(emailExists ? undefined : email);
    setEmailIsUnique(!emailExists);

    return !emailExists;
  };

  const usernameTextFieldInputValidator = async (
    textInput: string
  ): Promise<Boolean> => {
    const username = textInput;

    // Validate that the username passes the standard REGEX requirement for Foncii platform usernames
    if (
      !isInputValidAgainstPattern(username, RegexPatterns.FonciiUsernameRegex)
    ) {
      setUsername(undefined);
      setUsernameIsUnique(false);

      return false;
    }

    // Equivalent ~ email validation
    const usernameExists = await clientAPIService.performDoesUsernameExist(
      username
    );

    setUsername(usernameExists ? undefined : username);
    setUsernameIsUnique(!usernameExists);

    return !usernameExists;
  };

  const passwordTextFieldInputValidator = async (
    textInput: string
  ): Promise<Boolean> => {
    const password = textInput;

    // Validate that the password passes the standard REGEX requirement for Foncii platform passwords
    const passwordIsValid = isInputValidAgainstPattern(
      password,
      RegexPatterns.FonciiPasswordRegex
    );

    setPassword(passwordIsValid ? password : undefined);
    setPasswordIsValid(passwordIsValid);

    return passwordIsValid;
  };

  const firstNameTextFieldInputValidator = async (
    textInput: string
  ): Promise<Boolean> => {
    const firstName = textInput;

    // Validate that the password passes the standard REGEX requirement for Foncii platform passwords
    const firstNameIsValid = isInputValidAgainstPattern(
      firstName,
      RegexPatterns.PersonalNameRegex
    );

    setFirstName(firstNameIsValid ? firstName : undefined);
    setFirstNameIsValid(firstNameIsValid);

    return firstNameIsValid;
  };

  const lastNameTextFieldInputValidator = async (
    textInput: string
  ): Promise<Boolean> => {
    const lastName = textInput;

    // Validate that the password passes the standard REGEX requirement for Foncii platform passwords
    const lastNameIsValid = isInputValidAgainstPattern(
      lastName,
      RegexPatterns.PersonalNameRegex
    );

    setLastName(lastNameIsValid ? lastName : undefined);
    setLastNameIsValid(lastNameIsValid);

    return lastNameIsValid;
  };

  // Convenience
  const areFormRequirementsFulfilled = (): Boolean => {
    return (
      emailIsUnique &&
      usernameIsUnique &&
      passwordIsValid &&
      firstNameIsValid &&
      lastNameIsValid
    );
  };

  const canSubmit = (): Boolean => {
    return areFormRequirementsFulfilled() && !isLoading;
  };

  // Username required
  const oAuthButtonsEnabled = (): Boolean => {
    return username != undefined;
  };

  // Actions
  const navigateToLogInForm = () => {
    switchToAuthForm(AuthForms.LogIn);
  };

  /**
   * Pushes the validated inputs to the authentication manager to attempt to create the new
   * user's account.
   */
  const signUpAction = async () => {
    setIsLoading(false);

    if (!areFormRequirementsFulfilled()) return;
    setIsLoading(true);

    // Default user account
    await authenticationManager.createDefaultUserAccount({
      firstName: firstName!,
      lastName: lastName!,
      username: username!, // Force unwrap, these are guaranteed as defined via the `areFormRequirementsFulfilled` condition
      email: email!,
      password: password!,
      externalReferralCode: referralCode(),
    });

    setIsLoading(false);
  };

  // Subcomponents
  const FormSubmissionButton = (): React.ReactNode => {
    return (
      <DynamicRoundedCTAButton
        disabled={!canSubmit()}
        loading={isLoading}
        title="Agree and continue"
        type="submit"
        onClickAction={signUpAction}
        className={
          "h-[60px] w-full rounded-[10px] p-0 md:p-0 xl:p-0 max-w-none"
        }
      />
    );
  };

  const ORDivider = (): React.ReactNode => {
    const Divider = () => {
      return <div className="w-full h-[1px] bg-neutral rounded-full" />;
    };

    return (
      <div className="flex flex-row gap-x-[20px] items-center justify-between w-full h-fit">
        <Divider />
        <p className="shrink-0 text-neutral font-semibold text-[16px] text-center w-fit">
          or
        </p>
        <Divider />
      </div>
    );
  };

  // Sections
  const CallToActionSection = (): React.ReactNode => {
    return (
      <div className="flex flex-col gap-y-[8px] items-start justify-center w-full transition-all ease-in-out">
        <h3 className="text-permanent_white font-medium text-[24px] xl:text-[26px]">
          Welcome to Foncii 🎉
        </h3>
        <h4>
          Enter your name, email, username, and password to sign up.
          <button
            className="text-primary hover:opacity-75"
            onClick={navigateToLogInForm}
          >
            Already have an account?
          </button>
        </h4>
      </div>
    );
  };

  const AcknowledgementSection = (): React.ReactNode => {
    return (
      <div className="flex flex-col gap-y-[8px] items-center justify-center h-fit w-full">
        <div className="flex flex-col gap-y-[8px] items-center justify-center h-fit w-full">
          <p className="text-permanent_white font-normal text-[14px] text-left">
            By continuing, you agree to Foncii’s
            <Link
              href={OriginAssociatedDomainLinks.PrivacyPolicy()}
              className="hover:opacity-75 transition-all ease-in-out w-fit"
            >
              <span className="text-indicator_blue">
                Terms, Privacy Policy and Cookies Statement
              </span>
            </Link>
          </p>
        </div>
      </div>
    );
  };

  // OAuth providers, only available when the username field has been filled
  const OAuthProvidersSection = (): React.ReactNode => {
    return (
      <div className="flex flex-col gap-y-[16px] items-center justify-center h-fit w-full">
        <ORDivider />

        {/** Continue With Prompt */}
        <p className="flex items-center justify-center text-[14px] xs:text-[16px] font-normal text-permanent_white shrink-0 w-full text-center">
          Continue with:
        </p>

        <div className="flex flex-row gap-x-[48px] gap-y-[16px] items-center justify-center w-full transition-all ease-in-out">
          {/** Google */}
          {
            <OAuthButton
              variant={OAuthButtonVariants.small}
              key={AuthProviders.Google}
              provider={AuthProviders.Google}
              newUserDataProvider={() => {
                return {
                  firstName: firstNameIsValid ? firstName : undefined,
                  lastName: lastNameIsValid ? lastName : undefined,
                  username,
                  externalReferralCode: referralCode(),
                };
              }}
              switchToAuthForm={switchToAuthForm}
              disabled={!oAuthButtonsEnabled()}
            />
          }
          {/** Google */}

          {/** Facebook */}
          {
            <OAuthButton
              variant={OAuthButtonVariants.small}
              key={AuthProviders.Facebook}
              provider={AuthProviders.Facebook}
              newUserDataProvider={() => {
                return {
                  firstName: firstNameIsValid ? firstName : undefined,
                  lastName: lastNameIsValid ? lastName : undefined,
                  username,
                  externalReferralCode: referralCode(),
                };
              }}
              switchToAuthForm={switchToAuthForm}
              disabled={!oAuthButtonsEnabled()}
            />
          }
          {/** Facebook */}
        </div>
      </div>
    );
  };

  const FormFieldsSection = (): React.ReactNode => {
    return (
      <div className="flex flex-col gap-y-[16px] items-center justify-center w-full transition-all ease-in-out">
        {/** Notifications */}
        {/* {UserMigrationAvailableNotification()} */}

        <div className="flex flex-col h-fit w-full shrink-0">
          {/** Username Input */}
          {
            <FormInputTextField
              {...SignUpFormTextFieldConfigurations.usernameTextFieldConfig()}
              validate_empty
              className="rounded-none rounded-t-[10px]"
            />
          }
          {/** Username Input */}

          <div className="flex flex-row h-fit w-full shrink-0">
            {/** First Name Input */}
            {
              <FormInputTextField
                {...SignUpFormTextFieldConfigurations.firstNameTextFieldConfig()}
                className="rounded-none rounded-bl-[10px]"
              />
            }
            {/** First Name Input */}

            {/** Last Name Input */}
            {
              <FormInputTextField
                {...SignUpFormTextFieldConfigurations.lastNameTextFieldConfig()}
                className="rounded-none rounded-br-[10px]"
              />
            }
            {/** Last Name Input */}
          </div>
        </div>

        <div className="flex flex-col gap-y-[16px] h-fit w-full shrink-0">
          {/** Email Input */}
          {
            <FormInputTextField
              {...SignUpFormTextFieldConfigurations.emailTextFieldConfig()}
              className="rounded-[10px]"
            />
          }
          {/** Email Input */}

          {/** Password Input */}
          {
            <FormInputTextField
              {...SignUpFormTextFieldConfigurations.passwordTextFieldConfig()}
              className="rounded-[10px]"
            />
          }
          {/** Password Input */}
        </div>
      </div>
    );
  };

  const ContentSection = (): React.ReactNode => {
    return (
      <div className="flex flex-col gap-y-[16px] items-center justify-center transition-all ease-in-out h-fit w-full">
        {CallToActionSection()}
        {FormFieldsSection()}
        {AcknowledgementSection()}
        {FormSubmissionButton()}
        {OAuthProvidersSection()}
      </div>
    );
  };

  return <div className="w-full h-full">{ContentSection()}</div>;
}
