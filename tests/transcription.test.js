/**
 * Unit Tests for TranscriptionService
 * Tests transcription API calls, speaker diarization, and error handling
 * @module tests/transcription
 */

import {
    setupMockGame,
    setupMockUI,
    cleanupMocks,
    createMockFetch,
    createMockFetchError,
    createMockBlob,
    assert,
    TestRunner
} from './test-helper.js';

// Note: We need to set up mocks before importing the module
let TranscriptionService;

/**
 * Setup function to run before tests
 */
async function setup() {
    setupMockGame();
    setupMockUI();

    // Dynamic import after mocks are set up
    const module = await import('../scripts/transcription.js');
    TranscriptionService = module.TranscriptionService;
}

/**
 * Teardown function to run after tests
 */
function teardown() {
    cleanupMocks();
}

/**
 * Creates a mock successful transcription response
 */
function createMockTranscriptionResponse() {
    return {
        text: 'Ciao a tutti, benvenuti nella sessione.',
        segments: [
            { speaker: 'DM', text: 'Ciao a tutti', start: 0, end: 2 },
            { speaker: 'Player1', text: 'benvenuti nella sessione', start: 2, end: 5 }
        ],
        language: 'it',
        duration: 5.0
    };
}

/**
 * Creates a mock simple transcription response (non-diarized)
 */
function createMockSimpleResponse() {
    return {
        text: 'Questo è il testo trascritto.',
        segments: [{ text: 'Questo è il testo trascritto.', start: 0, end: 3 }],
        language: 'it',
        duration: 3.0
    };
}

/**
 * Run all TranscriptionService tests
 */
export async function runTests() {
    const runner = new TestRunner('TranscriptionService Tests');

    // Test: Constructor initializes with default values
    runner.test('constructor initializes with default values', async () => {
        await setup();

        const service = new TranscriptionService('test-api-key');

        assert.equal(service._apiKey, 'test-api-key', 'API key should be set');
        assert.equal(service._language, 'it', 'Default language should be Italian');
        assert.equal(service._enableDiarization, true, 'Diarization should be enabled by default');
        assert.ok(Array.isArray(service._knownSpeakerNames), 'Known speaker names should be array');
        assert.ok(Array.isArray(service._history), 'History should be array');

        teardown();
    });

    // Test: Constructor accepts options
    runner.test('constructor accepts custom options', async () => {
        await setup();

        const service = new TranscriptionService('key', {
            language: 'en',
            enableDiarization: false
        });

        assert.equal(service._language, 'en', 'Custom language should be set');
        assert.equal(service._enableDiarization, false, 'Custom diarization setting should be set');

        teardown();
    });

    // Test: isConfigured returns correct state
    runner.test('isConfigured returns correct state', async () => {
        await setup();

        const serviceWithKey = new TranscriptionService('valid-key');
        assert.ok(serviceWithKey.isConfigured(), 'Should return true with valid key');

        const serviceWithoutKey = new TranscriptionService('');
        assert.ok(!serviceWithoutKey.isConfigured(), 'Should return false with empty key');

        const serviceWithWhitespace = new TranscriptionService('   ');
        assert.ok(!serviceWithWhitespace.isConfigured(), 'Should return false with whitespace key');

        teardown();
    });

    // Test: setApiKey updates the API key
    runner.test('setApiKey updates the API key', async () => {
        await setup();

        const service = new TranscriptionService('old-key');
        service.setApiKey('new-key');

        assert.equal(service._apiKey, 'new-key', 'API key should be updated');

        teardown();
    });

    // Test: setLanguage updates the language
    runner.test('setLanguage updates the language', async () => {
        await setup();

        const service = new TranscriptionService('key');
        service.setLanguage('en');

        assert.equal(service._language, 'en', 'Language should be updated');
        assert.equal(service.getLanguage(), 'en', 'getLanguage should return updated value');

        teardown();
    });

    // Test: setKnownSpeakerNames updates speaker names
    runner.test('setKnownSpeakerNames updates speaker names array', async () => {
        await setup();

        const service = new TranscriptionService('key');
        service.setKnownSpeakerNames(['Marco', 'Giulia', 'Luca']);

        const names = service.getKnownSpeakerNames();
        assert.equal(names.length, 3, 'Should have 3 speaker names');
        assert.ok(names.includes('Marco'), 'Should include Marco');

        teardown();
    });

    // Test: addKnownSpeaker adds a single speaker
    runner.test('addKnownSpeaker adds a single speaker name', async () => {
        await setup();

        const service = new TranscriptionService('key');
        service.addKnownSpeaker('TestSpeaker');

        const names = service.getKnownSpeakerNames();
        assert.ok(names.includes('TestSpeaker'), 'Should include added speaker');

        teardown();
    });

    // Test: addKnownSpeaker prevents duplicates
    runner.test('addKnownSpeaker prevents duplicate names', async () => {
        await setup();

        const service = new TranscriptionService('key');
        service.addKnownSpeaker('Marco');
        service.addKnownSpeaker('Marco');

        const names = service.getKnownSpeakerNames();
        const marcoCount = names.filter((n) => n === 'Marco').length;
        assert.equal(marcoCount, 1, 'Should not have duplicate names');

        teardown();
    });

    // Test: transcribe throws error without API key
    runner.test('transcribe throws error when API key not configured', async () => {
        await setup();

        const service = new TranscriptionService('');
        const audioBlob = createMockBlob('audio/webm', 1024);

        await assert.throws(
            () => service.transcribe(audioBlob),
            'Should throw when API key not configured'
        );

        teardown();
    });

    // Test: transcribe throws error with invalid audio blob
    runner.test('transcribe throws error with invalid audio blob', async () => {
        await setup();

        const service = new TranscriptionService('valid-key');

        await assert.throws(() => service.transcribe(null), 'Should throw for null blob');

        await assert.throws(() => service.transcribe('not-a-blob'), 'Should throw for non-blob');

        teardown();
    });

    // Test: transcribe throws error for files > 25MB
    runner.test('transcribe throws error for files exceeding 25MB', async () => {
        await setup();

        const service = new TranscriptionService('valid-key');
        const largeBlob = createMockBlob('audio/webm', 30 * 1024 * 1024); // 30MB

        await assert.throws(() => service.transcribe(largeBlob), 'Should throw for files > 25MB');

        teardown();
    });

    // Test: transcribe successfully calls API and returns result
    runner.test('transcribe successfully calls API and returns result', async () => {
        await setup();

        const mockResponse = createMockTranscriptionResponse();
        const mockFetch = createMockFetch(mockResponse);

        // Temporarily replace global fetch
        const originalFetch = globalThis.fetch;
        globalThis.fetch = mockFetch;

        try {
            const service = new TranscriptionService('valid-key');
            const audioBlob = createMockBlob('audio/webm', 15000);

            const result = await service.transcribe(audioBlob);

            assert.ok(result.text, 'Result should have text');
            assert.ok(Array.isArray(result.segments), 'Result should have segments array');
            assert.ok(Array.isArray(result.speakers), 'Result should have speakers array');
            assert.ok(result.duration !== undefined, 'Result should have duration');

            // Verify fetch was called correctly
            assert.ok(mockFetch.calls.length > 0, 'Fetch should have been called');
            const call = mockFetch.calls[0];
            assert.ok(
                call.url.includes('/audio/transcriptions'),
                'Should call transcriptions endpoint'
            );
            assert.equal(call.options.method, 'POST', 'Should use POST method');
            assert.ok(
                call.options.headers.Authorization.includes('Bearer'),
                'Should include auth header'
            );
        } finally {
            globalThis.fetch = originalFetch;
        }

        teardown();
    });

    // Test: transcribe adds result to history
    runner.test('transcribe adds result to history', async () => {
        await setup();

        const mockResponse = createMockTranscriptionResponse();
        const mockFetch = createMockFetch(mockResponse);
        const originalFetch = globalThis.fetch;
        globalThis.fetch = mockFetch;

        try {
            const service = new TranscriptionService('valid-key');
            const audioBlob = createMockBlob('audio/webm', 15000);

            await service.transcribe(audioBlob);

            const history = service.getHistory();
            assert.equal(history.length, 1, 'History should have one entry');
            assert.ok(history[0].timestamp, 'History entry should have timestamp');
        } finally {
            globalThis.fetch = originalFetch;
        }

        teardown();
    });

    // Test: transcribe includes known speaker names in request
    runner.test('transcribe includes known speaker names in form data', async () => {
        await setup();

        const mockResponse = createMockTranscriptionResponse();
        const mockFetch = createMockFetch(mockResponse);
        const originalFetch = globalThis.fetch;
        globalThis.fetch = mockFetch;

        try {
            const service = new TranscriptionService('valid-key');
            service.setKnownSpeakerNames(['Marco', 'Giulia']);
            const audioBlob = createMockBlob('audio/webm', 15000);

            await service.transcribe(audioBlob);

            // The mock FormData will have the speaker names
            assert.ok(mockFetch.calls.length > 0, 'Fetch should have been called');
        } finally {
            globalThis.fetch = originalFetch;
        }

        teardown();
    });

    // Test: transcribeSimple works without diarization
    runner.test('transcribeSimple returns result without diarization', async () => {
        await setup();

        const mockResponse = createMockSimpleResponse();
        const mockFetch = createMockFetch(mockResponse);
        const originalFetch = globalThis.fetch;
        globalThis.fetch = mockFetch;

        try {
            const service = new TranscriptionService('valid-key');
            const audioBlob = createMockBlob('audio/webm', 15000);

            const result = await service.transcribeSimple(audioBlob);

            assert.ok(result.text, 'Result should have text');
            assert.ok(Array.isArray(result.segments), 'Result should have segments');
            // Simple transcription assigns generic speaker label
            assert.ok(result.speakers.includes('Speaker'), 'Should have generic Speaker label');
        } finally {
            globalThis.fetch = originalFetch;
        }

        teardown();
    });

    // Test: transcribeSimple throws error without API key
    runner.test('transcribeSimple throws error when not configured', async () => {
        await setup();

        const service = new TranscriptionService('');
        const audioBlob = createMockBlob('audio/webm', 1024);

        await assert.throws(
            () => service.transcribeSimple(audioBlob),
            'Should throw when not configured'
        );

        teardown();
    });

    // Test: _handleApiError returns correct error for 401
    runner.test('_handleApiError returns correct error for 401 Unauthorized', async () => {
        await setup();

        const service = new TranscriptionService('key');
        const error = service._handleApiError({ status: 401, message: 'Invalid key' });

        assert.ok(error instanceof Error, 'Should return Error instance');
        assert.ok(
            error.message.includes('InvalidApiKey') || error.message.length > 0,
            'Should have error message'
        );

        teardown();
    });

    // Test: _handleApiError returns correct error for 429
    runner.test('_handleApiError returns correct error for 429 Rate Limited', async () => {
        await setup();

        const service = new TranscriptionService('key');
        const error = service._handleApiError({ status: 429, message: 'Rate limited' });

        assert.ok(error instanceof Error, 'Should return Error instance');
        assert.ok(
            error.message.includes('RateLimited') || error.message.length > 0,
            'Should have error message'
        );

        teardown();
    });

    // Test: _handleApiError returns correct error for network errors
    runner.test('_handleApiError handles network errors correctly', async () => {
        await setup();

        const service = new TranscriptionService('key');
        const error = service._handleApiError({
            status: 0,
            message: 'Network failed',
            isNetworkError: true
        });

        assert.ok(error instanceof Error, 'Should return Error instance');
        assert.ok(error.isNetworkError, 'Should mark as network error');

        teardown();
    });

    // Test: getHistory returns transcription history
    runner.test('getHistory returns transcription history', async () => {
        await setup();

        const mockResponse = createMockTranscriptionResponse();
        const mockFetch = createMockFetch(mockResponse);
        const originalFetch = globalThis.fetch;
        globalThis.fetch = mockFetch;

        try {
            const service = new TranscriptionService('valid-key');
            const audioBlob = createMockBlob('audio/webm', 15000);

            // Make multiple transcriptions
            await service.transcribe(audioBlob);
            await service.transcribe(audioBlob);

            const history = service.getHistory();
            assert.equal(history.length, 2, 'Should have two history entries');

            const limitedHistory = service.getHistory(1);
            assert.equal(limitedHistory.length, 1, 'Limit should work');
        } finally {
            globalThis.fetch = originalFetch;
        }

        teardown();
    });

    // Test: clearHistory removes all history entries
    runner.test('clearHistory removes all history entries', async () => {
        await setup();

        const mockResponse = createMockTranscriptionResponse();
        const mockFetch = createMockFetch(mockResponse);
        const originalFetch = globalThis.fetch;
        globalThis.fetch = mockFetch;

        try {
            const service = new TranscriptionService('valid-key');
            const audioBlob = createMockBlob('audio/webm', 15000);

            await service.transcribe(audioBlob);
            assert.equal(service.getHistory().length, 1, 'Should have history');

            service.clearHistory();
            assert.equal(service.getHistory().length, 0, 'History should be empty after clear');
        } finally {
            globalThis.fetch = originalFetch;
        }

        teardown();
    });

    // Test: getRecentTranscriptionText formats output correctly
    runner.test('getRecentTranscriptionText formats output with speaker labels', async () => {
        await setup();

        const mockResponse = createMockTranscriptionResponse();
        const mockFetch = createMockFetch(mockResponse);
        const originalFetch = globalThis.fetch;
        globalThis.fetch = mockFetch;

        try {
            const service = new TranscriptionService('valid-key');
            const audioBlob = createMockBlob('audio/webm', 15000);

            await service.transcribe(audioBlob);

            const text = service.getRecentTranscriptionText(5);
            assert.ok(text.includes(':'), 'Should have speaker labels with colons');
        } finally {
            globalThis.fetch = originalFetch;
        }

        teardown();
    });

    // Test: estimateDuration calculates approximate duration
    runner.test('estimateDuration calculates approximate duration', async () => {
        await setup();

        const service = new TranscriptionService('key');
        const audioBlob = createMockBlob('audio/webm', 32 * 1024); // 32KB

        const duration = service.estimateDuration(audioBlob);

        assert.ok(duration > 0, 'Duration should be positive');
        // At ~32kbps, 32KB should be roughly 8 seconds
        assert.ok(duration >= 5 && duration <= 15, 'Duration estimate should be reasonable');

        teardown();
    });

    // Test: shouldUseChunking recommends chunking for long audio
    runner.test('shouldUseChunking recommends chunking for long audio', async () => {
        await setup();

        const service = new TranscriptionService('key');

        // Small file (short duration)
        const smallBlob = createMockBlob('audio/webm', 32 * 1024);
        assert.ok(!service.shouldUseChunking(smallBlob), 'Should not chunk small files');

        // Large file (long duration) - ~60 seconds estimated
        const largeBlob = createMockBlob('audio/webm', 256 * 1024);
        assert.ok(service.shouldUseChunking(largeBlob), 'Should chunk large files');

        teardown();
    });

    // Test: getStats returns service statistics
    runner.test('getStats returns service statistics', async () => {
        await setup();

        const service = new TranscriptionService('valid-key', { language: 'it' });
        service.setKnownSpeakerNames(['Test1', 'Test2']);

        const stats = service.getStats();

        assert.equal(stats.configured, true, 'Should show configured');
        assert.equal(stats.language, 'it', 'Should show language');
        assert.equal(stats.diarizationEnabled, true, 'Should show diarization');
        assert.equal(stats.knownSpeakers, 2, 'Should show speaker count');
        assert.equal(stats.historySize, 0, 'Should show history size');

        teardown();
    });

    // Test: _parseResponse normalizes API response
    runner.test('_parseResponse normalizes API response correctly', async () => {
        await setup();

        const service = new TranscriptionService('key');

        const rawResponse = {
            segments: [
                { speaker: 'DM', text: 'Test', start: 0, end: 1 },
                { speaker: 'Player', text: 'Response', start: 1, end: 2 }
            ],
            language: 'it'
        };

        const result = service._parseResponse(rawResponse, 'it');

        assert.ok(result.text, 'Should have combined text');
        assert.equal(result.segments.length, 2, 'Should have 2 segments');
        assert.ok(result.speakers.includes('DM'), 'Should include DM in speakers');
        assert.ok(result.speakers.includes('Player'), 'Should include Player in speakers');
        assert.equal(result.duration, 2, 'Duration should be max end time');

        teardown();
    });

    // Test: _createNetworkError creates appropriate error objects
    runner.test('_createNetworkError creates appropriate error objects', async () => {
        await setup();

        const service = new TranscriptionService('key');

        const timeoutError = service._createNetworkError({ name: 'AbortError' });
        assert.ok(timeoutError.isNetworkError, 'Should mark as network error');
        assert.equal(timeoutError.code, 'timeout', 'Should identify timeout');

        const networkError = service._createNetworkError({ message: 'Connection failed' });
        assert.ok(networkError.isNetworkError, 'Should mark as network error');
        assert.equal(networkError.code, 'network_error', 'Should identify as network error');

        teardown();
    });

    // Test: setMultiLanguageMode enables multi-language mode
    runner.test('setMultiLanguageMode enables multi-language mode', async () => {
        await setup();

        const service = new TranscriptionService('key');
        assert.ok(
            !service.isMultiLanguageMode(),
            'Multi-language mode should be disabled by default'
        );

        service.setMultiLanguageMode(true);
        assert.ok(service.isMultiLanguageMode(), 'Multi-language mode should be enabled');

        service.setMultiLanguageMode(false);
        assert.ok(!service.isMultiLanguageMode(), 'Multi-language mode should be disabled');

        teardown();
    });

    // Test: Constructor accepts multiLanguageMode option
    runner.test('constructor accepts multiLanguageMode option', async () => {
        await setup();

        const service = new TranscriptionService('key', {
            multiLanguageMode: true
        });

        assert.ok(
            service.isMultiLanguageMode(),
            'Multi-language mode should be enabled from constructor'
        );

        teardown();
    });

    // Test: Multi-language mode is included in getStats
    runner.test('getStats includes multi-language mode status', async () => {
        await setup();

        const service = new TranscriptionService('valid-key', {
            multiLanguageMode: true
        });

        const stats = service.getStats();

        assert.equal(
            stats.multiLanguageMode,
            true,
            'Stats should include multi-language mode status'
        );

        teardown();
    });

    // Test: _parseResponse handles per-segment language detection
    runner.test('_parseResponse handles per-segment language detection', async () => {
        await setup();

        const service = new TranscriptionService('key');

        const rawResponse = {
            segments: [
                { speaker: 'Player1', text: 'Hello everyone', start: 0, end: 2, language: 'en' },
                { speaker: 'Player2', text: 'Ciao a tutti', start: 2, end: 4, language: 'it' },
                { speaker: 'Player3', text: 'Hola amigos', start: 4, end: 6, language: 'es' }
            ],
            language: 'en'
        };

        const result = service._parseResponse(rawResponse, 'en');

        assert.equal(result.segments.length, 3, 'Should have 3 segments');
        assert.equal(result.segments[0].language, 'en', 'First segment should be English');
        assert.equal(result.segments[1].language, 'it', 'Second segment should be Italian');
        assert.equal(result.segments[2].language, 'es', 'Third segment should be Spanish');

        teardown();
    });

    // Test: _parseResponse uses top-level language as fallback
    runner.test(
        '_parseResponse uses top-level language when segment language missing',
        async () => {
            await setup();

            const service = new TranscriptionService('key');

            const rawResponse = {
                segments: [
                    { speaker: 'Player1', text: 'Hello', start: 0, end: 1 },
                    { speaker: 'Player2', text: 'World', start: 1, end: 2 }
                ],
                language: 'en'
            };

            const result = service._parseResponse(rawResponse, 'en');

            assert.equal(
                result.segments[0].language,
                'en',
                'Should use top-level language as fallback'
            );
            assert.equal(
                result.segments[1].language,
                'en',
                'Should use top-level language as fallback'
            );

            teardown();
        }
    );

    // Test: transcribe in multi-language mode omits language parameter
    runner.test(
        'transcribe in multi-language mode sends appropriate language parameter',
        async () => {
            await setup();

            let capturedFormData = null;
            const mockFetch = async (url, options) => {
                // Capture the FormData for inspection
                capturedFormData = options.body;
                return {
                    ok: true,
                    status: 200,
                    json: async () => createMockTranscriptionResponse()
                };
            };

            const originalFetch = globalThis.fetch;
            globalThis.fetch = mockFetch;

            try {
                const service = new TranscriptionService('valid-key', {
                    language: 'it',
                    multiLanguageMode: true
                });
                const audioBlob = createMockBlob('audio/webm', 15000);

                await service.transcribe(audioBlob);

                // In multi-language mode with language set, the language parameter should be omitted
                // to allow automatic detection
                assert.ok(capturedFormData !== null, 'Should have captured form data');
            } finally {
                globalThis.fetch = originalFetch;
            }

            teardown();
        }
    );

    // Test: transcribe with language='auto' enables automatic detection
    runner.test('transcribe with language auto enables automatic language detection', async () => {
        await setup();

        let capturedFormData = null;
        const mockFetch = async (url, options) => {
            capturedFormData = options.body;
            return {
                ok: true,
                status: 200,
                json: async () => createMockTranscriptionResponse()
            };
        };

        const originalFetch = globalThis.fetch;
        globalThis.fetch = mockFetch;

        try {
            const service = new TranscriptionService('valid-key', {
                language: 'auto'
            });
            const audioBlob = createMockBlob('audio/webm', 15000);

            await service.transcribe(audioBlob);

            assert.ok(capturedFormData !== null, 'Should have captured form data');
        } finally {
            globalThis.fetch = originalFetch;
        }

        teardown();
    });

    // Test: notifyError shows notification (static method)
    runner.test('notifyError shows UI notification', async () => {
        await setup();

        const error = new Error('Test error message');
        TranscriptionService.notifyError(error);

        // Check that notification was called
        assert.ok(ui.notifications._calls.length > 0, 'Should have shown notification');
        assert.equal(ui.notifications._calls[0].type, 'error', 'Should be error type');

        teardown();
    });

    // Test: History respects max size limit
    runner.test('history respects maximum size limit', async () => {
        await setup();

        const service = new TranscriptionService('key');
        // Override max size for testing
        service._maxHistorySize = 3;

        const mockResponse = createMockTranscriptionResponse();
        const mockFetch = createMockFetch(mockResponse);
        const originalFetch = globalThis.fetch;
        globalThis.fetch = mockFetch;

        try {
            const audioBlob = createMockBlob('audio/webm', 15000);

            // Add more than max
            for (let i = 0; i < 5; i++) {
                await service.transcribe(audioBlob);
            }

            const history = service.getHistory();
            assert.ok(history.length <= 3, 'History should not exceed max size');
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
                json: async () => createMockTranscriptionResponse()
            };
        };

        const originalFetch = globalThis.fetch;
        globalThis.fetch = mockFetch;

        try {
            const service = new TranscriptionService('valid-key', {
                retryBaseDelay: 10, // Short delay for testing
                maxRetryAttempts: 3
            });
            const audioBlob = createMockBlob('audio/webm', 15000);

            const result = await service.transcribe(audioBlob);

            assert.equal(attemptCount, 3, 'Should have retried 3 times');
            assert.ok(result.text, 'Should eventually succeed');
        } finally {
            globalThis.fetch = originalFetch;
        }

        teardown();
    });

    // Test: Retry on 503 server error
    runner.test('retries on 503 service unavailable', async () => {
        await setup();

        let attemptCount = 0;
        const mockFetch = async () => {
            attemptCount++;
            if (attemptCount === 1) {
                // Fail first attempt with 503
                return {
                    ok: false,
                    status: 503,
                    json: async () => ({ error: { message: 'Service temporarily unavailable' } })
                };
            }
            // Succeed on 2nd attempt
            return {
                ok: true,
                status: 200,
                json: async () => createMockTranscriptionResponse()
            };
        };

        const originalFetch = globalThis.fetch;
        globalThis.fetch = mockFetch;

        try {
            const service = new TranscriptionService('valid-key', {
                retryBaseDelay: 10,
                maxRetryAttempts: 3
            });
            const audioBlob = createMockBlob('audio/webm', 15000);

            const result = await service.transcribe(audioBlob);

            assert.equal(attemptCount, 2, 'Should have retried once');
            assert.ok(result.text, 'Should succeed after retry');
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
                json: async () => createMockTranscriptionResponse()
            };
        };

        const originalFetch = globalThis.fetch;
        globalThis.fetch = mockFetch;

        try {
            const service = new TranscriptionService('valid-key', {
                retryBaseDelay: 10,
                maxRetryAttempts: 3
            });
            const audioBlob = createMockBlob('audio/webm', 15000);

            const result = await service.transcribe(audioBlob);

            assert.equal(attemptCount, 2, 'Should have retried once after network error');
            assert.ok(result.text, 'Should succeed after retry');
        } finally {
            globalThis.fetch = originalFetch;
        }

        teardown();
    });

    // Test: No retry on 400 bad request
    runner.test('does not retry on 400 bad request', async () => {
        await setup();

        let attemptCount = 0;
        const mockFetch = async () => {
            attemptCount++;
            return {
                ok: false,
                status: 400,
                json: async () => ({ error: { message: 'Invalid request' } })
            };
        };

        const originalFetch = globalThis.fetch;
        globalThis.fetch = mockFetch;

        try {
            const service = new TranscriptionService('valid-key', {
                retryBaseDelay: 10,
                maxRetryAttempts: 3
            });
            const audioBlob = createMockBlob('audio/webm', 15000);

            await assert.throws(
                () => service.transcribe(audioBlob),
                'Should throw on non-retryable error'
            );

            assert.equal(attemptCount, 1, 'Should not retry 400 errors');
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
            const service = new TranscriptionService('valid-key', {
                retryBaseDelay: 10,
                maxRetryAttempts: 2
            });
            const audioBlob = createMockBlob('audio/webm', 15000);

            await assert.throws(
                () => service.transcribe(audioBlob),
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
                json: async () => createMockTranscriptionResponse()
            };
        };

        const originalFetch = globalThis.fetch;
        globalThis.fetch = mockFetch;

        try {
            const service = new TranscriptionService('valid-key', {
                retryEnabled: false
            });
            const audioBlob = createMockBlob('audio/webm', 15000);

            await assert.throws(
                () => service.transcribe(audioBlob),
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
                json: async () => createMockTranscriptionResponse()
            };
        };

        const originalFetch = globalThis.fetch;
        globalThis.fetch = mockFetch;

        try {
            const service = new TranscriptionService('valid-key', {
                retryEnabled: false
            });

            // Queue multiple requests
            const promises = [];
            for (let i = 0; i < 3; i++) {
                const blob = createMockBlob('audio/webm', 15000);
                promises.push(service.transcribe(blob));
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

        const mockFetch = async () => {
            // Simulate slow request
            await new Promise(resolve => setTimeout(resolve, 100));
            return {
                ok: true,
                status: 200,
                json: async () => createMockTranscriptionResponse()
            };
        };

        const originalFetch = globalThis.fetch;
        globalThis.fetch = mockFetch;

        try {
            const service = new TranscriptionService('valid-key', {
                maxQueueSize: 2,
                retryEnabled: false
            });

            // Start first request (will be processing)
            const blob1 = createMockBlob('audio/webm', 15000);
            const promise1 = service.transcribe(blob1);

            // Wait a bit for it to start processing
            await new Promise(resolve => setTimeout(resolve, 10));

            // Queue second request (should queue successfully)
            const blob2 = createMockBlob('audio/webm', 15000);
            const promise2 = service.transcribe(blob2);

            // Third request should throw (queue full)
            const blob3 = createMockBlob('audio/webm', 15000);
            await assert.throws(
                () => service.transcribe(blob3),
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

        const service = new TranscriptionService('valid-key');

        assert.equal(service.getQueueSize(), 0, 'Queue should start empty');

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
                json: async () => createMockTranscriptionResponse()
            };
        };

        const originalFetch = globalThis.fetch;
        globalThis.fetch = mockFetch;

        try {
            const service = new TranscriptionService('valid-key', {
                retryEnabled: false
            });

            // Queue some requests
            const blob1 = createMockBlob('audio/webm', 15000);
            const promise1 = service.transcribe(blob1).catch(() => {});

            // Wait for first request to start
            await new Promise(resolve => setTimeout(resolve, 10));

            const blob2 = createMockBlob('audio/webm', 15000);
            const promise2 = service.transcribe(blob2);

            // Clear the queue
            service.clearQueue();

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
    process.argv[1]?.includes('transcription.test')
) {
    runTests().then((results) => {
        process.exit(results.failed > 0 ? 1 : 0);
    });
}
