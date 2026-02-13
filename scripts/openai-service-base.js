/**
 * OpenAI Service Base Class for Narrator Master
 * Shared functionality for all OpenAI API service classes
 * @module openai-service-base
 */

import { MODULE_ID } from './settings.js';

/**
 * OpenAIServiceBase - Base class for OpenAI API services
 * Provides common functionality for API key management, error handling, and history tracking
 */
export class OpenAIServiceBase {
    /**
     * Creates a new OpenAIServiceBase instance
     * @param {string} apiKey - The OpenAI API key
     * @param {Object} [options={}] - Configuration options
     * @param {number} [options.maxHistorySize=50] - Maximum history entries to keep
     * @param {number} [options.maxRetryAttempts=3] - Maximum retry attempts for failed requests
     * @param {number} [options.retryBaseDelay=1000] - Base delay in ms for exponential backoff
     * @param {number} [options.retryMaxDelay=60000] - Maximum delay in ms between retries
     * @param {boolean} [options.retryEnabled=true] - Enable automatic retry with exponential backoff
     */
    constructor(apiKey, options = {}) {
        /**
         * OpenAI API key
         * @type {string}
         * @private
         */
        this._apiKey = apiKey || '';

        /**
         * Base URL for OpenAI API
         * @type {string}
         * @private
         */
        this._baseUrl = 'https://api.openai.com/v1';

        /**
         * History of API operations
         * @type {Array}
         * @private
         */
        this._history = [];

        /**
         * Maximum history entries to keep
         * @type {number}
         * @private
         */
        this._maxHistorySize = options.maxHistorySize || 50;

        /**
         * Retry configuration for API requests
         * @type {Object}
         * @private
         */
        this._retryConfig = {
            maxAttempts: options.maxRetryAttempts ?? 3,
            baseDelay: options.retryBaseDelay ?? 1000,    // 1 second
            maxDelay: options.retryMaxDelay ?? 60000,     // 60 seconds
            enabled: options.retryEnabled ?? true
        };
    }

    /**
     * Updates the API key
     * @param {string} apiKey - The new API key
     */
    setApiKey(apiKey) {
        this._apiKey = apiKey || '';
    }

    /**
     * Checks if the API key is configured
     * @returns {boolean} True if API key is set
     */
    isConfigured() {
        return this._apiKey && this._apiKey.trim().length > 0;
    }

    /**
     * Creates a network error object with localized message
     * @param {Error} networkError - The original network error
     * @returns {Object} Error object with status and message
     * @private
     */
    _createNetworkError(networkError) {
        const isTimeout = networkError.name === 'AbortError' ||
            networkError.message?.includes('timeout');

        if (isTimeout) {
            return {
                message: game.i18n.localize('NARRATOR.Errors.Timeout'),
                code: 'timeout',
                status: 0,
                isNetworkError: true
            };
        }

        return {
            message: game.i18n.localize('NARRATOR.Errors.NetworkError'),
            code: 'network_error',
            status: 0,
            isNetworkError: true
        };
    }

    /**
     * Handles API errors and returns user-friendly error messages
     * @param {Object} error - The API error
     * @param {string} operation - The operation being performed (e.g., 'Transcription', 'AI Assistant')
     * @returns {Error} A user-friendly error
     * @private
     */
    _handleApiError(error, operation) {
        let message;

        // Handle network errors first
        if (error.isNetworkError || error.status === 0) {
            message = error.message || game.i18n.localize('NARRATOR.Errors.NetworkError');
            const err = new Error(message);
            err.isNetworkError = true;
            return err;
        }

        switch (error.status) {
            case 401:
                message = game.i18n.localize('NARRATOR.Errors.InvalidApiKey');
                break;
            case 429:
                message = game.i18n.localize('NARRATOR.Errors.RateLimited');
                break;
            case 413:
                message = game.i18n.localize('NARRATOR.Errors.FileTooLarge');
                break;
            case 400:
                message = game.i18n.format('NARRATOR.Errors.BadRequest', {
                    details: error.message
                });
                break;
            case 500:
            case 502:
            case 503:
                message = game.i18n.localize('NARRATOR.Errors.ServerError');
                break;
            case 504:
                message = game.i18n.localize('NARRATOR.Errors.Timeout');
                break;
            default:
                message = game.i18n.format('NARRATOR.Errors.TranscriptionFailed', {
                    status: error.status,
                    message: error.message
                });
        }

        return new Error(message);
    }

    /**
     * Shows a user notification for errors
     * @param {Error} error - The error to display
     */
    static notifyError(error) {
        if (typeof ui !== 'undefined' && ui.notifications) {
            ui.notifications.error(error.message);
        }
    }

    /**
     * Adds an entry to history
     * @param {Object} entry - The entry to add
     * @private
     */
    _addToHistory(entry) {
        this._history.push({
            ...entry,
            timestamp: new Date()
        });

        // Trim history if exceeds max size
        if (this._history.length > this._maxHistorySize) {
            this._history = this._history.slice(-this._maxHistorySize);
        }
    }

    /**
     * Gets the operation history
     * @param {number} [limit] - Maximum number of entries to return
     * @returns {Array} Array of history entries
     */
    getHistory(limit) {
        const history = [...this._history];
        if (limit && limit > 0) {
            return history.slice(-limit);
        }
        return history;
    }

    /**
     * Clears the operation history
     */
    clearHistory() {
        this._history = [];
    }

    /**
     * Determines if an error is retryable
     * @param {Object} error - The error to check
     * @returns {boolean} True if the error should be retried
     * @private
     */
    _isRetryableError(error) {
        // Network errors are always retryable
        if (error.isNetworkError) {
            return true;
        }

        // Check HTTP status codes
        if (error.status) {
            // Rate limiting - retryable
            if (error.status === 429) {
                return true;
            }

            // Server errors - retryable
            if (error.status >= 500 && error.status < 600) {
                return true;
            }

            // Client errors (400-499 except 429) - not retryable
            if (error.status >= 400 && error.status < 500) {
                return false;
            }
        }

        // Default to not retryable for unknown errors
        return false;
    }

    /**
     * Executes an operation with exponential backoff retry logic
     * @param {Function} operation - Async function to execute
     * @param {Object} [context={}] - Context information for logging
     * @param {string} [context.operationName] - Name of the operation being retried
     * @returns {Promise<*>} Result of the operation
     * @throws {Error} If operation fails after all retries
     * @private
     */
    async _retryWithBackoff(operation, context = {}) {
        const { operationName = 'API request' } = context;

        // If retry is disabled, just execute once
        if (!this._retryConfig.enabled) {
            return await operation();
        }

        let lastError;
        const maxAttempts = Math.max(1, this._retryConfig.maxAttempts);

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                // Execute the operation
                const result = await operation();

                // Log retry success if this wasn't the first attempt
                if (attempt > 0) {
                    console.warn(`[${MODULE_ID}] ${operationName} succeeded after ${attempt + 1} attempts`);
                }

                return result;
            } catch (error) {
                lastError = error;

                // Check if we should retry
                const isRetryable = this._isRetryableError(error);
                const isLastAttempt = attempt === maxAttempts - 1;

                if (!isRetryable || isLastAttempt) {
                    // Don't retry - either not retryable or out of attempts
                    if (!isRetryable) {
                        console.warn(`[${MODULE_ID}] ${operationName} failed with non-retryable error:`, error.message);
                    } else {
                        console.warn(`[${MODULE_ID}] ${operationName} failed after ${maxAttempts} attempts`);
                    }
                    throw error;
                }

                // Calculate delay with exponential backoff: baseDelay * 2^attempt
                const exponentialDelay = this._retryConfig.baseDelay * Math.pow(2, attempt);

                // Cap at maxDelay
                const cappedDelay = Math.min(exponentialDelay, this._retryConfig.maxDelay);

                // Add jitter: random value between 0 and 25% of the delay
                // This prevents thundering herd when multiple requests fail simultaneously
                const jitter = Math.random() * cappedDelay * 0.25;
                const finalDelay = cappedDelay + jitter;

                console.warn(
                    `[${MODULE_ID}] ${operationName} failed (attempt ${attempt + 1}/${maxAttempts}), ` +
                    `retrying in ${Math.round(finalDelay)}ms: ${error.message}`
                );

                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, finalDelay));
            }
        }

        // Should never reach here, but throw last error if we do
        throw lastError;
    }

    /**
     * Gets statistics about the service
     * This is an abstract method that should be overridden by subclasses
     * @returns {Object} Service statistics
     */
    getStats() {
        return {
            configured: this.isConfigured(),
            historySize: this._history.length
        };
    }
}
