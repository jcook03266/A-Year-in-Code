// Dependencies
// Assets
import { ImageRepository } from "../../../../public/assets/images/ImageRepository";

// Components
// Local
import FonciiToolTip from "../../../components/tool-tips/FonciiToolTip";

// External
import Image from "next/image";

// Types
interface PlacesAutocompleteWidgetRowProps {
  onSelectAction: (value: string) => void;
  title: string; // Establishment Address
  value: string; // Place ID of the establishment
  selected: Boolean;
}

export default function PlacesAutocompleteWidgetRow({
  onSelectAction,
  title,
  value,
  selected,
}: PlacesAutocompleteWidgetRowProps): React.ReactNode {
  // Subcomponents
  const SideIcon = (): React.ReactNode => {
    const icon = ImageRepository.UtilityIcons.MapMarkerIconPrimary;

    return (
      <Image className="h-[20px] w-[20px]" src={icon} alt="Map Marker Icon" />
    );
  };

  const OptionTitle = (): React.ReactNode => {
    return (
      <p
        className={`line-clamp-1 font-normal text-left text-[14px] text-permanent_white`}
      >
        {title}
      </p>
    );
  };

  return (
    <FonciiToolTip title={title}>
      <button
        className={`p-[10px] rounded-md bg-black border-[1px] ${
          selected ? "border-primary" : "border-medium_dark_grey"
        } h-fit w-full justify-start items-center flex flex-row gap-x-[8px] transition-all ease-in-out hover:border-primary hover:opacity-75`}
        onClick={() => onSelectAction(value)}
      >
        {SideIcon()}
        <OptionTitle />
      </button>
    </FonciiToolTip>
  );
}
