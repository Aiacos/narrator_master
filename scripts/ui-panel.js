/**
 * NarratorPanel - DM Interface Panel for Narrator Master
 * Extends Foundry VTT Application class for the main DM control panel
 * @module ui-panel
 */

import { MODULE_ID, SettingsManager } from './settings.js';
import { debounce } from './dom-utils.js';

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
         * Transcript segments with speaker labels
         * @type {Array<{speaker: string, text: string, timestamp: number}>}
         */
        this.transcriptSegments = [];

        /**
         * NPC dialogue suggestions
         * @type {Object}
         */
        this.npcDialogue = {};

        /**
         * Speaker label service instance
         * @type {SpeakerLabelService|null}
         */
        this.speakerLabelService = null;

        /**
         * Scene segments with scene type and timestamp
         * @type {Array<{type: string, timestamp: number, isManual: boolean, index: number}>}
         */
        this.sceneSegments = [];

        /**
         * Callback for manual scene break marking
         * @type {Function|null}
         */
        this.onMarkSceneBreak = null;

        /**
         * Rules Q&A answers
         * @type {Array<{question: string, answer: string, citation: string, source: string, expanded: boolean, confidence: string, type: string, timestamp: number}>}
         */
        this.rulesAnswers = [];

        /**
         * Current chapter information for focused context
         * @type {Object|null}
         * @property {string} id - Chapter ID
         * @property {string} title - Chapter title
         * @property {string} content - Chapter content
         */
        this.currentChapter = null;

        /**
         * List of subchapters for navigation
         * @type {Array<{id: string, title: string, level: number}>}
         */
        this.subchapters = [];

        /**
         * Whether silence recovery mode is active
         * @type {boolean}
         */
        this.silenceRecoveryActive = false;

        /**
         * Recovery options for silence recovery
         * @type {Array<{id: string, label: string, type: string, pageId?: string, journalName?: string, description?: string, isSuggested?: boolean}>}
         */
        this.recoveryOptions = [];

        /**
         * Callback for subchapter click events
         * @type {Function|null}
         */
        this.onSubchapterClick = null;

        /**
         * Debounced version of render() for non-critical updates
         * Delays rendering by 150ms to batch multiple rapid updates
         * @type {Function}
         * @private
         */
        this._debouncedRender = debounce(() => {
            this.render(false);
        }, 150);
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
            tabs: [
                {
                    navSelector: '.tabs',
                    contentSelector: '.tab-content',
                    initial: 'assistant'
                }
            ]
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
            journalStatusText = game.i18n.format('NARRATOR.Panel.JournalStatus', {
                count: this.journalCount
            });
        } else {
            journalStatusText = game.i18n.localize('NARRATOR.Panel.JournalStatusEmpty');
        }

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

            // Generated images
            generatedImages: this.generatedImages,
            hasImages: this.generatedImages.length > 0,

            // Transcript segments
            transcriptEntries: this.transcriptSegments,
            hasTranscript: this.transcriptSegments.length > 0,

            // Scene segments
            sceneSegments: this.sceneSegments,
            hasScenes: this.sceneSegments.length > 0,

            // Merged transcript with scene breaks
            transcriptWithScenes: this._mergeTranscriptWithScenes(),

            // NPC dialogue
            npcDialogueList: Object.keys(this.npcDialogue).map((npcName) => ({
                name: npcName,
                dialogues: this.npcDialogue[npcName]
            })),
            hasNPCDialogue: Object.keys(this.npcDialogue).length > 0,

            // Rules Q&A
            rulesAnswers: this.rulesAnswers,
            hasRules: this.rulesAnswers.length > 0,

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

            // Chapter navigation
            currentChapter: this.currentChapter,
            hasChapter: this.currentChapter !== null,
            subchapters: this.subchapters,
            hasSubchapters: this.subchapters.length > 0,
            silenceRecoveryActive: this.silenceRecoveryActive,
            recoveryOptions: this.recoveryOptions,
            hasRecoveryOptions: this.recoveryOptions.length > 0,

            // Localization keys for template
            i18n: {
                startRecording: game.i18n.localize('NARRATOR.Panel.StartRecording'),
                stopRecording: game.i18n.localize('NARRATOR.Panel.StopRecording'),
                pauseRecording: game.i18n.localize('NARRATOR.Panel.PauseRecording'),
                resumeRecording: game.i18n.localize('NARRATOR.Panel.ResumeRecording'),
                // Accessibility-specific aria-labels
                startRecordingAriaLabel: game.i18n.localize(
                    'NARRATOR.Accessibility.StartRecordingButton'
                ),
                stopRecordingAriaLabel: game.i18n.localize(
                    'NARRATOR.Accessibility.StopRecordingButton'
                ),
                pauseRecordingAriaLabel: game.i18n.localize(
                    'NARRATOR.Accessibility.PauseRecordingButton'
                ),
                resumeRecordingAriaLabel: game.i18n.localize(
                    'NARRATOR.Accessibility.ResumeRecordingButton'
                ),
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
                transcriptTab: game.i18n.localize('NARRATOR.Panel.TranscriptTab'),
                noTranscript: game.i18n.localize('NARRATOR.Panel.NoTranscript'),
                clearTranscript: game.i18n.localize('NARRATOR.Panel.ClearTranscript'),
                exportTranscript: game.i18n.localize('NARRATOR.Panel.ExportTranscript'),
                markSceneBreak: game.i18n.localize('NARRATOR.Scenes.MarkSceneBreak'),
                npcDialogueTitle: game.i18n.localize('NARRATOR.Panel.NPCDialogueTitle'),
                copyDialogue: game.i18n.localize('NARRATOR.Panel.CopyDialogue'),
                // Rules
                noRulesDetected: game.i18n.localize('NARRATOR.Rules.NoRulesDetected'),
                questionDetected: game.i18n.localize('NARRATOR.Rules.QuestionDetected'),
                answer: game.i18n.localize('NARRATOR.Rules.Answer'),
                source: game.i18n.localize('NARRATOR.Rules.Source'),
                citation: game.i18n.localize('NARRATOR.Rules.Citation'),
                expandAnswer: game.i18n.localize('NARRATOR.Rules.ExpandAnswer'),
                collapseAnswer: game.i18n.localize('NARRATOR.Rules.CollapseAnswer'),
                dismissRule: game.i18n.localize('NARRATOR.Rules.DismissRule'),
                copyAnswer: game.i18n.localize('NARRATOR.Rules.CopyAnswer'),
                clearAllRules: game.i18n.localize('NARRATOR.Rules.ClearAllRules'),
                // Chapter navigation - keys must match template exactly
                currentChapter: game.i18n.localize('NARRATOR.Chapter.CurrentChapter'),
                subchapters: game.i18n.localize('NARRATOR.Panel.Subchapters') || 'Sottocapitoli',
                noChapterDetected: game.i18n.localize('NARRATOR.Chapter.NoChapterDetected'),
                selectChapterHint:
                    game.i18n.localize('NARRATOR.Panel.SelectChapterHint') ||
                    'Seleziona un journal o cambia scena',
                backToParent: game.i18n.localize('NARRATOR.Panel.BackToParent') || 'Torna indietro',
                navigateToChapter: game.i18n.localize('NARRATOR.Panel.NavigateToChapter') || 'Vai a',
                // Silence recovery
                silenceRecoveryTitle: game.i18n.localize('NARRATOR.Silence.RecoveryTitle'),
                whereToResume: game.i18n.localize('NARRATOR.Silence.WhereToResume'),
                noChapterContext: game.i18n.localize('NARRATOR.Silence.NoChapterContext'),
                continueListening:
                    game.i18n.localize('NARRATOR.Panel.ContinueListening') || 'Continua ad ascoltare',
                dismissRecovery: game.i18n.localize('NARRATOR.Silence.DismissRecovery') || 'Chiudi'
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
     * Formats Unix timestamp to HH:MM:SS format
     * @param {number} timestamp - Unix timestamp in milliseconds
     * @returns {string} Formatted time string
     * @private
     */
    _formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
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

        // NPC dialogue copy
        html.find('.copy-npc-dialogue').click(this._onCopyNPCDialogue.bind(this));

        // Transcript controls
        html.find('.speaker-label').click(this._onSpeakerLabelClick.bind(this));
        html.find('.copy-transcript').click(this._onCopyTranscript.bind(this));
        html.find('.export-transcript').click(this._onExportTranscript.bind(this));
        html.find('.clear-transcript').click(this._onClearTranscript.bind(this));

        // Scene break controls
        html.find('.mark-scene-break').click(this._onMarkSceneBreak.bind(this));

        // Rules controls
        html.find('.expand-rule').click(this._onExpandRule.bind(this));
        html.find('.dismiss-rule').click(this._onDismissRule.bind(this));
        html.find('.copy-rule-answer').click(this._onCopyRuleAnswer.bind(this));
        html.find('.clear-rules').click(this._onClearRules.bind(this));

        // Chapter navigation controls
        html.find('.subchapter-btn').click(this._onSubchapterItemClick.bind(this));
        html.find('.chapter-back-btn').click(this._onChapterBackClick.bind(this));
        html.find('.dismiss-recovery').click(this._onDismissSilenceRecovery.bind(this));
        html.find('.recovery-option-btn').click(this._onRecoveryOptionClick.bind(this));
        html.find('.continue-listening-btn').click(this._onDismissSilenceRecovery.bind(this));
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
    async _onClearImages(event) {
        event.preventDefault();

        // Show confirmation dialog
        const confirmed = await Dialog.confirm({
            title: game.i18n.localize('NARRATOR.Panel.ClearImages'),
            content: `<p>${game.i18n.localize('NARRATOR.Panel.ConfirmClearImages')}</p>`,
            yes: () => true,
            no: () => false,
            defaultYes: false
        });

        if (confirmed) {
            this.clearImages();
        }
    }

    /**
     * Handles copy suggestions button click
     * @param {Event} event - Click event
     * @private
     */
    async _onCopySuggestions(event) {
        event.preventDefault();
        const text = this.suggestions.join('\n\n');
        await this._copyToClipboard(text, event);
    }

    /**
     * Handles copy narrative bridge button click
     * @param {Event} event - Click event
     * @private
     */
    async _onCopyNarrativeBridge(event) {
        event.preventDefault();
        await this._copyToClipboard(this.narrativeBridge, event);
    }

    /**
     * Handles copy NPC dialogue button click
     * @param {Event} event - Click event
     * @private
     */
    async _onCopyNPCDialogue(event) {
        event.preventDefault();
        const button = event.currentTarget;
        const dialogue = button.dataset.dialogue;
        await this._copyToClipboard(dialogue);
    }

    /**
     * Copies text to clipboard
     * @param {string} text - Text to copy
     * @param {Event} event - Click event to provide visual feedback
     * @private
     */
    async _copyToClipboard(text, event) {
        try {
            await navigator.clipboard.writeText(text);
            ui.notifications.info(game.i18n.localize('NARRATOR.Notifications.CopiedToClipboard'));

            // Add visual feedback to the button
            if (event && event.currentTarget) {
                const button = event.currentTarget;
                button.classList.add('copy-success');

                // Remove the class after animation completes (1.5s)
                setTimeout(() => {
                    button.classList.remove('copy-success');
                }, 1500);
            }
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
     * Handles delete image button click
     * @param {Event} event - Click event
     * @private
     */
    async _onDeleteImage(event) {
        event.preventDefault();
        event.stopPropagation();

        const index = parseInt(event.currentTarget.dataset.index);
        if (!isNaN(index) && index >= 0 && index < this.generatedImages.length) {
            // Show confirmation dialog
            const confirmed = await Dialog.confirm({
                title: game.i18n.localize('NARRATOR.Images.Delete'),
                content: `<p>${game.i18n.localize('NARRATOR.Panel.ConfirmDeleteImage')}</p>`,
                yes: () => true,
                no: () => false,
                defaultYes: false
            });

            if (confirmed) {
                this.generatedImages.splice(index, 1);
                this.render(false);
            }
        }
    }

    /**
     * Handles speaker label click to edit
     * @param {Event} event - Click event
     * @private
     */
    async _onSpeakerLabelClick(event) {
        event.preventDefault();
        event.stopPropagation();

        if (!this.speakerLabelService) {
            return;
        }

        const speakerElement = event.currentTarget;
        const originalSpeaker = speakerElement.textContent.trim();

        // Create input element
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'speaker-label-input';
        input.value = originalSpeaker;
        input.placeholder = game.i18n.localize('NARRATOR.SpeakerLabels.NamePlaceholder');

        // Replace the speaker label with the input
        speakerElement.style.display = 'none';
        speakerElement.parentElement.appendChild(input);
        input.focus();
        input.select();

        // Save on blur or Enter key
        const saveLabel = async () => {
            const newLabel = input.value.trim();

            if (newLabel && newLabel !== originalSpeaker) {
                try {
                    // Find the original speaker ID from the entry
                    const entryElement = speakerElement.closest('.transcript-segment');
                    const originalSpeakerId = entryElement?.dataset.speaker || originalSpeaker;

                    await this.speakerLabelService.setLabel(originalSpeakerId, newLabel);

                    // Update all transcript segments with this speaker
                    this._updateTranscriptSpeakers(originalSpeakerId, newLabel);

                    ui.notifications.info(
                        game.i18n.format('NARRATOR.SpeakerLabels.NameAssigned', {
                            speaker: newLabel
                        })
                    );

                    // Re-render the panel to show updated labels
                    this.render(false);
                } catch (error) {
                    ui.notifications.error(error.message);
                    // Restore original display
                    input.remove();
                    speakerElement.style.display = '';
                }
            } else {
                // Restore original display without changes
                input.remove();
                speakerElement.style.display = '';
            }
        };

        // Handle blur event
        input.addEventListener('blur', saveLabel);

        // Handle key events
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                input.blur(); // Trigger save via blur handler
            } else if (e.key === 'Escape') {
                e.preventDefault();
                // Cancel editing - restore original display
                input.remove();
                speakerElement.style.display = '';
            }
        });
    }

    /**
     * Handles copy transcript button click
     * @param {Event} event - Click event
     * @private
     */
    async _onCopyTranscript(event) {
        event.preventDefault();

        if (this.transcriptSegments.length === 0) {
            return;
        }

        // Format transcript as text with scene breaks
        const text = this._formatTranscriptWithScenes();

        await this._copyToClipboard(text, event);
    }

    /**
     * Handles export transcript button click
     * @param {Event} event - Click event
     * @private
     */
    _onExportTranscript(event) {
        event.preventDefault();

        if (this.transcriptSegments.length === 0) {
            return;
        }

        try {
            // Format transcript as text with scene breaks
            const text = this._formatTranscriptWithScenes();

            // Create blob and download
            const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const filename = `narrator-transcript-${timestamp}.txt`;

            // Create temporary download link
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();

            // Cleanup
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 100);

            ui.notifications.info(game.i18n.localize('NARRATOR.Notifications.TranscriptExported'));
        } catch (error) {
            ui.notifications.error(game.i18n.localize('NARRATOR.Errors.ExportFailed'));
        }
    }

    /**
     * Handles clear transcript button click
     * @param {Event} event - Click event
     * @private
     */
    async _onClearTranscript(event) {
        event.preventDefault();

        // Show confirmation dialog
        const confirmed = await Dialog.confirm({
            title: game.i18n.localize('NARRATOR.Panel.ClearTranscript'),
            content: `<p>${game.i18n.localize('NARRATOR.Panel.ConfirmClearTranscript')}</p>`,
            yes: () => true,
            no: () => false,
            defaultYes: false
        });

        if (confirmed) {
            this.clearTranscript();
        }
    }

    /**
     * Handles mark scene break button click
     * @param {Event} event - Click event
     * @private
     */
    async _onMarkSceneBreak(event) {
        event.preventDefault();

        // Show dialog to select scene type
        const sceneType = await this._showSceneTypeDialog();

        if (sceneType && this.onMarkSceneBreak) {
            await this.onMarkSceneBreak(sceneType);
        }
    }

    /**
     * Shows a dialog to select scene type
     * @returns {Promise<string|null>} Selected scene type or null if canceled
     * @private
     */
    async _showSceneTypeDialog() {
        return new Promise((resolve) => {
            const dialog = new Dialog({
                title: game.i18n.localize('NARRATOR.Scenes.MarkSceneBreak'),
                content: `
                    <div class="form-group">
                        <label>${game.i18n.localize('NARRATOR.Scenes.SelectSceneType')}</label>
                        <select id="scene-type-select" style="width: 100%;">
                            <option value="exploration">${game.i18n.localize('NARRATOR.Scenes.SceneTypeExploration')}</option>
                            <option value="combat">${game.i18n.localize('NARRATOR.Scenes.SceneTypeCombat')}</option>
                            <option value="social">${game.i18n.localize('NARRATOR.Scenes.SceneTypeSocial')}</option>
                            <option value="rest">${game.i18n.localize('NARRATOR.Scenes.SceneTypeRest')}</option>
                        </select>
                    </div>
                `,
                buttons: {
                    ok: {
                        icon: '<i class="fas fa-check"></i>',
                        label: game.i18n.localize('NARRATOR.Scenes.MarkBreak'),
                        callback: (html) => {
                            const select = html.find('#scene-type-select')[0];
                            resolve(select.value);
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: game.i18n.localize('Cancel'),
                        callback: () => resolve(null)
                    }
                },
                default: 'ok',
                close: () => resolve(null)
            });

            dialog.render(true);
        });
    }

    /**
     * Handles expand/collapse rule answer button click
     * @param {Event} event - Click event
     * @private
     */
    _onExpandRule(event) {
        event.preventDefault();
        const index = parseInt($(event.currentTarget).data('index'));

        if (index >= 0 && index < this.rulesAnswers.length) {
            this.rulesAnswers[index].expanded = !this.rulesAnswers[index].expanded;
            this.render(false);
        }
    }

    /**
     * Handles dismiss rule button click
     * @param {Event} event - Click event
     * @private
     */
    _onDismissRule(event) {
        event.preventDefault();
        const index = parseInt($(event.currentTarget).data('index'));

        if (index >= 0 && index < this.rulesAnswers.length) {
            this.rulesAnswers.splice(index, 1);
            this.render(false);
        }
    }

    /**
     * Handles copy rule answer button click
     * @param {Event} event - Click event
     * @private
     */
    async _onCopyRuleAnswer(event) {
        event.preventDefault();
        const index = parseInt($(event.currentTarget).data('index'));

        if (index >= 0 && index < this.rulesAnswers.length) {
            const rule = this.rulesAnswers[index];
            const text = `${game.i18n.localize('NARRATOR.Rules.QuestionDetected')}: ${rule.question}\n\n${game.i18n.localize('NARRATOR.Rules.Answer')}: ${rule.answer}\n\n${game.i18n.localize('NARRATOR.Rules.Source')}: ${rule.citation}`;
            await this._copyToClipboard(text);
            ui.notifications.info(game.i18n.localize('NARRATOR.Rules.RuleAnswerCopied'));
        }
    }

    /**
     * Handles clear all rules button click
     * @param {Event} event - Click event
     * @private
     */
    _onClearRules(event) {
        event.preventDefault();
        this.clearRules();
    }

    /**
     * Handles subchapter item click for chapter navigation
     * @param {Event} event - Click event
     * @private
     */
    _onSubchapterItemClick(event) {
        event.preventDefault();
        const chapterId = event.currentTarget.dataset.chapterId;
        if (chapterId) {
            this._handleSubchapterClick(chapterId);
        }
    }

    /**
     * Handles dismiss silence recovery button click
     * @param {Event} event - Click event
     * @private
     */
    _onDismissSilenceRecovery(event) {
        event.preventDefault();
        this.hideSilenceRecovery();
    }

    /**
     * Handles chapter back button click
     * @param {Event} event - Click event
     * @private
     */
    _onChapterBackClick(event) {
        event.preventDefault();
        const chapterId = event.currentTarget.dataset.chapterId;
        if (chapterId) {
            this._handleSubchapterClick(chapterId);
        }
    }

    /**
     * Handles recovery option button click
     * @param {Event} event - Click event
     * @private
     */
    _onRecoveryOptionClick(event) {
        event.preventDefault();
        const optionId = event.currentTarget.dataset.optionId;
        const optionType = event.currentTarget.dataset.optionType;
        const pageId = event.currentTarget.dataset.pageId;

        // Log for debugging
        if (typeof console !== 'undefined') {
            console.warn(`[Narrator Master] Recovery option selected: ${optionId} (type: ${optionType})`);
        }

        // Navigate to chapter based on selection
        if (pageId) {
            this._handleSubchapterClick(pageId);
        } else if (optionId) {
            this._handleSubchapterClick(optionId);
        }

        // Hide recovery UI
        this.hideSilenceRecovery();
    }

    /**
     * Updates the panel with new content data
     * @param {Object} data - Content data to update
     * @param {Array<string>} [data.suggestions] - New AI suggestions
     * @param {boolean} [data.offTrack] - Off-track status
     * @param {string} [data.offTrackMessage] - Off-track warning message
     * @param {string} [data.narrativeBridge] - Narrative bridge suggestion
     * @param {number} [data.journalCount] - Number of journals loaded
     * @param {Array<Object>} [data.rulesAnswers] - Rules Q&A answers
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
        if (data.rulesAnswers !== undefined) {
            this.rulesAnswers = data.rulesAnswers;
        }

        this.render(false);
    }

    /**
     * Updates NPC dialogue suggestions
     * @param {Object} data - NPC dialogue data to update
     * @param {Object} [data.npcDialogue] - NPC dialogue suggestions object (key: NPC name, value: array of dialogue options)
     */
    updateNPCDialogue(data) {
        if (data.npcDialogue !== undefined) {
            this.npcDialogue = data.npcDialogue;
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
     * Updates the recording duration display without full re-render
     * @private
     */
    _updateDurationDisplay() {
        // Only update the duration display without full re-render
        const durationEl = this.element?.find('.recording-duration');
        if (durationEl && durationEl.length) {
            durationEl.text(this._formatDuration(this.recordingDuration));
        }
    }

    /**
     * Appends a single transcript segment to the DOM without full re-render
     * @param {Object} segment - Transcript segment to append
     * @param {string} segment.speaker - Speaker label
     * @param {string} segment.text - Transcript text
     * @param {number} segment.timestamp - Timestamp in milliseconds
     * @private
     */
    _appendTranscriptSegment(segment) {
        if (!segment || !segment.speaker || !segment.text) {
            return;
        }

        // Check if the transcript list exists
        const transcriptList = this.element?.find('.transcript-list');
        if (!transcriptList || !transcriptList.length) {
            return;
        }

        // Format the timestamp
        const formattedTimestamp = this._formatTimestamp(segment.timestamp);

        // Create the segment DOM element
        const segmentHtml = `
            <div class="transcript-segment" data-speaker="${segment.speaker}" data-timestamp="${segment.timestamp}">
                <div class="segment-header">
                    <span class="speaker-label">${segment.speaker}</span>
                    <span class="transcript-timestamp">${formattedTimestamp}</span>
                </div>
                <div class="transcript-text">${segment.text}</div>
            </div>
        `;

        // Append to the transcript list
        transcriptList.append(segmentHtml);
    }

    /**
     * Updates the loading overlay without full re-render
     * @private
     */
    _updateLoadingState() {
        // Find the loading overlay element
        const overlayEl = this.element?.find('.narrator-loading-overlay');
        if (!overlayEl || !overlayEl.length) {
            return;
        }

        // Show or hide the overlay based on loading state
        if (this.isLoading) {
            overlayEl.show();
            // Update the loading message
            const messageEl = overlayEl.find('span');
            if (messageEl && messageEl.length) {
                messageEl.text(this.loadingMessage);
            }
        } else {
            overlayEl.hide();
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
        this._updateLoadingState();
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
        this.clearTranscript();
        this.rulesAnswers = [];
        this._lastTranscription = '';
        this.render(false);
    }

    /**
     * Updates transcript segments
     * @param {Array<{speaker: string, text: string, timestamp: number}>} segments - New transcript segments
     */
    updateTranscript(segments) {
        if (!Array.isArray(segments)) {
            return;
        }

        // Apply speaker labels if service is available
        if (this.speakerLabelService) {
            this.transcriptSegments = this.speakerLabelService.applyLabelsToSegments(segments);
        } else {
            this.transcriptSegments = segments;
        }

        this.render(false);
    }

    /**
     * Adds new transcript segments to existing ones
     * @param {Array<{speaker: string, text: string, timestamp: number}>} segments - New segments to add
     */
    addTranscriptSegments(segments) {
        if (!Array.isArray(segments)) {
            return;
        }

        // Apply speaker labels if service is available
        let newSegments = segments;
        if (this.speakerLabelService) {
            newSegments = this.speakerLabelService.applyLabelsToSegments(segments);
        }

        // Add to internal array
        this.transcriptSegments.push(...newSegments);

        // Append each segment to the DOM without full re-render
        for (const segment of newSegments) {
            this._appendTranscriptSegment(segment);
        }
    }

    /**
     * Adds a scene break marker
     * @param {string} sceneType - Type of scene (exploration, combat, social, rest)
     * @param {number} timestamp - Timestamp of the scene break
     * @param {boolean} [isManual=false] - Whether this is a manually marked scene break
     */
    addSceneBreak(sceneType, timestamp, isManual = false) {
        // Validate scene type
        const validTypes = ['exploration', 'combat', 'social', 'rest'];
        if (!validTypes.includes(sceneType)) {
            console.warn(`Invalid scene type: ${sceneType}`);
            return;
        }

        // Get the index where this scene break should be inserted
        // This is the current length of transcript segments
        const index = this.transcriptSegments.length;

        // Add the scene break
        this.sceneSegments.push({
            type: sceneType,
            timestamp: timestamp,
            isManual: isManual,
            index: index
        });

        this.render(false);
    }

    /**
     * Gets the current scene (most recent scene break)
     * @returns {Object|null} Current scene object or null if no scenes
     */
    getCurrentScene() {
        if (this.sceneSegments.length === 0) {
            return null;
        }

        // Return the most recent scene
        return this.sceneSegments[this.sceneSegments.length - 1];
    }

    /**
     * Clears the transcript and scene segments
     */
    clearTranscript() {
        this.transcriptSegments = [];
        this.sceneSegments = [];
        this.render(false);
    }

    /**
     * Sets the speaker label service instance
     * @param {SpeakerLabelService} service - The speaker label service
     */
    setSpeakerLabelService(service) {
        this.speakerLabelService = service;
    }

    /**
     * Updates rules answers with new data
     * @param {Array<{question: string, answer: string, citation: string, source: string, confidence: string, type: string}>} rulesAnswers - Rules Q&A answers
     */
    updateRules(rulesAnswers) {
        if (!Array.isArray(rulesAnswers)) {
            return;
        }

        // Add expanded flag and timestamp to each rule if not present
        this.rulesAnswers = rulesAnswers.map((rule) => ({
            ...rule,
            expanded: rule.expanded !== undefined ? rule.expanded : false,
            timestamp: rule.timestamp || Date.now()
        }));

        this.render(false);
    }

    /**
     * Adds a single rule answer to existing ones
     * @param {Object} ruleAnswer - Single rule answer to add
     * @param {string} ruleAnswer.question - The detected question
     * @param {string} ruleAnswer.answer - The answer from SRD/compendium
     * @param {string} ruleAnswer.citation - Citation (source, page)
     * @param {string} [ruleAnswer.source] - Source name
     * @param {string} [ruleAnswer.confidence] - Confidence level
     * @param {string} [ruleAnswer.type] - Question type
     */
    addRuleAnswer(ruleAnswer) {
        if (!ruleAnswer || typeof ruleAnswer !== 'object') {
            return;
        }

        // Add expanded flag and timestamp
        const newRule = {
            ...ruleAnswer,
            expanded: false,
            timestamp: Date.now()
        };

        this.rulesAnswers.push(newRule);
        this.render(false);
    }

    /**
     * Clears all rules answers
     */
    clearRules() {
        this.rulesAnswers = [];
        this.render(false);
        ui.notifications.info(game.i18n.localize('NARRATOR.Rules.RulesCleared'));
    }

    /**
     * Sets the current chapter information for focused context navigation
     * Accepts data from ChapterTracker (title, path, pageId, pageName) and normalizes
     * it for template rendering (name, pageReference, parentId, parentName)
     * @param {Object|null} chapter - Chapter information object from ChapterTracker
     * @param {string} chapter.id - Unique chapter identifier
     * @param {string} chapter.title - Chapter title for display
     * @param {string} [chapter.path] - Hierarchical path (e.g. "Chapter 1 > The Tavern")
     * @param {string} [chapter.content] - Chapter content text
     * @param {string} [chapter.pageId] - Page ID containing this chapter
     * @param {string} [chapter.pageName] - Page name containing this chapter
     * @param {string} [chapter.journalName] - Journal name
     * @param {Array<{id: string, title: string, level: number}>} [chapter.subchapters] - List of subchapters
     */
    setChapterInfo(chapter) {
        if (chapter && typeof chapter === 'object') {
            // Extract parent from path for back navigation
            const pathParts = (chapter.path || '').split(' > ');
            const parentName = pathParts.length > 1 ? pathParts[pathParts.length - 2] : '';

            this.currentChapter = {
                id: chapter.id || '',
                // Template uses 'name' for display
                name: chapter.title || chapter.name || '',
                title: chapter.title || chapter.name || '',
                content: chapter.content || '',
                path: chapter.path || '',
                pageReference: chapter.pageName || '',
                parentName: parentName,
                parentId: '' // Will be set by ChapterTracker navigation if available
            };

            // Update subchapters if provided (normalize title → name for template)
            if (Array.isArray(chapter.subchapters)) {
                this.subchapters = chapter.subchapters.map((sub) => ({
                    id: sub.id || '',
                    name: sub.title || sub.name || '',
                    title: sub.title || sub.name || '',
                    level: sub.level || 1,
                    hasChildren: false
                }));
            }
        } else {
            this.currentChapter = null;
            this.subchapters = [];
        }

        // Reset silence recovery when chapter changes
        this.silenceRecoveryActive = false;

        this.render(false);
    }

    /**
     * Shows the silence recovery UI with chapter navigation options
     * Called when no transcription is received for the configured timeout period
     * @param {Object} [data={}] - Recovery context data
     * @param {Object} [data.currentChapter] - Current chapter info from ChapterTracker
     * @param {Array} [data.recoveryOptions] - Recovery options from AIAssistant
     * @param {number} [data.timeSinceLastTranscription] - Time in ms since last transcription
     */
    showSilenceRecovery(data = {}) {
        this.silenceRecoveryActive = true;

        // Update chapter info if provided
        if (data.currentChapter) {
            this.setChapterInfo(data.currentChapter);
        }

        // Update recovery options if provided
        if (Array.isArray(data.recoveryOptions)) {
            this.recoveryOptions = data.recoveryOptions;
        }

        this.render(false);
    }

    /**
     * Hides the silence recovery UI
     */
    hideSilenceRecovery() {
        this.silenceRecoveryActive = false;
        this.render(false);
    }

    /**
     * Handles subchapter navigation click
     * @param {string} chapterId - The ID of the chapter to navigate to
     * @private
     */
    _handleSubchapterClick(chapterId) {
        if (this.onSubchapterClick && typeof this.onSubchapterClick === 'function') {
            this.onSubchapterClick(chapterId);
        }
    }

    /**
     * Clears the current chapter info and subchapters
     */
    clearChapterInfo() {
        this.currentChapter = null;
        this.subchapters = [];
        this.silenceRecoveryActive = false;
        this.recoveryOptions = [];
        this.render(false);
    }

    /**
     * Sets the recovery options for silence recovery
     * @param {Array<{id: string, label: string, type: string, pageId?: string, journalName?: string, description?: string, isSuggested?: boolean}>} options
     */
    setRecoveryOptions(options) {
        this.recoveryOptions = Array.isArray(options) ? options : [];
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
            this._updateDurationDisplay();
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
     * Updates speaker labels in transcript segments retroactively
     * @param {string} originalSpeaker - The original speaker ID
     * @param {string} newLabel - The new custom label
     * @private
     */
    _updateTranscriptSpeakers(originalSpeaker, newLabel) {
        if (!originalSpeaker || !newLabel) {
            return;
        }

        // Update all segments that have this speaker
        for (const segment of this.transcriptSegments) {
            if (segment.speaker === originalSpeaker) {
                segment.speaker = newLabel;
            }
        }
    }

    /**
     * Merges transcript segments with scene breaks for template rendering
     * @returns {Array<Object>} Merged array of transcript entries and scene breaks
     * @private
     */
    _mergeTranscriptWithScenes() {
        const merged = [];

        // Build a map of scene breaks by index
        const scenesByIndex = new Map();
        for (const scene of this.sceneSegments) {
            scenesByIndex.set(scene.index, scene);
        }

        // Iterate through transcript segments and insert scene breaks
        for (let i = 0; i < this.transcriptSegments.length; i++) {
            // Check if there's a scene break at this index
            if (scenesByIndex.has(i)) {
                const scene = scenesByIndex.get(i);
                // Capitalize first letter for localization key
                const sceneTypeKey = scene.type.charAt(0).toUpperCase() + scene.type.slice(1);
                merged.push({
                    type: 'scene-break',
                    sceneType: scene.type,
                    sceneTypeLabel: game.i18n.localize(`NARRATOR.Scenes.SceneType${sceneTypeKey}`),
                    timestamp: this._formatTimestamp(scene.timestamp),
                    isManual: scene.isManual,
                    manualLabel: scene.isManual
                        ? game.i18n.localize('NARRATOR.Scenes.ManualBreak')
                        : game.i18n.localize('NARRATOR.Scenes.AutomaticBreak')
                });
            }

            // Add the transcript segment
            const segment = this.transcriptSegments[i];
            merged.push({
                type: 'transcript',
                speaker: segment.speaker,
                text: segment.text,
                timestamp: segment.timestamp
            });
        }

        return merged;
    }

    /**
     * Formats transcript with scene breaks integrated
     * @returns {string} Formatted transcript text
     * @private
     */
    _formatTranscriptWithScenes() {
        const lines = [];

        // Build a map of scene breaks by index
        const scenesByIndex = new Map();
        for (const scene of this.sceneSegments) {
            scenesByIndex.set(scene.index, scene);
        }

        // Iterate through transcript segments and insert scene breaks
        for (let i = 0; i < this.transcriptSegments.length; i++) {
            // Check if there's a scene break at this index
            if (scenesByIndex.has(i)) {
                const scene = scenesByIndex.get(i);
                const sceneTypeName = game.i18n.localize(
                    `NARRATOR.Scenes.SceneType${scene.type.charAt(0).toUpperCase() + scene.type.slice(1)}`
                );
                const manualMarker = scene.isManual
                    ? ` [${game.i18n.localize('NARRATOR.Scenes.ManualSceneBreak')}]`
                    : '';
                lines.push('');
                lines.push('═'.repeat(50));
                lines.push(
                    `${game.i18n.localize('NARRATOR.Scenes.SceneBreak')}: ${sceneTypeName}${manualMarker}`
                );
                lines.push('═'.repeat(50));
                lines.push('');
            }

            // Add the transcript segment
            const segment = this.transcriptSegments[i];
            lines.push(`[${segment.timestamp}] ${segment.speaker}: ${segment.text}`);
        }

        return lines.join('\n');
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
