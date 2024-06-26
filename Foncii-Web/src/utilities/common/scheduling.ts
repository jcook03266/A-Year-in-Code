// Dependencies
// Utils
import { UnitsOfTimeInMS } from "./time";

/**
 * Syntatically cleaner method for delaying a function call.
 * Executes some async or sync closure outside of a synchronous context.
 * Returns a promise that resolves after the given duration just in case
 * the caller wants to await its resolution.
 *
 * @async
 * @param closure -> A sync or async code block to execute asynchronously
 * @param duration -> The duration of the delay in milliseconds [ms] default
 * is 1 second ~ 1000[ms]
 *
 * @returns -> A promise that resolves the passed closure after the specified time period in [ms]
 */
export async function delay(
  closure: () => Promise<void> | void,
  duration: number = UnitsOfTimeInMS.second
): Promise<void> {
  return new Promise(() => setTimeout(closure, duration));
}
