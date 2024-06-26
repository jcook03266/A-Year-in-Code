// Dependencies
// Tailwind + Class Name Construction
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Helper function that constructs tailwind class name strings
 * using an array of class name values
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
