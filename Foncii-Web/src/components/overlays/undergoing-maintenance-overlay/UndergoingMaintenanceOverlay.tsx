/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Services
import RemoteConfigurationService, {
  FMRemoteConfigurationKeys,
} from "../../../core-foncii-maps/configurations/remoteConfigService";

// Styling
import { ColorEnum } from "../../../../public/assets/ColorRepository";

// Hooks
import { useEffect, useState } from "react";

// Components
import FonciiFullLogoIcon from "../../icons/foncii-icons/foncii-maps/full-logo-icon/FonciiFullLogoIcon";
import FonciiSocialLinkButton, {
  FonciiSocialMedias,
} from "../../../components/buttons/links/foncii-social-link-button/FonciiSocialLinkButton";

// App Properties
import { nonProductionEnvironment } from "../../../core-foncii-maps/properties/AppProperties";

/**
 * Remotely Configured Maintenance Panel that optionally displays when the site is down.
 * Control it from here: https://console.firebase.google.com/u/0/project/foncii-app/config
 *
 * This doesn't affect the dev environment, the dev condition bypasses the feature flag.
 */
export default function UndergoingMaintenanceOverlay(): React.ReactNode {
  // Services
  const remoteConfigService = () => new RemoteConfigurationService();

  // State Management
  useEffect(() => {
    configureDisplayState();
  }, []);

  const [isDisplayed, setIsDisplayed] = useState<boolean>(false);

  // Display state turned off automatically for dev / staging environments
  const configureDisplayState = async () => {
    let shouldDisplay = false;

    if (nonProductionEnvironment || typeof window == "undefined") return;

    await remoteConfigService().fetchRemoteConfig();

    shouldDisplay = remoteConfigService()
      .getValueForKey(
        FMRemoteConfigurationKeys.foncii_maps_undergoing_maintenance
      )
      .asBoolean();
    setIsDisplayed(shouldDisplay);
  };

  // Subcomponents
  const SocialLinksSection = (): React.ReactNode => {
    return (
      <div className="flex flex-row items-center gap-[24px] z-[1] pt-[40px] pb-[20px]">
        <FonciiSocialLinkButton socialMedia={FonciiSocialMedias.instagram} />
        <FonciiSocialLinkButton socialMedia={FonciiSocialMedias.twitter} />
        <FonciiSocialLinkButton socialMedia={FonciiSocialMedias.medium} />
      </div>
    );
  };

  return isDisplayed ? (
    <div
      className={`items-center justify-center z-[99999] w-[100dvw] fixed top-0 left-0 bg-${ColorEnum.system_black} backdrop-blur-lg bg-opacity-80 flex transition-all ease-in duration-300 h-[100dvh]`}
    >
      <div className="h-full w-[80%] m-auto flex flex-col gap-[50px] justify-center content-center items-center">
        <div className="max-w-[400px]">
          <FonciiFullLogoIcon withLink={false} />
        </div>
        <h1 className="text-center text-[26px] md:text-[30px] font-medium text-primary">
          Site Undergoing Maintenance
        </h1>
        <h2 className="text-center text-[18px] md:text-[20px]  font-normal text-permanent_white">
          We&#39;ll Be Back Soon! 🍜
        </h2>
        {SocialLinksSection()}
      </div>
    </div>
  ) : undefined;
}
