// Dependencies
// Framework
import { ButtonHTMLAttributes, DetailedHTMLProps } from "react";

// Components
// Local
import FonciiToolTip from "../../../components/tool-tips/FonciiToolTip";

// External
import Image from "next/image";

// Assets
import { ImageRepository } from "../../../../public/assets/images/ImageRepository";

/**
 * Reusable and configurable `back` button. Usually designated
 * for instances where the user can navigate backwards.
 *
 * @param onClick -> Action triggered when the button is clicked
 * @param disabled
 * @param withTitle -> True if the button should be displayed with the 'back' label, false otherwise
 */
export default function BackButton({
  disabled = false,
  withTitle = true,
  ...props
}: DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> & {
  withTitle?: boolean;
}) {
  return (
    <FonciiToolTip title={withTitle ? "Go Back" : undefined}>
      <button
        {...props}
        className={`flex flex-row gap-x-[16px] w-fit h-[30px] transition-all ease-in-out hover:opacity-75 active:scale-90 items-center justify-center`}
        disabled={disabled}
      >
        <Image
          src={ImageRepository.UtilityIcons.BackButtonIcon}
          alt="Back Button Icon"
        />

        {withTitle ? (
          <p className="text-[16px] font-semibold text-permanent_white">Back</p>
        ) : undefined}
      </button>
    </FonciiToolTip>
  );
}
