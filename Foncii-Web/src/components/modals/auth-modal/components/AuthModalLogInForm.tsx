/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Types
import { AuthForms, AuthModalFormProps } from "../AuthModal";
import { AuthProviders } from "../../../../__generated__/graphql";

// Hooks
import React, { InputHTMLAttributes, useEffect, useState } from "react";

// Components
// Local
import DynamicRoundedCTAButton from "../../../../components/buttons/call-to-action/dynamic-rounded-cta-button/DynamicRoundedCTAButton";
import FormInputTextField, {
  FormInputTextFieldProps,
} from "../../../../components/inputs/form-input-text-field/FormInputTextField";
import OAuthButton, {
  OAuthButtonVariants,
} from "../../../../components/buttons/call-to-action/oauth-button/OAuthButton";

// Services
import { FonciiAPIClientAdapter } from "../../../../services/foncii-api/adapters/fonciiAPIClientAdapter";

// Managers
import AuthenticationManager from "../../../../managers/authenticationManager";

// Redux
import { getFonciiUserSlice } from "../../../../redux/operations/selectors";

// Local Storage Persistence
import LocalStorageContainer, {
  clearLoginCoolDown,
  setLogInCoolDownExpirationDate,
} from "../../../../core-foncii-maps/containers/localStorageContainer";

// Utilities
import {
  RegexPatterns,
  isInputValidAgainstPattern,
} from "../../../../utilities/common/regex";
import { UnitsOfTimeInMS } from "../../../../utilities/common/time";
import { cn } from "../../../../utilities/development/DevUtils";

export default function AuthModalLogInForm({
  switchToAuthForm,
}: AuthModalFormProps) {
  // Managers
  const authenticationManager = new AuthenticationManager();

  // Services
  const clientAPIService = new FonciiAPIClientAdapter();

  // State Management
  // Redux
  const fonciiUser = getFonciiUserSlice()(),
    [isLoading, setIsLoading] = useState(false);

  // Properties
  // Validated inputs to pass to the backend to log the user in via the default provider.
  const [email, setEmail] = useState<string | undefined>(undefined),
    [username, setUsername] = useState<string | undefined>(undefined),
    [password, setPassword] = useState<string | undefined>(undefined);

  // Requirements
  const [userIdentifierExists, setUserIdentifierExists] =
    useState<Boolean>(false);

  // Limits
  // To be implemented
  const [logInAttempts, setLoginAttempts] = useState(0),
    maxLogInAttempts = 4;

  const logInAttemptsRemaining = (): number => {
    return Math.max(maxLogInAttempts - logInAttempts, 0);
  };

  // Disabled until the user refreshes the page and the cool down expiration date
  // stored in the local storage expires
  const loginDisabled = (): boolean => {
    const logInCoolDownExpirationDate =
      LocalStorageContainer().LogInCoolDownExpirationDate;

    // Precondition Failure, expiration date not set, meaning no cool down was activated.
    if (!logInCoolDownExpirationDate) return false;

    const coolDownActive = logInCoolDownExpirationDate.getTime() > Date.now();

    // Clear the cool down state from the local storage and this component since it expired.
    if (!coolDownActive) {
      clearLoginCoolDown();
    }

    return coolDownActive;
  };

  // Respond to user specific updates
  useEffect(() => { }, [fonciiUser]);

  // Text Field Configurations
  const LoginFormTextFieldConfigurations = {
    userIdentifierTextFieldConfig: (): FormInputTextFieldProps &
      InputHTMLAttributes<HTMLInputElement> => {
      return {
        id: "UserIdentifier",
        placeholder: "Email or username (required)",
        textInputValidator: userIdentifierTextFieldInputValidator,
        type: "text",
        inputMode: "text",
        name: "Username or email",
      };
    },
    passwordTextFieldConfig: (): FormInputTextFieldProps &
      InputHTMLAttributes<HTMLInputElement> => {
      return {
        id: "Password",
        placeholder: "Password",
        onInputChange: onPasswordInputChangeHandler,
        type: "password",
        inputMode: "text",
        name: "Password",
      };
    },
  };

  // Action Handlers
  // Simple handler to set the password on input change since a validator isn't used for the password field, for obvious security reasons.
  const onPasswordInputChangeHandler = (textInput: string) => {
    setPassword(textInput != "" ? textInput : undefined);
  };

  // Input Validators
  // These async validators fire when the user types in the input
  const userIdentifierTextFieldInputValidator = async (
    textInput: string
  ): Promise<Boolean> => {
    const userIdentifier = textInput;
    let userIdentifierExists: Boolean = false;

    // Determine the type of the input, whether it's a username or an email
    const isEmail = isInputValidAgainstPattern(
      userIdentifier,
      RegexPatterns.EmailRegex
    ),
      isUsername = isInputValidAgainstPattern(
        userIdentifier,
        RegexPatterns.FonciiUsernameRegex
      );

    // If the identifier actually exists, then the input is valid and the user can log in with it.
    if (isUsername) {
      userIdentifierExists = await clientAPIService.performDoesUsernameExist(
        userIdentifier
      );
      setUsername(userIdentifierExists ? userIdentifier : undefined);
      setEmail(undefined); // Reset unused input type
    } else if (isEmail) {
      userIdentifierExists = await clientAPIService.performDoesEmailExist(
        userIdentifier
      );
      setEmail(userIdentifierExists ? userIdentifier : undefined);
      setUsername(undefined);
    }

    setUserIdentifierExists(userIdentifierExists);

    return userIdentifierExists;
  };

  // Convenience
  const areFormRequirementsFulfilled = (): Boolean => {
    return userIdentifierExists && password != undefined;
  };

  const canSubmit = (): Boolean => {
    return areFormRequirementsFulfilled() && !isLoading && !loginDisabled();
  };

  const logInCoolDownRemainingDurationInMinutes = (): number => {
    const logInCoolDownExpirationDate =
      LocalStorageContainer().LogInCoolDownExpirationDate;

    // Precondition Failure, expiration date not set, meaning no cool down was activated.
    if (!logInCoolDownExpirationDate) return 0;

    return Math.ceil(
      Math.max(
        (logInCoolDownExpirationDate.getTime() - Date.now()) /
        UnitsOfTimeInMS.minute,
        0
      )
    );
  };

  const remainingLogInCoolDownDurationPrompt = (): string => {
    return `${logInCoolDownRemainingDurationInMinutes()} minute${logInCoolDownRemainingDurationInMinutes() > 1 ? "s" : ""
      }`;
  };

  const displayLogInAttemptNotification = (): Boolean => {
    return (
      loginDisabled() ||
      (logInAttemptsRemaining() < 3 &&
        !fonciiUser.isLoggedIn &&
        !fonciiUser.signingIn)
    ); // After 2 attempts the notif will show, 2 attempts implies the 1st attempt was unsuccessful
  };

  // Actions
  const navigateToSignUpForm = () => {
    switchToAuthForm(AuthForms.SignUp);
  };

  const navigateToResetPasswordForm = () => {
    switchToAuthForm(AuthForms.ResetPassword);
  };

  // Triggers a log in cool down that expires in 30 minutes, the user will have to refresh the page when it expires,
  // we're not setting a timeout for 30 minutes here.
  const triggerLogInCoolDown = () => {
    const oneHour = UnitsOfTimeInMS.hour,
      logInCoolDownExpirationDate = new Date(Date.now() + oneHour / 2);

    setLogInCoolDownExpirationDate(logInCoolDownExpirationDate);
  };

  /**
   * Pushes the validated inputs to the authentication manager to log the existing
   * user in through the default auth provider (email + password), username is used as a proxy for
   * obtaining the user's email automatically, by the backend.
   */
  const logInAction = async () => {
    setIsLoading(false);
    if (!areFormRequirementsFulfilled() || !password) return;
    setIsLoading(true);

    if (username) {
      await authenticationManager.loginWithUsername(username, password);
    } else if (email) {
      await authenticationManager.loginWithEmail(email, password);
    }

    if (fonciiUser.isLoggedIn) return;

    setIsLoading(false);
    setLoginAttempts((state) => state + 1);

    // Max login attempt limit reached.
    if (logInAttempts + 1 >= maxLogInAttempts) {
      triggerLogInCoolDown();
    }
  };

  // Subcomponents
  const LogInAttemptNotification = (): React.ReactNode => {
    return (
      <div
        className={cn(`text-permanent_white text-[14px] line-clamp-2 font-normal text-center transition-all ease-in-out`, displayLogInAttemptNotification() ? "h-[40px]" : "h-[0px]")}
      >
        {loginDisabled() ? (
          <p>
            <span className="text-primary">Too Many Log In Attempts.</span>
            Please try again in {remainingLogInCoolDownDurationPrompt()}.
          </p>
        ) : (
          <p>
            <span className="text-primary">{`${logInAttemptsRemaining()} Attempt${logInAttemptsRemaining() == 1 ? "" : "s"} Remaining.`}</span>
            {`You can reset your password below if necessary.`}
          </p>
        )}
      </div>
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

  const FormSubmissionButton = (): React.ReactNode => {
    return (
      <DynamicRoundedCTAButton
        disabled={!canSubmit()}
        loading={isLoading}
        title="Log in"
        type="submit"
        onClickAction={logInAction}
        className={
          "h-[60px] w-full rounded-[10px] p-0 md:p-0 xl:p-0 max-w-none"
        }
      />
    );
  };

  const ForgotPasswordButton = (): React.ReactNode => {
    return (
      <div className="flex w-full inset-y-0 left-0">
        <button
          className={`transition-all ease-in-out justify-start text-[12px] xs:text-[12px] font-medium text-neutral hover:text-primary hover:opacity-75 active:scale-90`}
          onClick={navigateToResetPasswordForm}
        >
          <p>{"Forgot your password?"}</p>
        </button>
      </div>
    );
  };

  // Sections
  const CallToActionSection = (): React.ReactNode => {
    return (
      <div className="flex flex-col gap-y-[8px] items-start justify-center w-full transition-all ease-in-out">
        <h3 className="text-permanent_white font-medium text-[24px] xl:text-[26px]">
          Welcome Back!
        </h3>
        <h4>
          <button
            className="text-primary hover:opacity-75"
            onClick={navigateToSignUpForm}
          >
            Don’t have an account?
          </button>
        </h4>
      </div>
    );
  };

  // OAuth providers, only available when the username field has been filled
  const OAuthProvidersSection = (): React.ReactNode => {
    return (
      <div className="flex flex-col gap-y-[16px] items-center justify-center h-fit w-full">
        <ORDivider />

        <div className="flex flex-col gap-y-[16px] gap-x-[48px] items-center justify-center w-full transition-all ease-in-out">
          {/** Google */}
          {
            <OAuthButton
              variant={OAuthButtonVariants.large}
              switchToAuthForm={switchToAuthForm}
              provider={AuthProviders.Google}
              disabled={loginDisabled()}
            />
          }
          {/** Google */}

          {/** Facebook */}
          {
            <OAuthButton
              variant={OAuthButtonVariants.large}
              switchToAuthForm={switchToAuthForm}
              provider={AuthProviders.Facebook}
              disabled={loginDisabled()}
            />
          }
          {/** Facebook */}
        </div>
      </div>
    );
  };

  const FormFieldsSection = (): React.ReactNode => {
    return (
      <div className="flex flex-col items-start justify-center w-full transition-all ease-in-out">
        {/** User Identifier Input */}
        {
          <FormInputTextField
            {...LoginFormTextFieldConfigurations.userIdentifierTextFieldConfig()}
            autoFocus
            className="rounded-none rounded-t-[10px]"
          />
        }
        {/** User Identifier Input */}

        {/** Password Input */}
        {
          <FormInputTextField
            {...LoginFormTextFieldConfigurations.passwordTextFieldConfig()}
            className="rounded-none rounded-b-[10px]"
          />
        }
        {/** Password Input */}

        {/** Log In Attempts Remaining / Log In Cool Down Active */}
        {LogInAttemptNotification()}
        {/** Log In Attempts Remaining / Log In Cool Down Active */}
      </div>
    );
  };

  const ContentSection = (): React.ReactNode => {
    return (
      <div className="flex flex-col gap-y-[16px] items-center justify-center transition-all ease-in-out">
        {CallToActionSection()}
        {FormFieldsSection()}
        {ForgotPasswordButton()}
        {FormSubmissionButton()}
        {OAuthProvidersSection()}
      </div>
    );
  };

  return <div className="w-full">{ContentSection()}</div>;
}
