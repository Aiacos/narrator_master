/**
 * Unit Tests for UI Panel Module
 * Tests NarratorPanel class functionality
 * @module tests/ui-panel
 */

import {
    setupMockGame,
    setupMockUI,
    setupMockDocument,
    cleanupMocks,
    assert,
    TestRunner
} from './test-helper.js';

// Note: We need to set up mocks before importing the module
let MODULE_ID, RECORDING_STATE, NarratorPanel;

/**
 * Mock Application class (Foundry VTT base class)
 */
class MockApplication {
    constructor(options = {}) {
        this.options = options;
        this.element = null;
        this.position = { top: 100, left: 100 };
        this._positionRestored = false;
    }

    static get defaultOptions() {
        return {
            width: 400,
            height: 600,
            resizable: false,
            minimizable: false,
            popOut: true
        };
    }

    render(_force = false) {
        // Mock render - just return this
        return this;
    }

    async close(_options = {}) {
        return true;
    }

    setPosition(options = {}) {
        this.position = { ...this.position, ...options };
        return this.position;
    }

    activateListeners(_html) {
        // Mock listener activation
    }
}

/**
 * Mock mergeObject function (Foundry VTT utility)
 */
function mockMergeObject(original, other = {}) {
    return { ...original, ...other };
}

/**
 * Mock Dialog class (Foundry VTT)
 */
class MockDialog {
    constructor(config) {
        this.config = config;
    }

    render(_force) {
        return this;
    }

    static async confirm(config) {
        // Default to yes for tests
        return config.yes ? config.yes() : true;
    }
}

/**
 * Mock ImagePopout class (Foundry VTT)
 */
class MockImagePopout {
    constructor(url, options) {
        this.url = url;
        this.options = options;
    }

    render(_force) {
        return this;
    }
}

/**
 * Mock clipboard API
 */
const mockClipboard = {
    _text: '',
    writeText: async function(text) {
        this._text = text;
        return Promise.resolve();
    },
    readText: async function() {
        return Promise.resolve(this._text);
    }
};

/**
 * Setup function to run before tests
 */
async function setup() {
    setupMockGame();
    setupMockUI();
    setupMockDocument();

    // Set up global mocks for Foundry VTT classes
    globalThis.Application = MockApplication;
    globalThis.mergeObject = mockMergeObject;
    globalThis.Dialog = MockDialog;
    globalThis.ImagePopout = MockImagePopout;

    // Set up navigator.clipboard
    if (!globalThis.navigator) {
        globalThis.navigator = {};
    }
    globalThis.navigator.clipboard = mockClipboard;

    // Set up URL.createObjectURL
    if (!globalThis.URL) {
        globalThis.URL = {
            createObjectURL: (_blob) => 'blob:mock-url',
            revokeObjectURL: (_url) => {}
        };
    }

    // Mock setInterval and clearInterval for timer tests
    globalThis._intervals = [];
    globalThis.setInterval = (fn, _ms) => {
        const id = Math.random();
        globalThis._intervals.push({ id, fn, ms: _ms });
        return id;
    };
    globalThis.clearInterval = (id) => {
        const index = globalThis._intervals.findIndex(i => i.id === id);
        if (index >= 0) {
            globalThis._intervals.splice(index, 1);
        }
    };

    // Mock setTimeout for async operations
    globalThis.setTimeout = (fn, _ms) => {
        // Execute immediately in tests
        fn();
        return Math.random();
    };

    // Mock jQuery find() method
    globalThis.$ = (_selector) => {
        const elements = {
            find: () => elements,
            click: () => elements,
            css: () => elements,
            data: () => null,
            length: 0,
            closest: () => ({ dataset: {} })
        };
        return elements;
    };

    // Dynamic import after mocks are set up
    const module = await import('../scripts/ui-panel.js');
    MODULE_ID = module.MODULE_ID;
    RECORDING_STATE = module.RECORDING_STATE;
    NarratorPanel = module.NarratorPanel;

    // Register settings for SettingsManager
    const settingsModule = await import('../scripts/settings.js');
    settingsModule.registerSettings();
}

/**
 * Teardown function to run after tests
 */
function teardown() {
    cleanupMocks();
    delete globalThis.Application;
    delete globalThis.mergeObject;
    delete globalThis.Dialog;
    delete globalThis.ImagePopout;
    delete globalThis.navigator;
    delete globalThis.URL;
    delete globalThis.setInterval;
    delete globalThis.clearInterval;
    delete globalThis.setTimeout;
    delete globalThis._intervals;
    delete globalThis.$;
}

/**
 * Run all UI Panel tests
 */
export async function runTests() {
    const runner = new TestRunner('UI Panel Tests');

    // Test: RECORDING_STATE constants are defined
    runner.test('RECORDING_STATE constants are defined', async () => {
        await setup();

        assert.ok(RECORDING_STATE.INACTIVE, 'INACTIVE should be defined');
        assert.ok(RECORDING_STATE.RECORDING, 'RECORDING should be defined');
        assert.ok(RECORDING_STATE.PAUSED, 'PAUSED should be defined');
        assert.ok(RECORDING_STATE.PROCESSING, 'PROCESSING should be defined');

        teardown();
    });

    // Test: RECORDING_STATE constants have correct values
    runner.test('RECORDING_STATE constants have expected values', async () => {
        await setup();

        assert.equal(RECORDING_STATE.INACTIVE, 'inactive', 'INACTIVE value');
        assert.equal(RECORDING_STATE.RECORDING, 'recording', 'RECORDING value');
        assert.equal(RECORDING_STATE.PAUSED, 'paused', 'PAUSED value');
        assert.equal(RECORDING_STATE.PROCESSING, 'processing', 'PROCESSING value');

        teardown();
    });

    // Test: NarratorPanel constructor initializes properties
    runner.test('NarratorPanel constructor initializes all properties', async () => {
        await setup();

        const panel = new NarratorPanel();

        assert.ok(panel.settingsManager, 'Should have settingsManager');
        assert.ok(Array.isArray(panel.suggestions), 'Should have suggestions array');
        assert.equal(panel.offTrack, false, 'Should initialize offTrack to false');
        assert.equal(panel.offTrackMessage, '', 'Should initialize offTrackMessage to empty');
        assert.equal(panel.narrativeBridge, '', 'Should initialize narrativeBridge to empty');
        assert.equal(panel.journalCount, 0, 'Should initialize journalCount to 0');
        assert.ok(Array.isArray(panel.generatedImages), 'Should have generatedImages array');
        assert.equal(panel.recordingState, RECORDING_STATE.INACTIVE, 'Should initialize to INACTIVE');
        assert.equal(panel.recordingDuration, 0, 'Should initialize duration to 0');
        assert.equal(panel.audioLevel, 0, 'Should initialize audioLevel to 0');
        assert.equal(panel.onRecordingControl, null, 'Should initialize callback to null');
        assert.equal(panel.onGenerateImage, null, 'Should initialize callback to null');
        assert.equal(panel.isLoading, false, 'Should initialize isLoading to false');
        assert.equal(panel.loadingMessage, '', 'Should initialize loadingMessage to empty');
        assert.ok(Array.isArray(panel.transcriptSegments), 'Should have transcriptSegments array');
        assert.ok(typeof panel.npcDialogue === 'object', 'Should have npcDialogue object');
        assert.equal(panel.speakerLabelService, null, 'Should initialize speakerLabelService to null');
        assert.ok(Array.isArray(panel.sceneSegments), 'Should have sceneSegments array');
        assert.equal(panel.onMarkSceneBreak, null, 'Should initialize callback to null');
        assert.ok(Array.isArray(panel.rulesAnswers), 'Should have rulesAnswers array');

        teardown();
    });

    // Test: defaultOptions returns correct configuration
    runner.test('defaultOptions returns correct configuration', async () => {
        await setup();

        const options = NarratorPanel.defaultOptions;

        assert.equal(options.id, 'narrator-master-panel', 'Should have correct id');
        assert.ok(options.title, 'Should have title');
        assert.ok(options.template.includes(MODULE_ID), 'Should have correct template path');
        assert.ok(options.classes.includes('narrator-master'), 'Should include narrator-master class');
        assert.ok(options.classes.includes('narrator-panel'), 'Should include narrator-panel class');
        assert.equal(options.width, 450, 'Should have correct width');
        assert.equal(options.height, 650, 'Should have correct height');
        assert.equal(options.resizable, true, 'Should be resizable');
        assert.equal(options.minimizable, true, 'Should be minimizable');
        assert.equal(options.popOut, true, 'Should be popOut');
        assert.ok(Array.isArray(options.tabs), 'Should have tabs configuration');

        teardown();
    });

    // Test: getData returns template data
    runner.test('getData returns complete template data', async () => {
        await setup();

        const panel = new NarratorPanel();
        const data = panel.getData();

        assert.equal(data.moduleId, MODULE_ID, 'Should include moduleId');
        assert.ok(Array.isArray(data.suggestions), 'Should include suggestions');
        assert.ok(typeof data.hasSuggestions === 'boolean', 'Should include hasSuggestions');
        assert.ok(typeof data.offTrack === 'boolean', 'Should include offTrack');
        assert.ok(typeof data.offTrackMessage === 'string', 'Should include offTrackMessage');
        assert.ok(typeof data.narrativeBridge === 'string', 'Should include narrativeBridge');
        assert.ok(typeof data.hasNarrativeBridge === 'boolean', 'Should include hasNarrativeBridge');
        assert.ok(typeof data.journalCount === 'number', 'Should include journalCount');
        assert.ok(typeof data.journalStatusText === 'string', 'Should include journalStatusText');
        assert.ok(Array.isArray(data.generatedImages), 'Should include generatedImages');
        assert.ok(typeof data.hasImages === 'boolean', 'Should include hasImages');
        assert.ok(Array.isArray(data.transcriptEntries), 'Should include transcriptEntries');
        assert.ok(typeof data.hasTranscript === 'boolean', 'Should include hasTranscript');
        assert.ok(Array.isArray(data.sceneSegments), 'Should include sceneSegments');
        assert.ok(typeof data.hasScenes === 'boolean', 'Should include hasScenes');
        assert.ok(Array.isArray(data.transcriptWithScenes), 'Should include transcriptWithScenes');
        assert.ok(Array.isArray(data.npcDialogueList), 'Should include npcDialogueList');
        assert.ok(typeof data.hasNPCDialogue === 'boolean', 'Should include hasNPCDialogue');
        assert.ok(Array.isArray(data.rulesAnswers), 'Should include rulesAnswers');
        assert.ok(typeof data.hasRules === 'boolean', 'Should include hasRules');
        assert.ok(typeof data.recordingState === 'string', 'Should include recordingState');
        assert.ok(typeof data.isRecording === 'boolean', 'Should include isRecording');
        assert.ok(typeof data.isPaused === 'boolean', 'Should include isPaused');
        assert.ok(typeof data.isProcessing === 'boolean', 'Should include isProcessing');
        assert.ok(typeof data.isInactive === 'boolean', 'Should include isInactive');
        assert.ok(typeof data.recordingDuration === 'string', 'Should include recordingDuration');
        assert.ok(typeof data.audioLevel === 'number', 'Should include audioLevel');
        assert.ok(data.apiKeyConfigured !== undefined, 'Should include apiKeyConfigured');
        assert.ok(data.isConfigured !== undefined, 'Should include isConfigured');
        assert.ok(typeof data.isLoading === 'boolean', 'Should include isLoading');
        assert.ok(typeof data.loadingMessage === 'string', 'Should include loadingMessage');
        assert.ok(typeof data.i18n === 'object', 'Should include i18n object');

        teardown();
    });

    // Test: updateContent updates suggestions
    runner.test('updateContent updates suggestions', async () => {
        await setup();

        const panel = new NarratorPanel();
        panel.updateContent({ suggestions: ['Suggestion 1', 'Suggestion 2'] });

        assert.equal(panel.suggestions.length, 2, 'Should have 2 suggestions');
        assert.equal(panel.suggestions[0], 'Suggestion 1', 'First suggestion should match');

        teardown();
    });

    // Test: updateContent updates off-track state
    runner.test('updateContent updates off-track state', async () => {
        await setup();

        const panel = new NarratorPanel();
        panel.updateContent({
            offTrack: true,
            offTrackMessage: 'Players are off track',
            narrativeBridge: 'Bridge suggestion'
        });

        assert.equal(panel.offTrack, true, 'Should set offTrack to true');
        assert.equal(panel.offTrackMessage, 'Players are off track', 'Should set message');
        assert.equal(panel.narrativeBridge, 'Bridge suggestion', 'Should set bridge');

        teardown();
    });

    // Test: updateContent updates journal count
    runner.test('updateContent updates journal count', async () => {
        await setup();

        const panel = new NarratorPanel();
        panel.updateContent({ journalCount: 5 });

        assert.equal(panel.journalCount, 5, 'Should update journal count');

        teardown();
    });

    // Test: updateContent updates rules answers
    runner.test('updateContent updates rules answers', async () => {
        await setup();

        const panel = new NarratorPanel();
        const rules = [{ question: 'Test?', answer: 'Answer', citation: 'PHB p.10' }];
        panel.updateContent({ rulesAnswers: rules });

        assert.equal(panel.rulesAnswers.length, 1, 'Should have 1 rule');
        assert.equal(panel.rulesAnswers[0].question, 'Test?', 'Question should match');

        teardown();
    });

    // Test: updateNPCDialogue updates NPC dialogue
    runner.test('updateNPCDialogue updates NPC dialogue', async () => {
        await setup();

        const panel = new NarratorPanel();
        const dialogue = { 'Gandalf': ['Hello', 'Goodbye'] };
        panel.updateNPCDialogue({ npcDialogue: dialogue });

        assert.ok(panel.npcDialogue['Gandalf'], 'Should have Gandalf dialogue');
        assert.equal(panel.npcDialogue['Gandalf'].length, 2, 'Should have 2 dialogues');

        teardown();
    });

    // Test: setLastTranscription stores transcription text
    runner.test('setLastTranscription stores transcription text', async () => {
        await setup();

        const panel = new NarratorPanel();
        panel.setLastTranscription('Test transcription');

        assert.equal(panel._lastTranscription, 'Test transcription', 'Should store transcription');

        teardown();
    });

    // Test: addImage adds image to gallery
    runner.test('addImage adds image to gallery', async () => {
        await setup();

        const panel = new NarratorPanel();
        panel.addImage({ url: 'test.jpg', prompt: 'Test prompt' });

        assert.equal(panel.generatedImages.length, 1, 'Should have 1 image');
        assert.equal(panel.generatedImages[0].url, 'test.jpg', 'URL should match');
        assert.equal(panel.generatedImages[0].prompt, 'Test prompt', 'Prompt should match');
        assert.ok(panel.generatedImages[0].timestamp, 'Should have timestamp');

        teardown();
    });

    // Test: clearImages removes all images
    runner.test('clearImages removes all images', async () => {
        await setup();

        const panel = new NarratorPanel();
        panel.addImage({ url: 'test1.jpg' });
        panel.addImage({ url: 'test2.jpg' });
        panel.clearImages();

        assert.equal(panel.generatedImages.length, 0, 'Should have no images');

        teardown();
    });

    // Test: clearSuggestions removes suggestions and off-track data
    runner.test('clearSuggestions removes suggestions and off-track data', async () => {
        await setup();

        const panel = new NarratorPanel();
        panel.updateContent({
            suggestions: ['Test'],
            offTrack: true,
            offTrackMessage: 'Message',
            narrativeBridge: 'Bridge'
        });
        panel.clearSuggestions();

        assert.equal(panel.suggestions.length, 0, 'Should have no suggestions');
        assert.equal(panel.offTrack, false, 'Should reset offTrack');
        assert.equal(panel.offTrackMessage, '', 'Should clear message');
        assert.equal(panel.narrativeBridge, '', 'Should clear bridge');

        teardown();
    });

    // Test: clearAll removes all content
    runner.test('clearAll removes all content', async () => {
        await setup();

        const panel = new NarratorPanel();
        panel.updateContent({ suggestions: ['Test'] });
        panel.addImage({ url: 'test.jpg' });
        panel.addTranscriptSegments([{ speaker: 'Test', text: 'Hello', timestamp: Date.now() }]);
        panel.addRuleAnswer({ question: 'Q?', answer: 'A', citation: 'P.1' });
        panel.clearAll();

        assert.equal(panel.suggestions.length, 0, 'Should have no suggestions');
        assert.equal(panel.generatedImages.length, 0, 'Should have no images');
        assert.equal(panel.transcriptSegments.length, 0, 'Should have no transcript');
        assert.equal(panel.rulesAnswers.length, 0, 'Should have no rules');
        assert.equal(panel._lastTranscription, '', 'Should clear last transcription');

        teardown();
    });

    // Test: setRecordingState updates state
    runner.test('setRecordingState updates recording state', async () => {
        await setup();

        const panel = new NarratorPanel();
        panel.setRecordingState(RECORDING_STATE.RECORDING);

        assert.equal(panel.recordingState, RECORDING_STATE.RECORDING, 'Should update state');

        teardown();
    });

    // Test: setRecordingState starts timer when recording
    runner.test('setRecordingState starts timer when recording', async () => {
        await setup();

        const panel = new NarratorPanel();
        panel.setRecordingState(RECORDING_STATE.RECORDING);

        assert.ok(globalThis._intervals.length > 0, 'Should start timer');

        teardown();
    });

    // Test: setRecordingState stops timer when inactive
    runner.test('setRecordingState stops timer when inactive', async () => {
        await setup();

        const panel = new NarratorPanel();
        panel.setRecordingState(RECORDING_STATE.RECORDING);
        panel.setRecordingState(RECORDING_STATE.INACTIVE);

        assert.equal(panel.recordingDuration, 0, 'Should reset duration');
        assert.equal(panel._durationTimer, null, 'Should clear timer');

        teardown();
    });

    // Test: setAudioLevel clamps values
    runner.test('setAudioLevel clamps values between 0 and 100', async () => {
        await setup();

        const panel = new NarratorPanel();

        panel.setAudioLevel(50);
        assert.equal(panel.audioLevel, 50, 'Should accept valid value');

        panel.setAudioLevel(-10);
        assert.equal(panel.audioLevel, 0, 'Should clamp negative to 0');

        panel.setAudioLevel(150);
        assert.equal(panel.audioLevel, 100, 'Should clamp over 100');

        teardown();
    });

    // Test: setLoading updates loading state
    runner.test('setLoading updates loading state', async () => {
        await setup();

        const panel = new NarratorPanel();
        panel.setLoading(true, 'Loading...');

        assert.equal(panel.isLoading, true, 'Should set loading to true');
        assert.equal(panel.loadingMessage, 'Loading...', 'Should set message');

        teardown();
    });

    // Test: updateTranscript replaces transcript
    runner.test('updateTranscript replaces transcript segments', async () => {
        await setup();

        const panel = new NarratorPanel();
        const segments = [
            { speaker: 'Speaker1', text: 'Hello', timestamp: Date.now() },
            { speaker: 'Speaker2', text: 'Hi', timestamp: Date.now() }
        ];
        panel.updateTranscript(segments);

        assert.equal(panel.transcriptSegments.length, 2, 'Should have 2 segments');
        assert.equal(panel.transcriptSegments[0].speaker, 'Speaker1', 'First speaker should match');

        teardown();
    });

    // Test: updateTranscript ignores non-array input
    runner.test('updateTranscript ignores non-array input', async () => {
        await setup();

        const panel = new NarratorPanel();
        panel.updateTranscript('not an array');

        assert.equal(panel.transcriptSegments.length, 0, 'Should not add invalid data');

        teardown();
    });

    // Test: addTranscriptSegments appends to existing
    runner.test('addTranscriptSegments appends to existing segments', async () => {
        await setup();

        const panel = new NarratorPanel();
        panel.addTranscriptSegments([{ speaker: 'S1', text: 'First', timestamp: Date.now() }]);
        panel.addTranscriptSegments([{ speaker: 'S2', text: 'Second', timestamp: Date.now() }]);

        assert.equal(panel.transcriptSegments.length, 2, 'Should have 2 segments');
        assert.equal(panel.transcriptSegments[1].speaker, 'S2', 'Second speaker should match');

        teardown();
    });

    // Test: addTranscriptSegments ignores non-array input
    runner.test('addTranscriptSegments ignores non-array input', async () => {
        await setup();

        const panel = new NarratorPanel();
        panel.addTranscriptSegments([{ speaker: 'S1', text: 'First', timestamp: Date.now() }]);
        panel.addTranscriptSegments(null);

        assert.equal(panel.transcriptSegments.length, 1, 'Should not add invalid data');

        teardown();
    });

    // Test: clearTranscript removes all transcript and scenes
    runner.test('clearTranscript removes all transcript and scenes', async () => {
        await setup();

        const panel = new NarratorPanel();
        panel.addTranscriptSegments([{ speaker: 'S1', text: 'Test', timestamp: Date.now() }]);
        panel.addSceneBreak('combat', Date.now());
        panel.clearTranscript();

        assert.equal(panel.transcriptSegments.length, 0, 'Should have no transcript');
        assert.equal(panel.sceneSegments.length, 0, 'Should have no scenes');

        teardown();
    });

    // Test: addSceneBreak adds scene marker
    runner.test('addSceneBreak adds scene marker', async () => {
        await setup();

        const panel = new NarratorPanel();
        panel.addSceneBreak('combat', Date.now());

        assert.equal(panel.sceneSegments.length, 1, 'Should have 1 scene');
        assert.equal(panel.sceneSegments[0].type, 'combat', 'Type should match');
        assert.ok(panel.sceneSegments[0].timestamp, 'Should have timestamp');
        assert.equal(panel.sceneSegments[0].isManual, false, 'Should default to automatic');

        teardown();
    });

    // Test: addSceneBreak validates scene type
    runner.test('addSceneBreak validates scene type', async () => {
        await setup();

        const panel = new NarratorPanel();
        panel.addSceneBreak('invalid-type', Date.now());

        assert.equal(panel.sceneSegments.length, 0, 'Should not add invalid type');

        teardown();
    });

    // Test: addSceneBreak supports manual flag
    runner.test('addSceneBreak supports manual flag', async () => {
        await setup();

        const panel = new NarratorPanel();
        panel.addSceneBreak('social', Date.now(), true);

        assert.equal(panel.sceneSegments[0].isManual, true, 'Should mark as manual');

        teardown();
    });

    // Test: getCurrentScene returns most recent scene
    runner.test('getCurrentScene returns most recent scene', async () => {
        await setup();

        const panel = new NarratorPanel();
        panel.addSceneBreak('exploration', Date.now());
        panel.addSceneBreak('combat', Date.now());

        const current = panel.getCurrentScene();
        assert.equal(current.type, 'combat', 'Should return most recent scene');

        teardown();
    });

    // Test: getCurrentScene returns null when no scenes
    runner.test('getCurrentScene returns null when no scenes', async () => {
        await setup();

        const panel = new NarratorPanel();
        const current = panel.getCurrentScene();

        assert.equal(current, null, 'Should return null');

        teardown();
    });

    // Test: setSpeakerLabelService sets the service
    runner.test('setSpeakerLabelService sets the service', async () => {
        await setup();

        const panel = new NarratorPanel();
        const mockService = { test: 'service' };
        panel.setSpeakerLabelService(mockService);

        assert.ok(panel.speakerLabelService, 'Should set service');

        teardown();
    });

    // Test: updateRules replaces rules
    runner.test('updateRules replaces all rules', async () => {
        await setup();

        const panel = new NarratorPanel();
        const rules = [
            { question: 'Q1?', answer: 'A1', citation: 'P.1' },
            { question: 'Q2?', answer: 'A2', citation: 'P.2' }
        ];
        panel.updateRules(rules);

        assert.equal(panel.rulesAnswers.length, 2, 'Should have 2 rules');
        assert.equal(panel.rulesAnswers[0].expanded, false, 'Should set expanded to false');
        assert.ok(panel.rulesAnswers[0].timestamp, 'Should add timestamp');

        teardown();
    });

    // Test: updateRules ignores non-array input
    runner.test('updateRules ignores non-array input', async () => {
        await setup();

        const panel = new NarratorPanel();
        panel.updateRules('not an array');

        assert.equal(panel.rulesAnswers.length, 0, 'Should not add invalid data');

        teardown();
    });

    // Test: addRuleAnswer appends single rule
    runner.test('addRuleAnswer appends single rule', async () => {
        await setup();

        const panel = new NarratorPanel();
        panel.addRuleAnswer({ question: 'Q1?', answer: 'A1', citation: 'P.1' });
        panel.addRuleAnswer({ question: 'Q2?', answer: 'A2', citation: 'P.2' });

        assert.equal(panel.rulesAnswers.length, 2, 'Should have 2 rules');
        assert.equal(panel.rulesAnswers[1].question, 'Q2?', 'Second question should match');

        teardown();
    });

    // Test: addRuleAnswer ignores invalid input
    runner.test('addRuleAnswer ignores invalid input', async () => {
        await setup();

        const panel = new NarratorPanel();
        panel.addRuleAnswer(null);
        panel.addRuleAnswer('string');

        assert.equal(panel.rulesAnswers.length, 0, 'Should not add invalid data');

        teardown();
    });

    // Test: clearRules removes all rules
    runner.test('clearRules removes all rules', async () => {
        await setup();

        const panel = new NarratorPanel();
        panel.addRuleAnswer({ question: 'Q?', answer: 'A', citation: 'P.1' });
        panel.clearRules();

        assert.equal(panel.rulesAnswers.length, 0, 'Should have no rules');

        teardown();
    });

    // Test: _formatDuration formats seconds correctly
    runner.test('_formatDuration formats seconds to MM:SS', async () => {
        await setup();

        const panel = new NarratorPanel();

        assert.equal(panel._formatDuration(0), '00:00', 'Should format 0 seconds');
        assert.equal(panel._formatDuration(65), '01:05', 'Should format 65 seconds');
        assert.equal(panel._formatDuration(125), '02:05', 'Should format 125 seconds');
        assert.equal(panel._formatDuration(3661), '61:01', 'Should format over 1 hour');

        teardown();
    });

    // Test: _formatTimestamp formats Unix timestamp
    runner.test('_formatTimestamp formats Unix timestamp to HH:MM:SS', async () => {
        await setup();

        const panel = new NarratorPanel();
        const timestamp = new Date('2024-01-01T15:30:45').getTime();
        const formatted = panel._formatTimestamp(timestamp);

        assert.ok(formatted.includes(':'), 'Should include colons');
        assert.equal(formatted.split(':').length, 3, 'Should have HH:MM:SS format');

        teardown();
    });

    // Test: _mergeTranscriptWithScenes merges data correctly
    runner.test('_mergeTranscriptWithScenes merges transcript with scene breaks', async () => {
        await setup();

        const panel = new NarratorPanel();
        panel.addTranscriptSegments([
            { speaker: 'S1', text: 'Before scene', timestamp: Date.now() }
        ]);
        panel.addSceneBreak('combat', Date.now());
        panel.addTranscriptSegments([
            { speaker: 'S2', text: 'After scene', timestamp: Date.now() }
        ]);

        const merged = panel._mergeTranscriptWithScenes();

        assert.ok(merged.length > 0, 'Should have merged data');
        assert.ok(merged.some(item => item.type === 'transcript'), 'Should include transcript items');

        teardown();
    });

    // Test: _formatTranscriptWithScenes formats as text
    runner.test('_formatTranscriptWithScenes formats as text with scene breaks', async () => {
        await setup();

        const panel = new NarratorPanel();
        panel.addTranscriptSegments([
            { speaker: 'S1', text: 'Hello', timestamp: '[12:00:00]' }
        ]);
        panel.addSceneBreak('combat', Date.now());

        const formatted = panel._formatTranscriptWithScenes();

        assert.ok(typeof formatted === 'string', 'Should return string');
        assert.ok(formatted.length > 0, 'Should have content');

        teardown();
    });

    // Test: close saves panel position
    runner.test('close saves panel position', async () => {
        await setup();

        const panel = new NarratorPanel();
        panel.position = { top: 200, left: 300 };
        await panel.close();

        const savedPosition = panel.settingsManager.getPanelPosition();
        assert.equal(savedPosition.top, 200, 'Should save top position');
        assert.equal(savedPosition.left, 300, 'Should save left position');

        teardown();
    });

    // Test: close stops duration timer
    runner.test('close stops duration timer', async () => {
        await setup();

        const panel = new NarratorPanel();
        panel.setRecordingState(RECORDING_STATE.RECORDING);
        await panel.close();

        assert.equal(panel._durationTimer, null, 'Should clear timer');

        teardown();
    });

    // Test: setPosition restores saved position
    runner.test('setPosition restores saved position on first call', async () => {
        await setup();

        const panel = new NarratorPanel();
        await panel.settingsManager.setPanelPosition({ top: 250, left: 350 });

        const position = panel.setPosition({});

        assert.equal(position.top, 250, 'Should restore top position');
        assert.equal(position.left, 350, 'Should restore left position');

        teardown();
    });

    // Test: getData shows correct journal status text
    runner.test('getData shows correct journal status text', async () => {
        await setup();

        const panel = new NarratorPanel();

        // No journals
        let data = panel.getData();
        assert.ok(data.journalStatusText.includes('JournalStatusEmpty'), 'Should show empty status');

        // With journals
        panel.journalCount = 3;
        data = panel.getData();
        assert.ok(data.journalStatusText.includes('JournalStatus'), 'Should show count status');

        teardown();
    });

    // Test: getData computes boolean flags correctly
    runner.test('getData computes boolean flags correctly', async () => {
        await setup();

        const panel = new NarratorPanel();

        // Test hasSuggestions
        assert.equal(panel.getData().hasSuggestions, false, 'Should be false with no suggestions');
        panel.suggestions.push('Test');
        assert.equal(panel.getData().hasSuggestions, true, 'Should be true with suggestions');

        // Test hasImages
        panel.suggestions = [];
        assert.equal(panel.getData().hasImages, false, 'Should be false with no images');
        panel.addImage({ url: 'test.jpg' });
        assert.equal(panel.getData().hasImages, true, 'Should be true with images');

        // Test hasTranscript
        panel.generatedImages = [];
        assert.equal(panel.getData().hasTranscript, false, 'Should be false with no transcript');
        panel.addTranscriptSegments([{ speaker: 'S1', text: 'Test', timestamp: Date.now() }]);
        assert.equal(panel.getData().hasTranscript, true, 'Should be true with transcript');

        teardown();
    });

    // Test: getData computes recording state booleans
    runner.test('getData computes recording state booleans correctly', async () => {
        await setup();

        const panel = new NarratorPanel();

        // INACTIVE
        panel.setRecordingState(RECORDING_STATE.INACTIVE);
        let data = panel.getData();
        assert.equal(data.isInactive, true, 'Should be inactive');
        assert.equal(data.isRecording, false, 'Should not be recording');
        assert.equal(data.isPaused, false, 'Should not be paused');
        assert.equal(data.isProcessing, false, 'Should not be processing');

        // RECORDING
        panel.setRecordingState(RECORDING_STATE.RECORDING);
        data = panel.getData();
        assert.equal(data.isRecording, true, 'Should be recording');
        assert.equal(data.isInactive, false, 'Should not be inactive');

        // PAUSED
        panel.setRecordingState(RECORDING_STATE.PAUSED);
        data = panel.getData();
        assert.equal(data.isPaused, true, 'Should be paused');
        assert.equal(data.isRecording, false, 'Should not be recording');

        // PROCESSING
        panel.setRecordingState(RECORDING_STATE.PROCESSING);
        data = panel.getData();
        assert.equal(data.isProcessing, true, 'Should be processing');
        assert.equal(data.isRecording, false, 'Should not be recording');

        teardown();
    });

    // Test: getData includes NPC dialogue list
    runner.test('getData includes NPC dialogue list correctly', async () => {
        await setup();

        const panel = new NarratorPanel();
        panel.npcDialogue = {
            'Gandalf': ['Hello', 'Goodbye'],
            'Frodo': ['Yes', 'No']
        };

        const data = panel.getData();
        assert.equal(data.npcDialogueList.length, 2, 'Should have 2 NPCs');
        assert.ok(data.npcDialogueList.find(npc => npc.name === 'Gandalf'), 'Should include Gandalf');
        assert.ok(data.npcDialogueList.find(npc => npc.name === 'Frodo'), 'Should include Frodo');
        assert.equal(data.hasNPCDialogue, true, 'Should indicate has dialogue');

        teardown();
    });

    // Run all tests
    return runner.run();
}

// Export for direct execution
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('ui-panel.test')) {
    runTests().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    });
}
