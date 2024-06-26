// Dependencies
// Components
import FonciiToolTip from "../../tool-tips/FonciiToolTip";

// Types
interface RestaurantRatingLabelProps {
  title?: string;
  rating?: number;
  fixedSize?: boolean;
  desiredDimensionClasses?: string;
  children?: React.ReactNode;
}

/**
 * Label for displaying rich(w/ image content and other amenities)
 * platform specific rating information
 */
export default function RestaurantRatingLabel({
  title,
  rating,
  fixedSize = false,
  desiredDimensionClasses,
  children,
}: RestaurantRatingLabelProps) {
  // Formatting
  const formattedRating = (): string => {
    /// Placeholder when rating is undefined or malformed
    if (!rating) {
      return "N/A";
    }

    return rating.toFixed(1);
  };

  return (
    <FonciiToolTip title={title}>
      <div className={`flex flex-row items-center gap-x-[8px]`}>
        <div
          className={`h-[18px] w-[18px] rounded-full ${
            fixedSize ? "" : "xl:h-[20px] xl:w-[20px]"
          } ${desiredDimensionClasses}`}
        >
          {children}
        </div>

        <p
          className={`text-permanent_white text-[14px] font-normal ${
            fixedSize ? "" : "xl:text-[16px]"
          }`}
        >
          {formattedRating()}
        </p>
      </div>
    </FonciiToolTip>
  );
}
