// Various unit conversion functions to simplify using repeatable computations across the codebase 
// and allow for easier testing by focusing all logic to one deterministic origin point.

export function convertMetersToKM(meters: number): number {
    return meters / 1000;
};

export function convertKMToMeters(km: number): number {
    return km * 1000;
};

export function convertSecondsToMS(seconds: number): number {
    return seconds * 1000;
};

export function convertMSToSeconds(ms: number): number {
    return ms / 1000;
};