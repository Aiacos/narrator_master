/**
 * Unit Tests for RulesReferenceService
 * Tests rules question detection and pattern matching
 * @module tests/rules-reference
 */

import { setupMockGame, setupMockUI, cleanupMocks, assert, TestRunner } from './test-helper.js';

// Note: We need to set up mocks before importing the module
let RulesReferenceService;

/**
 * Setup function to run before tests
 */
async function setup() {
    setupMockGame();
    setupMockUI();

    // Dynamic import after mocks are set up
    const module = await import('../scripts/rules-reference.js');
    RulesReferenceService = module.RulesReferenceService;
}

/**
 * Teardown function to run after tests
 */
function teardown() {
    cleanupMocks();
}

/**
 * Test suite for RulesReferenceService
 */
export async function runTests() {
    const runner = new TestRunner('RulesReferenceService Tests');

    // Test: Constructor creates instance with defaults
    runner.test('Constructor creates instance with default options', async () => {
        await setup();

        const service = new RulesReferenceService();

        assert.equal(service.getLanguage(), 'it', 'Default language should be Italian');
        assert.equal(service.getResultLimit(), 5, 'Default result limit should be 5');

        teardown();
    });

    // Test: Constructor accepts custom options
    runner.test('Constructor accepts custom options', async () => {
        await setup();

        const service = new RulesReferenceService({
            language: 'en',
            resultLimit: 10
        });

        assert.equal(service.getLanguage(), 'en', 'Should use custom language');
        assert.equal(service.getResultLimit(), 10, 'Should use custom result limit');

        teardown();
    });

    // Test: detectRulesQuestion detects English "how does X work" pattern
    runner.test('detectRulesQuestion detects English "how does X work" pattern', async () => {
        await setup();

        const service = new RulesReferenceService();
        const result = service.detectRulesQuestion('How does grappling work?');

        assert.ok(result.isRulesQuestion, 'Should detect rules question');
        assert.ok(result.confidence >= 0.9, 'Should have high confidence');
        assert.equal(
            result.questionType,
            'combat',
            'Should detect as combat (grappling is a combat mechanic)'
        );
        assert.ok(result.detectedTerms.includes('how_does_work'), 'Should include pattern name');

        teardown();
    });

    // Test: detectRulesQuestion detects Italian "come funziona" pattern
    runner.test('detectRulesQuestion detects Italian "come funziona" pattern', async () => {
        await setup();

        const service = new RulesReferenceService();
        const result = service.detectRulesQuestion('Come funziona la lotta?');

        assert.ok(result.isRulesQuestion, 'Should detect rules question');
        assert.ok(result.confidence >= 0.9, 'Should have high confidence');
        assert.equal(result.questionType, 'combat', 'Should detect combat type from "lotta"');
        assert.ok(result.detectedTerms.length > 0, 'Should have detected terms');

        teardown();
    });

    // Test: detectRulesQuestion detects "can I" action patterns
    runner.test('detectRulesQuestion detects "can I" action patterns', async () => {
        await setup();

        const service = new RulesReferenceService();
        const result = service.detectRulesQuestion('Can I attack twice?');

        assert.ok(result.isRulesQuestion, 'Should detect rules question');
        assert.ok(result.confidence >= 0.7, 'Should have confidence above 0.7');
        assert.equal(result.questionType, 'action', 'Should detect as action question');

        teardown();
    });

    // Test: detectRulesQuestion detects Italian "posso" patterns
    runner.test('detectRulesQuestion detects Italian "posso" patterns', async () => {
        await setup();

        const service = new RulesReferenceService();
        const result = service.detectRulesQuestion('Posso fare un attacco di opportunità?');

        assert.ok(result.isRulesQuestion, 'Should detect rules question');
        assert.ok(result.confidence > 0.7, 'Should have high confidence');
        assert.ok(
            result.detectedTerms.includes('attacco di opportunità'),
            'Should detect mechanic term'
        );

        teardown();
    });

    // Test: detectRulesQuestion detects known mechanic terms
    runner.test('detectRulesQuestion detects known mechanic terms', async () => {
        await setup();

        const service = new RulesReferenceService();
        const result = service.detectRulesQuestion('What happens with concentration?');

        assert.ok(result.isRulesQuestion, 'Should detect rules question');
        assert.ok(
            result.detectedTerms.includes('concentration'),
            'Should detect concentration term'
        );
        assert.equal(result.questionType, 'spell', 'Should categorize as spell mechanic');

        teardown();
    });

    // Test: detectRulesQuestion detects Italian spell terms
    runner.test('detectRulesQuestion detects Italian spell terms', async () => {
        await setup();

        const service = new RulesReferenceService();
        const result = service.detectRulesQuestion('Quanto costa questo slot incantesimo?');

        assert.ok(result.isRulesQuestion, 'Should detect rules question');
        assert.ok(result.confidence >= 0.8, 'Should have high confidence');
        assert.ok(
            result.detectedTerms.includes('slot incantesimo'),
            'Should detect spell slot term'
        );

        teardown();
    });

    // Test: detectRulesQuestion detects condition terms
    runner.test('detectRulesQuestion detects condition terms', async () => {
        await setup();

        const service = new RulesReferenceService();
        const result = service.detectRulesQuestion('What does stunned do?');

        assert.ok(result.isRulesQuestion, 'Should detect rules question');
        assert.ok(result.detectedTerms.includes('stunned'), 'Should detect stunned condition');
        assert.equal(result.questionType, 'condition', 'Should categorize as condition');

        teardown();
    });

    // Test: detectRulesQuestion detects Italian conditions
    runner.test('detectRulesQuestion detects Italian conditions', async () => {
        await setup();

        const service = new RulesReferenceService();
        const result = service.detectRulesQuestion('Come funziona lo stato stordito?');

        assert.ok(result.isRulesQuestion, 'Should detect rules question');
        assert.ok(result.detectedTerms.includes('stordito'), 'Should detect stordito (stunned)');

        teardown();
    });

    // Test: detectRulesQuestion returns false for non-rules text
    runner.test('detectRulesQuestion returns false for non-rules text', async () => {
        await setup();

        const service = new RulesReferenceService();
        const result = service.detectRulesQuestion('I enter the tavern and order ale.');

        assert.ok(!result.isRulesQuestion, 'Should not detect as rules question');
        assert.ok(result.confidence < 0.4, 'Should have low confidence');

        teardown();
    });

    // Test: detectRulesQuestion handles empty/invalid input
    runner.test('detectRulesQuestion handles empty/invalid input', async () => {
        await setup();

        const service = new RulesReferenceService();

        const emptyResult = service.detectRulesQuestion('');
        assert.ok(!emptyResult.isRulesQuestion, 'Empty string should return false');

        const nullResult = service.detectRulesQuestion(null);
        assert.ok(!nullResult.isRulesQuestion, 'Null should return false');

        const undefinedResult = service.detectRulesQuestion(undefined);
        assert.ok(!undefinedResult.isRulesQuestion, 'Undefined should return false');

        teardown();
    });

    // Test: detectRulesQuestion extracts topic from pattern
    runner.test('detectRulesQuestion extracts topic from question', async () => {
        await setup();

        const service = new RulesReferenceService();
        const result = service.detectRulesQuestion('How does opportunity attack work?');

        assert.ok(result.extractedTopic, 'Should extract topic');
        assert.ok(
            result.extractedTopic.includes('opportunity attack'),
            'Should include the mechanic name'
        );

        teardown();
    });

    // Test: extractRulesTopic returns extracted topic
    runner.test('extractRulesTopic returns extracted topic', async () => {
        await setup();

        const service = new RulesReferenceService();
        const topic = service.extractRulesTopic('Come funziona la concentrazione?');

        assert.ok(topic !== null, 'Should extract topic');

        teardown();
    });

    // Test: extractRulesTopic returns null for non-rules text
    runner.test('extractRulesTopic returns null for non-rules text', async () => {
        await setup();

        const service = new RulesReferenceService();
        const topic = service.extractRulesTopic('The dragon flies away');

        assert.ok(topic === null || topic === undefined, 'Should return null for non-rules text');

        teardown();
    });

    // Test: isKnownMechanic identifies known mechanics
    runner.test('isKnownMechanic identifies known mechanics', async () => {
        await setup();

        const service = new RulesReferenceService();

        assert.ok(service.isKnownMechanic('grappling'), 'Should recognize grappling');
        assert.ok(service.isKnownMechanic('concentration'), 'Should recognize concentration');
        assert.ok(service.isKnownMechanic('lotta'), 'Should recognize lotta (Italian)');
        assert.ok(
            service.isKnownMechanic('vantaggio'),
            'Should recognize vantaggio (Italian advantage)'
        );

        teardown();
    });

    // Test: isKnownMechanic returns false for unknown terms
    runner.test('isKnownMechanic returns false for unknown terms', async () => {
        await setup();

        const service = new RulesReferenceService();

        assert.ok(!service.isKnownMechanic('randomword'), 'Should not recognize random word');
        assert.ok(!service.isKnownMechanic('tavern'), 'Should not recognize non-mechanic word');

        teardown();
    });

    // Test: isKnownMechanic handles invalid input
    runner.test('isKnownMechanic handles invalid input', async () => {
        await setup();

        const service = new RulesReferenceService();

        assert.ok(!service.isKnownMechanic(null), 'Should handle null');
        assert.ok(!service.isKnownMechanic(undefined), 'Should handle undefined');
        assert.ok(!service.isKnownMechanic(''), 'Should handle empty string');

        teardown();
    });

    // Test: detectRulesQuestion with combat mechanics (multiple terms)
    runner.test('detectRulesQuestion detects multiple combat terms', async () => {
        await setup();

        const service = new RulesReferenceService();
        const result = service.detectRulesQuestion('Can I use advantage on my opportunity attack?');

        assert.ok(result.isRulesQuestion, 'Should detect rules question');
        assert.ok(result.detectedTerms.length >= 2, 'Should detect multiple terms');
        assert.ok(result.detectedTerms.includes('advantage'), 'Should detect advantage');
        assert.ok(
            result.detectedTerms.includes('opportunity attack'),
            'Should detect opportunity attack'
        );

        teardown();
    });

    // Test: detectRulesQuestion with rest mechanics
    runner.test('detectRulesQuestion detects rest mechanics', async () => {
        await setup();

        const service = new RulesReferenceService();
        const result = service.detectRulesQuestion('What happens during a short rest?');

        assert.ok(result.isRulesQuestion, 'Should detect rules question');
        assert.ok(result.detectedTerms.includes('short rest'), 'Should detect short rest');
        assert.equal(result.questionType, 'rest', 'Should categorize as rest');

        teardown();
    });

    // Test: detectRulesQuestion case insensitive
    runner.test('detectRulesQuestion is case insensitive', async () => {
        await setup();

        const service = new RulesReferenceService();
        const result1 = service.detectRulesQuestion('HOW DOES GRAPPLING WORK?');
        const result2 = service.detectRulesQuestion('how does grappling work?');
        const result3 = service.detectRulesQuestion('How Does Grappling Work?');

        assert.ok(result1.isRulesQuestion, 'Should detect uppercase');
        assert.ok(result2.isRulesQuestion, 'Should detect lowercase');
        assert.ok(result3.isRulesQuestion, 'Should detect mixed case');

        teardown();
    });

    return runner.run();
}
