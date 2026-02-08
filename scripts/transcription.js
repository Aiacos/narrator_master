/**
 * Transcription Service Module for Narrator Master
 * Handles audio transcription via OpenAI Whisper API with speaker diarization
 * @module transcription
 */

import { MODULE_ID } from './settings.js';

/**
 * Maximum file size for OpenAI Whisper API (25MB)
 * @constant {number}
 */
const MAX_FILE_SIZE = 25 * 1024 * 1024;

/**
 * Default audio duration threshold for chunking (30 seconds)
 * @constant {number}
 */
const CHUNKING_THRESHOLD_SECONDS = 30;

/**
 * Represents a transcribed segment with speaker information
 * @typedef {Object} TranscribedSegment
 * @property {string} speaker - The identified speaker name or ID
 * @property {string} text - The transcribed text for this segment
 * @property {number} start - Start time in seconds
 * @property {number} end - End time in seconds
 * @property {string} [language] - The detected language for this segment (if available)
 */

/**
 * Represents the full transcription result with diarization
 * @typedef {Object} TranscriptionResult
 * @property {string} text - The full transcribed text
 * @property {TranscribedSegment[]} segments - Array of transcribed segments with speaker info
 * @property {string} language - The detected or specified language
 * @property {number} duration - Total audio duration in seconds
 * @property {string[]} speakers - List of unique speakers identified
 */

/**
 * Represents an API error response
 * @typedef {Object} TranscriptionError
 * @property {string} message - Error message
 * @property {string} code - Error code
 * @property {number} status - HTTP status code
 */

/**
 * TranscriptionService - Handles audio transcription using OpenAI Whisper API
 * Supports speaker diarization via gpt-4o-transcribe-diarize model
 */
export class TranscriptionService {
    /**
     * Creates a new TranscriptionService instance
     * @param {string} apiKey - The OpenAI API key
     * @param {Object} [options={}] - Configuration options
     * @param {string} [options.language='it'] - Default transcription language (use 'auto' for auto-detection)
     * @param {boolean} [options.enableDiarization=true] - Enable speaker diarization
     * @param {boolean} [options.multiLanguageMode=false] - Enable multi-language mode with automatic language detection
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
         * Default transcription language
         * @type {string}
         * @private
         */
        this._language = options.language || 'it';

        /**
         * Whether to enable speaker diarization
         * @type {boolean}
         * @private
         */
        this._enableDiarization = options.enableDiarization !== false;

        /**
         * Whether to enable multi-language mode with automatic language detection
         * @type {boolean}
         * @private
         */
        this._multiLanguageMode = options.multiLanguageMode === true;

        /**
         * List of known speaker names for improved identification
         * @type {string[]}
         * @private
         */
        this._knownSpeakerNames = [];

        /**
         * Transcription history for context
         * @type {TranscriptionResult[]}
         * @private
         */
        this._history = [];

        /**
         * Maximum history entries to keep
         * @type {number}
         * @private
         */
        this._maxHistorySize = 50;
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
     * Sets the default transcription language
     * @param {string} language - Language code (e.g., 'it', 'en', 'auto')
     */
    setLanguage(language) {
        this._language = language || 'it';
    }

    /**
     * Gets the current transcription language
     * @returns {string} The language code
     */
    getLanguage() {
        return this._language;
    }

    /**
     * Enables or disables multi-language mode
     * @param {boolean} enabled - Whether to enable multi-language mode
     */
    setMultiLanguageMode(enabled) {
        this._multiLanguageMode = enabled === true;
    }

    /**
     * Checks if multi-language mode is enabled
     * @returns {boolean} True if multi-language mode is enabled
     */
    isMultiLanguageMode() {
        return this._multiLanguageMode;
    }

    /**
     * Sets the list of known speaker names for improved diarization
     * @param {string[]} names - Array of speaker names
     */
    setKnownSpeakerNames(names) {
        this._knownSpeakerNames = Array.isArray(names) ? names : [];
    }

    /**
     * Gets the list of known speaker names
     * @returns {string[]} Array of speaker names
     */
    getKnownSpeakerNames() {
        return [...this._knownSpeakerNames];
    }

    /**
     * Adds a speaker name to the known speakers list
     * @param {string} name - The speaker name to add
     */
    addKnownSpeaker(name) {
        if (name && typeof name === 'string' && !this._knownSpeakerNames.includes(name)) {
            this._knownSpeakerNames.push(name);
        }
    }

    /**
     * Transcribes audio with speaker diarization
     * @param {Blob} audioBlob - The audio blob to transcribe
     * @param {Object} [options={}] - Transcription options
     * @param {string} [options.language] - Override default language
     * @param {string[]} [options.speakerNames] - Speaker names for this transcription
     * @returns {Promise<TranscriptionResult>} The transcription result
     * @throws {Error} If transcription fails
     */
    async transcribe(audioBlob, options = {}) {
        // Validate API key
        if (!this.isConfigured()) {
            throw new Error(game.i18n.localize('NARRATOR.Errors.NoApiKey'));
        }

        // Validate audio blob
        if (!audioBlob || !(audioBlob instanceof Blob)) {
            throw new Error(game.i18n.localize('NARRATOR.Errors.InvalidAudio'));
        }

        // Check file size
        if (audioBlob.size > MAX_FILE_SIZE) {
            throw new Error(
                game.i18n.format('NARRATOR.Errors.FileTooLarge', {
                    size: Math.round(audioBlob.size / (1024 * 1024)),
                    max: 25
                })
            );
        }

        // Determine language and speaker names
        const language = options.language || this._language;
        const speakerNames = options.speakerNames || this._knownSpeakerNames;

        console.log(`${MODULE_ID} | Starting transcription, language: ${language}`);

        try {
            // Build form data for API request
            const formData = this._buildFormData(audioBlob, language, speakerNames);

            // Make API request
            const response = await this._makeApiRequest(formData);

            // Parse and normalize response
            const result = this._parseResponse(response, language);

            // Add to history
            this._addToHistory(result);

            console.log(
                `${MODULE_ID} | Transcription complete, ${result.segments.length} segments`
            );

            return result;
        } catch (error) {
            // Handle specific API errors
            if (error.status) {
                throw this._handleApiError(error);
            }
            throw error;
        }
    }

    /**
     * Transcribes audio using standard Whisper model (without diarization)
     * More cost-effective for single-speaker scenarios
     * @param {Blob} audioBlob - The audio blob to transcribe
     * @param {Object} [options={}] - Transcription options
     * @returns {Promise<TranscriptionResult>} The transcription result
     */
    async transcribeSimple(audioBlob, options = {}) {
        // Validate
        if (!this.isConfigured()) {
            throw new Error(game.i18n.localize('NARRATOR.Errors.NoApiKey'));
        }

        if (!audioBlob || !(audioBlob instanceof Blob)) {
            throw new Error(game.i18n.localize('NARRATOR.Errors.InvalidAudio'));
        }

        if (audioBlob.size > MAX_FILE_SIZE) {
            throw new Error(
                game.i18n.format('NARRATOR.Errors.FileTooLarge', {
                    size: Math.round(audioBlob.size / (1024 * 1024)),
                    max: 25
                })
            );
        }

        const language = options.language || this._language;

        console.log(`${MODULE_ID} | Starting simple transcription, language: ${language}`);

        try {
            const formData = new FormData();
            formData.append('file', audioBlob, 'audio.webm');
            formData.append('model', 'whisper-1');

            // Set language - omit for automatic detection
            if (language && language !== 'auto' && !this._multiLanguageMode) {
                formData.append('language', language);
            }

            formData.append('response_format', 'verbose_json');

            const response = await fetch(`${this._baseUrl}/audio/transcriptions`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this._apiKey}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw {
                    message: errorData.error?.message || 'Transcription failed',
                    code: errorData.error?.code || 'unknown',
                    status: response.status
                };
            }

            const data = await response.json();

            // Convert to standard result format
            const result = {
                text: data.text || '',
                segments: (data.segments || []).map((seg) => ({
                    speaker: 'Speaker',
                    text: seg.text,
                    start: seg.start,
                    end: seg.end
                })),
                language: data.language || language,
                duration: data.duration || 0,
                speakers: ['Speaker']
            };

            this._addToHistory(result);

            return result;
        } catch (error) {
            if (error.status) {
                throw this._handleApiError(error);
            }
            throw error;
        }
    }

    /**
     * Builds the form data for the transcription API request
     * @param {Blob} audioBlob - The audio blob
     * @param {string} language - The transcription language (omit or use 'auto' for auto-detection)
     * @param {string[]} speakerNames - Known speaker names
     * @returns {FormData} The constructed form data
     * @private
     */
    _buildFormData(audioBlob, language, speakerNames) {
        const formData = new FormData();

        // Add audio file
        formData.append('file', audioBlob, 'audio.webm');

        // Use diarization model for speaker identification
        formData.append('model', 'gpt-4o-transcribe-diarize');

        // Set response format for diarization data
        formData.append('response_format', 'diarized_json');

        // Set language - omit for automatic detection
        // When language is 'auto' or multiLanguageMode is enabled, omit the parameter
        // to enable OpenAI's automatic language detection
        if (language && language !== 'auto' && !this._multiLanguageMode) {
            formData.append('language', language);
        }

        // Add chunking strategy for longer audio
        formData.append('chunking_strategy', 'auto');

        // Add known speaker names if available
        if (speakerNames && speakerNames.length > 0) {
            formData.append('known_speaker_names', JSON.stringify(speakerNames));
        }

        return formData;
    }

    /**
     * Makes the API request to OpenAI
     * @param {FormData} formData - The form data to send
     * @returns {Promise<Object>} The API response data
     * @private
     */
    async _makeApiRequest(formData) {
        let response;

        try {
            response = await fetch(`${this._baseUrl}/audio/transcriptions`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this._apiKey}`
                },
                body: formData
            });
        } catch (networkError) {
            // Handle network errors (no connection, timeout, etc.)
            console.error(`${MODULE_ID} | Network error during transcription:`, networkError);
            throw this._createNetworkError(networkError);
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw {
                message: errorData.error?.message || 'Transcription failed',
                code: errorData.error?.code || 'unknown',
                status: response.status
            };
        }

        return await response.json();
    }

    /**
     * Creates a user-friendly error for network failures
     * @param {Error} networkError - The original network error
     * @returns {Object} Error object with status and message
     * @private
     */
    _createNetworkError(networkError) {
        const isTimeout =
            networkError.name === 'AbortError' || networkError.message?.includes('timeout');

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
     * Parses the API response into a normalized TranscriptionResult
     * @param {Object} response - The raw API response
     * @param {string} language - The requested language
     * @returns {TranscriptionResult} The normalized result
     * @private
     */
    _parseResponse(response, language) {
        // Determine the top-level language (fallback for segments without language field)
        const topLevelLanguage = response.language || language;

        // Extract segments from diarized response
        // Include per-segment language if available, otherwise use top-level language
        const segments = (response.segments || []).map((seg) => {
            const segment = {
                speaker: seg.speaker || 'Unknown',
                text: seg.text || '',
                start: seg.start || 0,
                end: seg.end || 0
            };

            // Add language field if present in segment or use top-level language
            if (seg.language) {
                segment.language = seg.language;
            } else if (topLevelLanguage) {
                segment.language = topLevelLanguage;
            }

            return segment;
        });

        // Build full text from segments
        const text = segments.map((seg) => seg.text).join(' ');

        // Extract unique speakers
        const speakers = [...new Set(segments.map((seg) => seg.speaker))];

        // Calculate total duration
        const duration =
            segments.length > 0
                ? Math.max(...segments.map((seg) => seg.end))
                : response.duration || 0;

        return {
            text,
            segments,
            language: topLevelLanguage,
            duration,
            speakers
        };
    }

    /**
     * Handles API errors and returns user-friendly error messages
     * @param {TranscriptionError} error - The API error
     * @returns {Error} A user-friendly error
     * @private
     */
    _handleApiError(error) {
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
     * Shows a user notification for transcription errors
     * @param {Error} error - The error to display
     */
    static notifyError(error) {
        if (typeof ui !== 'undefined' && ui.notifications) {
            ui.notifications.error(error.message);
        }
    }

    /**
     * Adds a transcription result to history
     * @param {TranscriptionResult} result - The result to add
     * @private
     */
    _addToHistory(result) {
        this._history.push({
            ...result,
            timestamp: new Date()
        });

        // Trim history if exceeds max size
        if (this._history.length > this._maxHistorySize) {
            this._history = this._history.slice(-this._maxHistorySize);
        }
    }

    /**
     * Gets the transcription history
     * @param {number} [limit] - Maximum number of entries to return
     * @returns {TranscriptionResult[]} Array of transcription results
     */
    getHistory(limit) {
        const history = [...this._history];
        if (limit && limit > 0) {
            return history.slice(-limit);
        }
        return history;
    }

    /**
     * Clears the transcription history
     */
    clearHistory() {
        this._history = [];
    }

    /**
     * Gets the combined text from recent transcriptions
     * Useful for providing context to AI assistant
     * @param {number} [count=5] - Number of recent transcriptions to include
     * @returns {string} Combined text with speaker and language labels
     */
    getRecentTranscriptionText(count = 5) {
        const recent = this.getHistory(count);
        return recent
            .map((result) => {
                return result.segments
                    .map((seg) => {
                        const languageLabel = seg.language ? ` (${seg.language})` : '';
                        return `${seg.speaker}${languageLabel}: ${seg.text}`;
                    })
                    .join('\n');
            })
            .join('\n\n');
    }

    /**
     * Estimates audio duration from blob size (rough estimate)
     * @param {Blob} audioBlob - The audio blob
     * @returns {number} Estimated duration in seconds
     */
    estimateDuration(audioBlob) {
        // Rough estimate: WebM/Opus at ~32kbps
        const bytesPerSecond = (32 * 1024) / 8;
        return audioBlob.size / bytesPerSecond;
    }

    /**
     * Checks if audio should use chunking strategy
     * @param {Blob} audioBlob - The audio blob
     * @returns {boolean} True if chunking is recommended
     */
    shouldUseChunking(audioBlob) {
        const estimatedDuration = this.estimateDuration(audioBlob);
        return estimatedDuration > CHUNKING_THRESHOLD_SECONDS;
    }

    /**
     * Applies custom speaker labels retroactively to transcription history
     * Updates all segments in history with new speaker labels based on mappings
     * @param {Object} labelMappings - Map of old speaker IDs to new labels (e.g., {"Speaker 1": "Marco (Gandalf)"})
     * @returns {number} Number of segments updated
     */
    applyCustomLabels(labelMappings) {
        if (!labelMappings || typeof labelMappings !== 'object') {
            console.warn(`${MODULE_ID} | Invalid label mappings provided to applyCustomLabels`);
            return 0;
        }

        let totalUpdated = 0;

        // Iterate through all history entries
        for (const result of this._history) {
            if (!result.segments || !Array.isArray(result.segments)) {
                continue;
            }

            // Update each segment's speaker label
            for (const segment of result.segments) {
                const oldSpeaker = segment.speaker;
                if (labelMappings.hasOwnProperty(oldSpeaker)) {
                    segment.speaker = labelMappings[oldSpeaker];
                    totalUpdated++;
                }
            }

            // Rebuild the speakers array with updated labels
            const uniqueSpeakers = [...new Set(result.segments.map((seg) => seg.speaker))];
            result.speakers = uniqueSpeakers;
        }

        console.log(`${MODULE_ID} | Applied custom labels to ${totalUpdated} segments`);

        return totalUpdated;
    }

    /**
     * Gets service statistics
     * @returns {Object} Statistics about the service usage
     */
    getStats() {
        return {
            configured: this.isConfigured(),
            language: this._language,
            multiLanguageMode: this._multiLanguageMode,
            diarizationEnabled: this._enableDiarization,
            knownSpeakers: this._knownSpeakerNames.length,
            historySize: this._history.length,
            totalTranscriptions: this._history.length,
            totalSegments: this._history.reduce((sum, r) => sum + r.segments.length, 0)
        };
    }
}
