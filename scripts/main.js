/**
 * Narrator Master - Main Entry Point
 * Foundry VTT module for DM assistance with AI-powered transcription and suggestions
 * @module main
 */

import { MODULE_ID, registerSettings, SettingsManager } from './settings.js';
import { AudioCapture, AudioCaptureEvent, RecordingState } from './audio-capture.js';
import { TranscriptionService } from './transcription.js';
import { AIAssistant } from './ai-assistant.js';
import { ImageGenerator } from './image-generator.js';
import { JournalParser } from './journal-parser.js';
import { CompendiumParser } from './compendium-parser.js';
import { ChapterTracker } from './chapter-tracker.js';
import { NarratorPanel, RECORDING_STATE } from './ui-panel.js';
import { SpeakerLabelService } from './speaker-labels.js';
import { Logger } from './logger.js';

/**
 * NOTE: Transcription cycle interval is now configured via settings
 * See SETTINGS.TRANSCRIPTION_BATCH_DURATION in settings.js
 * Default: 10000ms, Range: 5000-30000ms
 */

/**
 * Minimum audio blob size in bytes required for transcription (~1.5s at 128kbps)
 * Blobs smaller than this are too short for Whisper and will be rejected
 * @constant {number}
 */
const MIN_AUDIO_SIZE = 15000;

/**
 * Silence detection threshold (0.0 to 1.0)
 * Audio segments with average level below this threshold are considered silent
 * and will not be sent for transcription to reduce API calls
 * @constant {number}
 */
const SILENCE_THRESHOLD = 0.01;

/**
 * Maximum consecutive transcription errors before circuit breaker activates
 * @constant {number}
 */
const MAX_CONSECUTIVE_ERRORS = 5;

/**
 * Cooldown period between duplicate error notifications in milliseconds
 * @constant {number}
 */
const ERROR_NOTIFICATION_COOLDOWN_MS = 30000;

/**
 * Default silence timeout in milliseconds before triggering chapter recovery UI
 * When no transcription is received for this duration, the system will offer
 * chapter navigation options to help the GM resume the narrative
 * @constant {number}
 */
const DEFAULT_SILENCE_TIMEOUT_MS = 30000;

/**
 * Error notification types for different severity levels
 * @constant {Object}
 */
const NOTIFICATION_TYPE = {
    ERROR: 'error',
    WARNING: 'warn',
    INFO: 'info'
};

/**
 * Centralized error notification helper
 * Handles different error types and shows appropriate user notifications
 */
class ErrorNotificationHelper {
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

/**
 * NarratorMaster - Main controller class that orchestrates all module components
 * Coordinates audio capture, transcription, AI analysis, and UI updates
 */
class NarratorMaster {
    /**
     * Creates a new NarratorMaster instance
     */
    constructor() {
        /**
         * Settings manager instance
         * @type {SettingsManager}
         */
        this.settings = new SettingsManager();

        /**
         * Module initialization state
         * @type {boolean}
         */
        this._initialized = false;

        /**
         * Reference to the UI panel
         * @type {NarratorPanel|null}
         */
        this.panel = null;

        /**
         * Audio capture service
         * @type {AudioCapture|null}
         */
        this.audioCapture = null;

        /**
         * Transcription service
         * @type {TranscriptionService|null}
         */
        this.transcriptionService = null;

        /**
         * AI assistant service
         * @type {AIAssistant|null}
         */
        this.aiAssistant = null;

        /**
         * Image generator service
         * @type {ImageGenerator|null}
         */
        this.imageGenerator = null;

        /**
         * Journal parser service
         * @type {JournalParser|null}
         */
        this.journalParser = null;

        /**
         * Compendium parser service
         * @type {CompendiumParser|null}
         */
        this.compendiumParser = null;

        /**
         * Speaker label service
         * @type {SpeakerLabelService|null}
         */
        this.speakerLabelService = null;

        /**
         * Chapter tracker service
         * @type {ChapterTracker|null}
         */
        this.chapterTracker = null;

        /**
         * Audio level update interval ID
         * @type {number|null}
         * @private
         */
        this._audioLevelInterval = null;

        /**
         * Periodic transcription cycle interval ID
         * @type {number|null}
         * @private
         */
        this._transcriptionCycleInterval = null;

        /**
         * Whether a transcription cycle is currently being processed
         * @type {boolean}
         * @private
         */
        this._isProcessingCycle = false;

        /**
         * Whether a cyclic stop/restart is in progress (suppresses UI state changes)
         * @type {boolean}
         * @private
         */
        this._isCyclicRestart = false;

        /**
         * Count of consecutive transcription errors for circuit breaker
         * @type {number}
         * @private
         */
        this._consecutiveTranscriptionErrors = 0;

        /**
         * Timestamp of last error notification shown
         * @type {number}
         * @private
         */
        this._lastErrorNotificationTime = 0;

        /**
         * Last error message shown (for deduplication)
         * @type {string}
         * @private
         */
        this._lastErrorMessage = '';

        /**
         * Timestamp of the last successful transcription
         * Used for silence detection to determine when to show chapter recovery UI
         * @type {number}
         * @private
         */
        this._lastTranscriptionTime = 0;

        /**
         * Timeout ID for the silence detection timer
         * @type {number|null}
         * @private
         */
        this._silenceTimeoutId = null;

        /**
         * Whether silence recovery mode is currently active
         * When true, the panel shows chapter navigation options
         * @type {boolean}
         * @private
         */
        this._isSilenceRecoveryActive = false;

        /**
         * Audio levels collected during current transcription cycle
         * Used for silence detection to skip transcribing silent segments
         * @type {number[]}
         * @private
         */
        this._cycleAudioLevels = [];
    }

    /**
     * Initializes the module and all its components
     * Called from the 'ready' hook only for GM users
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this._initialized) {
            Logger.warn('Module already initialized', 'NarratorMaster');
            return;
        }

        Logger.info('Initializing NarratorMaster controller', 'NarratorMaster');

        // Initialize Logger debug mode from settings
        const debugMode = this.settings.getDebugMode();
        Logger.setDebugMode(debugMode);

        try {
            // Get API key from settings
            const apiKey = this.settings.getApiKey();

            // Initialize services
            this._initializeServices(apiKey);

            // Initialize speaker label service
            await this.speakerLabelService.initialize();

            // Initialize UI panel
            this._initializePanel();

            // Auto-load all journals
            await this._loadAllJournals();

            // Register journal update hooks
            this._registerJournalHooks();

            // Register scene tracking hooks for chapter detection
            this._registerSceneHooks();

            // Update chapter tracker from current active scene (if any)
            if (game.scenes?.active) {
                const chapter = this.chapterTracker.updateFromScene(game.scenes.active);
                // Also update AI context if a chapter was detected
                if (chapter) {
                    this._updateAIChapterContext(chapter);
                }
            }

            // Validate configuration
            const validation = this.settings.validateConfiguration();
            if (!validation.valid) {
                Logger.warn('Configuration incomplete', 'NarratorMaster', validation.errors);
                this._showConfigurationWarning(validation.errors);
            }

            // Mark as initialized
            this._initialized = true;
            Logger.info('NarratorMaster initialized successfully', 'NarratorMaster');

        } catch (error) {
            Logger.error(error, 'NarratorMaster.initialize');
            this._showErrorNotification(error.message);
        }
    }

    /**
     * Initializes all service instances
     * @param {string} apiKey - The OpenAI API key
     * @private
     */
    _initializeServices(apiKey) {
        Logger.info('Initializing services', 'NarratorMaster');

        // Initialize Journal Parser (no API key needed)
        this.journalParser = new JournalParser();

        // Initialize Compendium Parser (no API key needed)
        this.compendiumParser = new CompendiumParser();

        // Initialize Speaker Label Service (no API key needed)
        this.speakerLabelService = new SpeakerLabelService();

        // Initialize Chapter Tracker (no API key needed)
        this.chapterTracker = new ChapterTracker({
            journalParser: this.journalParser
        });

        // Initialize Audio Capture
        this.audioCapture = new AudioCapture({
            timeslice: 5000, // 5 second chunks for better processing
            maxDuration: 300000 // 5 minutes max
        });

        // Set up audio capture event handlers
        this._setupAudioCaptureHandlers();

        // Initialize API-dependent services
        this.transcriptionService = new TranscriptionService(apiKey, {
            language: this.settings.getTranscriptionLanguage(),
            enableDiarization: true,
            multiLanguageMode: this.settings.getMultiLanguageMode()
        });

        this.aiAssistant = new AIAssistant(apiKey, {
            model: 'gpt-4o-mini',
            sensitivity: this.settings.getOffTrackSensitivity()
        });

        this.imageGenerator = new ImageGenerator(apiKey, {
            model: 'gpt-image-1',
            defaultSize: '1024x1024',
            autoCacheImages: true
        });

        Logger.info('Services initialized', 'NarratorMaster');
    }

    /**
     * Sets up event handlers for audio capture
     * @private
     */
    _setupAudioCaptureHandlers() {
        // Handle state changes
        this.audioCapture.on(AudioCaptureEvent.STATE_CHANGE, (state) => {
            this._onAudioStateChange(state);
        });

        // Audio data available - no action needed, periodic cycles handle processing
        // DATA_AVAILABLE events still fire during normal recording

        // Handle errors
        this.audioCapture.on(AudioCaptureEvent.ERROR, (error) => {
            this._onAudioCaptureError(error);
        });

        // Handle permission events
        this.audioCapture.on(AudioCaptureEvent.PERMISSION_DENIED, (error) => {
            ui.notifications.error(error.message);
        });

        this.audioCapture.on(AudioCaptureEvent.PERMISSION_GRANTED, () => {
            ui.notifications.info(game.i18n.localize('NARRATOR.Notifications.MicrophoneReady'));
        });
    }

    /**
     * Initializes the UI panel
     * @private
     */
    _initializePanel() {
        Logger.info('Initializing UI panel', 'NarratorMaster');

        this.panel = new NarratorPanel();

        // Set up panel callbacks
        this.panel.onRecordingControl = this._handleRecordingControl.bind(this);
        this.panel.onGenerateImage = this._handleGenerateImage.bind(this);
        this.panel.onSubchapterClick = this._handleSubchapterNavigation.bind(this);

        // Connect speaker label service to panel
        if (this.speakerLabelService) {
            this.panel.setSpeakerLabelService(this.speakerLabelService);
        }

        Logger.info('UI panel initialized', 'NarratorMaster');
    }

    /**
     * Loads all available journals and compendiums, then sets AI context
     * @private
     */
    async _loadAllJournals() {
        try {
            // Parse journals
            const parsedJournals = await this.journalParser.parseAllJournals();
            const journalContext = this.journalParser.getAllContentForAI();

            // Parse compendiums (adventure content and rules)
            let compendiumContext = '';
            let compendiumStats = { journalCompendiums: 0, rulesCompendiums: 0, totalEntries: 0 };

            if (this.compendiumParser) {
                await this.compendiumParser.parseJournalCompendiums();
                await this.compendiumParser.parseRulesCompendiums();

                // Get compendium content for AI context
                compendiumContext = this.compendiumParser.getContentForAI();
                compendiumStats = this.compendiumParser.getCacheStats();
            }

            // Combine journal and compendium context for AI
            const combinedContext = journalContext +
                (compendiumContext ? '\n\n' + compendiumContext : '');

            // Set combined context in AI assistant
            this.aiAssistant.setAdventureContext(combinedContext);

            // Update panel with journal count
            if (this.panel) {
                this.panel.updateContent({
                    journalCount: parsedJournals.length
                });
            }

            // Auto-select the largest journal as the adventure journal for ChapterTracker
            if (this.chapterTracker && parsedJournals.length > 0) {
                const largestJournal = parsedJournals.reduce((largest, current) =>
                    current.totalCharacters > largest.totalCharacters ? current : largest
                );
                this.chapterTracker.setSelectedJournal(largestJournal.id);
                Logger.info(
                    `Auto-selected adventure journal: "${largestJournal.name}" (${largestJournal.totalCharacters} chars)`,
                    'JournalLoader'
                );
            }

            Logger.info(
                `Loaded ${parsedJournals.length} journals, ${compendiumStats.totalEntries} compendium entries, ${combinedContext.length} chars total context`,
                'JournalLoader'
            );

        } catch (error) {
            Logger.warn('Failed to load journals and compendiums', 'JournalLoader', error);
        }
    }

    /**
     * Registers hooks for automatic journal reload on changes
     * @private
     */
    _registerJournalHooks() {
        const reloadJournals = () => this._loadAllJournals();

        Hooks.on('updateJournalEntry', reloadJournals);
        Hooks.on('createJournalEntry', reloadJournals);
        Hooks.on('deleteJournalEntry', reloadJournals);
    }

    /**
     * Registers hooks for scene tracking and chapter detection
     * Updates ChapterTracker when the active scene changes
     * @private
     */
    _registerSceneHooks() {
        // Hook into canvas ready event to detect scene changes
        Hooks.on('canvasReady', (canvas) => {
            this._onSceneChange(canvas.scene);
        });

        Logger.debug('Scene tracking hooks registered', 'NarratorMaster');
    }

    /**
     * Handles scene change events
     * Updates chapter tracker based on the new active scene
     * @param {Object} scene - The newly active Foundry VTT scene
     * @private
     */
    _onSceneChange(scene) {
        if (!scene) {
            Logger.debug('Scene change event with no scene', 'SceneTracking');
            return;
        }

        Logger.debug(`Scene changed to: ${scene.name} (${scene.id})`, 'SceneTracking');

        // Update chapter tracker from scene
        if (this.chapterTracker) {
            const chapter = this.chapterTracker.updateFromScene(scene);

            if (chapter) {
                Logger.info(`Chapter detected from scene: ${chapter.title}`, 'SceneTracking');

                // Update AI assistant with chapter context
                this._updateAIChapterContext(chapter);

                // Update panel with chapter info if panel is open
                if (this.panel?.rendered) {
                    this.panel.render(false);
                }
            }
        }
    }

    /**
     * Updates the AI Assistant's chapter context based on current chapter info
     * Transforms ChapterInfo from ChapterTracker to the format expected by AIAssistant
     * @param {Object} chapter - The ChapterInfo object from ChapterTracker
     * @private
     */
    _updateAIChapterContext(chapter) {
        if (!this.aiAssistant) {
            Logger.debug('AI Assistant not initialized, skipping chapter context update', 'ChapterContext');
            return;
        }

        if (!chapter) {
            // Clear chapter context if no chapter
            this.aiAssistant.setChapterContext(null);
            Logger.debug('Chapter context cleared', 'ChapterContext');
            return;
        }

        // Get subchapters from ChapterTracker for navigation context
        const subchapters = this.chapterTracker?.getSubchapters() || [];
        const subsectionNames = subchapters.map(sub => sub.title);

        // Build page references from the chapter info
        const pageReferences = [];
        if (chapter.pageId && chapter.pageName) {
            pageReferences.push({
                pageId: chapter.pageId,
                pageName: chapter.pageName,
                journalName: chapter.journalName || ''
            });
        }

        // Get chapter content for summary (truncate if too long)
        let summary = '';
        if (chapter.content) {
            summary = chapter.content.length > 500
                ? chapter.content.substring(0, 500) + '...'
                : chapter.content;
        }

        // Build the chapter context object
        const chapterContext = {
            chapterName: chapter.title || chapter.path || '',
            subsections: subsectionNames,
            pageReferences: pageReferences,
            summary: summary
        };

        // Update AI assistant
        this.aiAssistant.setChapterContext(chapterContext);

        // Update panel UI with chapter info and subchapters for navigation
        if (this.panel) {
            const subchapters = this.chapterTracker?.getSubchapters() || [];
            this.panel.setChapterInfo({
                id: chapter.id,
                title: chapter.title,
                path: chapter.path,
                content: chapter.content,
                pageId: chapter.pageId,
                pageName: chapter.pageName,
                journalName: chapter.journalName,
                subchapters: subchapters
            });
        }

        Logger.info(`AI chapter context updated: ${chapterContext.chapterName}`, 'ChapterContext');
    }

    /**
     * Manually sets the current chapter by ID
     * Updates both the ChapterTracker and AI Assistant context
     * @param {string} chapterId - The chapter ID to set
     * @returns {boolean} True if the chapter was found and set
     */
    setCurrentChapter(chapterId) {
        if (!this.chapterTracker) {
            Logger.warn('ChapterTracker not initialized', 'NarratorMaster.setCurrentChapter');
            return false;
        }

        // Set the chapter in ChapterTracker
        const success = this.chapterTracker.setManualChapter(chapterId);

        if (success) {
            // Get the updated chapter and update AI context
            const chapter = this.chapterTracker.getCurrentChapter();
            if (chapter) {
                this._updateAIChapterContext(chapter);

                // Update panel display
                if (this.panel?.rendered) {
                    this.panel.render(false);
                }

                Logger.info(`Chapter manually set to: ${chapter.title}`, 'NarratorMaster.setCurrentChapter');
            }
        }

        return success;
    }

    /**
     * Gets the current chapter information
     * @returns {Object|null} The current chapter info or null
     */
    getCurrentChapter() {
        return this.chapterTracker?.getCurrentChapter() || null;
    }

    /**
     * Gets all available chapters for navigation
     * @returns {Array} Array of chapter objects with id, title, level, path
     */
    getAllChapters() {
        return this.chapterTracker?.getAllChapters() || [];
    }

    /**
     * Handles audio capture state changes
     * @param {RecordingState} state - The new state
     * @private
     */
    _onAudioStateChange(state) {
        // Suppress UI state changes during cyclic stop/restart
        if (this._isCyclicRestart) return;

        Logger.debug(`Audio state changed: ${state}`, 'AudioCapture');

        if (!this.panel) return;

        switch (state) {
            case RecordingState.RECORDING:
                this.panel.setRecordingState(RECORDING_STATE.RECORDING);
                this._startAudioLevelUpdates();
                this._startTranscriptionCycles();
                this._consecutiveTranscriptionErrors = 0;
                // Start silence detection timer
                this._resetSilenceTimer();
                break;

            case RecordingState.PAUSED:
                this.panel.setRecordingState(RECORDING_STATE.PAUSED);
                this._stopAudioLevelUpdates();
                this._stopTranscriptionCycles();
                // Pause silence detection (don't trigger during pause)
                this._clearSilenceTimer();
                break;

            case RecordingState.STOPPING:
                this.panel.setRecordingState(RECORDING_STATE.PROCESSING);
                this._stopAudioLevelUpdates();
                // Clear silence detection during stop
                this._clearSilenceTimer();
                break;

            case RecordingState.INACTIVE:
                this.panel.setRecordingState(RECORDING_STATE.INACTIVE);
                this._stopAudioLevelUpdates();
                this._stopTranscriptionCycles();
                // Clear silence detection and recovery state
                this._clearSilenceTimer();
                this._isSilenceRecoveryActive = false;
                break;
        }
    }

    /**
     * Starts periodic transcription cycles
     * Each cycle stops/restarts the recorder to produce valid WebM blobs with headers
     * @private
     */
    _startTranscriptionCycles() {
        this._stopTranscriptionCycles();
        const batchDuration = this.settings.getTranscriptionBatchDuration();
        this._transcriptionCycleInterval = setInterval(() => {
            this._runTranscriptionCycle();
        }, batchDuration);
        Logger.debug(`Transcription cycles started (${batchDuration}ms interval)`, 'TranscriptionCycle');
    }

    /**
     * Stops periodic transcription cycles
     * @private
     */
    _stopTranscriptionCycles() {
        if (this._transcriptionCycleInterval) {
            clearInterval(this._transcriptionCycleInterval);
            this._transcriptionCycleInterval = null;
        }
    }

    /**
     * Runs a single transcription cycle:
     * 1. Stops recorder to finalize current WebM container (complete with headers)
     * 2. Immediately restarts recorder for next segment
     * 3. Processes the completed audio blob
     * @private
     */
    async _runTranscriptionCycle() {
        // Skip if not recording or already processing
        if (!this.audioCapture?.isRecording || this._isProcessingCycle) return;

        // Circuit breaker: stop trying after too many consecutive errors
        if (this._consecutiveTranscriptionErrors >= MAX_CONSECUTIVE_ERRORS) {
            Logger.warn(
                `Circuit breaker active (${this._consecutiveTranscriptionErrors} errors), skipping transcription`,
                'TranscriptionCycle'
            );
            return;
        }

        this._isProcessingCycle = true;

        try {
            // Calculate average audio level from samples collected during this cycle
            let avgAudioLevel = 0;
            if (this._cycleAudioLevels.length > 0) {
                const sum = this._cycleAudioLevels.reduce((acc, level) => acc + level, 0);
                avgAudioLevel = sum / this._cycleAudioLevels.length;
            }

            // Clear audio levels for next cycle
            this._cycleAudioLevels = [];

            // Suppress UI state changes during the brief stop/restart
            this._isCyclicRestart = true;

            // Stop recorder to finalize the WebM container (produces valid blob with headers)
            const audioBlob = await this.audioCapture.stop();

            // Immediately restart recording (gap is ~10-50ms, imperceptible)
            await this.audioCapture.start();

            this._isCyclicRestart = false;

            // Process the blob if large enough
            if (!audioBlob || audioBlob.size < MIN_AUDIO_SIZE) {
                Logger.debug(`Audio too small (${audioBlob?.size || 0}B), skipping`, 'TranscriptionCycle');
                return;
            }

            // Skip silent audio segments to reduce API calls
            if (avgAudioLevel < SILENCE_THRESHOLD) {
                Logger.debug(
                    `Audio too quiet (avg level: ${(avgAudioLevel * 100).toFixed(2)}%), skipping transcription`,
                    'TranscriptionCycle'
                );
                return;
            }

            // Transcribe audio
            const transcription = await this.transcriptionService.transcribe(audioBlob);

            // Reset error counter on success
            this._consecutiveTranscriptionErrors = 0;

            // Skip empty transcriptions
            if (!transcription.text?.trim()) {
                Logger.debug('No text transcribed', 'TranscriptionCycle');
                return;
            }

            // Reset silence timer - we received valid transcription
            this._resetSilenceTimer();

            // Store transcription internally for image generation context
            this.panel?.setLastTranscription(transcription.text);

            // Add segments to transcript panel
            if (this.panel && transcription.segments?.length > 0) {
                this.panel.addTranscriptSegments(transcription.segments);
            }

            // Format with speaker labels and analyze with AI
            const labeledText = this._formatTranscriptionWithLabels(transcription);
            await this._analyzeTranscription(labeledText);

        } catch (error) {
            this._consecutiveTranscriptionErrors++;
            this._handleThrottledError(error, 'Transcription');

            // Ensure recording restarts even on error
            if (this._isCyclicRestart) {
                this._isCyclicRestart = false;
                try {
                    if (!this.audioCapture.isRecording) {
                        await this.audioCapture.start();
                    }
                } catch (restartError) {
                    Logger.error(restartError, 'TranscriptionCycle.restart');
                }
            }
        } finally {
            this._isProcessingCycle = false;
        }
    }

    /**
     * Shows an error notification with throttling to prevent flood
     * Same error message won't be shown more than once per cooldown period
     * @param {Error} error - The error
     * @param {string} operation - What operation failed
     * @private
     */
    _handleThrottledError(error, operation) {
        const now = Date.now();
        const message = error.message || String(error);

        // Throttle: don't show the same error within the cooldown period
        if (message === this._lastErrorMessage &&
            (now - this._lastErrorNotificationTime) < ERROR_NOTIFICATION_COOLDOWN_MS) {
            Logger.debug(`Throttled duplicate error: ${message}`, operation);
            return;
        }

        this._lastErrorMessage = message;
        this._lastErrorNotificationTime = now;
        ErrorNotificationHelper.handleApiError(error, operation);
    }

    /**
     * Analyzes transcription with AI assistant
     * @param {string} text - Transcribed text to analyze
     * @private
     */
    async _analyzeTranscription(text) {
        if (!this.aiAssistant.isConfigured()) {
            Logger.warn('AI assistant not configured', 'AIAnalysis');
            return;
        }

        try {
            const analysis = await this.aiAssistant.analyzeContext(text);

            if (this.panel) {
                // Update suggestions
                const suggestionTexts = analysis.suggestions.map(s => s.content);
                this.panel.updateContent({
                    suggestions: suggestionTexts,
                    offTrack: analysis.offTrackStatus.isOffTrack,
                    offTrackMessage: analysis.offTrackStatus.reason,
                    narrativeBridge: analysis.offTrackStatus.narrativeBridge || ''
                });

                // Show notification if off-track
                if (analysis.offTrackStatus.isOffTrack && analysis.offTrackStatus.severity > 0.5) {
                    ui.notifications.warn(game.i18n.localize('NARRATOR.Notifications.PlayersOffTrack'));
                }
            }

        } catch (error) {
            Logger.error(error, 'AIAnalysis');
            // Don't show notification for analysis errors - not critical
        }
    }

    /**
     * Handles audio capture errors
     * @param {Object} error - Error object
     * @private
     */
    _onAudioCaptureError(error) {
        ErrorNotificationHelper.error(error.message || error, 'Audio Capture');

        if (this.panel) {
            this.panel.setRecordingState(RECORDING_STATE.INACTIVE);
        }
    }

    /**
     * Starts periodic audio level updates
     * @private
     */
    _startAudioLevelUpdates() {
        this._stopAudioLevelUpdates();

        // Initialize audio analyzer if not already done
        if (!this.audioCapture._analyser) {
            this.audioCapture.initializeAnalyser();
        }

        // Update every 100ms
        this._audioLevelInterval = setInterval(() => {
            const level = this.audioCapture.getAudioLevel();

            // Track level for silence detection (raw 0-1 value)
            this._cycleAudioLevels.push(level);

            // Update UI with percentage value
            if (this.panel) {
                this.panel.setAudioLevel(level * 100);
            }
        }, 100);
    }

    /**
     * Stops periodic audio level updates
     * @private
     */
    _stopAudioLevelUpdates() {
        if (this._audioLevelInterval) {
            clearInterval(this._audioLevelInterval);
            this._audioLevelInterval = null;
        }
    }

    /**
     * Resets the silence detection timer
     * Called when a new transcription is received successfully
     * Clears any active silence recovery UI and restarts the timer
     * @private
     */
    _resetSilenceTimer() {
        // Clear existing timeout
        this._clearSilenceTimer();

        // Update last transcription timestamp
        this._lastTranscriptionTime = Date.now();

        // Deactivate silence recovery mode if it was active
        if (this._isSilenceRecoveryActive) {
            this._isSilenceRecoveryActive = false;
            if (this.panel) {
                this.panel.hideSilenceRecovery?.();
            }
            Logger.debug('Silence recovery deactivated due to new transcription', 'SilenceDetection');
        }

        // Start new silence timer only if recording is active
        if (this.audioCapture?.isRecording) {
            this._silenceTimeoutId = setTimeout(() => {
                this._onSilenceTimeout();
            }, DEFAULT_SILENCE_TIMEOUT_MS);
            Logger.debug(`Silence timer started (${DEFAULT_SILENCE_TIMEOUT_MS}ms)`, 'SilenceDetection');
        }
    }

    /**
     * Clears the silence detection timer without triggering recovery
     * Used when stopping recording or cleaning up
     * @private
     */
    _clearSilenceTimer() {
        if (this._silenceTimeoutId) {
            clearTimeout(this._silenceTimeoutId);
            this._silenceTimeoutId = null;
        }
    }

    /**
     * Handles silence timeout - triggers chapter recovery UI
     * Called when no transcription has been received for the configured timeout period
     * @private
     */
    _onSilenceTimeout() {
        // Only trigger if we're still recording
        if (!this.audioCapture?.isRecording) {
            Logger.debug('Silence timeout ignored - not recording', 'SilenceDetection');
            return;
        }

        Logger.info('Silence detected - triggering chapter recovery UI', 'SilenceDetection');
        this._isSilenceRecoveryActive = true;

        // Get current chapter info from ChapterTracker
        const currentChapter = this.chapterTracker?.getCurrentChapter();
        const subchapters = this.chapterTracker?.getSubchapters() || [];

        // Build chapter context for AIAssistant recovery options
        let recoveryOptions = [];
        if (this.aiAssistant && currentChapter) {
            const chapterContext = this.aiAssistant.getChapterContext();
            recoveryOptions = this.aiAssistant.generateChapterRecoveryOptions?.(chapterContext || currentChapter) || [];
        }

        // Notify panel to show silence recovery UI
        if (this.panel) {
            const chapterData = currentChapter ? {
                ...currentChapter,
                subchapters: subchapters
            } : null;

            this.panel.showSilenceRecovery({
                currentChapter: chapterData,
                recoveryOptions,
                timeSinceLastTranscription: Date.now() - this._lastTranscriptionTime
            });
        }

        // Show notification to GM
        ui.notifications.info(game.i18n.localize('NARRATOR.Silence.Detected'));
    }

    /**
     * Checks if silence recovery mode is currently active
     * @returns {boolean} True if silence recovery UI is being shown
     */
    isSilenceRecoveryActive() {
        return this._isSilenceRecoveryActive;
    }

    /**
     * Gets the time elapsed since the last transcription
     * @returns {number} Milliseconds since last transcription, or 0 if never recorded
     */
    getTimeSinceLastTranscription() {
        if (this._lastTranscriptionTime === 0) {
            return 0;
        }
        return Date.now() - this._lastTranscriptionTime;
    }

    /**
     * Handles subchapter navigation clicks from the panel
     * Sets the current chapter and updates all dependent systems
     * @param {string} chapterId - The chapter ID to navigate to
     * @private
     */
    _handleSubchapterNavigation(chapterId) {
        if (!chapterId) { return; }

        Logger.debug(`Subchapter navigation: ${chapterId}`, 'ChapterNavigation');
        const success = this.setCurrentChapter(chapterId);

        if (!success) {
            Logger.warn(`Failed to navigate to chapter: ${chapterId}`, 'ChapterNavigation');
        }
    }

    /**
     * Handles recording control actions from the panel
     * @param {string} action - The action (start, stop, pause, resume)
     * @private
     */
    async _handleRecordingControl(action) {
        Logger.debug(`Recording control: ${action}`, 'RecordingControl');

        try {
            switch (action) {
                case 'start':
                    await this.audioCapture.start();
                    break;

                case 'stop':
                    this._stopTranscriptionCycles();
                    const audioBlob = await this.audioCapture.stop();
                    if (audioBlob && audioBlob.size >= MIN_AUDIO_SIZE) {
                        // Process final audio
                        this.panel?.setRecordingState(RECORDING_STATE.PROCESSING);
                        await this._processFinalAudio(audioBlob);
                    }
                    break;

                case 'pause':
                    this.audioCapture.pause();
                    break;

                case 'resume':
                    this.audioCapture.resume();
                    break;
            }
        } catch (error) {
            this._handleServiceError(error, 'Recording Control');
            this.panel?.setRecordingState(RECORDING_STATE.INACTIVE);
        }
    }

    /**
     * Processes the final audio blob after recording stops
     * @param {Blob} audioBlob - The complete recording
     * @private
     */
    async _processFinalAudio(audioBlob) {
        try {
            // Transcribe final audio
            const transcription = await this.transcriptionService.transcribe(audioBlob);

            if (transcription.text && transcription.text.trim().length > 0) {
                // Store transcription internally for image generation context
                if (this.panel) {
                    this.panel.setLastTranscription(transcription.text);
                }

                // Update transcript display in panel with final segments
                if (this.panel && transcription.segments && transcription.segments.length > 0) {
                    // Use updateTranscript for final audio to include all segments
                    this.panel.addTranscriptSegments(transcription.segments);
                }

                // Apply speaker labels and format for AI analysis
                const labeledText = this._formatTranscriptionWithLabels(transcription);

                // Final AI analysis
                await this._analyzeTranscription(labeledText);
            }

        } catch (error) {
            this._handleServiceError(error, 'Final Audio Processing');
        } finally {
            this.panel?.setRecordingState(RECORDING_STATE.INACTIVE);
        }
    }

    /**
     * Formats transcription with applied speaker labels for AI analysis
     * @param {Object} transcription - The transcription result from TranscriptionService
     * @returns {string} Formatted text with speaker labels
     * @private
     */
    _formatTranscriptionWithLabels(transcription) {
        // If no segments available, fall back to plain text
        if (!transcription.segments || !Array.isArray(transcription.segments) || transcription.segments.length === 0) {
            return transcription.text;
        }

        // Apply custom speaker labels to segments
        const labeledSegments = this.speakerLabelService.applyLabelsToSegments(transcription.segments);

        // Format segments into speaker-aware text
        const formattedText = labeledSegments
            .map(segment => {
                const speaker = segment.speaker || 'Unknown';
                const text = segment.text || '';
                return `${speaker}: ${text}`;
            })
            .join('\n');

        // Fall back to plain text if formatting produced empty result
        return formattedText.trim() || transcription.text;
    }

    /**
     * Handles image generation requests from the panel
     * @param {string} context - Context for image generation
     * @private
     */
    async _handleGenerateImage(context) {
        Logger.debug('Generating image from context', 'ImageGeneration');

        if (!this.imageGenerator.isConfigured()) {
            ui.notifications.error(game.i18n.localize('NARRATOR.Errors.NoApiKey'));
            return;
        }

        try {
            const result = await this.imageGenerator.generateInfographic(context, {
                style: 'fantasy',
                mood: 'dramatic'
            });

            if (this.panel && result.url) {
                this.panel.addImage({
                    url: result.base64 ? `data:image/png;base64,${result.base64}` : result.url,
                    prompt: result.prompt
                });

                ErrorNotificationHelper.info(game.i18n.localize('NARRATOR.Notifications.ImageGenerated'));
            }

        } catch (error) {
            this._handleServiceError(error, 'Image Generation');
        }
    }

    /**
     * Updates the API key and reinitializes dependent services
     * Called when the API key setting changes
     * @param {string} newApiKey - The new API key
     */
    updateApiKey(newApiKey) {
        Logger.info('API key updated', 'NarratorMaster');

        if (newApiKey && newApiKey.trim().length > 0) {
            // Update all API-dependent services
            this.transcriptionService?.setApiKey(newApiKey);
            this.aiAssistant?.setApiKey(newApiKey);
            this.imageGenerator?.setApiKey(newApiKey);

            Logger.info('Services updated with new API key', 'NarratorMaster');
            ErrorNotificationHelper.info(game.i18n.localize('NARRATOR.Notifications.ApiKeyUpdated'));
        } else {
            Logger.warn('API key cleared', 'NarratorMaster');
        }

        // Update panel to reflect configuration status
        this.panel?.render(false);
    }

    /**
     * Restarts transcription cycles with new batch duration from settings
     * Called when the transcription batch duration setting changes
     * Only takes effect if recording is currently active
     */
    restartTranscriptionCycles() {
        // Only restart if currently recording
        if (!this.audioCapture?.isRecording) {
            Logger.debug('Transcription batch duration changed but not recording, will apply on next recording', 'NarratorMaster');
            return;
        }

        const newBatchDuration = this.settings.getTranscriptionBatchDuration();
        Logger.info(`Restarting transcription cycles with new interval: ${newBatchDuration}ms`, 'NarratorMaster');

        // Stop current cycles
        this._stopTranscriptionCycles();

        // Start cycles with new duration
        this._startTranscriptionCycles();
    }

    /**
     * Shows a configuration warning to the user
     * @param {string[]} errors - Array of configuration error messages
     * @private
     */
    _showConfigurationWarning(errors) {
        const message = game.i18n.localize('NARRATOR.Warnings.ConfigIncomplete');
        ErrorNotificationHelper.warn(`${message}: ${errors.join(', ')}`, 'Configuration');
    }

    /**
     * Shows an error notification to the user
     * @param {string} message - The error message
     * @private
     */
    _showErrorNotification(message) {
        const prefix = game.i18n.localize('NARRATOR.Errors.InitFailed');
        ErrorNotificationHelper.error(`${prefix}: ${message}`, 'Initialization');
    }

    /**
     * Handles service errors with user-friendly notifications
     * @param {Error} error - The error that occurred
     * @param {string} operation - What operation failed
     * @private
     */
    _handleServiceError(error, operation) {
        this._handleThrottledError(error, operation);
    }

    /**
     * Handles keyboard shortcuts for recording controls
     * @param {KeyboardEvent} event - The keyboard event
     * @private
     */
    _handleKeyboardShortcuts(event) {
        // Only handle shortcuts for GM users
        if (!game.user.isGM) return;

        // Only handle shortcuts if module is initialized
        if (!this._initialized) return;

        // Check for Ctrl+Shift modifier combination
        if (!event.ctrlKey || !event.shiftKey) return;

        // Handle specific key combinations
        let action = null;

        switch (event.key.toUpperCase()) {
            case 'R':
                // Ctrl+Shift+R - Start recording
                action = 'start';
                break;

            case 'S':
                // Ctrl+Shift+S - Stop recording
                action = 'stop';
                break;

            case 'P':
                // Ctrl+Shift+P - Pause/Resume recording (toggle based on current state)
                if (this.audioCapture?.state === RecordingState.RECORDING) {
                    action = 'pause';
                } else if (this.audioCapture?.state === RecordingState.PAUSED) {
                    action = 'resume';
                }
                break;

            default:
                return; // Not a narrator shortcut, ignore
        }

        // If we have a valid action, handle it
        if (action) {
            event.preventDefault();
            this._handleRecordingControl(action);
        }
    }

    /**
     * Opens the DM panel
     */
    openPanel() {
        if (this.panel) {
            this.panel.render(true);
        } else {
            Logger.warn('Panel not yet initialized', 'NarratorMaster');
        }
    }

    /**
     * Closes the DM panel
     */
    closePanel() {
        if (this.panel) {
            this.panel.close();
        }
    }

    /**
     * Toggles the DM panel open/closed state
     */
    togglePanel() {
        if (this.panel?.rendered) {
            this.closePanel();
        } else {
            this.openPanel();
        }
    }

    /**
     * Checks if the module is fully initialized
     * @returns {boolean}
     */
    isInitialized() {
        return this._initialized;
    }

    /**
     * Gets the current module status
     * @returns {Object} Status object with component states
     */
    getStatus() {
        return {
            initialized: this._initialized,
            apiKeyConfigured: this.settings.isApiKeyConfigured(),
            panelOpen: this.panel?.rendered ?? false,
            isRecording: this.audioCapture?.isRecording ?? false,
            journalCount: this.journalParser?.getCacheStats()?.cachedJournals ?? 0,
            services: {
                audioCapture: !!this.audioCapture,
                transcription: this.transcriptionService?.isConfigured() ?? false,
                aiAssistant: this.aiAssistant?.isConfigured() ?? false,
                imageGenerator: this.imageGenerator?.isConfigured() ?? false,
                journalParser: !!this.journalParser,
                compendiumParser: !!this.compendiumParser,
                chapterTracker: this.chapterTracker?.isConfigured() ?? false
            }
        };
    }

    /**
     * Cleans up resources when module is disabled
     */
    destroy() {
        Logger.info('Cleaning up NarratorMaster', 'NarratorMaster');

        // Stop audio capture
        if (this.audioCapture) {
            this.audioCapture.destroy();
        }

        // Clear intervals and cycles
        this._stopAudioLevelUpdates();
        this._stopTranscriptionCycles();
        this._clearSilenceTimer();
        this._isSilenceRecoveryActive = false;

        // Close panel
        this.closePanel();

        this._initialized = false;
    }
}

/**
 * Module initialization hook
 * Called early in the Foundry VTT loading process
 * Used for registering settings and loading templates
 */
Hooks.once('init', async function() {
    Logger.info('Initializing module', 'Hooks.init');

    // Register module settings
    registerSettings();

    // Load Handlebars templates
    await loadTemplates([
        `modules/${MODULE_ID}/templates/panel.hbs`
    ]);

    Logger.info('Module initialized', 'Hooks.init');
});

/**
 * Module ready hook
 * Called when the game is fully ready
 * Used for creating module instances and GM-only features
 */
Hooks.once('ready', async function() {
    Logger.info('Module ready', 'Hooks.ready');

    // Only initialize for GM users - this is a DM-only tool
    if (game.user.isGM) {
        Logger.info('User is GM, initializing NarratorMaster', 'Hooks.ready');

        // Create and store global instance for debugging and external access
        window.narratorMaster = new NarratorMaster();
        await window.narratorMaster.initialize();

        // Register keyboard shortcuts for recording controls
        document.addEventListener('keydown', window.narratorMaster._handleKeyboardShortcuts.bind(window.narratorMaster));
        Logger.info('Keyboard shortcuts registered (Ctrl+Shift+R/S/P)', 'Hooks.ready');
    } else {
        Logger.info('User is not GM, skipping initialization', 'Hooks.ready');
    }
});

/**
 * Add Narrator Master panel toggle button to the scene controls sidebar
 * Only visible to GM users
 */
Hooks.on('getSceneControlButtons', (controls) => {
    // Only add controls for GM users
    if (!game.user.isGM) return;

    // Foundry v13: controls is Record<string, SceneControl>, tools is Record<string, SceneControlTool>
    controls['narrator-master'] = {
        name: 'narrator-master',
        title: game.i18n.localize('NARRATOR.PanelTitle'),
        icon: 'fas fa-microphone-alt',
        layer: 'controls',
        visible: game.user.isGM,
        activeTool: 'open-panel',
        tools: {
            'open-panel': {
                name: 'open-panel',
                title: game.i18n.localize('NARRATOR.Panel.TogglePanel'),
                icon: 'fas fa-book-reader',
                onChange: () => {
                    if (window.narratorMaster) {
                        window.narratorMaster.togglePanel();
                    } else {
                        ui.notifications.warn(game.i18n.localize('NARRATOR.Errors.NotInitialized'));
                    }
                }
            },
            'settings': {
                name: 'settings',
                title: game.i18n.localize('NARRATOR.Panel.OpenSettings'),
                icon: 'fas fa-cog',
                button: true,
                onClick: () => {
                    const settingsApp = game.settings.sheet;
                    settingsApp.render(true);
                    setTimeout(() => {
                        const moduleTab = settingsApp.element?.find('[data-tab="modules"]');
                        if (moduleTab) {
                            moduleTab.trigger('click');
                        }
                    }, 100);
                }
            }
        }
    };

    Logger.debug('Scene control buttons registered', 'Hooks.getSceneControlButtons');
});

// Export for external use and testing
export { NarratorMaster, MODULE_ID };
