// Dependencies
// Components
import FonciiToolTip from "../../../components/tool-tips/FonciiToolTip";

// Utilities
import { cn } from "../../../utilities/development/DevUtils";
import { isInRange } from "../../../utilities/math/commonMath";

// Types
interface PercentMatchLabelProps {
  percentMatchScore?: number;
  qualityScore?: number;
  blurQualityScore?: boolean;
}

/**
 * A simple label that displays a percent formatted string representation
 * of a percent match score value.
 *
 * @param percentMatchScore -> The percent match score to display. From 0 - 100,
 * Note: this is not normalized in the backend to be from 0 - 1.
 */
export default function PercentMatchLabel({
  percentMatchScore,
  qualityScore,
  blurQualityScore = false,
}: PercentMatchLabelProps) {
  // Convenience
  const score =
    percentMatchScore != undefined ? percentMatchScore : qualityScore;

  // Rounds the score to the nearest whole number (integer) and removes any sig figs
  const formattedScore = () => {
    const score = percentMatchScore || qualityScore;
    if (score == undefined || !isInRange(score ?? 0, 100, 0)) return "N/A";

    const normalizedScore = Math.round(score).toFixed(0);
    return `${normalizedScore}%`;
  };

  // Pre-condition failure, if no score, don't render
  if (score == undefined) return null;

  // Properties
  const title = blurQualityScore
    ? "Sign up to see if your tastes match"
    : percentMatchScore
    ? `Matches ${formattedScore()} with your taste`
    : `${formattedScore()} Quality score`;

  const toolTip = () => {
    return (
      <FonciiToolTip title={title}>
        <div className="flex justify-center items-center bg-primary rounded-full w-[28px] h-[28px] overflow-hidden text-ellipsis cursor-default shrink-0">
          <p
            className={cn(
              `text-permanent_white font-bold text-left text-[10px]`,
              blurQualityScore ? "blur-[2px] pointer-events-none" : ""
            )}
          >
            {formattedScore()}
          </p>
        </div>
      </FonciiToolTip>
    );
  };

  return (
    // TODO(FM-217): Enable when ready
    <>{true ? undefined : toolTip()}</>
  );
}
