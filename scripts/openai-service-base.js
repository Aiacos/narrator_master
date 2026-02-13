/**
 * OpenAI Service Base Class for Narrator Master
 * Shared functionality for all OpenAI API service classes
 * @module openai-service-base
 */

import { MODULE_ID as _MODULE_ID } from './settings.js';

/**
 * OpenAIServiceBase - Base class for OpenAI API services
 * Provides common functionality for API key management, error handling, and history tracking
 */
export class OpenAIServiceBase {
    /**
     * Creates a new OpenAIServiceBase instance
     * @param {string} apiKey - The OpenAI API key
     * @param {Object} [options={}] - Configuration options
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
     * @param {string} _operation - The operation being performed (e.g., 'Transcription', 'AI Assistant')
     * @returns {Error} A user-friendly error
     * @private
     */
    _handleApiError(error, _operation) {
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
