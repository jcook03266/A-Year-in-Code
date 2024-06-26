// Dependencies
// Logging
import { pino } from 'pino';

/// Customized Pino logger for logging dynamic debug messages
/// Note: Logger shows the system time instead of UTC w/ the added options
export const logger = pino({
    transport: {
        target: "pino-pretty",
        options: {
            translateTime: "SYS:dd-mm-yyyy HH:MM:ss",
            ignore: "pid,hostname",
        }
    }
});