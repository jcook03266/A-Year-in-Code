"use client";
// Dependencies
// Framework
import React, { useEffect } from "react";

// Types
import {
  FmIntegrationCredential,
  FmIntegrationProviders,
} from "../../../../../../__generated__/graphql";

// Components
// Local
import RoundedRectangularActionButton from "../../../../../../components/buttons/call-to-action/rounded-rectangular-action-button/RoundedRectangularActionButton";
import CheckMarkToggleButton from "../../../../../../components/buttons/toggle-buttons/check-mark-toggle-button/CheckMarkToggleButton";

// External
import Image from "next/image";
import Link from "next/link";

// Styling
import { ColorEnum } from "../../../../../../../public/assets/ColorRepository";

// Assets
import { ImageRepository } from "../../../../../../../public/assets/images/ImageRepository";

// Navigation
import { ExternalLinks } from "../../../../../../core-foncii-maps/properties/NavigationProperties";
// Redux
import {
  FonciiUserActions,
  UserPostsActions,
} from "../../../../../../redux/operations/dispatchers";
import {
  getFonciiUserSlice,
  getUserPostsSlice,
} from "../../../../../../redux/operations/selectors";

// Formatting
import { uppercaseFirstLetter } from "../../../../../../utilities/formatting/textContentFormatting";
import { DateFormatter } from "../../../../../../utilities/formatting/miscFormatters";

// Utils
import { cn } from "../../../../../../utilities/development/DevUtils";

// A container for user menu row based content.
export default function AuthorizedIntegrationOption({
  integrationProvider,
}: {
  integrationProvider: FmIntegrationProviders;
}): React.ReactNode {
  // State Management
  const fonciiUser = getFonciiUserSlice()(),
    userPosts = getUserPostsSlice()();

  // Reactive UI side-effects
  useEffect(() => { }, [fonciiUser, userPosts]);

  // Properties
  const currentDescription = (): string => {
    let description = integrationProviderPreviewDescription();

    if (integrationCredentialExpiringSoon()) {
      description =
        "Access to this integration expires soon. Please refresh it if you want to continue using it.";
    } else if (integrationCredentialExpired()) {
      description =
        "Access to this integration has expired, please connect it again in order to continue using it.";
    }

    return description;
  };

  const integrationProviderName = (): string => {
    switch (integrationProvider) {
      case FmIntegrationProviders.Instagram:
        return "Instagram";
      default:
        return "Unsupported";
    }
  };

  const integrationProviderWebsite = (): string => {
    switch (integrationProvider) {
      case FmIntegrationProviders.Instagram:
        return "https://www.instagram.com/";
      default:
        return "";
    }
  };

  const integrationProviderPreviewDescription = (): string => {
    switch (integrationProvider) {
      case FmIntegrationProviders.Instagram:
        return "Import up to a thousand recent videos and images from your Instagram wall to start off your map.";
      default:
        return "N/A";
    }
  };

  // Convenience
  const storedIntegrationCredential = ():
    | FmIntegrationCredential
    | undefined => {
    return fonciiUser.integrationCredentials?.find(
      (storedCred) => storedCred?.provider == integrationProvider
    );
  };

  const integrationCredentialConnected = (): boolean => {
    return storedIntegrationCredential() != undefined;
  };

  const integrationCredentialExpired = (): boolean => {
    return storedIntegrationCredential()?.expired ?? false;
  };

  const integrationCredentialExpiringSoon = (): boolean => {
    return storedIntegrationCredential()?.expiresSoon ?? false;
  };

  const hasValidIntegrationCredential = (): boolean => {
    return integrationCredentialConnected() && !integrationCredentialExpired();
  };

  const canManuallyRefresh = (): boolean => {
    return storedIntegrationCredential()?.canRefresh ?? false;
  };

  const autoRefreshEnabled = (): boolean => {
    return storedIntegrationCredential()?.autoRefresh ?? false;
  };

  // Conditional UI display states
  const shouldDisplayBottomSection = (): boolean => {
    return integrationCredentialConnected();
  };

  /**
   * Don't display the expiration date if auto refresh is keeping the cred alive, but do display it if the cred
   * has expired for some reason (user inactive for too long and auto refresh wasn't able to trigger from the client session)
   */
  const shouldDisplayExpirationDate = (): boolean => {
    // Direct prerequisite for display this UI component
    if (!integrationCredentialConnected()) return false;

    return !autoRefreshEnabled() || integrationCredentialExpired();
  };

  const shouldDisplayDescriptionSection = (): boolean => {
    return (
      !hasValidIntegrationCredential() ||
      (integrationCredentialExpiringSoon() && !autoRefreshEnabled())
    );
  };

  // Actions
  /**
   * Connect or Import depending on the current app state
   */
  const currentPrimaryAction = (): void => {
    if (hasValidIntegrationCredential()) {
      // Valid credential ~ User can import
      importPostsThroughIntegrationAction();
    } else {
      // Invalid / no credential ~ User has to connect the integration
      requestIntegrationConnectionAction();
    }
  };

  /**
   * Starts the connection / auth process required to
   * connect the target integration provider. This process be initiated
   * at any time, and the resolution of the request can replace
   * any current integration credential from the target provider.
   */
  const requestIntegrationConnectionAction = (): void => {
    switch (integrationProvider) {
      case FmIntegrationProviders.Instagram:
        // Navigate to Instagram's auth redirect page where the user will then come back with an access token for the integration context to parse
        // and process.
        window.open(
          ExternalLinks.instagramOAuthRedirectLink(location.origin),
          "_self"
        );
        break;
      default:
        console.error(
          `Integration Provider: ${integrationProvider} is not yet supported as an authorizable Foncii Maps Integration.`
        );
    }
  };

  const importPostsThroughIntegrationAction = (): void => {
    const integrationCredential = storedIntegrationCredential();

    // Precondition failure
    if (!hasValidIntegrationCredential() || !integrationCredential) return;

    UserPostsActions.importUserPosts({ integrationCredential });
  };

  const revokeIntegrationCredentialAction = (): void => {
    const integrationCredential = storedIntegrationCredential();

    // Precondition failure
    if (!integrationCredentialConnected() || !integrationCredential) return;

    FonciiUserActions.revokeIntegrationCredential(integrationCredential);
  };

  /**
   * Note: Manually refreshing the integration credential is disabled until the
   * access token associated with it has matured to be at least 24 hours old, which
   * means the button is greyed out until then.
   */
  const manualRefreshAction = (): void => {
    const integrationCredential = storedIntegrationCredential();

    if (!canManuallyRefresh() || !integrationCredential) return;

    FonciiUserActions.refreshIntegrationCredential(integrationCredential);
  };

  /**
   * Toggles the auto refresh option on or off depending on the
   * current state of the component.
   */
  const toggleAutoRefreshAction = (): void => {
    const integrationCredential = storedIntegrationCredential();

    if (!integrationCredentialConnected() || !integrationCredential) return;

    FonciiUserActions.setAutoRefreshStateForCredential(
      integrationCredential,
      !autoRefreshEnabled()
    );
  };

  // Subcomponents
  const ProviderIconView = (): React.ReactNode => {
    let icon = ImageRepository.Placeholders.MissingResourcePlaceholder;

    switch (integrationProvider) {
      case FmIntegrationProviders.Instagram:
        icon = ImageRepository.UserMenuIcons.InstagramProviderIcon;
        break;
    }

    return (
      <Image
        fetchPriority="high"
        loading="eager"
        className="h-[30px] w-[30px]"
        src={icon}
        alt={`${integrationProviderName()} integration provider logo`}
      />
    );
  };

  // 'Import' when provider is connected and authorized, 'Connect' when provider isn't connected / authorized.
  const PrimaryActionButton = (): React.ReactNode => {
    const title = hasValidIntegrationCredential() ? "Import" : "Connect",
      backgroundColor = ColorEnum.primary,
      isLoading =
        fonciiUser.integrationConnectionInProgress ||
        userPosts.isImportingPosts;

    return RoundedRectangularActionButton({
      title,
      backgroundColor,
      isLoading,
      className: "max-h-[40px]",
      onClickAction: currentPrimaryAction,
    });
  };

  const DisconnectButton = (): React.ReactNode => {
    return RoundedRectangularActionButton({
      title: "Disconnect",
      backgroundColor: ColorEnum.medium,
      className: "max-h-[30px]",
      onClickAction: revokeIntegrationCredentialAction,
    });
  };

  const ManualRefreshButton = (): React.ReactNode => {
    if (integrationCredentialExpired()) return;

    // Button is disabled when the credential is immature and can't be refreshed.
    return RoundedRectangularActionButton({
      title: "Refresh",
      backgroundColor: ColorEnum.medium,
      className: "max-h-[30px]",
      disabled: !canManuallyRefresh(),
      onClickAction: manualRefreshAction,
    });
  };

  const AutoRefreshToggle = (): React.ReactNode => {
    // Toggling the auto refresh is pointless if the cred is invalid, just hide it for simplicity
    if (!hasValidIntegrationCredential()) return;

    return (
      <div className="flex flex-row gap-x-[12px] items-center justify-center w-fit h-fit">
        <CheckMarkToggleButton
          title={
            autoRefreshEnabled()
              ? `Disable auto-refresh (connection will expire over time)`
              : `Enable auto-refreshing (connection won't expire over time)`
          }
          toggled={autoRefreshEnabled()}
          onClickAction={toggleAutoRefreshAction}
        />
        <p className="text-[14px] font-normal text-permanent_white">
          Auto-Refresh
        </p>
      </div>
    );
  };

  const ExpirationDate = (): React.ReactNode => {
    const integrationCredential = storedIntegrationCredential();

    if (!shouldDisplayExpirationDate() || !integrationCredential) return;

    const shouldWarnUser =
      integrationCredentialExpiringSoon() || integrationCredentialExpired(),
      prefix = integrationCredentialExpired() ? "Expired" : "Expires",
      expirationDate = new Date(integrationCredential.staleDate),
      formattedExpirationDate =
        DateFormatter.formatDateToLocalizedNumericMMDDYYHH(expirationDate);

    return (
      <p className={cn(`font-normal text-[14px] line-clamp-1 w-fit`, shouldWarnUser ? "text-primary" : "text-permanent_white")}>
        <span className="text-primary">{prefix}</span>:
        {formattedExpirationDate}
      </p>
    );
  };

  /**
   * Short introduction to the integration if connecting for the first time,
   * or a status message prompting the user to refresh the cred if it expires soon,
   * or if the cred has already expired
   */
  const DescriptionSection = (): React.ReactNode => {
    if (!shouldDisplayDescriptionSection()) return;

    return (
      <div className="flex w-full h-fit items-center justify-start border-l-[1px] border-primary">
        <p className="px-[8px] text-medium font-normal text-[14px] line-clamp-3 w-full">
          {currentDescription()}
        </p>
      </div>
    );
  };

  const ContentSection = (): React.ReactNode => {
    return (
      <div className="flex flex-row flex-wrap gap-x-[16px] gap-y-[16px] w-full h-fit">
        <div className="flex flex-row gap-x-[16px] items-center justify-center w-fit h-fit">
          <Link
            className="hover:opacity-75 transition-all ease-in-out"
            href={integrationProviderWebsite()}
            rel="noreferrer"
            target="_blank"
          >
            {ProviderIconView()}
          </Link>

          <Link
            className="hover:opacity-75 transition-all ease-in-out"
            href={integrationProviderWebsite()}
            rel="noreferrer"
            target="_blank"
          >
            <p className="text-permanent_white text-[16px] font-normal line-clamp-1">
              {uppercaseFirstLetter(integrationProviderName())}
            </p>
          </Link>
        </div>

        <div className="flex flex-row gap-x-[16px] justify-between">
          {PrimaryActionButton()}
          {shouldDisplayBottomSection() ? DisconnectButton() : null}
        </div>
      </div>
    );
  };

  const BottomSection = (): React.ReactNode => {
    if (!shouldDisplayBottomSection()) return;

    return (
      <div className="flex flex-row gap-x-[12px] gap-y-[8px] flex-wrap items-center justify-start w-full transition-all ease-in-out">
        {AutoRefreshToggle()}
        {ExpirationDate()}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-y-[16px] p-[12px] items-start justify-center w-full h-fit transition-all ease-in-out border-[1px] border-medium rounded-[8px]">
      {ContentSection()}
      {BottomSection()}
      {DescriptionSection()}
    </div>
  );
}
