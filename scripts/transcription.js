/**
 * Transcription Service Module for Narrator Master
 * Handles audio transcription via OpenAI Whisper API with speaker diarization
 * @module transcription
 */

import { MODULE_ID } from './settings.js';
import { OpenAIServiceBase } from './openai-service-base.js';
import { Logger } from './logger.js';

/**
 * Maximum file size for OpenAI Whisper API (25MB)
 * @constant {number}
 */
const MAX_FILE_SIZE = 25 * 1024 * 1024;

/**
 * Minimum file size for valid audio (~1s at 128kbps)
 * Files smaller than this are rejected by Whisper as corrupt
 * @constant {number}
 */
const MIN_FILE_SIZE = 10000;

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
 * @extends OpenAIServiceBase
 */
export class TranscriptionService extends OpenAIServiceBase {
    /**
     * Creates a new TranscriptionService instance
     * @param {string} apiKey - The OpenAI API key
     * @param {Object} [options={}] - Configuration options
     * @param {string} [options.language='it'] - Default transcription language (use 'auto' for auto-detection)
     * @param {boolean} [options.enableDiarization=true] - Enable speaker diarization
     * @param {boolean} [options.multiLanguageMode=false] - Enable multi-language mode with automatic language detection
     */
    constructor(apiKey, options = {}) {
        // Call parent constructor for common OpenAI service functionality
        super(apiKey, options);

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

        // Check file size limits
        if (audioBlob.size < MIN_FILE_SIZE) {
            Logger.debug(`Audio too small (${audioBlob.size}B), skipping`, 'TranscriptionService');
            return { text: '', segments: [], language: this._language, duration: 0, speakers: [] };
        }

        if (audioBlob.size > MAX_FILE_SIZE) {
            throw new Error(game.i18n.format('NARRATOR.Errors.FileTooLarge', {
                size: Math.round(audioBlob.size / (1024 * 1024)),
                max: 25
            }));
        }

        // Determine language and speaker names
        const language = options.language || this._language;
        const speakerNames = options.speakerNames || this._knownSpeakerNames;

        Logger.debug(`Starting transcription, language: ${language}, size: ${audioBlob.size}B`, 'TranscriptionService');

        try {
            // Build form data for API request
            const formData = this._buildFormData(audioBlob, language, speakerNames);

            // Make API request
            const response = await this._makeApiRequest(formData);

            // Parse and normalize response
            const result = this._parseResponse(response, language);

            // Add to history
            this._addToHistory(result);

            Logger.info(`Transcription complete, ${result.segments.length} segments`, 'TranscriptionService');

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
            throw new Error(game.i18n.format('NARRATOR.Errors.FileTooLarge', {
                size: Math.round(audioBlob.size / (1024 * 1024)),
                max: 25
            }));
        }

        const language = options.language || this._language;

        Logger.debug(`Starting simple transcription, language: ${language}`, 'TranscriptionService');

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
                    'Authorization': `Bearer ${this._apiKey}`
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
                segments: (data.segments || []).map(seg => ({
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
                    'Authorization': `Bearer ${this._apiKey}`
                },
                body: formData
            });
        } catch (networkError) {
            // Handle network errors (no connection, timeout, etc.)
            Logger.error('Network error during transcription', 'TranscriptionService', networkError);
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
        const segments = (response.segments || []).map(seg => {
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
        const text = segments.map(seg => seg.text).join(' ');

        // Extract unique speakers
        const speakers = [...new Set(segments.map(seg => seg.speaker))];

        // Calculate total duration
        const duration = segments.length > 0
            ? Math.max(...segments.map(seg => seg.end))
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
     * Gets the combined text from recent transcriptions
     * Useful for providing context to AI assistant
     * @param {number} [count=5] - Number of recent transcriptions to include
     * @returns {string} Combined text with speaker and language labels
     */
    getRecentTranscriptionText(count = 5) {
        const recent = this.getHistory(count);
        return recent.map(result => {
            return result.segments
                .map(seg => {
                    const languageLabel = seg.language ? ` (${seg.language})` : '';
                    return `${seg.speaker}${languageLabel}: ${seg.text}`;
                })
                .join('\n');
        }).join('\n\n');
    }

    /**
     * Estimates audio duration from blob size (rough estimate)
     * @param {Blob} audioBlob - The audio blob
     * @returns {number} Estimated duration in seconds
     */
    estimateDuration(audioBlob) {
        // Rough estimate: WebM/Opus at ~32kbps
        const bytesPerSecond = 32 * 1024 / 8;
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
            Logger.warn('Invalid label mappings provided to applyCustomLabels', 'TranscriptionService');
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
            const uniqueSpeakers = [...new Set(result.segments.map(seg => seg.speaker))];
            result.speakers = uniqueSpeakers;
        }

        Logger.info(`Applied custom labels to ${totalUpdated} segments`, 'TranscriptionService');

        return totalUpdated;
    }

    /**
     * Gets service statistics
     * @returns {Object} Statistics about the service usage
     */
    getStats() {
        return {
            ...super.getStats(),
            language: this._language,
            multiLanguageMode: this._multiLanguageMode,
            diarizationEnabled: this._enableDiarization,
            knownSpeakers: this._knownSpeakerNames.length,
            totalTranscriptions: this._history.length,
            totalSegments: this._history.reduce((sum, r) => sum + r.segments.length, 0)
        };
    }
}
