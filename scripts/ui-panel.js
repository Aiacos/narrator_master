/**
 * NarratorPanel - DM Interface Panel for Narrator Master
 * Extends Foundry VTT Application class for the main DM control panel
 * @module ui-panel
 */

import { MODULE_ID, SettingsManager } from './settings.js';

/**
 * Recording state enumeration
 * @constant {Object}
 */
export const RECORDING_STATE = {
    INACTIVE: 'inactive',
    RECORDING: 'recording',
    PAUSED: 'paused',
    PROCESSING: 'processing'
};

/**
 * NarratorPanel - Main DM interface Application
 * Provides real-time transcription display, AI suggestions, and recording controls
 * @extends Application
 */
export class NarratorPanel extends Application {
    /**
     * Creates a new NarratorPanel instance
     * @param {Object} options - Application options
     */
    constructor(options = {}) {
        super(options);

        /**
         * Settings manager instance
         * @type {SettingsManager}
         */
        this.settingsManager = new SettingsManager();

        /**
         * Current transcription text
         * @type {string}
         */
        this.transcription = '';

        /**
         * Array of transcription segments with speaker info
         * @type {Array<{speaker: string, text: string, timestamp: number}>}
         */
        this.transcriptionSegments = [];

        /**
         * Current AI suggestions
         * @type {Array<string>}
         */
        this.suggestions = [];

        /**
         * Whether the players are currently off-track from the adventure
         * @type {boolean}
         */
        this.offTrack = false;

        /**
         * Off-track warning message
         * @type {string}
         */
        this.offTrackMessage = '';

        /**
         * Narrative bridge suggestions for returning to the story
         * @type {string}
         */
        this.narrativeBridge = '';

        /**
         * Current journal reference/context
         * @type {string}
         */
        this.journalRef = '';

        /**
         * Generated images
         * @type {Array<{url: string, prompt: string, timestamp: number}>}
         */
        this.generatedImages = [];

        /**
         * Current recording state
         * @type {string}
         */
        this.recordingState = RECORDING_STATE.INACTIVE;

        /**
         * Recording duration in seconds
         * @type {number}
         */
        this.recordingDuration = 0;

        /**
         * Timer interval ID for recording duration
         * @type {number|null}
         */
        this._durationTimer = null;

        /**
         * Current audio level (0-100)
         * @type {number}
         */
        this.audioLevel = 0;

        /**
         * Callback for recording control events
         * @type {Function|null}
         */
        this.onRecordingControl = null;

        /**
         * Callback for image generation requests
         * @type {Function|null}
         */
        this.onGenerateImage = null;

        /**
         * Callback for journal selection
         * @type {Function|null}
         */
        this.onJournalSelect = null;

        /**
         * Whether the module is loading/processing
         * @type {boolean}
         */
        this.isLoading = false;

        /**
         * Loading message to display
         * @type {string}
         */
        this.loadingMessage = '';
    }

    /**
     * Default application options
     * @returns {Object} The default options
     */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: 'narrator-master-panel',
            title: game.i18n.localize('NARRATOR.PanelTitle'),
            template: `modules/${MODULE_ID}/templates/panel.hbs`,
            classes: ['narrator-master', 'narrator-panel'],
            width: 450,
            height: 650,
            resizable: true,
            minimizable: true,
            popOut: true,
            dragDrop: [],
            tabs: [{
                navSelector: '.tabs',
                contentSelector: '.tab-content',
                initial: 'transcription'
            }]
        });
    }

    /**
     * Gets data for the Handlebars template
     * @returns {Object} Template data
     */
    getData() {
        const settings = this.settingsManager.getAllSettings();

        return {
            // Module info
            moduleId: MODULE_ID,

            // Transcription data
            transcription: this.transcription,
            transcriptionSegments: this.transcriptionSegments,
            hasTranscription: this.transcription.length > 0 || this.transcriptionSegments.length > 0,
            showSpeakerLabels: settings.showSpeakerLabels,

            // AI suggestions
            suggestions: this.suggestions,
            hasSuggestions: this.suggestions.length > 0,

            // Off-track detection
            offTrack: this.offTrack,
            offTrackMessage: this.offTrackMessage,
            narrativeBridge: this.narrativeBridge,
            hasNarrativeBridge: this.narrativeBridge.length > 0,

            // Journal reference
            journalRef: this.journalRef,
            hasJournalRef: this.journalRef.length > 0,
            selectedJournal: settings.selectedJournal,
            availableJournals: this._getAvailableJournals(),

            // Generated images
            generatedImages: this.generatedImages,
            hasImages: this.generatedImages.length > 0,

            // Recording state
            recordingState: this.recordingState,
            isRecording: this.recordingState === RECORDING_STATE.RECORDING,
            isPaused: this.recordingState === RECORDING_STATE.PAUSED,
            isProcessing: this.recordingState === RECORDING_STATE.PROCESSING,
            isInactive: this.recordingState === RECORDING_STATE.INACTIVE,
            recordingDuration: this._formatDuration(this.recordingDuration),
            audioLevel: this.audioLevel,

            // Configuration status
            apiKeyConfigured: this.settingsManager.isApiKeyConfigured(),
            journalSelected: this.settingsManager.isJournalSelected(),
            isConfigured: this.settingsManager.isApiKeyConfigured(),

            // Loading state
            isLoading: this.isLoading,
            loadingMessage: this.loadingMessage,

            // Localization keys for template
            i18n: {
                startRecording: game.i18n.localize('NARRATOR.Panel.StartRecording'),
                stopRecording: game.i18n.localize('NARRATOR.Panel.StopRecording'),
                pauseRecording: game.i18n.localize('NARRATOR.Panel.PauseRecording'),
                resumeRecording: game.i18n.localize('NARRATOR.Panel.ResumeRecording'),
                generateImage: game.i18n.localize('NARRATOR.Panel.GenerateImage'),
                transcriptionTab: game.i18n.localize('NARRATOR.Panel.TranscriptionTab'),
                suggestionsTab: game.i18n.localize('NARRATOR.Panel.SuggestionsTab'),
                imagesTab: game.i18n.localize('NARRATOR.Panel.ImagesTab'),
                noTranscription: game.i18n.localize('NARRATOR.Panel.NoTranscription'),
                noSuggestions: game.i18n.localize('NARRATOR.Panel.NoSuggestions'),
                noImages: game.i18n.localize('NARRATOR.Panel.NoImages'),
                offTrackWarning: game.i18n.localize('NARRATOR.Panel.OffTrackWarning'),
                returnToStory: game.i18n.localize('NARRATOR.Panel.ReturnToStory'),
                selectJournal: game.i18n.localize('NARRATOR.Panel.SelectJournal'),
                currentContext: game.i18n.localize('NARRATOR.Panel.CurrentContext'),
                noApiKey: game.i18n.localize('NARRATOR.Panel.NoApiKey'),
                configureSettings: game.i18n.localize('NARRATOR.Panel.ConfigureSettings'),
                processing: game.i18n.localize('NARRATOR.Panel.Processing'),
                clearTranscription: game.i18n.localize('NARRATOR.Panel.ClearTranscription'),
                clearImages: game.i18n.localize('NARRATOR.Panel.ClearImages'),
                copyToClipboard: game.i18n.localize('NARRATOR.Panel.CopyToClipboard')
            }
        };
    }

    /**
     * Gets the list of available journals for selection
     * @returns {Array<{id: string, name: string}>}
     * @private
     */
    _getAvailableJournals() {
        if (!game.journal) {
            return [];
        }

        return game.journal.contents.map(journal => ({
            id: journal.id,
            name: journal.name
        })).sort((a, b) => a.name.localeCompare(b.name));
    }

    /**
     * Formats duration in seconds to MM:SS format
     * @param {number} seconds - Duration in seconds
     * @returns {string} Formatted duration
     * @private
     */
    _formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Activates event listeners for the panel
     * @param {jQuery} html - The rendered HTML
     */
    activateListeners(html) {
        super.activateListeners(html);

        // Recording controls
        html.find('.start-recording').click(this._onStartRecording.bind(this));
        html.find('.stop-recording').click(this._onStopRecording.bind(this));
        html.find('.pause-recording').click(this._onPauseRecording.bind(this));
        html.find('.resume-recording').click(this._onResumeRecording.bind(this));

        // Image generation
        html.find('.generate-image').click(this._onGenerateImage.bind(this));

        // Journal selection
        html.find('.journal-select').change(this._onJournalSelect.bind(this));

        // Clear buttons
        html.find('.clear-transcription').click(this._onClearTranscription.bind(this));
        html.find('.clear-images').click(this._onClearImages.bind(this));

        // Copy to clipboard
        html.find('.copy-transcription').click(this._onCopyTranscription.bind(this));
        html.find('.copy-suggestions').click(this._onCopySuggestions.bind(this));

        // Settings link
        html.find('.open-settings').click(this._onOpenSettings.bind(this));

        // Image actions
        html.find('.image-item').click(this._onImageClick.bind(this));
        html.find('.delete-image').click(this._onDeleteImage.bind(this));

        // Narrative bridge copy
        html.find('.copy-bridge').click(this._onCopyNarrativeBridge.bind(this));
    }

    /**
     * Handles start recording button click
     * @param {Event} event - Click event
     * @private
     */
    async _onStartRecording(event) {
        event.preventDefault();

        if (!this.settingsManager.isApiKeyConfigured()) {
            ui.notifications.warn(game.i18n.localize('NARRATOR.Errors.NoApiKey'));
            return;
        }

        if (this.onRecordingControl) {
            await this.onRecordingControl('start');
        }
    }

    /**
     * Handles stop recording button click
     * @param {Event} event - Click event
     * @private
     */
    async _onStopRecording(event) {
        event.preventDefault();

        if (this.onRecordingControl) {
            await this.onRecordingControl('stop');
        }
    }

    /**
     * Handles pause recording button click
     * @param {Event} event - Click event
     * @private
     */
    async _onPauseRecording(event) {
        event.preventDefault();

        if (this.onRecordingControl) {
            await this.onRecordingControl('pause');
        }
    }

    /**
     * Handles resume recording button click
     * @param {Event} event - Click event
     * @private
     */
    async _onResumeRecording(event) {
        event.preventDefault();

        if (this.onRecordingControl) {
            await this.onRecordingControl('resume');
        }
    }

    /**
     * Handles generate image button click
     * @param {Event} event - Click event
     * @private
     */
    async _onGenerateImage(event) {
        event.preventDefault();

        if (!this.settingsManager.isApiKeyConfigured()) {
            ui.notifications.warn(game.i18n.localize('NARRATOR.Errors.NoApiKey'));
            return;
        }

        if (this.onGenerateImage) {
            // Generate based on current context
            const context = this.transcription || this.journalRef;
            if (context) {
                this.setLoading(true, game.i18n.localize('NARRATOR.Panel.GeneratingImage'));
                await this.onGenerateImage(context);
                this.setLoading(false);
            } else {
                ui.notifications.warn(game.i18n.localize('NARRATOR.Errors.NoContextForImage'));
            }
        }
    }

    /**
     * Handles journal selection change
     * @param {Event} event - Change event
     * @private
     */
    async _onJournalSelect(event) {
        event.preventDefault();
        const journalId = event.target.value;

        if (this.onJournalSelect) {
            await this.onJournalSelect(journalId);
        }

        // Also update the setting
        await this.settingsManager.setSelectedJournal(journalId);
    }

    /**
     * Handles clear transcription button click
     * @param {Event} event - Click event
     * @private
     */
    _onClearTranscription(event) {
        event.preventDefault();
        this.clearTranscription();
    }

    /**
     * Handles clear images button click
     * @param {Event} event - Click event
     * @private
     */
    _onClearImages(event) {
        event.preventDefault();
        this.clearImages();
    }

    /**
     * Handles copy transcription button click
     * @param {Event} event - Click event
     * @private
     */
    async _onCopyTranscription(event) {
        event.preventDefault();

        let text = this.transcription;
        if (this.transcriptionSegments.length > 0) {
            text = this.transcriptionSegments
                .map(seg => this.settingsManager.getShowSpeakerLabels()
                    ? `[${seg.speaker}]: ${seg.text}`
                    : seg.text)
                .join('\n');
        }

        await this._copyToClipboard(text);
    }

    /**
     * Handles copy suggestions button click
     * @param {Event} event - Click event
     * @private
     */
    async _onCopySuggestions(event) {
        event.preventDefault();
        const text = this.suggestions.join('\n\n');
        await this._copyToClipboard(text);
    }

    /**
     * Handles copy narrative bridge button click
     * @param {Event} event - Click event
     * @private
     */
    async _onCopyNarrativeBridge(event) {
        event.preventDefault();
        await this._copyToClipboard(this.narrativeBridge);
    }

    /**
     * Copies text to clipboard
     * @param {string} text - Text to copy
     * @private
     */
    async _copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            ui.notifications.info(game.i18n.localize('NARRATOR.Notifications.CopiedToClipboard'));
        } catch (error) {
            ui.notifications.error(game.i18n.localize('NARRATOR.Errors.CopyFailed'));
        }
    }

    /**
     * Handles open settings button click
     * @param {Event} event - Click event
     * @private
     */
    _onOpenSettings(event) {
        event.preventDefault();
        // Open the module settings
        game.settings.sheet.render(true);
    }

    /**
     * Handles image click to show in lightbox
     * @param {Event} event - Click event
     * @private
     */
    _onImageClick(event) {
        event.preventDefault();
        const imageUrl = event.currentTarget.dataset.url;
        if (imageUrl) {
            // Create a simple lightbox
            new ImagePopout(imageUrl, {
                title: game.i18n.localize('NARRATOR.Panel.GeneratedImage'),
                shareable: true
            }).render(true);
        }
    }

    /**
     * Handles delete image button click
     * @param {Event} event - Click event
     * @private
     */
    _onDeleteImage(event) {
        event.preventDefault();
        event.stopPropagation();

        const index = parseInt(event.currentTarget.dataset.index);
        if (!isNaN(index) && index >= 0 && index < this.generatedImages.length) {
            this.generatedImages.splice(index, 1);
            this.render(false);
        }
    }

    /**
     * Updates the panel with new content data
     * @param {Object} data - Content data to update
     * @param {string} [data.transcription] - New transcription text
     * @param {Array} [data.transcriptionSegments] - New transcription segments
     * @param {Array<string>} [data.suggestions] - New AI suggestions
     * @param {boolean} [data.offTrack] - Off-track status
     * @param {string} [data.offTrackMessage] - Off-track warning message
     * @param {string} [data.narrativeBridge] - Narrative bridge suggestion
     * @param {string} [data.journalRef] - Journal reference context
     */
    updateContent(data) {
        if (data.transcription !== undefined) {
            this.transcription = data.transcription;
        }
        if (data.transcriptionSegments !== undefined) {
            this.transcriptionSegments = data.transcriptionSegments;
        }
        if (data.suggestions !== undefined) {
            this.suggestions = data.suggestions;
        }
        if (data.offTrack !== undefined) {
            this.offTrack = data.offTrack;
        }
        if (data.offTrackMessage !== undefined) {
            this.offTrackMessage = data.offTrackMessage;
        }
        if (data.narrativeBridge !== undefined) {
            this.narrativeBridge = data.narrativeBridge;
        }
        if (data.journalRef !== undefined) {
            this.journalRef = data.journalRef;
        }

        this.render(false);
    }

    /**
     * Appends new transcription segment
     * @param {Object} segment - Transcription segment
     * @param {string} segment.speaker - Speaker name
     * @param {string} segment.text - Transcribed text
     * @param {number} [segment.timestamp] - Timestamp in seconds
     */
    appendTranscription(segment) {
        this.transcriptionSegments.push({
            speaker: segment.speaker || 'Unknown',
            text: segment.text,
            timestamp: segment.timestamp || Date.now()
        });

        // Update combined transcription text
        this.transcription = this.transcriptionSegments.map(s => s.text).join(' ');

        this.render(false);
    }

    /**
     * Adds a generated image to the panel
     * @param {Object} image - Image data
     * @param {string} image.url - Image URL or base64 data
     * @param {string} [image.prompt] - The prompt used to generate the image
     */
    addImage(image) {
        this.generatedImages.push({
            url: image.url,
            prompt: image.prompt || '',
            timestamp: Date.now()
        });

        this.render(false);
    }

    /**
     * Updates the recording state
     * @param {string} state - New recording state from RECORDING_STATE
     */
    setRecordingState(state) {
        this.recordingState = state;

        if (state === RECORDING_STATE.RECORDING) {
            this._startDurationTimer();
        } else if (state === RECORDING_STATE.INACTIVE || state === RECORDING_STATE.PROCESSING) {
            this._stopDurationTimer();
            if (state === RECORDING_STATE.INACTIVE) {
                this.recordingDuration = 0;
            }
        }

        this.render(false);
    }

    /**
     * Updates the audio level indicator
     * @param {number} level - Audio level (0-100)
     */
    setAudioLevel(level) {
        this.audioLevel = Math.max(0, Math.min(100, level));

        // Only update the level indicator without full re-render
        const levelEl = this.element?.find('.audio-level-bar');
        if (levelEl && levelEl.length) {
            levelEl.css('width', `${this.audioLevel}%`);
        }
    }

    /**
     * Sets the loading state
     * @param {boolean} loading - Whether loading
     * @param {string} [message] - Loading message
     */
    setLoading(loading, message = '') {
        this.isLoading = loading;
        this.loadingMessage = message;
        this.render(false);
    }

    /**
     * Clears the transcription data
     */
    clearTranscription() {
        this.transcription = '';
        this.transcriptionSegments = [];
        this.render(false);
    }

    /**
     * Clears the generated images
     */
    clearImages() {
        this.generatedImages = [];
        this.render(false);
    }

    /**
     * Clears the suggestions
     */
    clearSuggestions() {
        this.suggestions = [];
        this.offTrack = false;
        this.offTrackMessage = '';
        this.narrativeBridge = '';
        this.render(false);
    }

    /**
     * Clears all panel content
     */
    clearAll() {
        this.clearTranscription();
        this.clearSuggestions();
        this.clearImages();
        this.journalRef = '';
        this.render(false);
    }

    /**
     * Starts the recording duration timer
     * @private
     */
    _startDurationTimer() {
        this._stopDurationTimer();
        this._durationTimer = setInterval(() => {
            this.recordingDuration++;
            this.render(false);
        }, 1000);
    }

    /**
     * Stops the recording duration timer
     * @private
     */
    _stopDurationTimer() {
        if (this._durationTimer) {
            clearInterval(this._durationTimer);
            this._durationTimer = null;
        }
    }

    /**
     * Saves the current panel position to settings
     * @override
     */
    async close(options = {}) {
        // Save position before closing
        if (this.position) {
            await this.settingsManager.setPanelPosition({
                top: this.position.top,
                left: this.position.left
            });
        }

        // Clean up timer
        this._stopDurationTimer();

        return super.close(options);
    }

    /**
     * Restores panel position from settings
     * @override
     */
    setPosition(options = {}) {
        // On first render, restore position from settings
        if (!this._positionRestored) {
            const savedPosition = this.settingsManager.getPanelPosition();
            if (savedPosition && savedPosition.top && savedPosition.left) {
                options.top = savedPosition.top;
                options.left = savedPosition.left;
            }
            this._positionRestored = true;
        }

        return super.setPosition(options);
    }
}

// Export for use in other modules
export { MODULE_ID };
