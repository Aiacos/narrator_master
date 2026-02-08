/**
 * Audio Capture Module for Narrator Master
 * Handles browser microphone recording using Web Audio API and MediaRecorder
 * @module audio-capture
 */

import { MODULE_ID } from './settings.js';

/**
 * Maximum file size for OpenAI Whisper API (25MB)
 * @constant {number}
 */
const MAX_FILE_SIZE = 25 * 1024 * 1024;

/**
 * Size threshold for chunk processing (20MB = 80% of max)
 * @constant {number}
 */
const SIZE_THRESHOLD = 20 * 1024 * 1024;

/**
 * Default audio constraints for microphone capture
 * @constant {Object}
 */
const DEFAULT_AUDIO_CONSTRAINTS = {
    audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000,
        channelCount: 1
    },
    video: false
};

/**
 * Preferred MIME types in order of preference
 * WebM/Opus is optimal for quality/size ratio
 * @constant {string[]}
 */
const PREFERRED_MIME_TYPES = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
    'audio/wav'
];

/**
 * Recording state enumeration
 * @readonly
 * @enum {string}
 */
export const RecordingState = {
    INACTIVE: 'inactive',
    RECORDING: 'recording',
    PAUSED: 'paused',
    STOPPING: 'stopping'
};

/**
 * Audio capture event types
 * @readonly
 * @enum {string}
 */
export const AudioCaptureEvent = {
    STATE_CHANGE: 'stateChange',
    DATA_AVAILABLE: 'dataAvailable',
    ERROR: 'error',
    PERMISSION_DENIED: 'permissionDenied',
    PERMISSION_GRANTED: 'permissionGranted',
    STREAM_STARTED: 'streamStarted',
    STREAM_STOPPED: 'streamStopped',
    SIZE_THRESHOLD: 'sizeThreshold'
};

/**
 * Represents an audio capture error
 * @typedef {Object} AudioCaptureError
 * @property {string} message - Error message
 * @property {string} code - Error code
 * @property {Error} [originalError] - The original error if available
 */

/**
 * AudioCapture - Handles browser microphone recording
 * Uses MediaRecorder API with WebM/Opus format
 */
export class AudioCapture {
    /**
     * Creates a new AudioCapture instance
     * @param {Object} [options={}] - Configuration options
     * @param {number} [options.timeslice=1000] - Recording timeslice in ms
     * @param {Object} [options.constraints] - Custom audio constraints
     * @param {number} [options.maxDuration=300000] - Max recording duration in ms (5 min default)
     */
    constructor(options = {}) {
        /**
         * Recording timeslice in milliseconds
         * @type {number}
         * @private
         */
        this._timeslice = options.timeslice || 1000;

        /**
         * Audio constraints for getUserMedia
         * @type {Object}
         * @private
         */
        this._constraints = options.constraints || DEFAULT_AUDIO_CONSTRAINTS;

        /**
         * Maximum recording duration in milliseconds
         * @type {number}
         * @private
         */
        this._maxDuration = options.maxDuration || 300000;

        /**
         * The MediaStream from microphone
         * @type {MediaStream|null}
         * @private
         */
        this._stream = null;

        /**
         * The MediaRecorder instance
         * @type {MediaRecorder|null}
         * @private
         */
        this._recorder = null;

        /**
         * Recorded audio chunks
         * @type {Blob[]}
         * @private
         */
        this._chunks = [];

        /**
         * Current recording state
         * @type {RecordingState}
         * @private
         */
        this._state = RecordingState.INACTIVE;

        /**
         * Recording start timestamp
         * @type {number|null}
         * @private
         */
        this._startTime = null;

        /**
         * Event listeners map
         * @type {Map<string, Set<Function>>}
         * @private
         */
        this._listeners = new Map();

        /**
         * Max duration timeout ID
         * @type {number|null}
         * @private
         */
        this._maxDurationTimeout = null;

        /**
         * Selected MIME type for recording
         * @type {string}
         * @private
         */
        this._mimeType = this._selectMimeType();

        /**
         * Audio context for analysis (optional)
         * @type {AudioContext|null}
         * @private
         */
        this._audioContext = null;

        /**
         * Analyser node for volume metering
         * @type {AnalyserNode|null}
         * @private
         */
        this._analyser = null;

        /**
         * Cumulative size of recorded audio chunks in bytes
         * @type {number}
         * @private
         */
        this._cumulativeSize = 0;
    }

    /**
     * Gets the current recording state
     * @returns {RecordingState} The current state
     */
    get state() {
        return this._state;
    }

    /**
     * Checks if currently recording
     * @returns {boolean} True if recording
     */
    get isRecording() {
        return this._state === RecordingState.RECORDING;
    }

    /**
     * Checks if microphone is available
     * @returns {boolean} True if microphone API is available
     */
    get isSupported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }

    /**
     * Gets the recording duration in milliseconds
     * @returns {number} Duration in ms or 0 if not recording
     */
    get duration() {
        if (!this._startTime) return 0;
        return Date.now() - this._startTime;
    }

    /**
     * Gets the MIME type being used for recording
     * @returns {string} The MIME type
     */
    get mimeType() {
        return this._mimeType;
    }

    /**
     * Gets the cumulative size of recorded audio in bytes
     * @returns {number} The cumulative size in bytes
     */
    get cumulativeSize() {
        return this._cumulativeSize;
    }

    /**
     * Selects the best supported MIME type for recording
     * @returns {string} The selected MIME type
     * @private
     */
    _selectMimeType() {
        if (typeof MediaRecorder === 'undefined') {
            return 'audio/webm';
        }

        for (const mimeType of PREFERRED_MIME_TYPES) {
            if (MediaRecorder.isTypeSupported(mimeType)) {
                return mimeType;
            }
        }

        return 'audio/webm';
    }

    /**
     * Requests microphone permission and starts the audio stream
     * @returns {Promise<MediaStream>} The media stream
     * @throws {Error} If permission denied or microphone unavailable
     */
    async requestPermission() {
        console.log(`${MODULE_ID} | Requesting microphone permission`);

        if (!this.isSupported) {
            const error = {
                message: game.i18n.localize('NARRATOR.Errors.MicrophoneNotSupported'),
                code: 'not_supported'
            };
            this._emit(AudioCaptureEvent.ERROR, error);
            throw new Error(error.message);
        }

        try {
            this._stream = await navigator.mediaDevices.getUserMedia(this._constraints);
            console.log(`${MODULE_ID} | Microphone permission granted`);
            this._emit(AudioCaptureEvent.PERMISSION_GRANTED);
            this._emit(AudioCaptureEvent.STREAM_STARTED, this._stream);
            return this._stream;
        } catch (error) {
            const captureError = this._handlePermissionError(error);
            this._emit(AudioCaptureEvent.PERMISSION_DENIED, captureError);
            throw new Error(captureError.message);
        }
    }

    /**
     * Handles permission errors and returns user-friendly messages
     * @param {Error} error - The original error
     * @returns {AudioCaptureError} The processed error
     * @private
     */
    _handlePermissionError(error) {
        let message;
        let code;

        switch (error.name) {
            case 'NotAllowedError':
            case 'PermissionDeniedError':
                message = game.i18n.localize('NARRATOR.Errors.MicrophonePermissionDenied');
                code = 'permission_denied';
                break;
            case 'NotFoundError':
            case 'DevicesNotFoundError':
                message = game.i18n.localize('NARRATOR.Errors.MicrophoneNotFound');
                code = 'not_found';
                break;
            case 'NotReadableError':
            case 'TrackStartError':
                message = game.i18n.localize('NARRATOR.Errors.MicrophoneInUse');
                code = 'in_use';
                break;
            case 'OverconstrainedError':
                message = game.i18n.localize('NARRATOR.Errors.MicrophoneConstraints');
                code = 'constraints';
                break;
            case 'SecurityError':
                message = game.i18n.localize('NARRATOR.Errors.MicrophoneSecurityError');
                code = 'security';
                break;
            default:
                message = game.i18n.format('NARRATOR.Errors.MicrophoneGeneric', {
                    error: error.message || error.name
                });
                code = 'unknown';
        }

        console.error(`${MODULE_ID} | Microphone error: ${code} - ${error.message}`);

        return {
            message,
            code,
            originalError: error
        };
    }

    /**
     * Starts recording audio from the microphone
     * @returns {Promise<void>}
     * @throws {Error} If recording cannot be started
     */
    async start() {
        if (this._state === RecordingState.RECORDING) {
            console.warn(`${MODULE_ID} | Already recording`);
            return;
        }

        // Request permission if no stream
        if (!this._stream) {
            await this.requestPermission();
        }

        // Clear previous chunks
        this._chunks = [];
        this._cumulativeSize = 0;

        // Create MediaRecorder
        try {
            const options = {
                mimeType: this._mimeType,
                audioBitsPerSecond: 128000
            };

            this._recorder = new MediaRecorder(this._stream, options);

            // Set up event handlers
            this._recorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    this._chunks.push(event.data);
                    this._cumulativeSize += event.data.size;
                    this._emit(AudioCaptureEvent.DATA_AVAILABLE, event.data);

                    // Check if approaching size threshold
                    if (this._cumulativeSize >= SIZE_THRESHOLD) {
                        this._emit(AudioCaptureEvent.SIZE_THRESHOLD, {
                            size: this._cumulativeSize,
                            threshold: SIZE_THRESHOLD
                        });
                    }
                }
            };

            this._recorder.onstart = () => {
                this._startTime = Date.now();
                this._state = RecordingState.RECORDING;
                this._emit(AudioCaptureEvent.STATE_CHANGE, this._state);
                console.log(`${MODULE_ID} | Recording started`);
            };

            this._recorder.onstop = () => {
                this._state = RecordingState.INACTIVE;
                this._emit(AudioCaptureEvent.STATE_CHANGE, this._state);
                console.log(`${MODULE_ID} | Recording stopped`);
            };

            this._recorder.onerror = (event) => {
                const error = {
                    message: game.i18n.localize('NARRATOR.Errors.RecordingFailed'),
                    code: 'recording_error',
                    originalError: event.error
                };
                this._emit(AudioCaptureEvent.ERROR, error);
                console.error(`${MODULE_ID} | Recording error:`, event.error);
            };

            this._recorder.onpause = () => {
                this._state = RecordingState.PAUSED;
                this._emit(AudioCaptureEvent.STATE_CHANGE, this._state);
            };

            this._recorder.onresume = () => {
                this._state = RecordingState.RECORDING;
                this._emit(AudioCaptureEvent.STATE_CHANGE, this._state);
            };

            // Start recording
            this._recorder.start(this._timeslice);

            // Set up max duration timeout
            if (this._maxDuration > 0) {
                this._maxDurationTimeout = setTimeout(() => {
                    console.log(`${MODULE_ID} | Max duration reached, stopping recording`);
                    this.stop();
                }, this._maxDuration);
            }
        } catch (error) {
            const captureError = {
                message: game.i18n.format('NARRATOR.Errors.RecorderInitFailed', {
                    error: error.message
                }),
                code: 'init_failed',
                originalError: error
            };
            this._emit(AudioCaptureEvent.ERROR, captureError);
            throw new Error(captureError.message);
        }
    }

    /**
     * Stops the current recording
     * @returns {Promise<Blob>} The recorded audio blob
     */
    async stop() {
        if (!this._recorder || this._state === RecordingState.INACTIVE) {
            console.warn(`${MODULE_ID} | Not currently recording`);
            return this.getAudioBlob();
        }

        // Clear max duration timeout
        if (this._maxDurationTimeout) {
            clearTimeout(this._maxDurationTimeout);
            this._maxDurationTimeout = null;
        }

        this._state = RecordingState.STOPPING;
        this._emit(AudioCaptureEvent.STATE_CHANGE, this._state);

        return new Promise((resolve) => {
            // Wait for final data
            this._recorder.onstop = () => {
                this._state = RecordingState.INACTIVE;
                this._emit(AudioCaptureEvent.STATE_CHANGE, this._state);
                console.log(`${MODULE_ID} | Recording stopped, chunks: ${this._chunks.length}`);
                resolve(this.getAudioBlob());
            };

            this._recorder.stop();
        });
    }

    /**
     * Pauses the current recording
     */
    pause() {
        if (this._recorder && this._state === RecordingState.RECORDING) {
            this._recorder.pause();
        }
    }

    /**
     * Resumes a paused recording
     */
    resume() {
        if (this._recorder && this._state === RecordingState.PAUSED) {
            this._recorder.resume();
        }
    }

    /**
     * Gets the recorded audio as a Blob
     * @returns {Blob|null} The audio blob or null if no data
     */
    getAudioBlob() {
        if (this._chunks.length === 0) {
            return null;
        }

        const blob = new Blob(this._chunks, { type: this._mimeType });

        // Check file size
        if (blob.size > MAX_FILE_SIZE) {
            console.warn(`${MODULE_ID} | Audio blob exceeds max size: ${blob.size} bytes`);
        }

        return blob;
    }

    /**
     * Clears the recorded audio chunks
     */
    clearRecording() {
        this._chunks = [];
        this._cumulativeSize = 0;
    }

    /**
     * Resets chunk boundary for long session handling
     * Returns accumulated chunks as a Blob and resets counters without stopping recording
     * @returns {Blob|null} The accumulated audio blob or null if no data
     */
    resetChunkBoundary() {
        if (this._chunks.length === 0) {
            return null;
        }

        // Create blob from accumulated chunks
        const blob = new Blob(this._chunks, { type: this._mimeType });

        // Log chunk boundary reset
        console.log(
            `${MODULE_ID} | Chunk boundary reset - size: ${blob.size} bytes, chunks: ${this._chunks.length}`
        );

        // Clear chunks and reset size counter
        this._chunks = [];
        this._cumulativeSize = 0;

        return blob;
    }

    /**
     * Stops the media stream and releases resources
     */
    releaseStream() {
        if (this._stream) {
            this._stream.getTracks().forEach((track) => {
                track.stop();
            });
            this._stream = null;
            this._emit(AudioCaptureEvent.STREAM_STOPPED);
            console.log(`${MODULE_ID} | Media stream released`);
        }

        if (this._audioContext) {
            this._audioContext.close();
            this._audioContext = null;
            this._analyser = null;
        }
    }

    /**
     * Fully cleans up resources
     */
    destroy() {
        if (this._state === RecordingState.RECORDING) {
            this._recorder.stop();
        }

        if (this._maxDurationTimeout) {
            clearTimeout(this._maxDurationTimeout);
            this._maxDurationTimeout = null;
        }

        this.releaseStream();
        this._recorder = null;
        this._chunks = [];
        this._listeners.clear();
        this._state = RecordingState.INACTIVE;

        console.log(`${MODULE_ID} | AudioCapture destroyed`);
    }

    /**
     * Initializes audio analysis for volume metering
     * @returns {AnalyserNode|null} The analyser node
     */
    initializeAnalyser() {
        if (!this._stream) {
            console.warn(`${MODULE_ID} | Cannot initialize analyser without stream`);
            return null;
        }

        try {
            this._audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = this._audioContext.createMediaStreamSource(this._stream);
            this._analyser = this._audioContext.createAnalyser();
            this._analyser.fftSize = 256;
            source.connect(this._analyser);

            return this._analyser;
        } catch (error) {
            console.error(`${MODULE_ID} | Failed to initialize analyser:`, error);
            return null;
        }
    }

    /**
     * Gets the current audio level (0-1)
     * @returns {number} The current audio level
     */
    getAudioLevel() {
        if (!this._analyser) {
            return 0;
        }

        const dataArray = new Uint8Array(this._analyser.frequencyBinCount);
        this._analyser.getByteFrequencyData(dataArray);

        // Calculate RMS
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / dataArray.length);

        // Normalize to 0-1
        return Math.min(1, rms / 128);
    }

    /**
     * Adds an event listener
     * @param {AudioCaptureEvent} event - The event type
     * @param {Function} callback - The callback function
     */
    on(event, callback) {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, new Set());
        }
        this._listeners.get(event).add(callback);
    }

    /**
     * Removes an event listener
     * @param {AudioCaptureEvent} event - The event type
     * @param {Function} callback - The callback function
     */
    off(event, callback) {
        if (this._listeners.has(event)) {
            this._listeners.get(event).delete(callback);
        }
    }

    /**
     * Emits an event to all listeners
     * @param {AudioCaptureEvent} event - The event type
     * @param {*} data - The event data
     * @private
     */
    _emit(event, data) {
        if (this._listeners.has(event)) {
            for (const callback of this._listeners.get(event)) {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`${MODULE_ID} | Event listener error:`, error);
                }
            }
        }
    }

    /**
     * Lists available audio input devices
     * @returns {Promise<MediaDeviceInfo[]>} Array of audio input devices
     */
    static async listAudioDevices() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            return [];
        }

        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.filter((device) => device.kind === 'audioinput');
        } catch (error) {
            console.error(`${MODULE_ID} | Failed to enumerate devices:`, error);
            return [];
        }
    }

    /**
     * Checks if the browser supports audio capture
     * @returns {boolean} True if supported
     */
    static isAudioCaptureSupported() {
        return !!(
            navigator.mediaDevices &&
            navigator.mediaDevices.getUserMedia &&
            typeof MediaRecorder !== 'undefined'
        );
    }

    /**
     * Checks if a specific MIME type is supported
     * @param {string} mimeType - The MIME type to check
     * @returns {boolean} True if supported
     */
    static isMimeTypeSupported(mimeType) {
        if (typeof MediaRecorder === 'undefined') {
            return false;
        }
        return MediaRecorder.isTypeSupported(mimeType);
    }

    /**
     * Gets recording statistics
     * @returns {Object} Recording stats
     */
    getStats() {
        return {
            state: this._state,
            isRecording: this.isRecording,
            duration: this.duration,
            chunksCount: this._chunks.length,
            totalSize: this._chunks.reduce((sum, chunk) => sum + chunk.size, 0),
            cumulativeSize: this._cumulativeSize,
            mimeType: this._mimeType,
            hasStream: !!this._stream,
            hasAnalyser: !!this._analyser
        };
    }
}
