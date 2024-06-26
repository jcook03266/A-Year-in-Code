/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Hooks
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// Styling
import { ColorEnum } from "../../../../public/assets/ColorRepository";

// Components
import FonciiFullLogoIcon from "../../icons/foncii-icons/foncii-maps/full-logo-icon/FonciiFullLogoIcon";
import FixedRoundedCTAButton from "../../../components/buttons/call-to-action/fixed-rounded-cta-button/FixedRoundedCTAButton";

// Local Storage Persistence
import LocalStorageContainer, {
  setEncipheredStagingAuthCode,
} from "../../../core-foncii-maps/containers/localStorageContainer";

// Types
import { ComponentSize } from "../../../types/component-types";

// Redux
import { NotificationCenterActions } from "../../../redux/operations/dispatchers";

// Notification Center
import { NotificationTemplates } from "../../../core-foncii-maps/repositories/NotificationTemplates";

// App Properties
import { stagingEnvironment } from "../../../core-foncii-maps/properties/AppProperties";

// Simple overlay displayed for the staging environment to prevent unauthorized parties from using the website
// Note: Even if a person deletes this element in the dev panel it'll still appear over every page if the person doesn't gain authorization
export const StagingAuthorizationOverlay = (): React.ReactNode => {
  // Element Reference
  const textInput = useRef<HTMLInputElement>(null);

  // Text Descriptions
  const textInputPlaceholder = (): string =>
    incorrectPasscodeEntered
      ? `${passcodeAttemptsRemaining()} Attempt${
          passcodeAttemptsRemaining() != 1 ? "s" : ""
        } Remaining`
      : "Enter Passcode Here";

  // Limits
  const maxIncorrectPasscodeAttempts = 5;

  // Convenience
  const passcodeAttemptsRemaining = (): number =>
    maxIncorrectPasscodeAttempts - numberOfFailedPasscodeAttempts;
  const textFieldHasText = (): boolean => passcodeEntry.length > 0;
  const excessivePasscodeAttemptsDetected = (): boolean =>
    numberOfFailedPasscodeAttempts >= maxIncorrectPasscodeAttempts;

  const requiredStagingAuthCode = (): string => {
    return process.env.NEXT_PUBLIC_FONCII_STAGING_AUTH_CODE;
  };

  const encipheredRequiredStagingAuthCode = (): string => {
    return encipherAuthCode(requiredStagingAuthCode());
  };

  const isClientAuthorized = (): boolean => {
    // Production/local builds don't need to have this overlay
    if (!stagingEnvironment) return true;

    return (
      locallyStoredAuthorizationCipher() == encipheredRequiredStagingAuthCode()
    );
  };

  const locallyStoredAuthorizationCipher = (): string | undefined => {
    return LocalStorageContainer().EncryptedStagingAuthorizationCode;
  };

  // Logic
  // Enciphers the plain text using simple base64 encoding. This is
  // a simple auth screen over our staging server so no need to bust out
  // the crypto library.
  //
  // A repeated cipher is used to encode the plain text for extra security
  const encipherAuthCode = (
    plainTextCode: string,
    iterations: number = 0
  ): string => {
    const repeatCipherLimit = 2;

    if (iterations >= repeatCipherLimit)
      return Buffer.from(plainTextCode).toString("base64");
    else {
      let encipheredCode = Buffer.from(plainTextCode).toString("base64");
      return encipherAuthCode(encipheredCode, iterations + 1);
    }
  };

  const comparePlainTextWithCipher = (plainTextCode: string): boolean => {
    return (
      encipherAuthCode(plainTextCode) == encipheredRequiredStagingAuthCode()
    );
  };

  // Actions
  const submitAuthorizationRequest = (): void => {
    setIsAuthorized(false);

    if (excessivePasscodeAttemptsDetected()) return;

    const cleanedUpPasscode = passcodeEntry.trim(),
      enteredCodeAuthorized = comparePlainTextWithCipher(cleanedUpPasscode);

    // Persist the encrypted passcode to local store
    // to disable this panel from appearing on future launches of the site
    if (enteredCodeAuthorized) {
      setEncipheredStagingAuthCode(encipherAuthCode(cleanedUpPasscode));
      setPasscodeEntry("");
      setNumberOfFailedPasscodeAttempts(0);
      setIncorrectPasscodeEntered(false);
      setIsAuthorized(true);

      NotificationCenterActions.triggerSystemNotification(
        NotificationTemplates.StagingAuthSuccessful
      );
    } else {
      setIsAuthorized(false);
      setPasscodeEntry("");
      setIncorrectPasscodeEntered(true);
      setNumberOfFailedPasscodeAttempts((state) => (state += 1));

      if (numberOfFailedPasscodeAttempts + 1 >= maxIncorrectPasscodeAttempts) {
        NotificationCenterActions.triggerSystemNotification(
          NotificationTemplates.StagingAuthMaxAttemptWarning
        );
      }
    }
  };

  // State Management
  const shouldDisplay = (): boolean => !isAuthorized;

  const [passcodeEntry, setPasscodeEntry] = useState(""),
    [isAuthorized, setIsAuthorized] = useState(isClientAuthorized()),
    [incorrectPasscodeEntered, setIncorrectPasscodeEntered] = useState(false),
    [numberOfFailedPasscodeAttempts, setNumberOfFailedPasscodeAttempts] =
      useState(0);

  const pathname = usePathname();

  // Side Effects
  useEffect(() => {
    setIsAuthorized(isClientAuthorized());
  }, [pathname]);

  // Keyboard Events
  // Custom key down event handlers for ease of use
  // Dismiss the keyboard when the user presses the enter key and submit their entry
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      textInput.current?.blur();
      submitAuthorizationRequest();
    }
  };

  return shouldDisplay() ? (
    <div
      className={`items-center justify-center z-[99999] w-[100dvw] fixed top-0 left-0 bg-${ColorEnum.system_black} backdrop-blur-lg bg-opacity-80 flex transition-all ease-in duration-300 h-[100dvh]`}
    >
      <div className="h-full w-[80%] m-auto flex flex-col gap-[50px] justify-center content-center items-center">
        <div className="max-w-[400px]">
          <FonciiFullLogoIcon />
        </div>
        <h1 className="text-center text-[26px] md:text-[30px] font-medium text-primary">
          Staging Environment
        </h1>

        <input
          name="Passcode Input"
          id="Passcode Input"
          placeholder={textInputPlaceholder()}
          value={passcodeEntry}
          onChange={(value) => setPasscodeEntry(value.target.value)}
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          maxLength={100}
          spellCheck="false"
          aria-label="Search"
          inputMode="text"
          type="password"
          className={`border-[1px] ${
            incorrectPasscodeEntered
              ? "border-invalid_red"
              : "border-medium_dark_grey"
          } rounded-lg h-fit w-[300px] px-[20px] py-[10px] text-left bg-black text-permanent_white font-normal text-[16px] resize-none whitespace-nowrap outline-none overflow-hidden`}
          ref={textInput}
          onKeyDown={handleKeyDown}
        />

        {/** Block All Malicious Authorization Attempts */}
        {excessivePasscodeAttemptsDetected() ? undefined : (
          <span
            className={`w-[200px] ${
              textFieldHasText()
                ? "opacity-100"
                : "opacity-50 pointer-events-none"
            } transition-all ease-in-out`}
          >
            <FixedRoundedCTAButton
              size={ComponentSize.xl}
              title="Authorize"
              onClickAction={submitAuthorizationRequest}
            />
          </span>
        )}
      </div>
    </div>
  ) : undefined;
};
