/**
 * Unit Tests for OpenAIServiceBase
 * Tests retry logic, exponential backoff, and request queuing
 * @module tests/openai-service-base
 */

import {
    setupMockGame,
    setupMockUI,
    cleanupMocks,
    assert,
    TestRunner
} from './test-helper.js';

// Note: We need to set up mocks before importing the module
let OpenAIServiceBase;

/**
 * Setup function to run before tests
 */
async function setup() {
    setupMockGame();
    setupMockUI();

    // Ensure setTimeout is available
    if (typeof globalThis.setTimeout === 'undefined') {
        globalThis.setTimeout = (fn, delay) => {
            // Simple synchronous fallback for testing
            fn();
            return 0;
        };
    }

    // Dynamic import after mocks are set up
    const module = await import('../scripts/openai-service-base.js');
    OpenAIServiceBase = module.OpenAIServiceBase;
}

/**
 * Teardown function to run after tests
 */
function teardown() {
    cleanupMocks();
}

/**
 * Creates a mock response object with headers
 */
function createMockResponse(headers = {}) {
    return {
        headers: {
            get: (key) => headers[key] || null
        }
    };
}

/**
 * Helper to create a retryable error (network error)
 */
function createNetworkError() {
    const error = new Error('Network error');
    error.isNetworkError = true;
    error.status = 0;
    return error;
}

/**
 * Helper to create an HTTP error
 */
function createHttpError(status, message = 'HTTP Error') {
    const error = new Error(message);
    error.status = status;
    return error;
}

/**
 * Run all OpenAIServiceBase tests
 */
export async function runTests() {
    const runner = new TestRunner('OpenAIServiceBase Tests');

    // ========================================
    // Constructor and Initialization Tests
    // ========================================

    runner.test('constructor initializes with default values', async () => {
        await setup();

        const service = new OpenAIServiceBase('test-api-key');

        assert.equal(service._apiKey, 'test-api-key', 'API key should be set');
        assert.equal(service._retryConfig.maxAttempts, 3, 'Default max attempts should be 3');
        assert.equal(
            service._retryConfig.baseDelay,
            1000,
            'Default base delay should be 1000ms'
        );
        assert.equal(
            service._retryConfig.maxDelay,
            60000,
            'Default max delay should be 60000ms'
        );
        assert.equal(service._retryConfig.enabled, true, 'Retry should be enabled by default');
        assert.equal(service._maxQueueSize, 100, 'Default queue size should be 100');
        assert.equal(service._requestQueue.length, 0, 'Queue should be empty initially');
        assert.equal(service._isProcessingQueue, false, 'Should not be processing initially');

        teardown();
    });

    runner.test('constructor accepts custom retry options', async () => {
        await setup();

        const service = new OpenAIServiceBase('key', {
            maxRetryAttempts: 5,
            retryBaseDelay: 2000,
            retryMaxDelay: 120000,
            retryEnabled: false,
            maxQueueSize: 50
        });

        assert.equal(service._retryConfig.maxAttempts, 5, 'Custom max attempts should be set');
        assert.equal(service._retryConfig.baseDelay, 2000, 'Custom base delay should be set');
        assert.equal(service._retryConfig.maxDelay, 120000, 'Custom max delay should be set');
        assert.equal(service._retryConfig.enabled, false, 'Custom retry enabled should be set');
        assert.equal(service._maxQueueSize, 50, 'Custom queue size should be set');

        teardown();
    });

    runner.test('setApiKey updates the API key', async () => {
        await setup();

        const service = new OpenAIServiceBase('old-key');
        service.setApiKey('new-key');

        assert.equal(service._apiKey, 'new-key', 'API key should be updated');

        teardown();
    });

    runner.test('isConfigured returns correct state', async () => {
        await setup();

        const serviceWithKey = new OpenAIServiceBase('valid-key');
        assert.ok(serviceWithKey.isConfigured(), 'Should return true with valid key');

        const serviceWithoutKey = new OpenAIServiceBase('');
        assert.ok(!serviceWithoutKey.isConfigured(), 'Should return false with empty key');

        const serviceWithWhitespace = new OpenAIServiceBase('   ');
        assert.ok(
            !serviceWithWhitespace.isConfigured(),
            'Should return false with whitespace key'
        );

        teardown();
    });

    // ========================================
    // Error Classification Tests (_shouldRetry)
    // ========================================

    runner.test('_shouldRetry returns true for network errors', async () => {
        await setup();

        const service = new OpenAIServiceBase('key');
        const networkError = createNetworkError();

        assert.ok(service._shouldRetry(networkError), 'Should retry network errors');

        teardown();
    });

    runner.test('_shouldRetry returns true for HTTP 429 (rate limit)', async () => {
        await setup();

        const service = new OpenAIServiceBase('key');
        const rateLimitError = createHttpError(429, 'Rate limited');

        assert.ok(service._shouldRetry(rateLimitError), 'Should retry rate limit errors');

        teardown();
    });

    runner.test('_shouldRetry returns true for HTTP 5xx server errors', async () => {
        await setup();

        const service = new OpenAIServiceBase('key');

        const error500 = createHttpError(500, 'Internal Server Error');
        assert.ok(service._shouldRetry(error500), 'Should retry HTTP 500');

        const error503 = createHttpError(503, 'Service Unavailable');
        assert.ok(service._shouldRetry(error503), 'Should retry HTTP 503');

        const error504 = createHttpError(504, 'Gateway Timeout');
        assert.ok(service._shouldRetry(error504), 'Should retry HTTP 504');

        teardown();
    });

    runner.test('_shouldRetry returns false for HTTP 4xx client errors (except 429)', async () => {
        await setup();

        const service = new OpenAIServiceBase('key');

        const error400 = createHttpError(400, 'Bad Request');
        assert.ok(!service._shouldRetry(error400), 'Should not retry HTTP 400');

        const error401 = createHttpError(401, 'Unauthorized');
        assert.ok(!service._shouldRetry(error401), 'Should not retry HTTP 401');

        const error403 = createHttpError(403, 'Forbidden');
        assert.ok(!service._shouldRetry(error403), 'Should not retry HTTP 403');

        const error404 = createHttpError(404, 'Not Found');
        assert.ok(!service._shouldRetry(error404), 'Should not retry HTTP 404');

        teardown();
    });

    runner.test('_shouldRetry returns false for unknown errors', async () => {
        await setup();

        const service = new OpenAIServiceBase('key');
        const unknownError = new Error('Unknown error');

        assert.ok(!service._shouldRetry(unknownError), 'Should not retry unknown errors');

        teardown();
    });

    // ========================================
    // Retry-After Header Parsing Tests
    // ========================================

    runner.test('_parseRetryAfter parses numeric seconds format', async () => {
        await setup();

        const service = new OpenAIServiceBase('key');
        const response = createMockResponse({ 'Retry-After': '5' });

        const delay = service._parseRetryAfter(response);

        assert.equal(delay, 5000, 'Should parse 5 seconds as 5000ms');

        teardown();
    });

    runner.test('_parseRetryAfter parses HTTP-date format', async () => {
        await setup();

        const service = new OpenAIServiceBase('key');

        // Create a date 10 seconds in the future
        const futureDate = new Date(Date.now() + 10000);
        const response = createMockResponse({ 'Retry-After': futureDate.toUTCString() });

        const delay = service._parseRetryAfter(response);

        // Allow some tolerance for timing
        assert.ok(delay >= 9000 && delay <= 11000, 'Should parse HTTP-date correctly');

        teardown();
    });

    runner.test('_parseRetryAfter returns null for missing header', async () => {
        await setup();

        const service = new OpenAIServiceBase('key');
        const response = createMockResponse({});

        const delay = service._parseRetryAfter(response);

        assert.equal(delay, null, 'Should return null when header is missing');

        teardown();
    });

    runner.test('_parseRetryAfter returns null for invalid format', async () => {
        await setup();

        const service = new OpenAIServiceBase('key');
        const response = createMockResponse({ 'Retry-After': 'invalid' });

        const delay = service._parseRetryAfter(response);

        assert.equal(delay, null, 'Should return null for invalid format');

        teardown();
    });

    runner.test('_parseRetryAfter returns null for negative delays', async () => {
        await setup();

        const service = new OpenAIServiceBase('key');

        // Date in the past
        const pastDate = new Date(Date.now() - 10000);
        const response = createMockResponse({ 'Retry-After': pastDate.toUTCString() });

        const delay = service._parseRetryAfter(response);

        assert.equal(delay, null, 'Should return null for negative delays');

        teardown();
    });

    // ========================================
    // Retry Logic Tests (_retryWithBackoff)
    // ========================================

    runner.test('_retryWithBackoff succeeds on first attempt', async () => {
        await setup();

        const service = new OpenAIServiceBase('key');
        let attempts = 0;

        const operation = async () => {
            attempts++;
            return 'success';
        };

        const result = await service._retryWithBackoff(operation, {
            operationName: 'Test operation'
        });

        assert.equal(result, 'success', 'Should return operation result');
        assert.equal(attempts, 1, 'Should only attempt once');

        teardown();
    });

    runner.test('_retryWithBackoff retries on retryable errors', async () => {
        await setup();

        const service = new OpenAIServiceBase('key', {
            retryBaseDelay: 10, // Short delay for testing
            maxRetryAttempts: 3
        });
        let attempts = 0;

        const operation = async () => {
            attempts++;
            if (attempts < 3) {
                throw createNetworkError();
            }
            return 'success';
        };

        const result = await service._retryWithBackoff(operation, {
            operationName: 'Test operation'
        });

        assert.equal(result, 'success', 'Should eventually succeed');
        assert.equal(attempts, 3, 'Should retry 3 times');

        teardown();
    });

    runner.test('_retryWithBackoff fails after max attempts', async () => {
        await setup();

        const service = new OpenAIServiceBase('key', {
            retryBaseDelay: 10, // Short delay for testing
            maxRetryAttempts: 3
        });
        let attempts = 0;

        const operation = async () => {
            attempts++;
            throw createNetworkError();
        };

        await assert.throws(
            () =>
                service._retryWithBackoff(operation, {
                    operationName: 'Test operation'
                }),
            'Should throw after max attempts'
        );

        assert.equal(attempts, 3, 'Should attempt maxRetryAttempts times');

        teardown();
    });

    runner.test('_retryWithBackoff does not retry non-retryable errors', async () => {
        await setup();

        const service = new OpenAIServiceBase('key', {
            retryBaseDelay: 10,
            maxRetryAttempts: 3
        });
        let attempts = 0;

        const operation = async () => {
            attempts++;
            throw createHttpError(401, 'Unauthorized');
        };

        await assert.throws(
            () =>
                service._retryWithBackoff(operation, {
                    operationName: 'Test operation'
                }),
            'Should throw non-retryable error'
        );

        assert.equal(attempts, 1, 'Should only attempt once for non-retryable errors');

        teardown();
    });

    runner.test('_retryWithBackoff respects retry disabled flag', async () => {
        await setup();

        const service = new OpenAIServiceBase('key', {
            retryEnabled: false,
            maxRetryAttempts: 3
        });
        let attempts = 0;

        const operation = async () => {
            attempts++;
            throw createNetworkError();
        };

        await assert.throws(
            () =>
                service._retryWithBackoff(operation, {
                    operationName: 'Test operation'
                }),
            'Should throw when retry is disabled'
        );

        assert.equal(attempts, 1, 'Should only attempt once when retry is disabled');

        teardown();
    });

    runner.test('_retryWithBackoff uses exponential backoff with jitter', async () => {
        await setup();

        const service = new OpenAIServiceBase('key', {
            retryBaseDelay: 100,
            maxRetryAttempts: 3,
            retryMaxDelay: 10000
        });
        let attempts = 0;
        const delays = [];
        const originalSetTimeout = (typeof global !== 'undefined' && global.setTimeout) || setTimeout;

        // Mock setTimeout to capture delay values
        if (typeof global !== 'undefined') {
            global.setTimeout = (fn, delay) => {
                delays.push(delay);
                return originalSetTimeout.call(global, fn, 0); // Execute immediately for testing
            };
        }

        const operation = async () => {
            attempts++;
            if (attempts < 3) {
                throw createNetworkError();
            }
            return 'success';
        };

        await service._retryWithBackoff(operation, {
            operationName: 'Test operation'
        });

        // Restore setTimeout
        if (typeof global !== 'undefined') {
            global.setTimeout = originalSetTimeout;
        }

        assert.equal(delays.length, 2, 'Should have 2 delays for 3 attempts');

        // First retry: baseDelay * 2^0 = 100ms (plus jitter up to 25ms)
        assert.ok(delays[0] >= 100 && delays[0] <= 125, 'First delay should be ~100ms + jitter');

        // Second retry: baseDelay * 2^1 = 200ms (plus jitter up to 50ms)
        assert.ok(delays[1] >= 200 && delays[1] <= 250, 'Second delay should be ~200ms + jitter');

        teardown();
    });

    runner.test('_retryWithBackoff caps delay at maxDelay', async () => {
        await setup();

        const service = new OpenAIServiceBase('key', {
            retryBaseDelay: 1000,
            maxRetryAttempts: 10, // Many attempts to trigger large exponential value
            retryMaxDelay: 5000 // Cap at 5 seconds
        });
        let attempts = 0;
        const delays = [];
        const originalSetTimeout = (typeof global !== 'undefined' && global.setTimeout) || setTimeout;

        // Mock setTimeout to capture delay values
        if (typeof global !== 'undefined') {
            global.setTimeout = (fn, delay) => {
                delays.push(delay);
                return originalSetTimeout.call(global, fn, 0);
            };
        }

        const operation = async () => {
            attempts++;
            if (attempts < 6) {
                throw createNetworkError();
            }
            return 'success';
        };

        await service._retryWithBackoff(operation, {
            operationName: 'Test operation'
        });

        // Restore setTimeout
        if (typeof global !== 'undefined') {
            global.setTimeout = originalSetTimeout;
        }

        // After attempt 3, exponential delay would be 1000 * 2^3 = 8000ms
        // But should be capped at 5000ms (+ jitter up to 1250ms)
        const laterDelays = delays.slice(3);
        for (const delay of laterDelays) {
            assert.ok(
                delay <= 6250,
                `Delay ${delay}ms should be capped at maxDelay + jitter (6250ms)`
            );
        }

        teardown();
    });

    // ========================================
    // Request Queue Tests
    // ========================================

    runner.test('_enqueueRequest adds requests to queue (FIFO)', async () => {
        await setup();

        const service = new OpenAIServiceBase('key', {
            retryBaseDelay: 10
        });

        const results = [];

        // Enqueue three operations
        const promise1 = service._enqueueRequest(
            async () => {
                results.push('op1');
                return 'result1';
            },
            { operationName: 'Operation 1' }
        );

        const promise2 = service._enqueueRequest(
            async () => {
                results.push('op2');
                return 'result2';
            },
            { operationName: 'Operation 2' }
        );

        const promise3 = service._enqueueRequest(
            async () => {
                results.push('op3');
                return 'result3';
            },
            { operationName: 'Operation 3' }
        );

        // Wait for all to complete
        const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3]);

        assert.equal(result1, 'result1', 'First operation should return result1');
        assert.equal(result2, 'result2', 'Second operation should return result2');
        assert.equal(result3, 'result3', 'Third operation should return result3');

        // Check FIFO order
        assert.deepEqual(results, ['op1', 'op2', 'op3'], 'Operations should execute in FIFO order');

        teardown();
    });

    runner.test('_enqueueRequest handles priority correctly', async () => {
        await setup();

        const service = new OpenAIServiceBase('key', {
            retryBaseDelay: 10
        });

        const results = [];

        // Block the queue processing temporarily by adding a slow operation
        let resolveBlocker;
        const blockerPromise = new Promise((resolve) => {
            resolveBlocker = resolve;
        });

        const blockerOperation = service._enqueueRequest(
            async () => {
                await blockerPromise;
                results.push('blocker');
                return 'blocker';
            },
            { operationName: 'Blocker' }
        );

        // Wait for blocker to start processing
        await new Promise((resolve) => setTimeout(resolve, 10));

        // Now add operations with different priorities
        const promise1 = service._enqueueRequest(
            async () => {
                results.push('normal');
                return 'normal';
            },
            { operationName: 'Normal' },
            0 // Normal priority
        );

        const promise2 = service._enqueueRequest(
            async () => {
                results.push('high');
                return 'high';
            },
            { operationName: 'High' },
            10 // High priority
        );

        const promise3 = service._enqueueRequest(
            async () => {
                results.push('low');
                return 'low';
            },
            { operationName: 'Low' },
            -5 // Low priority
        );

        // Unblock the queue
        resolveBlocker();

        // Wait for all to complete
        await Promise.all([blockerOperation, promise1, promise2, promise3]);

        // High priority should execute before normal and low
        assert.deepEqual(
            results,
            ['blocker', 'high', 'normal', 'low'],
            'High priority should execute before normal and low'
        );

        teardown();
    });

    runner.test('_enqueueRequest throws when queue is full', async () => {
        await setup();

        const service = new OpenAIServiceBase('key', {
            maxQueueSize: 2
        });

        // Fill the queue
        let resolveBlocker;
        const blockerPromise = new Promise((resolve) => {
            resolveBlocker = resolve;
        });

        const promise1 = service._enqueueRequest(async () => {
            await blockerPromise;
            return 'blocker';
        });

        const promise2 = service._enqueueRequest(async () => {
            await blockerPromise;
            return 'item2';
        });

        // Wait for first operation to start processing
        await new Promise((resolve) => setTimeout(resolve, 10));

        // Third request should throw (queue is full - one processing, one in queue, max is 2)
        try {
            service._enqueueRequest(async () => 'item3');
            throw new Error('Should have thrown when queue is full');
        } catch (error) {
            assert.ok(
                error.message.toLowerCase().includes('queue') &&
                    error.message.toLowerCase().includes('full'),
                `Error should mention queue is full, got: "${error.message}"`
            );
        }

        // Cleanup - unblock and wait for promises
        resolveBlocker();
        await Promise.all([promise1, promise2]);

        teardown();
    });

    runner.test('_processQueue processes requests sequentially', async () => {
        await setup();

        const service = new OpenAIServiceBase('key', {
            retryBaseDelay: 10
        });

        const executionOrder = [];
        let activeCount = 0;
        let maxActive = 0;

        const createOperation = (name) => async () => {
            activeCount++;
            maxActive = Math.max(maxActive, activeCount);
            executionOrder.push(`${name}-start`);

            await new Promise((resolve) => setTimeout(resolve, 20));

            executionOrder.push(`${name}-end`);
            activeCount--;
            return name;
        };

        // Enqueue multiple operations
        const promises = [
            service._enqueueRequest(createOperation('op1')),
            service._enqueueRequest(createOperation('op2')),
            service._enqueueRequest(createOperation('op3'))
        ];

        await Promise.all(promises);

        // Verify sequential execution (one at a time)
        assert.equal(maxActive, 1, 'Should never have more than 1 active operation');

        // Verify order: each operation completes before the next starts
        assert.deepEqual(
            executionOrder,
            ['op1-start', 'op1-end', 'op2-start', 'op2-end', 'op3-start', 'op3-end'],
            'Operations should complete sequentially'
        );

        teardown();
    });

    runner.test('_processQueue handles operation errors correctly', async () => {
        await setup();

        const service = new OpenAIServiceBase('key', {
            retryBaseDelay: 10,
            maxRetryAttempts: 1 // Only 1 attempt to speed up test
        });

        const results = [];

        // First operation fails
        const promise1 = service
            ._enqueueRequest(async () => {
                throw new Error('Operation failed');
            })
            .catch((error) => {
                results.push(`error1: ${error.message}`);
            });

        // Second operation succeeds
        const promise2 = service._enqueueRequest(async () => {
            results.push('success2');
            return 'result2';
        });

        // Third operation fails with non-retryable error
        const promise3 = service
            ._enqueueRequest(async () => {
                throw createHttpError(401, 'Unauthorized');
            })
            .catch((error) => {
                results.push('error3');
            });

        await Promise.all([promise1, promise2, promise3]);

        assert.ok(results.includes('success2'), 'Successful operation should complete');
        assert.ok(
            results.some((r) => r.includes('error1')),
            'Failed operation should be caught'
        );
        assert.ok(results.includes('error3'), 'Non-retryable error should be caught');

        teardown();
    });

    // ========================================
    // Queue Management Tests
    // ========================================

    runner.test('getQueueSize returns correct queue size', async () => {
        await setup();

        const service = new OpenAIServiceBase('key');

        assert.equal(service.getQueueSize(), 0, 'Queue should be empty initially');

        // Block processing
        let resolveBlocker;
        const blockerPromise = new Promise((resolve) => {
            resolveBlocker = resolve;
        });

        const promise1 = service._enqueueRequest(async () => {
            await blockerPromise;
        });

        // Wait for blocker to start
        await new Promise((resolve) => setTimeout(resolve, 10));

        // Add more items
        const promise2 = service._enqueueRequest(async () => 'op2');
        const promise3 = service._enqueueRequest(async () => 'op3');

        assert.equal(service.getQueueSize(), 2, 'Queue should have 2 pending items');

        // Unblock and wait for all promises to complete
        resolveBlocker();
        await Promise.all([promise1, promise2, promise3]);

        assert.equal(service.getQueueSize(), 0, 'Queue should be empty after processing');

        teardown();
    });

    runner.test('clearQueue cancels all pending requests', async () => {
        await setup();

        const service = new OpenAIServiceBase('key');

        // Block processing
        let resolveBlocker;
        const blockerPromise = new Promise((resolve) => {
            resolveBlocker = resolve;
        });

        const promise1 = service._enqueueRequest(async () => {
            await blockerPromise;
        });

        // Wait for blocker to start
        await new Promise((resolve) => setTimeout(resolve, 10));

        // Add more items
        const promise2 = service._enqueueRequest(async () => 'op2');
        const promise3 = service._enqueueRequest(async () => 'op3');

        // Clear the queue
        service.clearQueue();

        assert.equal(service.getQueueSize(), 0, 'Queue should be empty after clearing');

        // Verify promises are rejected with cancellation error
        await assert.throws(() => promise2, 'Second operation should be cancelled');
        await assert.throws(() => promise3, 'Third operation should be cancelled');

        // Check that error has isCancelled flag
        try {
            await promise2;
        } catch (error) {
            assert.ok(error.isCancelled, 'Error should have isCancelled flag');
        }

        // Cleanup - unblock and wait for first promise
        resolveBlocker();
        await promise1.catch(() => {}); // Ignore if already rejected

        teardown();
    });

    // ========================================
    // History and Stats Tests
    // ========================================

    runner.test('getStats returns correct statistics', async () => {
        await setup();

        const service = new OpenAIServiceBase('test-key');
        const stats = service.getStats();

        assert.ok(stats.configured, 'Should report configured when API key is set');
        assert.equal(stats.historySize, 0, 'History should be empty initially');

        teardown();
    });

    runner.test('getStats returns unconfigured state without API key', async () => {
        await setup();

        const service = new OpenAIServiceBase('');
        const stats = service.getStats();

        assert.ok(!stats.configured, 'Should report not configured without API key');

        teardown();
    });

    // ========================================
    // Integration Test: Retry + Queue
    // ========================================

    runner.test('queue integrates with retry logic correctly', async () => {
        await setup();

        const service = new OpenAIServiceBase('key', {
            retryBaseDelay: 10,
            maxRetryAttempts: 2
        });

        const attempts = [];

        // First operation: succeeds on second attempt
        const promise1 = service._enqueueRequest(async () => {
            const attemptNum = attempts.filter((a) => a === 'op1').length + 1;
            attempts.push('op1');

            if (attemptNum === 1) {
                throw createNetworkError();
            }
            return 'result1';
        });

        // Second operation: succeeds immediately
        const promise2 = service._enqueueRequest(async () => {
            attempts.push('op2');
            return 'result2';
        });

        const [result1, result2] = await Promise.all([promise1, promise2]);

        assert.equal(result1, 'result1', 'First operation should succeed after retry');
        assert.equal(result2, 'result2', 'Second operation should succeed');

        // Check that op1 was attempted twice due to retry
        const op1Attempts = attempts.filter((a) => a === 'op1').length;
        assert.equal(op1Attempts, 2, 'First operation should have been retried once');

        teardown();
    });

    // Run all tests
    return runner.run();
}

// Export for direct execution
if (
    typeof process !== 'undefined' &&
    process.argv &&
    process.argv[1]?.includes('openai-service-base.test')
) {
    runTests().then((results) => {
        process.exit(results.failed > 0 ? 1 : 0);
    });
}
