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
        choices: [
            {
                message: {
                    content: JSON.stringify({
                        suggestions: [
                            {
                                type: 'narration',
                                content: 'Descrivi la taverna fumosa',
                                confidence: 0.8
                            },
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
            }
        ]
    };
}

/**
 * Creates a mock off-track response
 */
function createMockOffTrackResponse() {
    return {
        choices: [
            {
                message: {
                    content: JSON.stringify({
                        isOffTrack: true,
                        severity: 0.7,
                        reason: 'I giocatori stanno discutendo di politica invece della missione',
                        narrativeBridge: 'Un messaggero arriva improvvisamente con notizie urgenti'
                    })
                }
            }
        ]
    };
}

/**
 * Creates a mock suggestions response
 */
function createMockSuggestionsResponse() {
    return {
        choices: [
            {
                message: {
                    content: JSON.stringify({
                        suggestions: [
                            {
                                type: 'action',
                                content: 'Chiedi un tiro percezione',
                                confidence: 0.9
                            },
                            {
                                type: 'reference',
                                content: 'Vedi pagina 12 del manuale',
                                pageReference: 'page12',
                                confidence: 0.85
                            },
                            {
                                type: 'narration',
                                content: 'Si sente un rumore provenire dal fondo',
                                confidence: 0.75
                            }
                        ]
                    })
                }
            }
        ]
    };
}

/**
 * Creates a mock narrative bridge response
 */
function createMockNarrativeBridgeResponse() {
    return {
        choices: [
            {
                message: {
                    content:
                        'Mentre discutete, un anziano si avvicina al vostro tavolo. "Scusate l\'interruzione, ma ho sentito che cercate il tempio perduto..."'
                }
            }
        ]
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
        assert.ok(
            Array.isArray(assistant._conversationHistory),
            'Conversation history should be array'
        );

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
        assert.equal(
            assistant.getAdventureContext(),
            context,
            'getAdventureContext should return context'
        );

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
            assert.ok(
                typeof suggestions[0].confidence === 'number',
                'Suggestions should have confidence'
            );
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

        assert.ok(
            highPrompt.includes('attentamente'),
            'High sensitivity should mention careful monitoring'
        );

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
            assistant._conversationHistory.some((h) => h.content === 'message 4'),
            'Should keep most recent messages'
        );

        teardown();
    });

    // Test: _parseAnalysisResponse handles malformed JSON gracefully
    runner.test('_parseAnalysisResponse handles malformed JSON gracefully', async () => {
        await setup();

        const assistant = new AIAssistant('key');

        const malformedResponse = {
            choices: [
                {
                    message: {
                        content: 'Not valid JSON at all'
                    }
                }
            ]
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
            choices: [
                {
                    message: {
                        content: 'Invalid JSON'
                    }
                }
            ]
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
            assert.ok(
                call.options.headers.Authorization.includes('Bearer test-api-key'),
                'Should include API key'
            );
            assert.equal(
                call.options.headers['Content-Type'],
                'application/json',
                'Should set content type'
            );
        } finally {
            globalThis.fetch = originalFetch;
        }

        teardown();
    });

    // Test: _validateString handles excessive length
    runner.test('_validateString truncates excessively long strings', async () => {
        await setup();

        const assistant = new AIAssistant('key');
        const longString = 'A'.repeat(10000);
        const validated = assistant._validateString(longString, 100, 'test');

        assert.equal(validated.length, 100, 'Should truncate to max length');
        assert.equal(validated, 'A'.repeat(100), 'Should preserve valid portion');

        teardown();
    });

    // Test: _validateString handles null and undefined
    runner.test('_validateString handles null and undefined values', async () => {
        await setup();

        const assistant = new AIAssistant('key');

        const nullResult = assistant._validateString(null, 100, 'test');
        assert.equal(nullResult, '', 'Should return empty string for null');

        const undefinedResult = assistant._validateString(undefined, 100, 'test');
        assert.equal(undefinedResult, '', 'Should return empty string for undefined');

        teardown();
    });

    // Test: _validateString converts non-string types
    runner.test('_validateString converts non-string types to string', async () => {
        await setup();

        const assistant = new AIAssistant('key');

        const numberResult = assistant._validateString(123, 100, 'test');
        assert.equal(numberResult, '123', 'Should convert number to string');

        const boolResult = assistant._validateString(true, 100, 'test');
        assert.equal(boolResult, 'true', 'Should convert boolean to string');

        const objectResult = assistant._validateString({ key: 'value' }, 100, 'test');
        assert.ok(objectResult.includes('object'), 'Should convert object to string');

        teardown();
    });

    // Test: _validateNumber clamps to range
    runner.test('_validateNumber clamps values to min and max range', async () => {
        await setup();

        const assistant = new AIAssistant('key');

        const tooLow = assistant._validateNumber(-5, 0, 1, 'test');
        assert.equal(tooLow, 0, 'Should clamp to minimum');

        const tooHigh = assistant._validateNumber(10, 0, 1, 'test');
        assert.equal(tooHigh, 1, 'Should clamp to maximum');

        const inRange = assistant._validateNumber(0.5, 0, 1, 'test');
        assert.equal(inRange, 0.5, 'Should preserve in-range value');

        teardown();
    });

    // Test: _validateNumber handles null and undefined
    runner.test('_validateNumber handles null and undefined values', async () => {
        await setup();

        const assistant = new AIAssistant('key');

        const nullResult = assistant._validateNumber(null, 0, 1, 'test');
        assert.equal(nullResult, 0, 'Should return min for null');

        const undefinedResult = assistant._validateNumber(undefined, 0, 1, 'test');
        assert.equal(undefinedResult, 0, 'Should return min for undefined');

        teardown();
    });

    // Test: _validateNumber handles NaN
    runner.test('_validateNumber handles non-numeric values', async () => {
        await setup();

        const assistant = new AIAssistant('key');

        const nanResult = assistant._validateNumber('not a number', 0, 1, 'test');
        assert.equal(nanResult, 0, 'Should return min for NaN');

        const stringResult = assistant._validateNumber('abc', 5, 10, 'test');
        assert.equal(stringResult, 5, 'Should return min for non-numeric string');

        teardown();
    });

    // Test: _validateArray limits array size
    runner.test('_validateArray truncates arrays exceeding max items', async () => {
        await setup();

        const assistant = new AIAssistant('key');
        const largeArray = Array.from({ length: 100 }, (_, i) => i);
        const validated = assistant._validateArray(largeArray, 10, 'test');

        assert.equal(validated.length, 10, 'Should truncate to max items');
        assert.deepEqual(validated, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 'Should preserve first items');

        teardown();
    });

    // Test: _validateArray handles null and undefined
    runner.test('_validateArray handles null and undefined values', async () => {
        await setup();

        const assistant = new AIAssistant('key');

        const nullResult = assistant._validateArray(null, 10, 'test');
        assert.deepEqual(nullResult, [], 'Should return empty array for null');

        const undefinedResult = assistant._validateArray(undefined, 10, 'test');
        assert.deepEqual(undefinedResult, [], 'Should return empty array for undefined');

        teardown();
    });

    // Test: _validateArray handles non-array types
    runner.test('_validateArray converts non-array types to empty array', async () => {
        await setup();

        const assistant = new AIAssistant('key');

        const stringResult = assistant._validateArray('not an array', 10, 'test');
        assert.deepEqual(stringResult, [], 'Should return empty array for string');

        const numberResult = assistant._validateArray(123, 10, 'test');
        assert.deepEqual(numberResult, [], 'Should return empty array for number');

        const objectResult = assistant._validateArray({ key: 'value' }, 10, 'test');
        assert.deepEqual(objectResult, [], 'Should return empty array for object');

        teardown();
    });

    // Test: _parseAnalysisResponse sanitizes malicious content
    runner.test('_parseAnalysisResponse sanitizes excessive content lengths', async () => {
        await setup();

        const assistant = new AIAssistant('key');
        const maliciousResponse = {
            choices: [
                {
                    message: {
                        content: JSON.stringify({
                            suggestions: [
                                {
                                    type: 'narration',
                                    content: 'A'.repeat(10000), // Excessively long
                                    confidence: 0.8
                                }
                            ],
                            offTrackStatus: {
                                isOffTrack: false,
                                severity: 0.1,
                                reason: 'B'.repeat(5000) // Excessively long
                            },
                            relevantPages: ['page1'],
                            summary: 'C'.repeat(5000) // Excessively long
                        })
                    }
                }
            ]
        };

        const result = assistant._parseAnalysisResponse(maliciousResponse);

        assert.ok(
            result.suggestions[0].content.length <= 5000,
            'Should truncate suggestion content'
        );
        assert.ok(result.offTrackStatus.reason.length <= 1000, 'Should truncate off-track reason');
        assert.ok(result.summary.length <= 2000, 'Should truncate summary');

        teardown();
    });

    // Test: _parseAnalysisResponse limits array sizes
    runner.test('_parseAnalysisResponse limits array sizes to prevent DoS', async () => {
        await setup();

        const assistant = new AIAssistant('key');
        const excessiveArrays = {
            choices: [
                {
                    message: {
                        content: JSON.stringify({
                            suggestions: Array.from({ length: 50 }, (_, i) => ({
                                type: 'narration',
                                content: `Suggestion ${i}`,
                                confidence: 0.8
                            })),
                            offTrackStatus: {
                                isOffTrack: false,
                                severity: 0.1,
                                reason: 'Test'
                            },
                            relevantPages: Array.from({ length: 100 }, (_, i) => `page${i}`),
                            summary: 'Test'
                        })
                    }
                }
            ]
        };

        const result = assistant._parseAnalysisResponse(excessiveArrays);

        assert.ok(result.suggestions.length <= 10, 'Should limit suggestions array to 10 items');
        assert.ok(
            result.relevantPages.length <= 20,
            'Should limit relevantPages array to 20 items'
        );

        teardown();
    });

    // Test: _parseAnalysisResponse clamps numeric ranges
    runner.test(
        '_parseAnalysisResponse clamps confidence and severity to valid ranges',
        async () => {
            await setup();

            const assistant = new AIAssistant('key');
            const outOfRangeNumbers = {
                choices: [
                    {
                        message: {
                            content: JSON.stringify({
                                suggestions: [
                                    {
                                        type: 'narration',
                                        content: 'Test',
                                        confidence: 5.0 // Out of range (should be 0-1)
                                    }
                                ],
                                offTrackStatus: {
                                    isOffTrack: false,
                                    severity: -2.0, // Out of range
                                    reason: 'Test'
                                },
                                relevantPages: [],
                                summary: 'Test'
                            })
                        }
                    }
                ]
            };

            const result = assistant._parseAnalysisResponse(outOfRangeNumbers);

            assert.ok(
                result.suggestions[0].confidence >= 0 && result.suggestions[0].confidence <= 1,
                'Should clamp confidence to 0-1 range'
            );
            assert.ok(
                result.offTrackStatus.severity >= 0 && result.offTrackStatus.severity <= 1,
                'Should clamp severity to 0-1 range'
            );

            teardown();
        }
    );

    // Test: _parseOffTrackResponse sanitizes content
    runner.test('_parseOffTrackResponse sanitizes excessive content lengths', async () => {
        await setup();

        const assistant = new AIAssistant('key');
        const maliciousResponse = {
            choices: [
                {
                    message: {
                        content: JSON.stringify({
                            isOffTrack: true,
                            severity: 0.7,
                            reason: 'A'.repeat(5000), // Excessively long
                            narrativeBridge: 'B'.repeat(5000) // Excessively long
                        })
                    }
                }
            ]
        };

        const result = assistant._parseOffTrackResponse(maliciousResponse);

        assert.ok(result.reason.length <= 1000, 'Should truncate reason');
        assert.ok(result.narrativeBridge.length <= 2000, 'Should truncate narrative bridge');

        teardown();
    });

    // Test: _parseSuggestionsResponse sanitizes content
    runner.test('_parseSuggestionsResponse sanitizes excessive content lengths', async () => {
        await setup();

        const assistant = new AIAssistant('key');
        const maliciousResponse = {
            choices: [
                {
                    message: {
                        content: JSON.stringify({
                            suggestions: [
                                {
                                    type: 'narration',
                                    content: 'A'.repeat(10000), // Excessively long
                                    pageReference: 'B'.repeat(500), // Excessively long
                                    confidence: 0.9
                                }
                            ]
                        })
                    }
                }
            ]
        };

        const result = assistant._parseSuggestionsResponse(maliciousResponse, 5);

        assert.ok(result[0].content.length <= 5000, 'Should truncate content');
        assert.ok(result[0].pageReference.length <= 200, 'Should truncate page reference');

        teardown();
    });

    // Test: Validation handles special characters safely
    runner.test('validation handles special characters without breaking', async () => {
        await setup();

        const assistant = new AIAssistant('key');
        const specialChars = '<script>alert("xss")</script>\n\r\t\0';

        const stringResult = assistant._validateString(specialChars, 1000, 'test');
        assert.ok(
            stringResult.includes('<script>'),
            'Should preserve special chars (escaping is UI layer responsibility)'
        );
        assert.ok(stringResult.length <= 1000, 'Should still respect max length');

        teardown();
    });

    // Test: End-to-end validation with complex nested structure
    runner.test('end-to-end validation with complex malformed data', async () => {
        await setup();

        const assistant = new AIAssistant('key');
        const malformedResponse = {
            choices: [
                {
                    message: {
                        content: JSON.stringify({
                            suggestions: [
                                { type: 'narration', content: 'A'.repeat(10000), confidence: 99 },
                                { type: null, content: null, confidence: 'invalid' },
                                {
                                    /* missing fields */
                                }
                            ],
                            offTrackStatus: {
                                isOffTrack: 'yes', // Should be boolean
                                severity: 'high', // Should be number
                                reason: null,
                                narrativeBridge: { key: 'not a string' }
                            },
                            relevantPages: 'not an array',
                            summary: null
                        })
                    }
                }
            ]
        };

        const result = assistant._parseAnalysisResponse(malformedResponse);

        // Verify structure is intact despite malformed data
        assert.ok(Array.isArray(result.suggestions), 'Suggestions should be array');
        assert.ok(result.offTrackStatus, 'Should have offTrackStatus');
        assert.ok(Array.isArray(result.relevantPages), 'relevantPages should be array');
        assert.equal(typeof result.summary, 'string', 'Summary should be string');

        // Verify sanitization applied
        assert.ok(
            result.suggestions[0].content.length <= 5000,
            'Should sanitize suggestion content'
        );
        assert.equal(
            typeof result.offTrackStatus.isOffTrack,
            'boolean',
            'isOffTrack should be boolean'
        );
        assert.ok(typeof result.offTrackStatus.severity === 'number', 'severity should be number');
        assert.ok(
            result.offTrackStatus.severity >= 0 && result.offTrackStatus.severity <= 1,
            'severity should be in valid range'
        );

        teardown();
    });

    // ========================================
    // Rules Question Detection Tests
    // ========================================

    // Test: _detectRulesQuestions detects English rules questions
    runner.test('AIAssistant rules detection identifies English questions', async () => {
        await setup();

        const assistant = new AIAssistant('key');

        const transcription = 'How does grappling work in combat?';
        const result = assistant._detectRulesQuestions(transcription);

        assert.ok(result.hasRulesQuestions, 'Should detect rules question');
        assert.ok(result.questions.length > 0, 'Should have detected questions');
        assert.ok(result.questions[0].confidence > 0.5, 'Should have reasonable confidence');
        assert.ok(result.questions[0].type, 'Should have question type');

        teardown();
    });

    // Test: _detectRulesQuestions detects Italian rules questions
    runner.test('AIAssistant rules detection identifies Italian questions', async () => {
        await setup();

        const assistant = new AIAssistant('key');

        const transcription = 'Come funziona la concentrazione per gli incantesimi?';
        const result = assistant._detectRulesQuestions(transcription);

        assert.ok(result.hasRulesQuestions, 'Should detect Italian rules question');
        assert.ok(result.questions.length > 0, 'Should have detected questions');
        assert.ok(result.questions[0].confidence > 0.5, 'Should have reasonable confidence');

        teardown();
    });

    // Test: _detectRulesQuestions detects combat mechanics
    runner.test('AIAssistant rules detection identifies combat mechanic questions', async () => {
        await setup();

        const assistant = new AIAssistant('key');

        const transcription = 'What happens when I make an opportunity attack?';
        const result = assistant._detectRulesQuestions(transcription);

        assert.ok(result.hasRulesQuestions, 'Should detect combat question');
        assert.ok(
            result.questions[0].type === 'combat' || result.questions[0].type === 'mechanic',
            'Should identify as combat or mechanic type'
        );
        assert.ok(result.questions[0].detectedTerms, 'Should have detected terms');

        teardown();
    });

    // Test: _detectRulesQuestions detects spell mechanics
    runner.test('AIAssistant rules detection identifies spell mechanic questions', async () => {
        await setup();

        const assistant = new AIAssistant('key');

        const transcription = 'Quanti slot incantesimo servono per questo?';
        const result = assistant._detectRulesQuestions(transcription);

        assert.ok(result.hasRulesQuestions, 'Should detect spell question');
        const spellQuestion = result.questions.find((q) => q.type === 'spell');
        assert.ok(spellQuestion, 'Should identify as spell type');

        teardown();
    });

    // Test: _detectRulesQuestions detects conditions
    runner.test('AIAssistant rules detection identifies condition questions', async () => {
        await setup();

        const assistant = new AIAssistant('key');

        const transcription = 'What does it mean to be stunned?';
        const result = assistant._detectRulesQuestions(transcription);

        assert.ok(result.hasRulesQuestions, 'Should detect condition question');
        const conditionQuestion = result.questions.find(
            (q) => q.type === 'condition' || q.detectedTerms.includes('stunned')
        );
        assert.ok(conditionQuestion, 'Should identify condition-related question');

        teardown();
    });

    // Test: _detectRulesQuestions handles empty input
    runner.test('AIAssistant rules detection handles empty input', async () => {
        await setup();

        const assistant = new AIAssistant('key');

        const result1 = assistant._detectRulesQuestions('');
        assert.ok(!result1.hasRulesQuestions, 'Should return false for empty string');
        assert.equal(result1.questions.length, 0, 'Should have no questions');

        const result2 = assistant._detectRulesQuestions(null);
        assert.ok(!result2.hasRulesQuestions, 'Should return false for null');

        const result3 = assistant._detectRulesQuestions(undefined);
        assert.ok(!result3.hasRulesQuestions, 'Should return false for undefined');

        teardown();
    });

    // Test: _detectRulesQuestions handles non-rules content
    runner.test('AIAssistant rules detection ignores non-rules conversation', async () => {
        await setup();

        const assistant = new AIAssistant('key');

        const transcription = 'I want to go to the tavern and order some ale.';
        const result = assistant._detectRulesQuestions(transcription);

        assert.ok(!result.hasRulesQuestions, 'Should not detect rules in normal conversation');
        assert.equal(result.questions.length, 0, 'Should have no detected questions');

        teardown();
    });

    // Test: _detectRulesQuestions handles multiple questions in one transcription
    runner.test('AIAssistant rules detection handles multiple questions', async () => {
        await setup();

        const assistant = new AIAssistant('key');

        const transcription = 'How does grappling work? And what about advantage on attack rolls?';
        const result = assistant._detectRulesQuestions(transcription);

        assert.ok(result.hasRulesQuestions, 'Should detect rules questions');
        assert.ok(result.questions.length >= 2, 'Should detect multiple questions');

        teardown();
    });

    // Test: _detectRulesQuestions extracts topic from questions
    runner.test('AIAssistant rules detection extracts question topics', async () => {
        await setup();

        const assistant = new AIAssistant('key');

        const transcription = 'How does concentration work for spells?';
        const result = assistant._detectRulesQuestions(transcription);

        assert.ok(result.hasRulesQuestions, 'Should detect rules question');
        assert.ok(result.questions[0].extractedTopic, 'Should have extracted topic');
        assert.ok(
            result.questions[0].extractedTopic.includes('concentration') ||
                result.questions[0].detectedTerms.includes('concentration'),
            'Should extract concentration as topic'
        );

        teardown();
    });

    // Test: _hasQuestionWord detects English question words
    runner.test(
        'AIAssistant rules detection helper identifies English question words',
        async () => {
            await setup();

            const assistant = new AIAssistant('key');

            assert.ok(assistant._hasQuestionWord('how does this work'), 'Should detect "how"');
            assert.ok(assistant._hasQuestionWord('what is the rule'), 'Should detect "what"');
            assert.ok(assistant._hasQuestionWord('can i do this'), 'Should detect "can"');
            assert.ok(
                !assistant._hasQuestionWord('i move to the door'),
                'Should not detect in statement'
            );

            teardown();
        }
    );

    // Test: _hasQuestionWord detects Italian question words
    runner.test(
        'AIAssistant rules detection helper identifies Italian question words',
        async () => {
            await setup();

            const assistant = new AIAssistant('key');

            assert.ok(assistant._hasQuestionWord('come funziona'), 'Should detect "come"');
            assert.ok(assistant._hasQuestionWord('cosa succede'), 'Should detect "cosa"');
            assert.ok(assistant._hasQuestionWord('posso fare questo'), 'Should detect "posso"');
            assert.ok(
                !assistant._hasQuestionWord('vado alla taverna'),
                'Should not detect in statement'
            );

            teardown();
        }
    );

    // Test: analyzeContext integrates rules detection
    runner.test('AIAssistant analyzeContext includes rules detection', async () => {
        await setup();

        const mockResponse = createMockAnalysisResponse();
        const mockFetch = createMockFetch(mockResponse);
        const originalFetch = globalThis.fetch;
        globalThis.fetch = mockFetch;

        try {
            const assistant = new AIAssistant('valid-key');
            assistant.setAdventureContext('Adventure context');

            // This should internally call _detectRulesQuestions
            const result = await assistant.analyzeContext('How does grappling work?');

            assert.ok(result, 'Should return analysis result');
            assert.ok(Array.isArray(result.suggestions), 'Should have suggestions');

            // The rules detection happens internally but doesn't affect the return value yet
            // (that will be added in subtask-3-2)
        } finally {
            globalThis.fetch = originalFetch;
        }

        teardown();
    });

    // Test: analyzeContext respects detectRules option
    runner.test('AIAssistant analyzeContext respects detectRules option', async () => {
        await setup();

        const mockResponse = createMockAnalysisResponse();
        const mockFetch = createMockFetch(mockResponse);
        const originalFetch = globalThis.fetch;
        globalThis.fetch = mockFetch;

        try {
            const assistant = new AIAssistant('valid-key');

            // Test with detectRules disabled
            const result = await assistant.analyzeContext('How does grappling work?', {
                detectRules: false
            });

            assert.ok(result, 'Should return result even with rules detection disabled');
        } finally {
            globalThis.fetch = originalFetch;
        }

        teardown();
    });

    // ========================================
    // RETRY AND QUEUE TESTS
    // ========================================

    // Test: Retry on 429 rate limit error
    runner.test('retries on 429 rate limit with exponential backoff', async () => {
        await setup();

        let attemptCount = 0;
        const mockFetch = async () => {
            attemptCount++;
            if (attemptCount < 3) {
                // Fail first 2 attempts with 429
                return {
                    ok: false,
                    status: 429,
                    json: async () => ({ error: { message: 'Rate limit exceeded' } })
                };
            }
            // Succeed on 3rd attempt
            return {
                ok: true,
                status: 200,
                json: async () => createMockAnalysisResponse()
            };
        };

        const originalFetch = globalThis.fetch;
        globalThis.fetch = mockFetch;

        try {
            const assistant = new AIAssistant('valid-key', {
                retryBaseDelay: 10,
                maxRetryAttempts: 3
            });

            const result = await assistant.analyzeContext('Test conversation');

            assert.equal(attemptCount, 3, 'Should have retried 3 times');
            assert.ok(result.suggestions, 'Should eventually succeed');
        } finally {
            globalThis.fetch = originalFetch;
        }

        teardown();
    });

    // Test: Retry on 500 server error
    runner.test('retries on 500 internal server error', async () => {
        await setup();

        let attemptCount = 0;
        const mockFetch = async () => {
            attemptCount++;
            if (attemptCount === 1) {
                // Fail first attempt with 500
                return {
                    ok: false,
                    status: 500,
                    json: async () => ({ error: { message: 'Internal server error' } })
                };
            }
            // Succeed on 2nd attempt
            return {
                ok: true,
                status: 200,
                json: async () => createMockAnalysisResponse()
            };
        };

        const originalFetch = globalThis.fetch;
        globalThis.fetch = mockFetch;

        try {
            const assistant = new AIAssistant('valid-key', {
                retryBaseDelay: 10,
                maxRetryAttempts: 3
            });

            const result = await assistant.analyzeContext('Test conversation');

            assert.equal(attemptCount, 2, 'Should have retried once');
            assert.ok(result.suggestions, 'Should succeed after retry');
        } finally {
            globalThis.fetch = originalFetch;
        }

        teardown();
    });

    // Test: Retry on network error
    runner.test('retries on network error', async () => {
        await setup();

        let attemptCount = 0;
        const mockFetch = async () => {
            attemptCount++;
            if (attemptCount < 2) {
                // Throw network error on first attempt
                throw new Error('Network request failed');
            }
            // Succeed on 2nd attempt
            return {
                ok: true,
                status: 200,
                json: async () => createMockAnalysisResponse()
            };
        };

        const originalFetch = globalThis.fetch;
        globalThis.fetch = mockFetch;

        try {
            const assistant = new AIAssistant('valid-key', {
                retryBaseDelay: 10,
                maxRetryAttempts: 3
            });

            const result = await assistant.analyzeContext('Test conversation');

            assert.equal(attemptCount, 2, 'Should have retried once after network error');
            assert.ok(result.suggestions, 'Should succeed after retry');
        } finally {
            globalThis.fetch = originalFetch;
        }

        teardown();
    });

    // Test: No retry on 401 unauthorized
    runner.test('does not retry on 401 unauthorized', async () => {
        await setup();

        let attemptCount = 0;
        const mockFetch = async () => {
            attemptCount++;
            return {
                ok: false,
                status: 401,
                json: async () => ({ error: { message: 'Invalid API key' } })
            };
        };

        const originalFetch = globalThis.fetch;
        globalThis.fetch = mockFetch;

        try {
            const assistant = new AIAssistant('valid-key', {
                retryBaseDelay: 10,
                maxRetryAttempts: 3
            });

            await assert.throws(
                () => assistant.analyzeContext('Test conversation'),
                'Should throw on non-retryable error'
            );

            assert.equal(attemptCount, 1, 'Should not retry 401 errors');
        } finally {
            globalThis.fetch = originalFetch;
        }

        teardown();
    });

    // Test: Respects max retry attempts
    runner.test('respects max retry attempts limit', async () => {
        await setup();

        let attemptCount = 0;
        const mockFetch = async () => {
            attemptCount++;
            // Always fail with 503
            return {
                ok: false,
                status: 503,
                json: async () => ({ error: { message: 'Service unavailable' } })
            };
        };

        const originalFetch = globalThis.fetch;
        globalThis.fetch = mockFetch;

        try {
            const assistant = new AIAssistant('valid-key', {
                retryBaseDelay: 10,
                maxRetryAttempts: 2
            });

            await assert.throws(
                () => assistant.analyzeContext('Test conversation'),
                'Should throw after max attempts'
            );

            assert.equal(attemptCount, 2, 'Should respect max retry attempts of 2');
        } finally {
            globalThis.fetch = originalFetch;
        }

        teardown();
    });

    // Test: Retry disabled works correctly
    runner.test('works with retry disabled', async () => {
        await setup();

        let attemptCount = 0;
        const mockFetch = async () => {
            attemptCount++;
            if (attemptCount === 1) {
                // Fail first attempt
                return {
                    ok: false,
                    status: 503,
                    json: async () => ({ error: { message: 'Service unavailable' } })
                };
            }
            return {
                ok: true,
                status: 200,
                json: async () => createMockAnalysisResponse()
            };
        };

        const originalFetch = globalThis.fetch;
        globalThis.fetch = mockFetch;

        try {
            const assistant = new AIAssistant('valid-key', {
                retryEnabled: false
            });

            await assert.throws(
                () => assistant.analyzeContext('Test conversation'),
                'Should throw immediately with retry disabled'
            );

            assert.equal(attemptCount, 1, 'Should not retry when disabled');
        } finally {
            globalThis.fetch = originalFetch;
        }

        teardown();
    });

    // Test: Request queue processes sequentially
    runner.test('processes queued requests sequentially', async () => {
        await setup();

        let currentlyExecuting = 0;
        let maxConcurrent = 0;
        let executionCount = 0;

        const mockFetch = async () => {
            currentlyExecuting++;
            maxConcurrent = Math.max(maxConcurrent, currentlyExecuting);
            executionCount++;

            // Simulate async work
            await new Promise(resolve => setTimeout(resolve, 5));

            currentlyExecuting--;

            return {
                ok: true,
                status: 200,
                json: async () => createMockAnalysisResponse()
            };
        };

        const originalFetch = globalThis.fetch;
        globalThis.fetch = mockFetch;

        try {
            const assistant = new AIAssistant('valid-key', {
                retryEnabled: false
            });

            // Queue multiple requests
            const promises = [];
            for (let i = 0; i < 3; i++) {
                promises.push(assistant.analyzeContext(`Request ${i}`));
            }

            await Promise.all(promises);

            assert.equal(maxConcurrent, 1, 'Should execute only one request at a time');
            assert.equal(executionCount, 3, 'Should have executed all 3 requests');
        } finally {
            globalThis.fetch = originalFetch;
        }

        teardown();
    });

    // Test: Queue size limit
    runner.test('throws when queue size limit exceeded', async () => {
        await setup();

        let callCount = 0;
        const mockFetch = async () => {
            callCount++;
            // Simulate slow request
            await new Promise(resolve => setTimeout(resolve, 100));
            return {
                ok: true,
                status: 200,
                json: async () => createMockAnalysisResponse()
            };
        };

        const originalFetch = globalThis.fetch;
        globalThis.fetch = mockFetch;

        try {
            const assistant = new AIAssistant('valid-key', {
                maxQueueSize: 2,
                retryEnabled: false
            });

            // Start first request (will be processing)
            const promise1 = assistant.analyzeContext('Request 1');

            // Wait a bit for it to start processing
            await new Promise(resolve => setTimeout(resolve, 10));

            // Queue second request (should queue successfully)
            const promise2 = assistant.analyzeContext('Request 2');

            // Third request should throw (queue full)
            await assert.throws(
                () => assistant.analyzeContext('Request 3'),
                'Should throw when queue is full'
            );

            // Wait for promises to complete to avoid hanging
            await Promise.all([promise1, promise2]);
        } finally {
            globalThis.fetch = originalFetch;
        }

        teardown();
    });

    // Test: Get queue size
    runner.test('getQueueSize returns current queue size', async () => {
        await setup();

        const assistant = new AIAssistant('valid-key');

        assert.equal(assistant.getQueueSize(), 0, 'Queue should start empty');

        teardown();
    });

    // Test: Clear queue
    runner.test('clearQueue cancels all pending requests', async () => {
        await setup();

        let requestStarted = false;
        const mockFetch = async () => {
            requestStarted = true;
            // Simulate slow request
            await new Promise(resolve => setTimeout(resolve, 100));
            return {
                ok: true,
                status: 200,
                json: async () => createMockAnalysisResponse()
            };
        };

        const originalFetch = globalThis.fetch;
        globalThis.fetch = mockFetch;

        try {
            const assistant = new AIAssistant('valid-key', {
                retryEnabled: false
            });

            // Queue some requests
            const promise1 = assistant.analyzeContext('Request 1').catch(() => {});

            // Wait for first request to start
            await new Promise(resolve => setTimeout(resolve, 10));

            const promise2 = assistant.analyzeContext('Request 2');

            // Clear the queue
            assistant.clearQueue();

            // Second request should be cancelled
            await assert.throws(
                () => promise2,
                'Queued request should be cancelled'
            );

            assert.ok(requestStarted, 'First request should have started');

            // Wait for first request to complete to avoid hanging
            await promise1;
        } finally {
            globalThis.fetch = originalFetch;
        }

        teardown();
    });

    // Run all tests
    return runner.run();
}

// Export for direct execution
if (
    typeof process !== 'undefined' &&
    process.argv &&
    process.argv[1]?.includes('ai-assistant.test')
) {
    runTests().then((results) => {
        process.exit(results.failed > 0 ? 1 : 0);
    });
}
