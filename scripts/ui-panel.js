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
 * Provides AI suggestions, off-track detection, and recording controls
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
         * Number of journals loaded for AI context
         * @type {number}
         */
        this.journalCount = 0;

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
         * Whether the module is loading/processing
         * @type {boolean}
         */
        this.isLoading = false;

        /**
         * Loading message to display
         * @type {string}
         */
        this.loadingMessage = '';

        /**
         * Internal transcription text for image generation context
         * @type {string}
         * @private
         */
        this._lastTranscription = '';

        /**
         * Current gallery filter selection
         * @type {string}
         */
        this.galleryFilter = 'all';

        /**
         * Current gallery search query
         * @type {string}
         */
        this.searchQuery = '';

        /**
         * Filtered gallery images to display
         * @type {Array}
         */
        this.galleryImages = [];

        /**
         * Callback for gallery operations (toggle favorite, add tag, etc.)
         * @type {Function|null}
         */
        this.onGalleryAction = null;
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
                initial: 'assistant'
            }]
        });
    }

    /**
     * Gets data for the Handlebars template
     * @returns {Object} Template data
     */
    getData() {
        // Build journal status text
        let journalStatusText;
        if (this.journalCount > 0) {
            journalStatusText = game.i18n.format('NARRATOR.Panel.JournalStatus', { count: this.journalCount });
        } else {
            journalStatusText = game.i18n.localize('NARRATOR.Panel.JournalStatusEmpty');
        }

        // Filter gallery images based on current filter and search
        const filteredImages = this._filterGalleryImages();

        // Process images to add tagsString for data attribute
        const processedImages = filteredImages.map(img => ({
            ...img,
            tagsString: img.tags ? img.tags.join(',') : ''
        }));

        // Extract unique categories from all images (not just filtered)
        const allCategories = [...new Set(
            this.generatedImages
                .map(img => img.category)
                .filter(cat => cat && cat.trim().length > 0)
        )].sort();

        return {
            // Module info
            moduleId: MODULE_ID,

            // AI suggestions
            suggestions: this.suggestions,
            hasSuggestions: this.suggestions.length > 0,

            // Off-track detection
            offTrack: this.offTrack,
            offTrackMessage: this.offTrackMessage,
            narrativeBridge: this.narrativeBridge,
            hasNarrativeBridge: this.narrativeBridge.length > 0,

            // Journal status
            journalCount: this.journalCount,
            journalStatusText,

            // Generated images (filtered)
            generatedImages: processedImages,
            hasImages: processedImages.length > 0,

            // Gallery metadata
            imageCategories: allCategories,
            hasCategories: allCategories.length > 0,

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
                assistantTab: game.i18n.localize('NARRATOR.Panel.AssistantTab'),
                imagesTab: game.i18n.localize('NARRATOR.Panel.ImagesTab'),
                noSuggestions: game.i18n.localize('NARRATOR.Panel.NoSuggestions'),
                noImages: game.i18n.localize('NARRATOR.Panel.NoImages'),
                offTrackWarning: game.i18n.localize('NARRATOR.Panel.OffTrackWarning'),
                returnToStory: game.i18n.localize('NARRATOR.Panel.ReturnToStory'),
                noApiKey: game.i18n.localize('NARRATOR.Panel.NoApiKey'),
                configureSettings: game.i18n.localize('NARRATOR.Panel.ConfigureSettings'),
                processing: game.i18n.localize('NARRATOR.Panel.Processing'),
                clearImages: game.i18n.localize('NARRATOR.Panel.ClearImages'),
                copyToClipboard: game.i18n.localize('NARRATOR.Panel.CopyToClipboard'),
                listeningStatus: game.i18n.localize('NARRATOR.Panel.ListeningStatus'),
                filterLabel: game.i18n.localize('NARRATOR.Gallery.FilterLabel'),
                filterAll: game.i18n.localize('NARRATOR.Gallery.FilterAll'),
                filterFavorites: game.i18n.localize('NARRATOR.Gallery.FilterFavorites'),
                filterByCategory: game.i18n.localize('NARRATOR.Gallery.FilterByCategory'),
                searchPlaceholder: game.i18n.localize('NARRATOR.Gallery.SearchPlaceholder'),
                clearSearch: game.i18n.localize('NARRATOR.Gallery.ClearSearch'),
                toggleFavorite: game.i18n.localize('NARRATOR.Gallery.ToggleFavorite'),
                manageTags: game.i18n.localize('NARRATOR.Gallery.ManageTags'),
                showToPlayers: game.i18n.localize('NARRATOR.Gallery.ShowToPlayers'),
                deleteImage: game.i18n.localize('NARRATOR.Gallery.DeleteImage'),
                favoriteImage: game.i18n.localize('NARRATOR.Gallery.FavoriteImage'),
                categoryLabel: game.i18n.localize('NARRATOR.Gallery.CategoryLabel')
            }
        };
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
     * Filters gallery images based on current filter and search query
     * @returns {Array} Filtered images
     * @private
     */
    _filterGalleryImages() {
        let filtered = [...this.generatedImages];

        // Apply filter
        if (this.galleryFilter === 'favorites') {
            filtered = filtered.filter(img => img.isFavorite);
        } else if (this.galleryFilter.startsWith('category:')) {
            const category = this.galleryFilter.substring(9);
            filtered = filtered.filter(img => img.category === category);
        }

        // Apply search query
        if (this.searchQuery && this.searchQuery.trim().length > 0) {
            const query = this.searchQuery.toLowerCase().trim();
            filtered = filtered.filter(img => {
                // Search in prompt
                const promptMatch = img.prompt && img.prompt.toLowerCase().includes(query);

                // Search in tags
                const tagsMatch = img.tags && img.tags.some(tag =>
                    tag.toLowerCase().includes(query)
                );

                // Search in category
                const categoryMatch = img.category && img.category.toLowerCase().includes(query);

                return promptMatch || tagsMatch || categoryMatch;
            });
        }

        return filtered;
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

        // Clear buttons
        html.find('.clear-images').click(this._onClearImages.bind(this));

        // Copy to clipboard
        html.find('.copy-suggestions').click(this._onCopySuggestions.bind(this));

        // Settings link
        html.find('.open-settings').click(this._onOpenSettings.bind(this));

        // Image actions
        html.find('.image-item').click(this._onImageClick.bind(this));
        html.find('.delete-image').click(this._onDeleteImage.bind(this));

        // Narrative bridge copy
        html.find('.copy-bridge').click(this._onCopyNarrativeBridge.bind(this));

        // Gallery controls
        html.find('.gallery-filter-select').change(this._onFilterGallery.bind(this));
        html.find('.gallery-search-input').on('input', this._onSearchGallery.bind(this));
        html.find('.clear-search').click(this._onClearSearch.bind(this));

        // Gallery image actions
        html.find('.action-favorite').click(this._onToggleFavorite.bind(this));
        html.find('.action-tag').click(this._onManageTags.bind(this));
        html.find('.action-show').click(this._onShowImage.bind(this));
        html.find('.action-delete').click(this._onDeleteImage.bind(this));
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
            const context = this._lastTranscription;
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
     * Handles clear images button click
     * @param {Event} event - Click event
     * @private
     */
    _onClearImages(event) {
        event.preventDefault();
        this.clearImages();
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
            new ImagePopout(imageUrl, {
                title: game.i18n.localize('NARRATOR.Panel.GeneratedImage'),
                shareable: true
            }).render(true);
        }
    }

    /**
     * Handles gallery filter dropdown change
     * @param {Event} event - Change event
     * @private
     */
    _onFilterGallery(event) {
        event.preventDefault();
        this.galleryFilter = event.currentTarget.value;
        this.render(false);
    }

    /**
     * Handles gallery search input
     * @param {Event} event - Input event
     * @private
     */
    _onSearchGallery(event) {
        event.preventDefault();
        this.searchQuery = event.currentTarget.value;
        this.render(false);
    }

    /**
     * Handles clear search button click
     * @param {Event} event - Click event
     * @private
     */
    _onClearSearch(event) {
        event.preventDefault();
        this.searchQuery = '';
        const searchInput = this.element?.find('.gallery-search-input');
        if (searchInput && searchInput.length) {
            searchInput.val('');
        }
        this.render(false);
    }

    /**
     * Handles toggle favorite button click
     * @param {Event} event - Click event
     * @private
     */
    async _onToggleFavorite(event) {
        event.preventDefault();
        event.stopPropagation();

        const index = parseInt(event.currentTarget.dataset.index);
        if (!isNaN(index) && index >= 0 && index < this.generatedImages.length) {
            const image = this.generatedImages[index];

            if (this.onGalleryAction) {
                await this.onGalleryAction('toggleFavorite', { imageId: image.id });
            } else {
                // Fallback: toggle locally if no callback
                image.isFavorite = !image.isFavorite;
                this.render(false);
            }
        }
    }

    /**
     * Handles manage tags button click
     * @param {Event} event - Click event
     * @private
     */
    async _onManageTags(event) {
        event.preventDefault();
        event.stopPropagation();

        const index = parseInt(event.currentTarget.dataset.index);
        if (!isNaN(index) && index >= 0 && index < this.generatedImages.length) {
            const image = this.generatedImages[index];

            // Show dialog to add/remove tags
            const currentTags = image.tags || [];
            const tagsString = currentTags.join(', ');

            const newTagsString = await Dialog.prompt({
                title: game.i18n.localize('NARRATOR.Gallery.ManageTags'),
                content: `
                    <form>
                        <div class="form-group">
                            <label>${game.i18n.localize('NARRATOR.Gallery.TagsLabel')}</label>
                            <input type="text" name="tags" value="${tagsString}"
                                   placeholder="${game.i18n.localize('NARRATOR.Gallery.TagsPlaceholder')}" />
                            <p class="notes">${game.i18n.localize('NARRATOR.Gallery.TagsHint')}</p>
                        </div>
                    </form>
                `,
                callback: (html) => {
                    return html.find('[name="tags"]').val();
                },
                rejectClose: false
            });

            if (newTagsString !== null && newTagsString !== undefined) {
                const newTags = newTagsString
                    .split(',')
                    .map(tag => tag.trim())
                    .filter(tag => tag.length > 0);

                if (this.onGalleryAction) {
                    await this.onGalleryAction('setTags', { imageId: image.id, tags: newTags });
                } else {
                    // Fallback: update locally if no callback
                    image.tags = newTags;
                    this.render(false);
                }
            }
        }
    }

    /**
     * Handles show image to players button click
     * @param {Event} event - Click event
     * @private
     */
    async _onShowImage(event) {
        event.preventDefault();
        event.stopPropagation();

        const index = parseInt(event.currentTarget.dataset.index);
        if (!isNaN(index) && index >= 0 && index < this.generatedImages.length) {
            const image = this.generatedImages[index];

            // Use Foundry's ImagePopout to show to all players
            if (image.url) {
                new ImagePopout(image.url, {
                    title: image.prompt || game.i18n.localize('NARRATOR.Panel.GeneratedImage'),
                    shareable: true
                }).render(true);

                // Notify that image is being shared
                ui.notifications.info(game.i18n.localize('NARRATOR.Gallery.ImageShown'));
            }
        }
    }

    /**
     * Handles delete image button click
     * @param {Event} event - Click event
     * @private
     */
    async _onDeleteImage(event) {
        event.preventDefault();
        event.stopPropagation();

        const index = parseInt(event.currentTarget.dataset.index);
        if (!isNaN(index) && index >= 0 && index < this.generatedImages.length) {
            const image = this.generatedImages[index];

            // Confirm deletion
            const confirmed = await Dialog.confirm({
                title: game.i18n.localize('NARRATOR.Gallery.DeleteImage'),
                content: `<p>${game.i18n.localize('NARRATOR.Gallery.DeleteConfirm')}</p>`,
                yes: () => true,
                no: () => false,
                defaultYes: false
            });

            if (confirmed) {
                if (this.onGalleryAction) {
                    await this.onGalleryAction('deleteImage', { imageId: image.id });
                } else {
                    // Fallback: delete locally if no callback
                    this.generatedImages.splice(index, 1);
                    this.render(false);
                }
            }
        }
    }

    /**
     * Updates the panel with new content data
     * @param {Object} data - Content data to update
     * @param {Array<string>} [data.suggestions] - New AI suggestions
     * @param {boolean} [data.offTrack] - Off-track status
     * @param {string} [data.offTrackMessage] - Off-track warning message
     * @param {string} [data.narrativeBridge] - Narrative bridge suggestion
     * @param {number} [data.journalCount] - Number of journals loaded
     */
    updateContent(data) {
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
        if (data.journalCount !== undefined) {
            this.journalCount = data.journalCount;
        }

        this.render(false);
    }

    /**
     * Sets the last transcription text (used internally for image generation context)
     * @param {string} text - Transcribed text
     */
    setLastTranscription(text) {
        this._lastTranscription = text;
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
     * Updates the gallery with new images (typically from ImageGenerator)
     * @param {Array} images - Array of gallery images
     */
    updateGallery(images) {
        this.generatedImages = images || [];
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
        this.clearSuggestions();
        this.clearImages();
        this._lastTranscription = '';
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
        if (this.position) {
            await this.settingsManager.setPanelPosition({
                top: this.position.top,
                left: this.position.left
            });
        }

        this._stopDurationTimer();

        return super.close(options);
    }

    /**
     * Restores panel position from settings
     * @override
     */
    setPosition(options = {}) {
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
