"use client";
// Dependencies
// Framework
import ReactDOM from "react-dom";
import * as React from "react";

// Components
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

// Utilities
import { cn } from "../../utilities/development/DevUtils";
import { ClassNameValue } from "tailwind-merge";

// Components
const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;
const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    side="bottom"
    sideOffset={sideOffset}
    className={cn(
      "z-[999999999999] overflow-hidden rounded-md shadow-lg border-black border-[1px] bg-medium_dark_grey bg-opacity-95 backdrop-blur-lg px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

// Types
interface FonciiToolTipProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: ClassNameValue;
}

/**
 * Reusable tool-tip to simplify wrapping components
 * with the tool-tip functionality
 */
export default function FonciiToolTip({
  title,
  subtitle,
  children,
  className,
}: FonciiToolTipProps) {
  // Just return the passed children if no title is provided (shouldn't render a tool-tip)
  if (!title) return children;

  return (
    <TooltipProvider>
      <Tooltip>
        {/** Note: `asChild` required to prevent nested button warning by passing custom component as child */}
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        {
          /**
           * Render the tool tip content outside of the DOM and above all the other content so
           * that any overflow is visible
           */
          ReactDOM.createPortal(
            <TooltipContent
              className={cn(className, "max-w-[240px] lg:max-w-[320px]")}
            >
              <p className="text-neutral text-sm">{title}</p>
              <i className="text-neutral text-xs">{subtitle}</i>
            </TooltipContent>,
            document.body
          )
        }
      </Tooltip>
    </TooltipProvider>
  );
}
