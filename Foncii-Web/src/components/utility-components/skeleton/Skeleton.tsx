// Dependencies
// Utilities
import { cn } from "../../../utilities/development/DevUtils";

/**
 * Reusable and customizable skeleton component
 * to use when loading components. Control the
 * rendering of this skeleton component from the parent
 * component as this component doesn't accept a loading state.
 */
export default function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-medium_dark_grey", className)}
      {...props}
    />
  );
}
