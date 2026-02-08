/**
 * Error Notification Helper Module for Narrator Master
 * Provides centralized error notification handling with different severity levels
 * @module error-notification-helper
 */

import { MODULE_ID } from './settings.js';

/**
 * Error notification types for different severity levels
 * @constant {Object}
 */
export const NOTIFICATION_TYPE = {
    ERROR: 'error',
    WARNING: 'warn',
    INFO: 'info'
};

/**
 * Centralized error notification helper
 * Handles different error types and shows appropriate user notifications
 */
export class ErrorNotificationHelper {
    /**
     * Shows an error notification to the user
     * @param {Error|string} error - The error or message to display
     * @param {Object} [options={}] - Notification options
     * @param {string} [options.type='error'] - Notification type (error, warn, info)
     * @param {boolean} [options.permanent=false] - Whether notification should be permanent
     * @param {string} [options.context] - Additional context about where the error occurred
     */
    static notify(error, options = {}) {
        const type = options.type || NOTIFICATION_TYPE.ERROR;
        const message = error instanceof Error ? error.message : String(error);
        const context = options.context ? `[${options.context}] ` : '';

        // Log to console for debugging
        if (type === NOTIFICATION_TYPE.ERROR) {
            console.error(`${MODULE_ID} | ${context}${message}`, error);
        } else if (type === NOTIFICATION_TYPE.WARNING) {
            console.warn(`${MODULE_ID} | ${context}${message}`);
        }

        // Show user notification
        if (typeof ui !== 'undefined' && ui.notifications) {
            const notifyMethod = ui.notifications[type];
            if (typeof notifyMethod === 'function') {
                notifyMethod.call(ui.notifications, message, { permanent: options.permanent });
            }
        }
    }

    /**
     * Shows an error notification
     * @param {Error|string} error - The error to display
     * @param {string} [context] - Additional context
     */
    static error(error, context) {
        this.notify(error, { type: NOTIFICATION_TYPE.ERROR, context });
    }

    /**
     * Shows a warning notification
     * @param {string} message - The warning message
     * @param {string} [context] - Additional context
     */
    static warn(message, context) {
        this.notify(message, { type: NOTIFICATION_TYPE.WARNING, context });
    }

    /**
     * Shows an info notification
     * @param {string} message - The info message
     */
    static info(message) {
        this.notify(message, { type: NOTIFICATION_TYPE.INFO });
    }

    /**
     * Handles API-related errors with specific messaging
     * @param {Error} error - The API error
     * @param {string} operation - What operation failed (e.g., 'transcription', 'image generation')
     */
    static handleApiError(error, operation) {
        // Check if it's a network error
        if (error.isNetworkError) {
            this.error(error.message, operation);
            return;
        }

        // Check for rate limiting
        if (error.message?.includes('rate') || error.message?.includes('limite')) {
            this.warn(error.message, operation);
            return;
        }

        // Default error handling
        this.error(error, operation);
    }
}
