// Dependencies
// Logging
import logger from "../../foncii-toolkit/debugging/debugLogger";

// Performance Measurement
import * as perf from "perf_hooks";

/**
 * Base class that allows other instances to observe various async
 * tasks and cleanly gauge their overall performance in a high level manner.
 */
export default class PerformanceObserverable {
  // Properties
  /**
   * True if the observation log should be silenced, false otherwise.
   * The observation log is used to log the performance of each task
   * continuously as the observer observes changes to the performance measurements
   * over time. This shouldn't be used to gauge individual performance as it
   * represents the total task duration. The latest duration is automatically logged.
   * 
   * True by default as the observation log is very verbose and extensive.
   */
  silenceObservationLog: boolean;
  /** Disabled in production by default because this hampers performance */
  disabledInProduction: boolean;
  /** Disable entirely for all envs, just return the untouched async func */
  disabled: boolean;

  constructor({
    silenceObservationLog = true,
    disabledInProduction = true,
    disabled = false
  }: {
    silenceObservationLog?: boolean,
    disabledInProduction?: boolean,
    disabled?: boolean
  }) {
    this.silenceObservationLog = silenceObservationLog;
    this.disabledInProduction = disabledInProduction;
    this.disabled = disabled;

    this.initializePerformanceObserver();
  }

  // Setup
  initializePerformanceObserver() {
    const obs = new perf.PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (this.silenceObservationLog) return;

        logger.info(`${entry.name} took ${entry.duration}[ms]`);
      });
    });

    obs.observe({ entryTypes: ["measure"], buffered: true });
  }

  /**
   * Measures the response time of the given asynchronous task.
   * Warning this can slow down performance by increasing the response
   * time of the async function. Don't use this in production.
   *
   * @param taskName
   * @param asyncFunction
   *
   * @returns -> Resolved asynchronous task
   */
  async measurePerformance<T>(
    taskName: string,
    asyncFunction: () => Promise<T>
  ): Promise<T> {
    // Don't measure performance in production if the disable flag is true
    if (this.disabled || (this.disabledInProduction && process.env.NODE_ENV == 'production'))
      return asyncFunction();

    performance.mark("start");

    try {
      const result = await asyncFunction();

      // Performance measurement
      performance.mark("end");
      performance.measure(taskName, "start", "end");

      // Logging
      this.logLatestTask(taskName);

      return result;
    } catch (error) {
      logger.error(`${taskName} failed with error:`, error);
      throw error;
    }
  }

  // Helpers
  /**
   * @param taskName -> Name of the task measured and stored in the
   * performance entry buffer.
   *
   * @returns -> The duration of the latest task entry in [ms].
   */
  getLatestDurationOfTask(taskName: string): number | undefined {
    const latestEntry = performance.getEntriesByName(taskName)[0];

    return latestEntry?.duration;
  }

  /**
   * @param taskName -> Name of the task measured and stored in the
   * performance entry buffer
   *
   * @returns -> The total duration of the task over all entries in [ms]
   */
  getTotalDurationOfTask(taskName: string): number {
    const entries = performance.getEntriesByName(taskName),
      totalDuration = entries.reduce(
        (total, entry) => total + entry.duration,
        0
      );

    return totalDuration;
  }

  /**
   * @param taskName -> Name of the task measured and stored in the
   * performance entry buffer
   *
   * @returns -> The average duration of the task over all entries in [ms]
   */
  getAverageDurationOfTask(taskName: string): number {
    const entries = performance.getEntriesByName(taskName),
      totalEntries = entries.length,
      totalDuration = this.getTotalDurationOfTask(taskName),
      averageDuration = totalDuration / totalEntries;

    return averageDuration;
  }

  /**
   * Prints out a tabular log of the given task names and their
   * latest (most recent aka index 0 in the buffer) durations to the console.
   *
   * @param taskNames
   */
  logLatestDurationOfTasks(taskNames: string[]) {
    const taskDurationMap: { [taskName: string]: number } = {};

    taskNames.map((taskName) => {
      const taskDuration = this.getLatestDurationOfTask(taskName);

      // Filter out undefined values
      if (taskDuration) {
        taskDurationMap[taskName] = taskDuration;
      } else {
        logger.warn(`Unknown task ${taskName} has an undefined duration`);
      }
    });

    console.table(taskDurationMap, ["Task", "Duration [ms]"]);
  }

  /**
   * Prints out a tabular log of the given task names and their
   * average durations to the console.
   *
   * @param taskNames
   */
  logAverageDurationOfTasks(taskNames: string[]) {
    const taskDurationMap: { [taskName: string]: number } = {};

    taskNames.map((taskName) => {
      const averageTaskDuration = this.getAverageDurationOfTask(taskName);
      taskDurationMap[taskName] = averageTaskDuration;
    });

    console.table(taskDurationMap, ["Task", "Average Duration [ms]"]);
  }

  /**
   * Prints out a tabular log of the given task names and their
   * total durations to the console.
   *
   * @param taskNames
   */
  logTotalDurationOfTasks(taskNames: string[]) {
    const taskDurationMap: { [taskName: string]: number } = {};

    taskNames.map((taskName) => {
      const totalTaskDuration = this.getTotalDurationOfTask(taskName);
      taskDurationMap[taskName] = totalTaskDuration;
    });

    console.table(taskDurationMap, ["Task", "Total Duration [ms]"]);
  }

  /**
   * Prints out the latest information for the given task name to the console.
   * 
   * @param taskName 
   */
  logLatestTask(taskName: string) {
    logger.info(`${taskName} took ${this.getLatestDurationOfTask(taskName)}[ms]`);
  }
}
