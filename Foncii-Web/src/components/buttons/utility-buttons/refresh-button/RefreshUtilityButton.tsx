// Dependencies
// Framework
import { HTMLAttributes } from "react";

// Styling
import { ImageRepository } from "../../../../../public/assets/images/ImageRepository";

// Components
// Local
import FonciiToolTip from "../../../tool-tips/FonciiToolTip";

// Utilities
import { cn } from "../../../../utilities/development/DevUtils";
import { ClassNameValue } from "tailwind-merge";

// Types
interface RefreshUtilityButtonProps {
  onClick: () => void;
  filled?: boolean; // -> True if the desired style is the filled variant, false otherwise, default is true
  title?: string;
  subtitle?: string;
  className?: ClassNameValue;
  disabled?: boolean;
}

// Note: Supply class names other than dimensions (height, width), this button is set to fill its parent container
export default function RefreshUtilityButton({
  onClick,
  filled = true,
  className,
  title = "Refresh",
  subtitle = undefined,
  ...props
}: RefreshUtilityButtonProps & HTMLAttributes<HTMLButtonElement>) {
  return (
    <FonciiToolTip title={title} subtitle={subtitle}>
      <button
        {...props}
        onClick={onClick}
        className={cn(
          `flex items-center justify-center w-full h-full bg-opacity-30 rounded-full transition-all ease-in-out active:scale-90 hover:opacity-75`,
          filled ? "bg-permanent_black bg-opacity-25" : "",
          className
        )}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
        >
          <path
            d="M15.5316 14.4722C15.6715 14.6127 15.7501 14.803 15.7501 15.0014C15.7501 15.1998 15.6715 15.3901 15.5316 15.5306C15.4294 15.6309 13.0144 18 9 18C5.49469 18 2.95031 15.9 1.5 14.2641V16.5C1.5 16.6989 1.42098 16.8897 1.28033 17.0303C1.13968 17.171 0.948912 17.25 0.75 17.25C0.551088 17.25 0.360322 17.171 0.21967 17.0303C0.0790178 16.8897 0 16.6989 0 16.5V12C0 11.8011 0.0790178 11.6103 0.21967 11.4697C0.360322 11.329 0.551088 11.25 0.75 11.25H5.25C5.44891 11.25 5.63968 11.329 5.78033 11.4697C5.92098 11.6103 6 11.8011 6 12C6 12.1989 5.92098 12.3897 5.78033 12.5303C5.63968 12.671 5.44891 12.75 5.25 12.75H2.1975C3.3525 14.1891 5.71875 16.5 9 16.5C12.375 16.5 14.4506 14.4881 14.4713 14.4675C14.6125 14.3276 14.8035 14.2495 15.0024 14.2503C15.2012 14.2512 15.3915 14.331 15.5316 14.4722ZM17.25 0.75C17.0511 0.75 16.8603 0.829018 16.7197 0.96967C16.579 1.11032 16.5 1.30109 16.5 1.5V3.73594C15.0497 2.1 12.5053 0 9 0C4.98563 0 2.57063 2.36906 2.46938 2.46938C2.3284 2.60986 2.249 2.80059 2.24865 2.99961C2.24829 3.19863 2.32702 3.38965 2.4675 3.53063C2.60798 3.6716 2.79871 3.751 2.99774 3.75135C3.19676 3.75171 3.38777 3.67298 3.52875 3.5325C3.54938 3.51187 5.625 1.5 9 1.5C12.2812 1.5 14.6475 3.81094 15.8025 5.25H12.75C12.5511 5.25 12.3603 5.32902 12.2197 5.46967C12.079 5.61032 12 5.80109 12 6C12 6.19891 12.079 6.38968 12.2197 6.53033C12.3603 6.67098 12.5511 6.75 12.75 6.75H17.25C17.4489 6.75 17.6397 6.67098 17.7803 6.53033C17.921 6.38968 18 6.19891 18 6V1.5C18 1.30109 17.921 1.11032 17.7803 0.96967C17.6397 0.829018 17.4489 0.75 17.25 0.75Z"
            fill="#FFFFFF"
          />
        </svg>
      </button>
    </FonciiToolTip>
  );
}
