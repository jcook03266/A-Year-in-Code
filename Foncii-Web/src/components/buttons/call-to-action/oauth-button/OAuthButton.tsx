"use client";
// Dependencies
// Types
import { AuthProviders } from "../../../../__generated__/graphql";

// Assets
import { ImageRepository } from "../../../../../public/assets/images/ImageRepository";

// Components
// Local
import FonciiToolTip from "../../../../components/tool-tips/FonciiToolTip";
import { AuthForms } from "../../../../components/modals/auth-modal/AuthModal";

// External
import Image from "next/image";

// Managers
import AuthenticationManager, {
  AuthState,
} from "../../../../managers/authenticationManager";

// Utilities
import { uppercaseFirstLetterOnly } from "../../../../utilities/formatting/textContentFormatting";
import { cn } from "../../../../utilities/development/DevUtils";

// Types
interface OAuthButtonProps {
  provider: AuthProviders;
  newUserDataProvider?: () => {
    firstName?: string;
    lastName?: string;
    username?: string;
    externalReferralCode?: string;
  };
  switchToAuthForm: (authForm: AuthForms) => void;
  disabled?: boolean;
  variant?: OAuthButtonVariants;
}

export enum OAuthButtonVariants {
  large,
  small,
}

/**
 * A modular OAuth button that interfaces with the authentication manager to log in or
 * sign up users based on the target provider.
 *
 * @param provider -> Supported OAuth provider to authenticate the new or existing user with: (google, facebook etc.)
 * @param newUserDataProvider -> A callback containing user information pertaining to a new user
 * that's about to be created ~ provided when this is embedded in the sign up page / form.
 */
export default function OAuthButton({
  provider,
  newUserDataProvider,
  switchToAuthForm,
  disabled = false,
  variant = OAuthButtonVariants.small,
}: OAuthButtonProps) {
  // Managers
  const authManager = new AuthenticationManager();

  // Actions
  const navigateToSignUpForm = () => {
    switchToAuthForm(AuthForms.SignUp);
  };

  // Actions
  const authAction = () => {
    const { firstName, lastName, username, externalReferralCode } =
      newUserDataProvider?.() ?? {};
    authManager
      .authenticateUserWith({
        provider,
        firstName,
        lastName,
        username,
        externalReferralCode,
      })
      .then((state) => {
        if (state === AuthState.USER_NOT_FOUND) {
          navigateToSignUpForm();
        }
      });
  };

  // Subcomponents
  const ContentSection = (): React.ReactNode => {
    let OAuthProviderLogo = "";

    switch (provider) {
      case AuthProviders.Google:
        OAuthProviderLogo = ImageRepository.AuthProviderIcons.GoogleAuthIcon;
        break;
      case AuthProviders.Facebook:
        OAuthProviderLogo = ImageRepository.AuthProviderIcons.FacebookAuthIcon;
        break;
      default:
        OAuthProviderLogo =
          ImageRepository.Placeholders.MissingResourcePlaceholder;
        console.error(
          `[OAuthButton] Unsupported OAuth Provider Selected ${provider}`
        );
        break;
    }

    return (
      <Image
        className={cn(
          "h-[32px] w-[32px] object-contain",
          variant == OAuthButtonVariants.large
            ? "h-[22px] xs:h-[24px] w-[22px] xs:w-[24px] absolute"
            : ""
        )}
        src={OAuthProviderLogo}
        alt={`${provider} Logo`}
      />
    );
  };

  // Variants
  const LargeFormatVariant = (): React.ReactNode => {
    return (
      <FonciiToolTip
        title={`Continue with ${uppercaseFirstLetterOnly(provider)}`}
      >
        <button
          className={`flex items-center justify-between h-fit w-full border-[1px] border-medium bg-medium_dark_grey rounded-[10px] p-[16px] shrink-0 ${
            disabled
              ? "opacity-50"
              : "hover:shadow-md hover:opacity-75 ease-in-out transition-all active:scale-90"
          }`}
          disabled={disabled}
          onClick={authAction}
          role="button"
          type="button"
        >
          {ContentSection()}
          <p className="text-[16px] xs:text-[18px] text-permanent_white font-normal w-full text-center">{`Continue with ${uppercaseFirstLetterOnly(
            provider
          )}`}</p>
        </button>
      </FonciiToolTip>
    );
  };

  const SmallFormatVariant = (): React.ReactNode => {
    return (
      <FonciiToolTip
        title={`Continue with ${uppercaseFirstLetterOnly(provider)}`}
      >
        <button
          className={`h-fit w-fit rounded-full shrink-0 ${
            disabled
              ? "opacity-30"
              : "hover:shadow-md hover:opacity-75 ease-in-out transition-all active:scale-90"
          }`}
          disabled={disabled}
          onClick={authAction}
          role="button"
          type="button"
        >
          {ContentSection()}
        </button>
      </FonciiToolTip>
    );
  };

  const CurrentVariant = (): React.ReactNode => {
    switch (variant) {
      case OAuthButtonVariants.large:
        return LargeFormatVariant();
      case OAuthButtonVariants.small:
        return SmallFormatVariant();
    }
  };

  return CurrentVariant();
}
