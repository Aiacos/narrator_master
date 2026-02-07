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
import { NarratorPanel, RECORDING_STATE } from './ui-panel.js';
import { SpeakerLabelService } from './speaker-labels.js';
import { SceneDetector } from './scene-detector.js';

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
         * Speaker label service
         * @type {SpeakerLabelService|null}
         */
        this.speakerLabelService = null;

        /**
         * Scene detector service
         * @type {SceneDetector|null}
         */
        this.sceneDetector = null;

        /**
         * Audio level update interval ID
         * @type {number|null}
         * @private
         */
        this._audioLevelInterval = null;

        /**
         * Pending transcription timeout ID for debouncing
         * @type {number|null}
         * @private
         */
        this._transcriptionTimeout = null;

        /**
         * Collected audio chunks waiting to be processed
         * @type {Blob[]}
         * @private
         */
        this._pendingAudioChunks = [];
    }

    /**
     * Initializes the module and all its components
     * Called from the 'ready' hook only for GM users
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this._initialized) {
            console.warn(`${MODULE_ID} | Module already initialized`);
            return;
        }

        console.log(`${MODULE_ID} | Initializing NarratorMaster controller`);

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

            // Validate configuration
            const validation = this.settings.validateConfiguration();
            if (!validation.valid) {
                console.warn(`${MODULE_ID} | Configuration incomplete:`, validation.errors);
                this._showConfigurationWarning(validation.errors);
            }

            // Mark as initialized
            this._initialized = true;
            console.log(`${MODULE_ID} | NarratorMaster initialized successfully`);

        } catch (error) {
            console.error(`${MODULE_ID} | Failed to initialize NarratorMaster:`, error);
            this._showErrorNotification(error.message);
        }
    }

    /**
     * Initializes all service instances
     * @param {string} apiKey - The OpenAI API key
     * @private
     */
    _initializeServices(apiKey) {
        console.log(`${MODULE_ID} | Initializing services`);

        // Initialize Journal Parser (no API key needed)
        this.journalParser = new JournalParser();

        // Initialize Speaker Label Service (no API key needed)
        this.speakerLabelService = new SpeakerLabelService();

        // Initialize Scene Detector (no API key needed)
        this.sceneDetector = new SceneDetector({
            sensitivity: this.settings.getOffTrackSensitivity()
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

        console.log(`${MODULE_ID} | Services initialized`);
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

        // Handle audio data available
        this.audioCapture.on(AudioCaptureEvent.DATA_AVAILABLE, (chunk) => {
            this._onAudioDataAvailable(chunk);
        });

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
        console.log(`${MODULE_ID} | Initializing UI panel`);

        this.panel = new NarratorPanel();

        // Set up panel callbacks
        this.panel.onRecordingControl = this._handleRecordingControl.bind(this);
        this.panel.onGenerateImage = this._handleGenerateImage.bind(this);

        // Connect speaker label service to panel
        if (this.speakerLabelService) {
            this.panel.setSpeakerLabelService(this.speakerLabelService);
        }

        console.log(`${MODULE_ID} | UI panel initialized`);
    }

    /**
     * Loads all available journals and sets AI context
     * @private
     */
    async _loadAllJournals() {
        try {
            const parsedJournals = await this.journalParser.parseAllJournals();
            const context = this.journalParser.getAllContentForAI();

            // Set context in AI assistant
            this.aiAssistant.setAdventureContext(context);

            // Update panel with journal count
            if (this.panel) {
                this.panel.updateContent({
                    journalCount: parsedJournals.length
                });
            }

            console.log(`${MODULE_ID} | Loaded ${parsedJournals.length} journals, ${context.length} chars context`);

        } catch (error) {
            console.warn(`${MODULE_ID} | Failed to load journals:`, error);
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
     * Handles audio capture state changes
     * @param {RecordingState} state - The new state
     * @private
     */
    _onAudioStateChange(state) {
        console.log(`${MODULE_ID} | Audio state changed: ${state}`);

        if (!this.panel) return;

        switch (state) {
            case RecordingState.RECORDING:
                this.panel.setRecordingState(RECORDING_STATE.RECORDING);
                this._startAudioLevelUpdates();
                break;

            case RecordingState.PAUSED:
                this.panel.setRecordingState(RECORDING_STATE.PAUSED);
                this._stopAudioLevelUpdates();
                break;

            case RecordingState.STOPPING:
                this.panel.setRecordingState(RECORDING_STATE.PROCESSING);
                this._stopAudioLevelUpdates();
                break;

            case RecordingState.INACTIVE:
                this.panel.setRecordingState(RECORDING_STATE.INACTIVE);
                this._stopAudioLevelUpdates();
                break;
        }
    }

    /**
     * Handles audio data availability
     * @param {Blob} chunk - Audio data chunk
     * @private
     */
    _onAudioDataAvailable(chunk) {
        this._pendingAudioChunks.push(chunk);

        // Debounce transcription - wait for 2 seconds of silence
        if (this._transcriptionTimeout) {
            clearTimeout(this._transcriptionTimeout);
        }

        this._transcriptionTimeout = setTimeout(() => {
            this._processAudioChunks();
        }, 2000);
    }

    /**
     * Processes accumulated audio chunks through transcription
     * Transcription is internal - only AI analysis results are shown to the user
     * @private
     */
    async _processAudioChunks() {
        if (this._pendingAudioChunks.length === 0) return;

        // Combine chunks into a single blob
        const audioBlob = new Blob(this._pendingAudioChunks, { type: 'audio/webm' });
        this._pendingAudioChunks = [];

        // Skip if too small (likely silence)
        if (audioBlob.size < 1000) {
            console.log(`${MODULE_ID} | Audio chunk too small, skipping`);
            return;
        }

        try {
            // Transcribe audio
            const transcription = await this.transcriptionService.transcribe(audioBlob);

            // Skip if no text was transcribed
            if (!transcription.text || transcription.text.trim().length === 0) {
                console.log(`${MODULE_ID} | No text transcribed`);
                return;
            }

            // Store transcription internally for image generation context
            if (this.panel) {
                this.panel.setLastTranscription(transcription.text);
            }

            // Update transcript display in panel (using addTranscriptSegments for incremental updates)
            // panel.updateTranscript() would replace all segments, addTranscriptSegments() appends
            if (this.panel && transcription.segments && transcription.segments.length > 0) {
                this.panel.addTranscriptSegments(transcription.segments);
            }

            // Apply speaker labels and format for AI analysis
            const labeledText = this._formatTranscriptionWithLabels(transcription);

            // Analyze transcription with AI (results shown to user)
            const analysis = await this._analyzeTranscription(labeledText);

            // Handle scene transitions
            if (analysis && analysis.sceneInfo && analysis.sceneInfo.isTransition && this.panel) {
                this.panel.addSceneBreak(
                    analysis.sceneInfo.type,
                    analysis.sceneInfo.timestamp,
                    false // false for automatic detection
                );
            }

        } catch (error) {
            this._handleServiceError(error, 'Transcription');
        }
    }

    /**
     * Analyzes transcription with AI assistant
     * @param {string} text - Transcribed text to analyze
     * @returns {Promise<Object|null>} The analysis result including sceneInfo, or null if failed
     * @private
     */
    async _analyzeTranscription(text) {
        if (!this.aiAssistant.isConfigured()) {
            console.warn(`${MODULE_ID} | AI assistant not configured`);
            return null;
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

            return analysis;

        } catch (error) {
            console.error(`${MODULE_ID} | AI analysis error:`, error);
            // Don't show notification for analysis errors - not critical
            return null;
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
            const level = this.audioCapture.getAudioLevel() * 100;
            if (this.panel) {
                this.panel.setAudioLevel(level);
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
     * Handles recording control actions from the panel
     * @param {string} action - The action (start, stop, pause, resume)
     * @private
     */
    async _handleRecordingControl(action) {
        console.log(`${MODULE_ID} | Recording control: ${action}`);

        try {
            switch (action) {
                case 'start':
                    await this.audioCapture.start();
                    break;

                case 'stop':
                    const audioBlob = await this.audioCapture.stop();
                    if (audioBlob && audioBlob.size > 1000) {
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
                const analysis = await this._analyzeTranscription(labeledText);

                // Handle scene transitions
                if (analysis && analysis.sceneInfo && analysis.sceneInfo.isTransition && this.panel) {
                    this.panel.addSceneBreak(
                        analysis.sceneInfo.type,
                        analysis.sceneInfo.timestamp,
                        false // false for automatic detection
                    );
                }
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
        console.log(`${MODULE_ID} | Generating image from context`);

        if (!this.imageGenerator.isConfigured()) {
            ui.notifications.error(game.i18n.localize('NARRATOR.Errors.NoApiKey'));
            return;
        }

        try {
            // Get current scene type for scene-aware image generation
            const currentScene = this.panel?.getCurrentScene();
            const sceneType = currentScene?.type || null;

            const result = await this.imageGenerator.generateInfographic(context, {
                style: 'fantasy',
                mood: 'dramatic',
                sceneType: sceneType
            });

            if (this.panel && result.url) {
                this.panel.addImage({
                    url: result.base64 ? `data:image/png;base64,${result.base64}` : result.url,
                    prompt: result.prompt,
                    sceneType: sceneType
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
        console.log(`${MODULE_ID} | API key updated`);

        if (newApiKey && newApiKey.trim().length > 0) {
            // Update all API-dependent services
            this.transcriptionService?.setApiKey(newApiKey);
            this.aiAssistant?.setApiKey(newApiKey);
            this.imageGenerator?.setApiKey(newApiKey);

            console.log(`${MODULE_ID} | Services updated with new API key`);
            ErrorNotificationHelper.info(game.i18n.localize('NARRATOR.Notifications.ApiKeyUpdated'));
        } else {
            console.warn(`${MODULE_ID} | API key cleared`);
        }

        // Update panel to reflect configuration status
        this.panel?.render(false);
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
        ErrorNotificationHelper.handleApiError(error, operation);
    }

    /**
     * Opens the DM panel
     */
    openPanel() {
        if (this.panel) {
            this.panel.render(true);
        } else {
            console.warn(`${MODULE_ID} | Panel not yet initialized`);
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
                journalParser: !!this.journalParser
            }
        };
    }

    /**
     * Cleans up resources when module is disabled
     */
    destroy() {
        console.log(`${MODULE_ID} | Cleaning up NarratorMaster`);

        // Stop audio capture
        if (this.audioCapture) {
            this.audioCapture.destroy();
        }

        // Clear intervals
        this._stopAudioLevelUpdates();
        if (this._transcriptionTimeout) {
            clearTimeout(this._transcriptionTimeout);
        }

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
    console.log(`${MODULE_ID} | Initializing module`);

    // Register module settings
    registerSettings();

    // Load Handlebars templates
    await loadTemplates([
        `modules/${MODULE_ID}/templates/panel.hbs`
    ]);

    console.log(`${MODULE_ID} | Module initialized`);
});

/**
 * Module ready hook
 * Called when the game is fully ready
 * Used for creating module instances and GM-only features
 */
Hooks.once('ready', async function() {
    console.log(`${MODULE_ID} | Module ready`);

    // Only initialize for GM users - this is a DM-only tool
    if (game.user.isGM) {
        console.log(`${MODULE_ID} | User is GM, initializing NarratorMaster`);

        // Create and store global instance for debugging and external access
        window.narratorMaster = new NarratorMaster();
        await window.narratorMaster.initialize();
    } else {
        console.log(`${MODULE_ID} | User is not GM, skipping initialization`);
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

    console.log(`${MODULE_ID} | Scene control buttons registered`);
});

// Export for external use and testing
export { NarratorMaster, MODULE_ID };
