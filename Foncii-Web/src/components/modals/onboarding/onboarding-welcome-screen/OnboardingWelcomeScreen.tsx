// Dependencies
// Components
// Local
import FonciiToolTip from "../../../../components/tool-tips/FonciiToolTip";

// External
import Image from "next/image";

// Assets
import { ImageRepository } from "../../../../../public/assets/images/ImageRepository";

// Animations
import { motion, AnimatePresence } from "framer-motion";

// Types
interface OnboardingWelcomeScreenProps {
  didClickContinueButton: () => void;
}

export default function OnboardingWelcomeScreen({
  didClickContinueButton,
}: OnboardingWelcomeScreenProps) {
  // Properties
  const welcomeStatement = "Made with love by foodies, for foodies.",
    secondaryStatement = `Discover, search, and savor the vibes – finding your next meal just got a whole lot easier.`,
    continueButtonTitle = "Continue";

  // Subcomponents
  const Illustration = (): React.ReactNode => {
    const illustrationImage = ImageRepository.Illustrations.OnboardingHighFive,
      alt = "Foodie Party";

    return (
      <AnimatePresence>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            ease: "anticipate",
            duration: 1,
          }}
        >
          <Image
            src={illustrationImage}
            fetchPriority="high"
            loading="eager"
            height={383}
            width={502}
            alt={alt}
            className="h-[250px] md:h-[350px] w-fit object-contain"
            unoptimized
          />
        </motion.div>
      </AnimatePresence>
    );
  };

  const WelcomeLabel = (): React.ReactNode => {
    return (
      <h2 className="text-permanent_white text-[22px] xl:text-[24px] text-left font-medium w-full h-fit justify-center items-center">
        {welcomeStatement}
      </h2>
    );
  };

  const SecondaryStatementLabel = (): React.ReactNode => {
    return (
      <h3 className="text-neutral text-[16px] xl:text-[18px] text-left font-normal w-full h-fit justify-center items-center">
        {secondaryStatement}
      </h3>
    );
  };

  const ContinueButton = (): React.ReactNode => {
    return (
      <button
        title="Let's get started!"
        className="bg-primary w-full sm:w-[70%] px-[48px] h-[50px] justify-center items-center rounded-[10px] text-permanent_white text-[16px] xl:text-[18px] line-clamp-1 font-normal hover:opacity-75 active:scale-90 transform-gpu transition-all ease-in-out"
        onClick={didClickContinueButton}
      >
        <FonciiToolTip title="Let's get started!">
          <p>{continueButtonTitle}</p>
        </FonciiToolTip>
      </button>
    );
  };

  return (
    <div className="flex flex-col pb-[40px] gap-y-[32px] px-[16px] xs:px-[32px] w-full h-fit justify-start items-center">
      {Illustration()}

      <div className="flex flex-col gap-y-[12px] w-full h-fit justify-center items-center">
        <WelcomeLabel />
        <SecondaryStatementLabel />
      </div>

      <ContinueButton />
    </div>
  );
}
