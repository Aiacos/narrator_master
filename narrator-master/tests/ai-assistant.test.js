/**
 * Unit Tests for AIAssistant
 * Tests context analysis, off-track detection, and suggestion generation
 * @module tests/ai-assistant
 */

import {
    setupMockGame,
    setupMockUI,
    cleanupMocks,
    createMockFetch,
    createMockFetchError,
    assert,
    TestRunner
} from './test-helper.js';

// Note: We need to set up mocks before importing the module
let AIAssistant;

/**
 * Setup function to run before tests
 */
async function setup() {
    setupMockGame();
    setupMockUI();

    // Dynamic import after mocks are set up
    const module = await import('../scripts/ai-assistant.js');
    AIAssistant = module.AIAssistant;
}

/**
 * Teardown function to run after tests
 */
function teardown() {
    cleanupMocks();
}

/**
 * Creates a mock analysis response from GPT
 */
function createMockAnalysisResponse() {
    return {
        choices: [{
            message: {
                content: JSON.stringify({
                    suggestions: [
                        { type: 'narration', content: 'Descrivi la taverna fumosa', confidence: 0.8 },
                        { type: 'dialogue', content: 'Il barista si avvicina', confidence: 0.7 }
                    ],
                    offTrackStatus: {
                        isOffTrack: false,
                        severity: 0.1,
                        reason: 'I giocatori stanno seguendo la trama'
                    },
                    relevantPages: ['page1', 'page2'],
                    summary: 'I giocatori entrano nella taverna'
                })
            }
        }]
    };
}

/**
 * Creates a mock off-track response
 */
function createMockOffTrackResponse() {
    return {
        choices: [{
            message: {
                content: JSON.stringify({
                    isOffTrack: true,
                    severity: 0.7,
                    reason: 'I giocatori stanno discutendo di politica invece della missione',
                    narrativeBridge: 'Un messaggero arriva improvvisamente con notizie urgenti'
                })
            }
        }]
    };
}

/**
 * Creates a mock suggestions response
 */
function createMockSuggestionsResponse() {
    return {
        choices: [{
            message: {
                content: JSON.stringify({
                    suggestions: [
                        { type: 'action', content: 'Chiedi un tiro percezione', confidence: 0.9 },
                        { type: 'reference', content: 'Vedi pagina 12 del manuale', pageReference: 'page12', confidence: 0.85 },
                        { type: 'narration', content: 'Si sente un rumore provenire dal fondo', confidence: 0.75 }
                    ]
                })
            }
        }]
    };
}

/**
 * Creates a mock narrative bridge response
 */
function createMockNarrativeBridgeResponse() {
    return {
        choices: [{
            message: {
                content: 'Mentre discutete, un anziano si avvicina al vostro tavolo. "Scusate l\'interruzione, ma ho sentito che cercate il tempio perduto..."'
            }
        }]
    };
}

/**
 * Run all AIAssistant tests
 */
export async function runTests() {
    const runner = new TestRunner('AIAssistant Tests');

    // Test: Constructor initializes with default values
    runner.test('constructor initializes with default values', async () => {
        await setup();

        const assistant = new AIAssistant('test-api-key');

        assert.equal(assistant._apiKey, 'test-api-key', 'API key should be set');
        assert.equal(assistant._model, 'gpt-4o-mini', 'Default model should be gpt-4o-mini');
        assert.equal(assistant._sensitivity, 'medium', 'Default sensitivity should be medium');
        assert.equal(assistant._adventureContext, '', 'Adventure context should be empty');
        assert.ok(Array.isArray(assistant._conversationHistory), 'Conversation history should be array');

        teardown();
    });

    // Test: Constructor accepts custom options
    runner.test('constructor accepts custom options', async () => {
        await setup();

        const assistant = new AIAssistant('key', {
            model: 'gpt-4',
            sensitivity: 'high'
        });

        assert.equal(assistant._model, 'gpt-4', 'Custom model should be set');
        assert.equal(assistant._sensitivity, 'high', 'Custom sensitivity should be set');

        teardown();
    });

    // Test: isConfigured returns correct state
    runner.test('isConfigured returns correct state', async () => {
        await setup();

        const configuredAssistant = new AIAssistant('valid-key');
        assert.ok(configuredAssistant.isConfigured(), 'Should return true with valid key');

        const unconfiguredAssistant = new AIAssistant('');
        assert.ok(!unconfiguredAssistant.isConfigured(), 'Should return false with empty key');

        const whitespaceAssistant = new AIAssistant('   ');
        assert.ok(!whitespaceAssistant.isConfigured(), 'Should return false with whitespace key');

        teardown();
    });

    // Test: setApiKey updates the API key
    runner.test('setApiKey updates the API key', async () => {
        await setup();

        const assistant = new AIAssistant('old-key');
        assistant.setApiKey('new-key');

        assert.equal(assistant._apiKey, 'new-key', 'API key should be updated');

        teardown();
    });

    // Test: setModel updates the model
    runner.test('setModel updates the model', async () => {
        await setup();

        const assistant = new AIAssistant('key');
        assistant.setModel('gpt-4');

        assert.equal(assistant._model, 'gpt-4', 'Model should be updated');
        assert.equal(assistant.getModel(), 'gpt-4', 'getModel should return updated value');

        teardown();
    });

    // Test: setSensitivity validates and updates sensitivity
    runner.test('setSensitivity validates and updates sensitivity', async () => {
        await setup();

        const assistant = new AIAssistant('key');

        assistant.setSensitivity('low');
        assert.equal(assistant._sensitivity, 'low', 'Should accept low');

        assistant.setSensitivity('medium');
        assert.equal(assistant._sensitivity, 'medium', 'Should accept medium');

        assistant.setSensitivity('high');
        assert.equal(assistant._sensitivity, 'high', 'Should accept high');

        assistant.setSensitivity('invalid');
        assert.equal(assistant._sensitivity, 'high', 'Should ignore invalid values');

        teardown();
    });

    // Test: getSensitivity returns current sensitivity
    runner.test('getSensitivity returns current sensitivity', async () => {
        await setup();

        const assistant = new AIAssistant('key', { sensitivity: 'low' });
        assert.equal(assistant.getSensitivity(), 'low', 'Should return current sensitivity');

        teardown();
    });

    // Test: setAdventureContext updates context
    runner.test('setAdventureContext updates adventure context', async () => {
        await setup();

        const assistant = new AIAssistant('key');
        const context = 'This is the adventure content...';
        assistant.setAdventureContext(context);

        assert.equal(assistant._adventureContext, context, 'Context should be updated');
        assert.equal(assistant.getAdventureContext(), context, 'getAdventureContext should return context');

        teardown();
    });

    // Test: analyzeContext throws error without API key
    runner.test('analyzeContext throws error when not configured', async () => {
        await setup();

        const assistant = new AIAssistant('');

        await assert.throws(
            () => assistant.analyzeContext('Test transcription'),
            'Should throw when API key not configured'
        );

        teardown();
    });

    // Test: analyzeContext throws error with invalid transcription
    runner.test('analyzeContext throws error with invalid transcription', async () => {
        await setup();

        const assistant = new AIAssistant('valid-key');

        await assert.throws(
            () => assistant.analyzeContext(''),
            'Should throw for empty transcription'
        );

        await assert.throws(
            () => assistant.analyzeContext(null),
            'Should throw for null transcription'
        );

        teardown();
    });

    // Test: analyzeContext successfully returns analysis
    runner.test('analyzeContext successfully returns analysis', async () => {
        await setup();

        const mockResponse = createMockAnalysisResponse();
        const mockFetch = createMockFetch(mockResponse);
        const originalFetch = globalThis.fetch;
        globalThis.fetch = mockFetch;

        try {
            const assistant = new AIAssistant('valid-key');
            assistant.setAdventureContext('Adventure context here');

            const result = await assistant.analyzeContext('I giocatori entrano nella taverna');

            assert.ok(Array.isArray(result.suggestions), 'Should have suggestions array');
            assert.ok(result.offTrackStatus, 'Should have offTrackStatus');
            assert.ok(Array.isArray(result.relevantPages), 'Should have relevantPages');
            assert.ok(result.summary !== undefined, 'Should have summary');
        } finally {
            globalThis.fetch = originalFetch;
        }

        teardown();
    });

    // Test: analyzeContext adds to conversation history
    runner.test('analyzeContext adds to conversation history', async () => {
        await setup();

        const mockResponse = createMockAnalysisResponse();
        const mockFetch = createMockFetch(mockResponse);
        const originalFetch = globalThis.fetch;
        globalThis.fetch = mockFetch;

        try {
            const assistant = new AIAssistant('valid-key');

            await assistant.analyzeContext('Test transcription');

            const history = assistant.getHistory();
            assert.ok(history.length >= 2, 'Should have user and assistant entries in history');
        } finally {
            globalThis.fetch = originalFetch;
        }

        teardown();
    });

    // Test: detectOffTrack returns result when context set
    runner.test('detectOffTrack returns result with adventure context', async () => {
        await setup();

        const mockResponse = createMockOffTrackResponse();
        const mockFetch = createMockFetch(mockResponse);
        const originalFetch = globalThis.fetch;
        globalThis.fetch = mockFetch;

        try {
            const assistant = new AIAssistant('valid-key');
            assistant.setAdventureContext('The heroes must save the village');

            const result = await assistant.detectOffTrack('I giocatori discutono di politica');

            assert.equal(typeof result.isOffTrack, 'boolean', 'Should have isOffTrack boolean');
            assert.equal(typeof result.severity, 'number', 'Should have severity number');
            assert.ok(result.reason !== undefined, 'Should have reason');
        } finally {
            globalThis.fetch = originalFetch;
        }

        teardown();
    });

    // Test: detectOffTrack returns default when no context
    runner.test('detectOffTrack returns default result without adventure context', async () => {
        await setup();

        const assistant = new AIAssistant('valid-key');
        // No adventure context set

        const result = await assistant.detectOffTrack('Test transcription');

        assert.equal(result.isOffTrack, false, 'Should return false when no context');
        assert.equal(result.severity, 0, 'Severity should be 0');

        teardown();
    });

    // Test: detectOffTrack throws error without API key
    runner.test('detectOffTrack throws error when not configured', async () => {
        await setup();

        const assistant = new AIAssistant('');

        await assert.throws(
            () => assistant.detectOffTrack('Test'),
            'Should throw when not configured'
        );

        teardown();
    });

    // Test: generateSuggestions returns suggestions array
    runner.test('generateSuggestions returns suggestions array', async () => {
        await setup();

        const mockResponse = createMockSuggestionsResponse();
        const mockFetch = createMockFetch(mockResponse);
        const originalFetch = globalThis.fetch;
        globalThis.fetch = mockFetch;

        try {
            const assistant = new AIAssistant('valid-key');
            assistant.setAdventureContext('Adventure content');

            const suggestions = await assistant.generateSuggestions('Transcription text');

            assert.ok(Array.isArray(suggestions), 'Should return array');
            assert.ok(suggestions.length > 0, 'Should have suggestions');
            assert.ok(suggestions[0].type, 'Suggestions should have type');
            assert.ok(suggestions[0].content, 'Suggestions should have content');
            assert.ok(typeof suggestions[0].confidence === 'number', 'Suggestions should have confidence');
        } finally {
            globalThis.fetch = originalFetch;
        }

        teardown();
    });

    // Test: generateSuggestions respects maxSuggestions
    runner.test('generateSuggestions respects maxSuggestions option', async () => {
        await setup();

        const mockResponse = createMockSuggestionsResponse();
        const mockFetch = createMockFetch(mockResponse);
        const originalFetch = globalThis.fetch;
        globalThis.fetch = mockFetch;

        try {
            const assistant = new AIAssistant('valid-key');

            const suggestions = await assistant.generateSuggestions('Transcription', {
                maxSuggestions: 2
            });

            assert.ok(suggestions.length <= 2, 'Should respect max suggestions');
        } finally {
            globalThis.fetch = originalFetch;
        }

        teardown();
    });

    // Test: generateNarrativeBridge returns narrative text
    runner.test('generateNarrativeBridge returns narrative text', async () => {
        await setup();

        const mockResponse = createMockNarrativeBridgeResponse();
        const mockFetch = createMockFetch(mockResponse);
        const originalFetch = globalThis.fetch;
        globalThis.fetch = mockFetch;

        try {
            const assistant = new AIAssistant('valid-key');
            assistant.setAdventureContext('Adventure about finding a temple');

            const bridge = await assistant.generateNarrativeBridge(
                'Players are discussing unrelated topics',
                'Meeting with the temple guide'
            );

            assert.ok(typeof bridge === 'string', 'Should return string');
            assert.ok(bridge.length > 0, 'Should not be empty');
        } finally {
            globalThis.fetch = originalFetch;
        }

        teardown();
    });

    // Test: generateNarrativeBridge throws error without API key
    runner.test('generateNarrativeBridge throws error when not configured', async () => {
        await setup();

        const assistant = new AIAssistant('');

        await assert.throws(
            () => assistant.generateNarrativeBridge('current', 'target'),
            'Should throw when not configured'
        );

        teardown();
    });

    // Test: _buildSystemPrompt includes sensitivity guide
    runner.test('_buildSystemPrompt includes sensitivity-specific guidance', async () => {
        await setup();

        const assistant = new AIAssistant('key', { sensitivity: 'low' });
        const prompt = assistant._buildSystemPrompt();

        assert.ok(prompt.includes('tollerante'), 'Low sensitivity should mention tolerance');

        assistant.setSensitivity('high');
        const highPrompt = assistant._buildSystemPrompt();

        assert.ok(highPrompt.includes('attentamente'), 'High sensitivity should mention careful monitoring');

        teardown();
    });

    // Test: _handleApiError returns correct error for different status codes
    runner.test('_handleApiError handles different HTTP status codes', async () => {
        await setup();

        const assistant = new AIAssistant('key');

        const error401 = assistant._handleApiError({ status: 401 });
        assert.ok(error401 instanceof Error, '401 should return Error');

        const error429 = assistant._handleApiError({ status: 429 });
        assert.ok(error429 instanceof Error, '429 should return Error');

        const error500 = assistant._handleApiError({ status: 500 });
        assert.ok(error500 instanceof Error, '500 should return Error');

        const networkError = assistant._handleApiError({ status: 0, isNetworkError: true });
        assert.ok(networkError.isNetworkError, 'Network error should be marked');

        teardown();
    });

    // Test: clearHistory empties conversation history
    runner.test('clearHistory empties conversation history', async () => {
        await setup();

        const assistant = new AIAssistant('key');
        assistant._conversationHistory = [
            { role: 'user', content: 'test' },
            { role: 'assistant', content: 'response' }
        ];

        assistant.clearHistory();

        assert.equal(assistant._conversationHistory.length, 0, 'History should be empty');

        teardown();
    });

    // Test: getHistory returns conversation history
    runner.test('getHistory returns conversation history', async () => {
        await setup();

        const assistant = new AIAssistant('key');
        assistant._conversationHistory = [
            { role: 'user', content: 'first' },
            { role: 'assistant', content: 'second' },
            { role: 'user', content: 'third' }
        ];

        const fullHistory = assistant.getHistory();
        assert.equal(fullHistory.length, 3, 'Should return full history');

        const limitedHistory = assistant.getHistory(2);
        assert.equal(limitedHistory.length, 2, 'Should respect limit');
        assert.equal(limitedHistory[0].content, 'second', 'Should return most recent');

        teardown();
    });

    // Test: resetSession clears history and state
    runner.test('resetSession clears history and session state', async () => {
        await setup();

        const assistant = new AIAssistant('key');
        assistant._conversationHistory = [{ role: 'user', content: 'test' }];
        assistant._sessionState.suggestionsCount = 10;
        assistant._sessionState.currentScene = 'test scene';

        assistant.resetSession();

        assert.equal(assistant._conversationHistory.length, 0, 'History should be cleared');
        assert.equal(assistant._sessionState.suggestionsCount, 0, 'Suggestions count should reset');
        assert.equal(assistant._sessionState.currentScene, null, 'Current scene should reset');

        teardown();
    });

    // Test: getStats returns service statistics
    runner.test('getStats returns service statistics', async () => {
        await setup();

        const assistant = new AIAssistant('valid-key', { sensitivity: 'high' });
        assistant.setAdventureContext('Test adventure context');

        const stats = assistant.getStats();

        assert.equal(stats.configured, true, 'Should show configured');
        assert.equal(stats.model, 'gpt-4o-mini', 'Should show model');
        assert.equal(stats.sensitivity, 'high', 'Should show sensitivity');
        assert.equal(stats.hasContext, true, 'Should show has context');
        assert.ok(stats.contextLength > 0, 'Should show context length');

        teardown();
    });

    // Test: _extractJson handles markdown code blocks
    runner.test('_extractJson extracts JSON from markdown code blocks', async () => {
        await setup();

        const assistant = new AIAssistant('key');

        const markdown = '```json\n{"test": "value"}\n```';
        const extracted = assistant._extractJson(markdown);
        assert.ok(extracted.includes('"test"'), 'Should extract JSON from code block');

        const plain = '{"plain": "json"}';
        const extractedPlain = assistant._extractJson(plain);
        assert.ok(extractedPlain.includes('"plain"'), 'Should handle plain JSON');

        teardown();
    });

    // Test: _truncateContext handles long content
    runner.test('_truncateContext handles long content', async () => {
        await setup();

        const assistant = new AIAssistant('key');

        // Short content
        const shortContent = 'Short content';
        const shortResult = assistant._truncateContext(shortContent);
        assert.equal(shortResult, shortContent, 'Short content should not be truncated');

        // Very long content (simulate)
        const longContent = 'A'.repeat(50000);
        const longResult = assistant._truncateContext(longContent);
        assert.ok(longResult.length < longContent.length, 'Long content should be truncated');
        assert.ok(longResult.includes('troncato'), 'Should include truncation notice');

        teardown();
    });

    // Test: _addToHistory respects max history size
    runner.test('_addToHistory respects max history size', async () => {
        await setup();

        const assistant = new AIAssistant('key');
        assistant._maxHistorySize = 3;

        // Add more than max
        for (let i = 0; i < 5; i++) {
            assistant._addToHistory('user', `message ${i}`);
        }

        assert.ok(assistant._conversationHistory.length <= 3, 'Should not exceed max size');
        // Should keep most recent
        assert.ok(
            assistant._conversationHistory.some(h => h.content === 'message 4'),
            'Should keep most recent messages'
        );

        teardown();
    });

    // Test: _parseAnalysisResponse handles malformed JSON gracefully
    runner.test('_parseAnalysisResponse handles malformed JSON gracefully', async () => {
        await setup();

        const assistant = new AIAssistant('key');

        const malformedResponse = {
            choices: [{
                message: {
                    content: 'Not valid JSON at all'
                }
            }]
        };

        const result = assistant._parseAnalysisResponse(malformedResponse);

        // Should return fallback structure
        assert.ok(Array.isArray(result.suggestions), 'Should have suggestions array');
        assert.ok(result.offTrackStatus, 'Should have offTrackStatus');
        assert.ok(result.summary !== undefined, 'Should have summary');

        teardown();
    });

    // Test: _parseOffTrackResponse handles malformed response
    runner.test('_parseOffTrackResponse handles malformed response gracefully', async () => {
        await setup();

        const assistant = new AIAssistant('key');

        const malformedResponse = {
            choices: [{
                message: {
                    content: 'Invalid JSON'
                }
            }]
        };

        const result = assistant._parseOffTrackResponse(malformedResponse);

        // Should return safe default
        assert.equal(result.isOffTrack, false, 'Should default to not off-track');
        assert.equal(result.severity, 0, 'Should default to 0 severity');

        teardown();
    });

    // Test: notifyError shows notification
    runner.test('notifyError shows UI notification', async () => {
        await setup();

        const error = new Error('Test AI error');
        AIAssistant.notifyError(error);

        assert.ok(ui.notifications._calls.length > 0, 'Should have shown notification');
        assert.equal(ui.notifications._calls[0].type, 'error', 'Should be error type');

        teardown();
    });

    // Test: API request includes correct headers
    runner.test('_makeApiRequest includes correct headers', async () => {
        await setup();

        const mockResponse = createMockAnalysisResponse();
        const mockFetch = createMockFetch(mockResponse);
        const originalFetch = globalThis.fetch;
        globalThis.fetch = mockFetch;

        try {
            const assistant = new AIAssistant('test-api-key');
            assistant.setAdventureContext('Context');

            await assistant.analyzeContext('Test');

            const call = mockFetch.calls[0];
            assert.ok(call.options.headers.Authorization.includes('Bearer test-api-key'), 'Should include API key');
            assert.equal(call.options.headers['Content-Type'], 'application/json', 'Should set content type');
        } finally {
            globalThis.fetch = originalFetch;
        }

        teardown();
    });

    // Run all tests
    return runner.run();
}

// Export for direct execution
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('ai-assistant.test')) {
    runTests().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    });
}
