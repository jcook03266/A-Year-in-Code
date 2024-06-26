// Dependencies
// Styling
import { ColorEnum } from "../../public/assets/ColorRepository";

// Components
// Local
import FonciiFullLogoIcon from "../components/icons/foncii-icons/foncii-maps/full-logo-icon/FonciiFullLogoIcon";
import FixedRoundedCTAButton from "../components/buttons/call-to-action/fixed-rounded-cta-button/FixedRoundedCTAButton";

// External
import Link from "next/link";

// Types
import { ComponentSize } from "../types/component-types";

export default function NotFound() {
  // Note: Z-index is 99999, above most elements ~ not notifications
  return (
    <div
      className={`items-center justify-center z-[99999] w-[100dvw] fixed top-0 left-0 bg-${ColorEnum.system_black} backdrop-blur-lg bg-opacity-80 flex transition-all ease-in duration-300 h-[100dvh]`}
    >
      <div className="h-full w-full flex flex-col gap-[50px] justify-center content-center items-center">
        <div className="max-w-[80dvw] xs:max-w-[320px]">
          <FonciiFullLogoIcon withLink />
        </div>
        <h1 className="text-center text-[20px] font-medium">
          <span className={`text-${ColorEnum.primary}`}>404</span> | We
          Couldn&apos;t Find This Page
        </h1>

        <Link className="w-[200px]" href="/">
          <FixedRoundedCTAButton size={ComponentSize.xl} title="Return Home" />
        </Link>
      </div>
    </div>
  );
}
