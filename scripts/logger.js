/**
 * Logger Utility - Centralized logging with debug mode support
 * Provides structured logging that respects ESLint no-console rules
 * @module logger
 */

/**
 * Module identifier for log prefixing
 * @constant {string}
 */
const MODULE_ID = 'narrator-master';

/**
 * Log levels for filtering and categorization
 * @constant {Object}
 * @property {string} DEBUG - Detailed diagnostic information, only shown when debug mode is enabled
 * @property {string} INFO - General informational messages about normal operations
 * @property {string} WARN - Warning messages for potentially problematic situations
 * @property {string} ERROR - Error messages for failures requiring attention
 */
const LOG_LEVEL = {
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error'
};

/**
 * Centralized logger utility class
 * Provides consistent logging with debug mode support throughout the module.
 * All log messages are prefixed with the module ID and formatted consistently.
 *
 * Uses console.warn for debug/info/warn messages and console.error for errors
 * to comply with ESLint no-console rules while maintaining production logging capability.
 *
 * Debug-level messages are only output when debug mode is explicitly enabled,
 * reducing console noise in production while retaining diagnostic capability.
 *
 * @example
 * // Enable debug mode
 * Logger.enableDebugMode();
 *
 * // Log at different levels
 * Logger.debug('Detailed diagnostic info', 'AudioCapture');
 * Logger.info('Recording started', 'AudioCapture');
 * Logger.warn('API rate limit approaching', 'TranscriptionService');
 * Logger.error(new Error('Failed to connect'), 'AIAssistant');
 */
class Logger {
    /**
     * Debug mode state - when false, debug messages are suppressed
     * @type {boolean}
     * @private
     */
    static _debugMode = false;

    /**
     * Enables debug mode logging
     * When enabled, debug-level messages will be logged to console.
     * Useful for troubleshooting and development work.
     * Logs an info message to confirm debug mode activation.
     */
    static enableDebugMode() {
        this._debugMode = true;
        this.info('Debug mode enabled');
    }

    /**
     * Disables debug mode logging
     * When disabled, debug-level messages are suppressed to reduce console output.
     * Info, warning, and error messages continue to be logged.
     * Silently disables without logging to avoid noise after debug mode is turned off.
     */
    static disableDebugMode() {
        this._debugMode = false;
    }

    /**
     * Sets debug mode state dynamically
     * Provides programmatic control over debug logging.
     * Logs state transitions to inform when debug mode is enabled or disabled.
     * When transitioning to disabled state, uses console.warn directly to ensure
     * the final message is visible even though debug mode is being turned off.
     * @param {boolean} enabled - Whether debug mode should be enabled
     */
    static setDebugMode(enabled) {
        const wasEnabled = this._debugMode;
        this._debugMode = Boolean(enabled);

        // Only log the change if we're transitioning to a different state
        if (enabled && !wasEnabled) {
            this.info('Debug mode enabled');
        } else if (!enabled && wasEnabled) {
            // Use console.warn directly since we just disabled debug mode
            console.warn(`${MODULE_ID} | [INFO] Debug mode disabled`);
        }
    }

    /**
     * Gets current debug mode state
     * @returns {boolean} Whether debug mode is enabled
     */
    static isDebugMode() {
        return this._debugMode;
    }

    /**
     * Formats a log message with module prefix and optional context
     * Creates a consistent log format: "narrator-master | [LEVEL] [Context] Message"
     * The context parameter helps identify which component or operation generated the log.
     * @param {string} level - Log level (from LOG_LEVEL constants)
     * @param {string} message - The message to log
     * @param {string} [context] - Optional context identifier (e.g., class name, operation name)
     * @returns {string} Formatted message string ready for console output
     * @private
     */
    static _formatMessage(level, message, context) {
        const levelStr = `[${level.toUpperCase()}]`;
        const contextStr = context ? ` [${context}]` : '';
        return `${MODULE_ID} |${levelStr}${contextStr} ${message}`;
    }

    /**
     * Logs a debug message (only when debug mode is enabled)
     * Use for detailed diagnostic information useful during development and troubleshooting.
     * These messages are suppressed in production unless debug mode is explicitly enabled.
     * Ideal for logging internal state, variable values, and execution flow details.
     * Uses console.warn to comply with ESLint no-console rules.
     * @param {string} message - The message to log
     * @param {string} [context] - Optional context identifier (e.g., class name, method name)
     * @param {*} [data] - Optional additional data to log (objects, arrays, etc.)
     */
    static debug(message, context, data) {
        if (!this._debugMode) {return;}

        const formattedMessage = this._formatMessage(LOG_LEVEL.DEBUG, message, context);
        if (data !== undefined) {
            console.warn(formattedMessage, data);
        } else {
            console.warn(formattedMessage);
        }
    }

    /**
     * Logs an info message
     * Use for important runtime information that should always be visible in production.
     * Appropriate for initialization messages, completion notifications, and significant events.
     * Always logs regardless of debug mode state.
     * Uses console.warn to comply with ESLint no-console rules.
     * @param {string} message - The message to log
     * @param {string} [context] - Optional context identifier (e.g., class name, operation name)
     * @param {*} [data] - Optional additional data to log (objects, arrays, etc.)
     */
    static info(message, context, data) {
        const formattedMessage = this._formatMessage(LOG_LEVEL.INFO, message, context);
        if (data !== undefined) {
            console.warn(formattedMessage, data);
        } else {
            console.warn(formattedMessage);
        }
    }

    /**
     * Logs a warning message
     * Use for potentially problematic situations that don't prevent operation but warrant attention.
     * Examples: deprecated API usage, rate limiting, fallback behavior, recoverable errors.
     * Always logs regardless of debug mode state.
     * Uses console.warn which is the natural fit for warning-level messages.
     * @param {string} message - The warning message
     * @param {string} [context] - Optional context identifier (e.g., class name, operation name)
     * @param {*} [data] - Optional additional data to log (objects, arrays, etc.)
     */
    static warn(message, context, data) {
        const formattedMessage = this._formatMessage(LOG_LEVEL.WARN, message, context);
        if (data !== undefined) {
            console.warn(formattedMessage, data);
        } else {
            console.warn(formattedMessage);
        }
    }

    /**
     * Logs an error message
     * Use for errors and exceptions that require immediate attention.
     * Handles both Error objects and string messages gracefully.
     * When passed an Error object, includes the full error with stack trace.
     * Always logs regardless of debug mode state.
     * Uses console.error which is appropriate for error-level messages and
     * complies with ESLint rules for production error logging.
     * @param {Error|string} error - The error object or error message string
     * @param {string} [context] - Optional context identifier (e.g., class name, operation name)
     * @param {*} [data] - Optional additional data to log (objects, arrays, etc.)
     */
    static error(error, context, data) {
        const message = error instanceof Error ? error.message : String(error);
        const formattedMessage = this._formatMessage(LOG_LEVEL.ERROR, message, context);

        if (data !== undefined) {
            console.error(formattedMessage, error, data);
        } else if (error instanceof Error) {
            console.error(formattedMessage, error);
        } else {
            console.error(formattedMessage);
        }
    }
}

export { Logger, LOG_LEVEL };
