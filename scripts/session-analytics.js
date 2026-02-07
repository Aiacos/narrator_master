/**
 * Session Analytics Module for Narrator Master
 * Tracks speaker engagement metrics, session timeline, and player participation
 * @module session-analytics
 */

import { MODULE_ID } from './settings.js';

/**
 * Default bucket size for timeline visualization (60 seconds)
 * @constant {number}
 */
const DEFAULT_BUCKET_SIZE = 60;

/**
 * Maximum number of sessions to keep in history
 * @constant {number}
 */
const MAX_HISTORY_SIZE = 100;

/**
 * Represents metrics for a single speaker
 * @typedef {Object} SpeakerMetrics
 * @property {string} speakerId - The speaker identifier
 * @property {number} speakingTime - Total speaking time in seconds
 * @property {number} segmentCount - Number of segments spoken
 * @property {number} avgSegmentDuration - Average segment duration in seconds
 * @property {number} percentage - Percentage of total session time
 * @property {number} firstSpeakTime - Timestamp of first speech
 * @property {number} lastSpeakTime - Timestamp of last speech
 */

/**
 * Represents a time bucket in the session timeline
 * @typedef {Object} TimelineBucket
 * @property {number} timestamp - Start timestamp of the bucket
 * @property {Object.<string, number>} speakers - Map of speakerId to speaking duration in this bucket
 * @property {number} totalActivity - Total speaking time across all speakers in this bucket
 */

/**
 * Represents session metadata
 * @typedef {Object} SessionMetadata
 * @property {string} sessionId - Unique session identifier
 * @property {number} startTime - Session start timestamp
 * @property {number} endTime - Session end timestamp (null if active)
 * @property {number} duration - Total session duration in seconds
 * @property {string} status - Session status ('active', 'completed', 'paused')
 */

/**
 * Represents complete session summary data
 * @typedef {Object} SessionSummary
 * @property {SessionMetadata} metadata - Session metadata
 * @property {Object.<string, SpeakerMetrics>} speakers - Map of speakerId to metrics
 * @property {number} totalSpeakingTime - Total speaking time across all speakers
 * @property {number} speakerCount - Number of unique speakers
 * @property {string} dominantSpeaker - Speaker ID with most speaking time
 * @property {string} quietestSpeaker - Speaker ID with least speaking time
 * @property {TimelineBucket[]} timeline - Session timeline data
 */

/**
 * Represents a transcription segment (from TranscriptionService)
 * @typedef {Object} TranscriptionSegment
 * @property {string} speaker - The identified speaker name or ID
 * @property {string} text - The transcribed text for this segment
 * @property {number} start - Start time in seconds
 * @property {number} end - End time in seconds
 */

/**
 * SessionAnalytics - Tracks and analyzes player engagement metrics during sessions
 * Processes transcription segments to calculate speaking time, participation, and session pacing
 */
export class SessionAnalytics {
    /**
     * Creates a new SessionAnalytics instance
     * @param {Object} [options={}] - Configuration options
     * @param {Object} [options.settingsManager] - SettingsManager instance for persistence
     * @param {number} [options.bucketSize=60] - Timeline bucket size in seconds
     * @param {number} [options.maxHistorySize=100] - Maximum sessions to keep in history
     */
    constructor(options = {}) {
        /**
         * Settings manager for data persistence
         * @type {Object|null}
         * @private
         */
        this._settingsManager = options.settingsManager || null;

        /**
         * Timeline bucket size in seconds
         * @type {number}
         * @private
         */
        this._bucketSize = options.bucketSize || DEFAULT_BUCKET_SIZE;

        /**
         * Maximum history size
         * @type {number}
         * @private
         */
        this._maxHistorySize = options.maxHistorySize || MAX_HISTORY_SIZE;

        /**
         * Current session metadata
         * @type {SessionMetadata|null}
         * @private
         */
        this._currentSession = null;

        /**
         * Current session speaker metrics
         * @type {Object.<string, SpeakerMetrics>}
         * @private
         */
        this._speakerMetrics = {};

        /**
         * Raw segment data for the current session
         * @type {TranscriptionSegment[]}
         * @private
         */
        this._segments = [];

        /**
         * Session history
         * @type {SessionSummary[]}
         * @private
         */
        this._sessionHistory = [];

        /**
         * Session start timestamp offset (for relative timing)
         * @type {number|null}
         * @private
         */
        this._sessionStartOffset = null;
    }

    /**
     * Starts a new analytics session
     * @param {string} [sessionId] - Optional session ID (auto-generated if not provided)
     * @returns {string} The session ID
     */
    startSession(sessionId = null) {
        // End any active session first
        if (this._currentSession && this._currentSession.status === 'active') {
            this.endSession();
        }

        // Generate session ID if not provided
        const id = sessionId || `session-${Date.now()}`;
        const now = Date.now();

        this._currentSession = {
            sessionId: id,
            startTime: now,
            endTime: null,
            duration: 0,
            status: 'active'
        };

        this._sessionStartOffset = now;
        this._speakerMetrics = {};
        this._segments = [];

        return id;
    }

    /**
     * Ends the current session and saves it to history
     * @returns {SessionSummary|null} The completed session summary, or null if no active session
     */
    endSession() {
        if (!this._currentSession || this._currentSession.status !== 'active') {
            return null;
        }

        const now = Date.now();
        this._currentSession.endTime = now;
        this._currentSession.duration = (now - this._currentSession.startTime) / 1000; // Convert to seconds
        this._currentSession.status = 'completed';

        // Calculate final metrics
        this.calculateMetrics();

        // Create session summary
        const summary = this.getSessionSummary();

        // Add to history
        this._sessionHistory.unshift(summary);

        // Trim history if needed
        if (this._sessionHistory.length > this._maxHistorySize) {
            this._sessionHistory = this._sessionHistory.slice(0, this._maxHistorySize);
        }

        // Reset current session
        this._currentSession = null;
        this._sessionStartOffset = null;

        return summary;
    }

    /**
     * Pauses the current session
     */
    pauseSession() {
        if (this._currentSession && this._currentSession.status === 'active') {
            this._currentSession.status = 'paused';
        }
    }

    /**
     * Resumes a paused session
     */
    resumeSession() {
        if (this._currentSession && this._currentSession.status === 'paused') {
            this._currentSession.status = 'active';
        }
    }

    /**
     * Adds a transcription segment to the current session
     * @param {TranscriptionSegment} segment - The segment to add
     */
    addSegment(segment) {
        if (!this._currentSession) {
            console.warn('SessionAnalytics: Cannot add segment without active session');
            return;
        }

        if (!segment || !segment.speaker || typeof segment.start !== 'number' || typeof segment.end !== 'number') {
            console.warn('SessionAnalytics: Invalid segment data', segment);
            return;
        }

        this._segments.push(segment);

        // Initialize speaker metrics if needed
        if (!this._speakerMetrics[segment.speaker]) {
            this._speakerMetrics[segment.speaker] = {
                speakerId: segment.speaker,
                speakingTime: 0,
                segmentCount: 0,
                avgSegmentDuration: 0,
                percentage: 0,
                firstSpeakTime: segment.start,
                lastSpeakTime: segment.end
            };
        }

        // Update speaker metrics
        const metrics = this._speakerMetrics[segment.speaker];
        const duration = segment.end - segment.start;

        metrics.speakingTime += duration;
        metrics.segmentCount += 1;
        metrics.lastSpeakTime = Math.max(metrics.lastSpeakTime, segment.end);
        metrics.firstSpeakTime = Math.min(metrics.firstSpeakTime, segment.start);
    }

    /**
     * Calculates and updates metrics for all speakers
     */
    calculateMetrics() {
        if (!this._currentSession) {
            return;
        }

        const totalSpeakingTime = Object.values(this._speakerMetrics).reduce(
            (sum, metrics) => sum + metrics.speakingTime,
            0
        );

        // Update percentages and averages
        for (const speakerId in this._speakerMetrics) {
            const metrics = this._speakerMetrics[speakerId];
            metrics.avgSegmentDuration = metrics.segmentCount > 0
                ? metrics.speakingTime / metrics.segmentCount
                : 0;
            metrics.percentage = totalSpeakingTime > 0
                ? (metrics.speakingTime / totalSpeakingTime) * 100
                : 0;
        }
    }

    /**
     * Gets speaker statistics sorted by speaking time
     * @returns {SpeakerMetrics[]} Array of speaker metrics sorted by speaking time (descending)
     */
    getSpeakerStats() {
        return Object.values(this._speakerMetrics).sort((a, b) => b.speakingTime - a.speakingTime);
    }

    /**
     * Gets the current session metrics
     * @returns {Object.<string, SpeakerMetrics>} Map of speakerId to metrics
     */
    getCurrentMetrics() {
        return { ...this._speakerMetrics };
    }

    /**
     * Generates timeline data with activity distribution
     * @param {number} [bucketSize] - Bucket size in seconds (defaults to instance bucketSize)
     * @returns {TimelineBucket[]} Array of timeline buckets
     */
    getTimeline(bucketSize = null) {
        const size = bucketSize || this._bucketSize;
        const buckets = new Map();

        // Process each segment
        for (const segment of this._segments) {
            const startBucket = Math.floor(segment.start / size) * size;
            const endBucket = Math.floor(segment.end / size) * size;

            // Handle segments that span multiple buckets
            for (let bucketStart = startBucket; bucketStart <= endBucket; bucketStart += size) {
                if (!buckets.has(bucketStart)) {
                    buckets.set(bucketStart, {
                        timestamp: bucketStart,
                        speakers: {},
                        totalActivity: 0
                    });
                }

                const bucket = buckets.get(bucketStart);
                const bucketEnd = bucketStart + size;

                // Calculate overlap between segment and bucket
                const overlapStart = Math.max(segment.start, bucketStart);
                const overlapEnd = Math.min(segment.end, bucketEnd);
                const overlapDuration = Math.max(0, overlapEnd - overlapStart);

                if (!bucket.speakers[segment.speaker]) {
                    bucket.speakers[segment.speaker] = 0;
                }

                bucket.speakers[segment.speaker] += overlapDuration;
                bucket.totalActivity += overlapDuration;
            }
        }

        // Convert map to sorted array
        return Array.from(buckets.values()).sort((a, b) => a.timestamp - b.timestamp);
    }

    /**
     * Gets a complete summary of the current session
     * @returns {SessionSummary} The session summary
     */
    getSessionSummary() {
        if (!this._currentSession) {
            return null;
        }

        this.calculateMetrics();

        const speakerStats = this.getSpeakerStats();
        const totalSpeakingTime = speakerStats.reduce((sum, s) => sum + s.speakingTime, 0);

        return {
            metadata: { ...this._currentSession },
            speakers: { ...this._speakerMetrics },
            totalSpeakingTime: totalSpeakingTime,
            speakerCount: speakerStats.length,
            dominantSpeaker: speakerStats.length > 0 ? speakerStats[0].speakerId : null,
            quietestSpeaker: speakerStats.length > 0 ? speakerStats[speakerStats.length - 1].speakerId : null,
            timeline: this.getTimeline()
        };
    }

    /**
     * Gets the session history
     * @param {number} [limit] - Maximum number of sessions to return
     * @returns {SessionSummary[]} Array of session summaries
     */
    getSessionHistory(limit = null) {
        if (limit && limit > 0) {
            return this._sessionHistory.slice(0, limit);
        }
        return [...this._sessionHistory];
    }

    /**
     * Clears the current session data without saving
     */
    clearCurrentSession() {
        this._currentSession = null;
        this._sessionStartOffset = null;
        this._speakerMetrics = {};
        this._segments = [];
    }

    /**
     * Clears all session history
     */
    clearHistory() {
        this._sessionHistory = [];
    }

    /**
     * Checks if a session is currently active
     * @returns {boolean} True if a session is active
     */
    isSessionActive() {
        return this._currentSession !== null && this._currentSession.status === 'active';
    }

    /**
     * Gets the current session ID
     * @returns {string|null} The session ID or null if no active session
     */
    getCurrentSessionId() {
        return this._currentSession ? this._currentSession.sessionId : null;
    }

    /**
     * Saves the current session and history to persistent storage
     * @returns {Promise<void>}
     */
    async saveSession() {
        if (!this._settingsManager) {
            console.warn('SessionAnalytics: Cannot save session - no settings manager configured');
            return;
        }

        try {
            const sessionData = {
                sessions: this._sessionHistory,
                currentSession: this._currentSession ? {
                    metadata: this._currentSession,
                    speakerMetrics: this._speakerMetrics,
                    segments: this._segments,
                    sessionStartOffset: this._sessionStartOffset
                } : null
            };

            await this._settingsManager.setSessionData(sessionData);
        } catch (error) {
            console.error('SessionAnalytics: Failed to save session data', error);
            throw error;
        }
    }

    /**
     * Loads session history and current session from persistent storage
     * @returns {Promise<void>}
     */
    async loadSessions() {
        if (!this._settingsManager) {
            console.warn('SessionAnalytics: Cannot load sessions - no settings manager configured');
            return;
        }

        try {
            const sessionData = this._settingsManager.getSessionData();

            if (!sessionData) {
                return;
            }

            // Restore session history
            if (Array.isArray(sessionData.sessions)) {
                this._sessionHistory = sessionData.sessions;
            }

            // Restore current session if it exists
            if (sessionData.currentSession) {
                const current = sessionData.currentSession;
                this._currentSession = current.metadata;
                this._speakerMetrics = current.speakerMetrics || {};
                this._segments = current.segments || [];
                this._sessionStartOffset = current.sessionStartOffset || null;
            }
        } catch (error) {
            console.error('SessionAnalytics: Failed to load session data', error);
            throw error;
        }
    }
}
