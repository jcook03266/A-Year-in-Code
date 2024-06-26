// Dependencies
// Components
// Local
import FonciiToolTip from "../../../../components/tool-tips/FonciiToolTip";

// External
import Image from "next/image";

// Assets
import { ImageRepository } from "../../../../../public/assets/images/ImageRepository";

// Styling
import ColorRepository from "../../../../../public/assets/ColorRepository";

// Types
interface SocialMediaConnectionOnboardingScreenProps {
  didClickConnectAccountButton: () => void;
}

export default function SocialMediaConnectionOnboardingScreen({
  didClickConnectAccountButton,
}: SocialMediaConnectionOnboardingScreenProps) {
  // Properties
  const title = "Map out your Instagram 🤳 🍽️ 🗺️",
    missionStatement = "Connect your Instagram and easily showcase your recommendations to your followers.",
    connectAccountButtonTitle = "Connect Account";

  // Subcomponents
  const Illustration = (): React.ReactNode => {
    const illustrationImage =
      ImageRepository.Illustrations.OnboardingSocialMediaConnector,
      alt = "Mapped Experiences";

    return (
      <div className="flex justify-center items-center">
        <Image
          fetchPriority="high"
          loading="eager"
          alt={`Social Media Connector Background Hue`}
          src={ImageRepository.Illustrations.SocialMediaConnectionScreenBackgroundHue}
          className="h-fit w-full fixed top-0 pointer-events-none z-[-1] select-none"
          unoptimized
          unselectable="on"
        />
        <Image
          fetchPriority="high"
          src={illustrationImage}
          height={433}
          width={382}
          alt={alt}
          className="h-fit w-[90%] object-contain select-none"
          unoptimized
          priority={true}
          unselectable="on"
        />
      </div>
    );
  };

  const TitleLabel = (): React.ReactNode => {
    return (
      <h3 className="text-white text-[24px] xl:text-[26px] text-center font-semibold w-full h-fit justify-start items-center select-none">
        {title}
      </h3>
    );
  };

  const MissionStatementLabel = (): React.ReactNode => {
    return (
      <h3 className="text-neutral text-[16px] text-left font-normal w-full h-fit justify-start items-center select-none">
        {missionStatement}
      </h3>
    );
  };

  const InstagramIcon = (): React.ReactNode => {
    return (
      <Image
        src={ImageRepository.CompanyLogos.InstagramLogo}
        height={20}
        width={20}
        alt="Instagram Logo"
        unselectable="on"
        className="select-none"
      />
    );
  };

  const ConnectAccountButton = (): React.ReactNode => {
    return (
      <button
        className="flex flex-row gap-x-[16px] w-[90%] sm:w-[70%] px-[48px] h-[50px] justify-center items-center rounded-[10px] text-permanent_white text-[16px] xl:text-[18px] line-clamp-1 font-normal hover:opacity-75 active:scale-90 transform-gpu transition-all ease-in-out"
        style={{
          background:
            ColorRepository.gradients.instagram_connect_account_button_gradient
        }}
        onClick={didClickConnectAccountButton}
      >
        {InstagramIcon()}
        <FonciiToolTip title="Connect your social media to Foncii">
          <p>{connectAccountButtonTitle}</p>
        </FonciiToolTip>
      </button>
    );
  };

  return (
    <div className="flex flex-col pb-[40px] gap-y-[32px] w-full h-fit justify-center items-center">
      {Illustration()}

      <div className="flex flex-col gap-y-[12px] w-full h-fit justify-center items-center px-[16px] xs:px-[32px]">
        <TitleLabel />
        <MissionStatementLabel />
      </div>

      <ConnectAccountButton />
    </div>
  );
}
