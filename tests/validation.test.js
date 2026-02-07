/**
 * Unit Tests for Validation Helpers in AIAssistant
 * Tests _validateString, _validateNumber, and _validateArray methods
 * @module tests/validation
 */

import {
    setupMockGame,
    setupMockUI,
    cleanupMocks,
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
 * Helper to access private validation methods for testing
 * Note: Tests private methods through public parseResponse methods
 */
function createTestAssistant() {
    const assistant = new AIAssistant('test-api-key');
    // Expose private methods for testing purposes
    return {
        validateString: assistant._validateString.bind(assistant),
        validateNumber: assistant._validateNumber.bind(assistant),
        validateArray: assistant._validateArray.bind(assistant)
    };
}

/**
 * Run all validation tests
 */
export async function runTests() {
    const runner = new TestRunner('Validation Helper Tests');

    // ========== _validateString Tests ==========

    runner.test('_validateString returns empty string for null', async () => {
        await setup();
        const { validateString } = createTestAssistant();

        const result = validateString(null, 100, 'test');

        assert.equal(result, '', 'Should return empty string for null');
        teardown();
    });

    runner.test('_validateString returns empty string for undefined', async () => {
        await setup();
        const { validateString } = createTestAssistant();

        const result = validateString(undefined, 100, 'test');

        assert.equal(result, '', 'Should return empty string for undefined');
        teardown();
    });

    runner.test('_validateString converts non-string values to strings', async () => {
        await setup();
        const { validateString } = createTestAssistant();

        assert.equal(validateString(123, 100, 'test'), '123', 'Should convert number to string');
        assert.equal(validateString(true, 100, 'test'), 'true', 'Should convert boolean to string');
        assert.equal(validateString({ key: 'value' }, 100, 'test'), '[object Object]', 'Should convert object to string');

        teardown();
    });

    runner.test('_validateString returns string unchanged if within maxLength', async () => {
        await setup();
        const { validateString } = createTestAssistant();

        const input = 'Hello World';
        const result = validateString(input, 100, 'test');

        assert.equal(result, input, 'Should return unchanged string');
        teardown();
    });

    runner.test('_validateString truncates string exceeding maxLength', async () => {
        await setup();
        const { validateString } = createTestAssistant();

        const input = 'This is a very long string that exceeds the maximum length';
        const maxLength = 20;
        const result = validateString(input, maxLength, 'test');

        assert.equal(result.length, maxLength, 'Should truncate to maxLength');
        assert.equal(result, input.substring(0, maxLength), 'Should match truncated substring');
        teardown();
    });

    runner.test('_validateString handles empty strings', async () => {
        await setup();
        const { validateString } = createTestAssistant();

        const result = validateString('', 100, 'test');

        assert.equal(result, '', 'Should return empty string');
        teardown();
    });

    runner.test('_validateString handles special characters', async () => {
        await setup();
        const { validateString } = createTestAssistant();

        const specialChars = '<script>alert("xss")</script>';
        const result = validateString(specialChars, 100, 'test');

        assert.equal(result, specialChars, 'Should preserve special characters (sanitization is handled by Handlebars)');
        teardown();
    });

    runner.test('_validateString handles unicode characters', async () => {
        await setup();
        const { validateString } = createTestAssistant();

        const unicode = 'Hello 世界 🌍 émoji';
        const result = validateString(unicode, 100, 'test');

        assert.equal(result, unicode, 'Should preserve unicode characters');
        teardown();
    });

    runner.test('_validateString truncates unicode strings correctly', async () => {
        await setup();
        const { validateString } = createTestAssistant();

        const unicode = '🌍🌍🌍🌍🌍🌍🌍🌍🌍🌍';
        const maxLength = 5;
        const result = validateString(unicode, maxLength, 'test');

        assert.equal(result.length, maxLength, 'Should truncate to maxLength');
        teardown();
    });

    runner.test('_validateString handles extremely long strings', async () => {
        await setup();
        const { validateString } = createTestAssistant();

        const longString = 'a'.repeat(10000);
        const maxLength = 5000;
        const result = validateString(longString, maxLength, 'test');

        assert.equal(result.length, maxLength, 'Should truncate extremely long string');
        teardown();
    });

    runner.test('_validateString handles newlines and whitespace', async () => {
        await setup();
        const { validateString } = createTestAssistant();

        const input = 'Line 1\nLine 2\r\nLine 3\t\tTabbed';
        const result = validateString(input, 100, 'test');

        assert.equal(result, input, 'Should preserve newlines and whitespace');
        teardown();
    });

    // ========== _validateNumber Tests ==========

    runner.test('_validateNumber returns min for null', async () => {
        await setup();
        const { validateNumber } = createTestAssistant();

        const result = validateNumber(null, 0, 1, 'test');

        assert.equal(result, 0, 'Should return min for null');
        teardown();
    });

    runner.test('_validateNumber returns min for undefined', async () => {
        await setup();
        const { validateNumber } = createTestAssistant();

        const result = validateNumber(undefined, 0, 1, 'test');

        assert.equal(result, 0, 'Should return min for undefined');
        teardown();
    });

    runner.test('_validateNumber returns min for NaN', async () => {
        await setup();
        const { validateNumber } = createTestAssistant();

        const result = validateNumber('not-a-number', 0, 1, 'test');

        assert.equal(result, 0, 'Should return min for NaN');
        teardown();
    });

    runner.test('_validateNumber parses string numbers', async () => {
        await setup();
        const { validateNumber } = createTestAssistant();

        assert.equal(validateNumber('0.5', 0, 1, 'test'), 0.5, 'Should parse string to number');
        assert.equal(validateNumber('42', 0, 100, 'test'), 42, 'Should parse integer string');
        assert.equal(validateNumber('3.14159', 0, 10, 'test'), 3.14159, 'Should parse float string');

        teardown();
    });

    runner.test('_validateNumber returns number unchanged if in range', async () => {
        await setup();
        const { validateNumber } = createTestAssistant();

        assert.equal(validateNumber(0.5, 0, 1, 'test'), 0.5, 'Should return number in range');
        assert.equal(validateNumber(0, 0, 1, 'test'), 0, 'Should accept min boundary');
        assert.equal(validateNumber(1, 0, 1, 'test'), 1, 'Should accept max boundary');

        teardown();
    });

    runner.test('_validateNumber clamps value below min', async () => {
        await setup();
        const { validateNumber } = createTestAssistant();

        const result = validateNumber(-0.5, 0, 1, 'test');

        assert.equal(result, 0, 'Should clamp to min');
        teardown();
    });

    runner.test('_validateNumber clamps value above max', async () => {
        await setup();
        const { validateNumber } = createTestAssistant();

        const result = validateNumber(1.5, 0, 1, 'test');

        assert.equal(result, 1, 'Should clamp to max');
        teardown();
    });

    runner.test('_validateNumber handles negative ranges', async () => {
        await setup();
        const { validateNumber } = createTestAssistant();

        assert.equal(validateNumber(-5, -10, 0, 'test'), -5, 'Should handle negative values in range');
        assert.equal(validateNumber(-15, -10, 0, 'test'), -10, 'Should clamp below negative min');
        assert.equal(validateNumber(5, -10, 0, 'test'), 0, 'Should clamp above negative max');

        teardown();
    });

    runner.test('_validateNumber handles very large numbers', async () => {
        await setup();
        const { validateNumber } = createTestAssistant();

        const result = validateNumber(Number.MAX_SAFE_INTEGER, 0, 100, 'test');

        assert.equal(result, 100, 'Should clamp very large number to max');
        teardown();
    });

    runner.test('_validateNumber handles very small numbers', async () => {
        await setup();
        const { validateNumber } = createTestAssistant();

        const result = validateNumber(Number.MIN_SAFE_INTEGER, 0, 100, 'test');

        assert.equal(result, 0, 'Should clamp very small number to min');
        teardown();
    });

    runner.test('_validateNumber handles float precision', async () => {
        await setup();
        const { validateNumber } = createTestAssistant();

        const result = validateNumber(0.1 + 0.2, 0, 1, 'test');

        // 0.1 + 0.2 = 0.30000000000000004 in JavaScript
        assert.ok(result > 0 && result < 1, 'Should handle float precision issues');
        teardown();
    });

    runner.test('_validateNumber handles Infinity', async () => {
        await setup();
        const { validateNumber } = createTestAssistant();

        assert.equal(validateNumber(Infinity, 0, 1, 'test'), 1, 'Should clamp Infinity to max');
        assert.equal(validateNumber(-Infinity, 0, 1, 'test'), 0, 'Should clamp -Infinity to min');

        teardown();
    });

    // ========== _validateArray Tests ==========

    runner.test('_validateArray returns empty array for null', async () => {
        await setup();
        const { validateArray } = createTestAssistant();

        const result = validateArray(null, 10, 'test');

        assert.ok(Array.isArray(result), 'Should return an array');
        assert.equal(result.length, 0, 'Should return empty array for null');
        teardown();
    });

    runner.test('_validateArray returns empty array for undefined', async () => {
        await setup();
        const { validateArray } = createTestAssistant();

        const result = validateArray(undefined, 10, 'test');

        assert.ok(Array.isArray(result), 'Should return an array');
        assert.equal(result.length, 0, 'Should return empty array for undefined');
        teardown();
    });

    runner.test('_validateArray returns empty array for non-array values', async () => {
        await setup();
        const { validateArray } = createTestAssistant();

        assert.equal(validateArray('string', 10, 'test').length, 0, 'Should return empty array for string');
        assert.equal(validateArray(123, 10, 'test').length, 0, 'Should return empty array for number');
        assert.equal(validateArray({ key: 'value' }, 10, 'test').length, 0, 'Should return empty array for object');
        assert.equal(validateArray(true, 10, 'test').length, 0, 'Should return empty array for boolean');

        teardown();
    });

    runner.test('_validateArray returns array unchanged if within maxItems', async () => {
        await setup();
        const { validateArray } = createTestAssistant();

        const input = [1, 2, 3, 4, 5];
        const result = validateArray(input, 10, 'test');

        assert.deepEqual(result, input, 'Should return unchanged array');
        teardown();
    });

    runner.test('_validateArray truncates array exceeding maxItems', async () => {
        await setup();
        const { validateArray } = createTestAssistant();

        const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const maxItems = 5;
        const result = validateArray(input, maxItems, 'test');

        assert.equal(result.length, maxItems, 'Should truncate to maxItems');
        assert.deepEqual(result, input.slice(0, maxItems), 'Should match first maxItems elements');
        teardown();
    });

    runner.test('_validateArray handles empty arrays', async () => {
        await setup();
        const { validateArray } = createTestAssistant();

        const result = validateArray([], 10, 'test');

        assert.ok(Array.isArray(result), 'Should return an array');
        assert.equal(result.length, 0, 'Should return empty array');
        teardown();
    });

    runner.test('_validateArray handles arrays with mixed types', async () => {
        await setup();
        const { validateArray } = createTestAssistant();

        const input = [1, 'string', true, null, { key: 'value' }, [1, 2]];
        const result = validateArray(input, 10, 'test');

        assert.deepEqual(result, input, 'Should preserve mixed-type arrays');
        teardown();
    });

    runner.test('_validateArray handles arrays with undefined elements', async () => {
        await setup();
        const { validateArray } = createTestAssistant();

        const input = [1, undefined, 3, undefined, 5];
        const result = validateArray(input, 10, 'test');

        assert.equal(result.length, 5, 'Should preserve array length with undefined elements');
        assert.deepEqual(result, input, 'Should preserve undefined elements');
        teardown();
    });

    runner.test('_validateArray handles sparse arrays', async () => {
        await setup();
        const { validateArray } = createTestAssistant();

        const input = new Array(5);
        input[0] = 'first';
        input[4] = 'last';
        const result = validateArray(input, 10, 'test');

        assert.equal(result.length, 5, 'Should preserve sparse array length');
        teardown();
    });

    runner.test('_validateArray handles arrays with complex objects', async () => {
        await setup();
        const { validateArray } = createTestAssistant();

        const input = [
            { type: 'narration', content: 'Test 1' },
            { type: 'dialogue', content: 'Test 2' },
            { type: 'action', content: 'Test 3' }
        ];
        const result = validateArray(input, 10, 'test');

        assert.deepEqual(result, input, 'Should preserve complex objects');
        teardown();
    });

    runner.test('_validateArray handles very large arrays', async () => {
        await setup();
        const { validateArray } = createTestAssistant();

        const largeArray = new Array(1000).fill('item');
        const maxItems = 10;
        const result = validateArray(largeArray, maxItems, 'test');

        assert.equal(result.length, maxItems, 'Should truncate very large array');
        teardown();
    });

    runner.test('_validateArray preserves array reference integrity', async () => {
        await setup();
        const { validateArray } = createTestAssistant();

        const nested = { value: 'nested' };
        const input = [nested, nested, nested];
        const result = validateArray(input, 10, 'test');

        assert.ok(result[0] === result[1], 'Should preserve object references');
        assert.ok(result[1] === result[2], 'Should preserve object references');
        teardown();
    });

    // ========== Integration Tests ==========

    runner.test('Validation integration: all helpers work together', async () => {
        await setup();
        const { validateString, validateNumber, validateArray } = createTestAssistant();

        // Simulate validation of a suggestion object
        const suggestions = validateArray([
            {
                content: 'Test suggestion that is very long and needs truncation'.repeat(200),
                confidence: 1.5
            }
        ], 10, 'suggestions');

        const validatedSuggestion = {
            content: validateString(suggestions[0].content, 5000, 'content'),
            confidence: validateNumber(suggestions[0].confidence, 0, 1, 'confidence')
        };

        assert.equal(validatedSuggestion.content.length, 5000, 'Should truncate content');
        assert.equal(validatedSuggestion.confidence, 1, 'Should clamp confidence');

        teardown();
    });

    runner.test('Validation integration: extreme edge cases', async () => {
        await setup();
        const { validateString, validateNumber, validateArray } = createTestAssistant();

        // Test with all invalid inputs
        const str = validateString(null, 100, 'test');
        const num = validateNumber(undefined, 0, 1, 'test');
        const arr = validateArray(null, 10, 'test');

        assert.equal(str, '', 'Should handle null string');
        assert.equal(num, 0, 'Should handle undefined number');
        assert.equal(arr.length, 0, 'Should handle null array');

        teardown();
    });

    const results = await runner.run();
    return results;
}
