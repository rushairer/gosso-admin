/**
 * Structured logger for production environments.
 * In development, logs to console as usual.
 * In production, can be extended to forward to Sentry, Datadog, etc.
 */
export const logger = {
  error(message: string, context?: unknown): void {
    if (import.meta.env.DEV) {
      console.error(`[gosso-admin] ${message}`, context);
    }
    // Production: forward to error tracking service
    // e.g. Sentry.captureException(context) or DatadogLogs.logger.error(message, context)
  },

  warn(message: string, context?: unknown): void {
    if (import.meta.env.DEV) {
      console.warn(`[gosso-admin] ${message}`, context);
    }
  },

  info(message: string): void {
    if (import.meta.env.DEV) {
      console.info(`[gosso-admin] ${message}`);
    }
  },
};
