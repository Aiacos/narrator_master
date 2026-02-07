/**
 * Unit Tests for SceneDetector
 * Tests scene transition detection, scene type identification, and pattern matching
 * @module tests/scene-detector
 */

import {
    setupMockGame,
    setupMockUI,
    cleanupMocks,
    assert,
    TestRunner
} from './test-helper.js';

// Note: We need to set up mocks before importing the module
let SceneDetector, SCENE_TYPES;

/**
 * Setup function to run before tests
 */
async function setup() {
    setupMockGame();
    setupMockUI();

    // Dynamic import after mocks are set up
    const module = await import('../scripts/scene-detector.js');
    SceneDetector = module.SceneDetector;
    SCENE_TYPES = module.SCENE_TYPES;
}

/**
 * Teardown function to run after tests
 */
function teardown() {
    cleanupMocks();
}

/**
 * Run all SceneDetector tests
 */
export async function runTests() {
    const runner = new TestRunner('SceneDetector Tests');

    // Test: Constructor initializes with default values
    runner.test('constructor initializes with default values', async () => {
        await setup();

        const detector = new SceneDetector();

        assert.equal(detector._sensitivity, 'medium', 'Default sensitivity should be medium');
        assert.equal(detector._minimumConfidence, 0.6, 'Default minimum confidence should be 0.6');
        assert.equal(detector._enableCombatDetection, true, 'Combat detection should be enabled by default');
        assert.equal(detector._enableTimeDetection, true, 'Time detection should be enabled by default');
        assert.equal(detector._enableLocationDetection, true, 'Location detection should be enabled by default');
        assert.equal(detector._currentSceneType, SCENE_TYPES.UNKNOWN, 'Current scene type should be unknown');
        assert.ok(Array.isArray(detector._sceneHistory), 'Scene history should be an array');
        assert.equal(detector._sceneHistory.length, 0, 'Scene history should be empty initially');

        teardown();
    });

    // Test: Constructor accepts custom options
    runner.test('constructor accepts custom options', async () => {
        await setup();

        const detector = new SceneDetector({
            sensitivity: 'high',
            minimumConfidence: 0.4,
            enableCombatDetection: false,
            enableTimeDetection: false,
            enableLocationDetection: false
        });

        assert.equal(detector._sensitivity, 'high', 'Custom sensitivity should be set');
        assert.equal(detector._minimumConfidence, 0.4, 'Custom minimum confidence should be set');
        assert.equal(detector._enableCombatDetection, false, 'Combat detection should be disabled');
        assert.equal(detector._enableTimeDetection, false, 'Time detection should be disabled');
        assert.equal(detector._enableLocationDetection, false, 'Location detection should be disabled');

        teardown();
    });

    // Test: isConfigured always returns true
    runner.test('isConfigured always returns true', async () => {
        await setup();

        const detector = new SceneDetector();
        assert.ok(detector.isConfigured(), 'Should always return true for pattern-based detection');

        teardown();
    });

    // Test: setSensitivity updates sensitivity and confidence threshold
    runner.test('setSensitivity updates sensitivity and confidence threshold', async () => {
        await setup();

        const detector = new SceneDetector();

        detector.setSensitivity('low');
        assert.equal(detector._sensitivity, 'low', 'Should update to low');
        assert.equal(detector._minimumConfidence, 0.8, 'Low sensitivity should set confidence to 0.8');

        detector.setSensitivity('medium');
        assert.equal(detector._sensitivity, 'medium', 'Should update to medium');
        assert.equal(detector._minimumConfidence, 0.6, 'Medium sensitivity should set confidence to 0.6');

        detector.setSensitivity('high');
        assert.equal(detector._sensitivity, 'high', 'Should update to high');
        assert.equal(detector._minimumConfidence, 0.4, 'High sensitivity should set confidence to 0.4');

        teardown();
    });

    // Test: setSensitivity ignores invalid values
    runner.test('setSensitivity ignores invalid values', async () => {
        await setup();

        const detector = new SceneDetector();
        const originalSensitivity = detector._sensitivity;

        detector.setSensitivity('invalid');
        assert.equal(detector._sensitivity, originalSensitivity, 'Should not change sensitivity for invalid value');

        teardown();
    });

    // Test: getSensitivity returns current sensitivity
    runner.test('getSensitivity returns current sensitivity', async () => {
        await setup();

        const detector = new SceneDetector({ sensitivity: 'high' });
        assert.equal(detector.getSensitivity(), 'high', 'Should return high');

        detector.setSensitivity('low');
        assert.equal(detector.getSensitivity(), 'low', 'Should return updated value');

        teardown();
    });

    // Test: detectSceneTransition returns no detection for empty text
    runner.test('detectSceneTransition returns no detection for empty text', async () => {
        await setup();

        const detector = new SceneDetector();
        const result = detector.detectSceneTransition('');

        assert.equal(result.detected, false, 'Should not detect transition');
        assert.equal(result.type, 'none', 'Type should be none');
        assert.equal(result.confidence, 0, 'Confidence should be 0');
        assert.equal(result.sceneType, SCENE_TYPES.UNKNOWN, 'Scene type should be unknown');

        teardown();
    });

    // Test: detectSceneTransition returns no detection for null text
    runner.test('detectSceneTransition handles null text gracefully', async () => {
        await setup();

        const detector = new SceneDetector();
        const result = detector.detectSceneTransition(null);

        assert.equal(result.detected, false, 'Should not detect transition');
        assert.equal(result.type, 'none', 'Type should be none');

        teardown();
    });

    // Test: detectSceneTransition detects location changes
    runner.test('detectSceneTransition detects location changes', async () => {
        await setup();

        const detector = new SceneDetector();
        const text = 'I giocatori entrano nella taverna';
        const result = detector.detectSceneTransition(text);

        assert.equal(result.detected, true, 'Should detect transition');
        assert.equal(result.type, 'location', 'Should identify as location transition');
        assert.ok(result.confidence > 0.6, 'Confidence should be above threshold');
        assert.ok(result.trigger.length > 0, 'Should have trigger text');
        assert.ok([SCENE_TYPES.EXPLORATION, SCENE_TYPES.SOCIAL].includes(result.sceneType), 'Scene type should be valid');

        teardown();
    });

    // Test: detectSceneTransition detects combat start
    runner.test('detectSceneTransition detects combat start', async () => {
        await setup();

        const detector = new SceneDetector();
        const text = 'Tirate l\'iniziativa!';
        const result = detector.detectSceneTransition(text);

        assert.equal(result.detected, true, 'Should detect transition');
        assert.equal(result.type, 'combat', 'Should identify as combat transition');
        assert.equal(result.sceneType, SCENE_TYPES.COMBAT, 'Scene type should be combat');
        assert.ok(result.confidence >= 0.9, 'Initiative pattern should have high confidence');

        teardown();
    });

    // Test: detectSceneTransition detects combat end
    runner.test('detectSceneTransition detects combat end when in combat', async () => {
        await setup();

        const detector = new SceneDetector();

        // First, enter combat
        detector.detectSceneTransition('Tirate l\'iniziativa!');
        assert.equal(detector._currentSceneType, SCENE_TYPES.COMBAT, 'Should be in combat');

        // Then detect combat end
        const result = detector.detectSceneTransition('Fine del combattimento');
        assert.equal(result.detected, true, 'Should detect transition');
        assert.equal(result.type, 'combat_end', 'Should identify as combat end');
        assert.equal(result.sceneType, SCENE_TYPES.EXPLORATION, 'Scene type should be exploration after combat');

        teardown();
    });

    // Test: detectSceneTransition detects time skips
    runner.test('detectSceneTransition detects time skips', async () => {
        await setup();

        const detector = new SceneDetector();
        const text = 'Il giorno dopo, i giocatori si risvegliano';
        const result = detector.detectSceneTransition(text);

        assert.equal(result.detected, true, 'Should detect transition');
        assert.equal(result.type, 'time', 'Should identify as time transition');
        assert.ok(result.confidence > 0.6, 'Confidence should be above threshold');

        teardown();
    });

    // Test: detectSceneTransition respects minimum confidence threshold
    runner.test('detectSceneTransition respects minimum confidence threshold', async () => {
        await setup();

        const detector = new SceneDetector({ sensitivity: 'low' }); // High threshold (0.8)
        const text = 'Si sente un rumore'; // Lower confidence pattern
        const result = detector.detectSceneTransition(text);

        assert.equal(result.detected, false, 'Should not detect with low confidence pattern');

        teardown();
    });

    // Test: detectSceneTransition returns highest confidence transition
    runner.test('detectSceneTransition returns highest confidence transition', async () => {
        await setup();

        const detector = new SceneDetector();
        const text = 'Tirate l\'iniziativa mentre entrate nella taverna'; // Both combat and location
        const result = detector.detectSceneTransition(text);

        assert.equal(result.detected, true, 'Should detect transition');
        assert.equal(result.type, 'combat', 'Should prefer combat (highest confidence)');
        assert.equal(result.sceneType, SCENE_TYPES.COMBAT, 'Scene type should be combat');

        teardown();
    });

    // Test: detectSceneTransition updates scene history
    runner.test('detectSceneTransition updates scene history on detection', async () => {
        await setup();

        const detector = new SceneDetector();
        assert.equal(detector._sceneHistory.length, 0, 'History should be empty initially');

        detector.detectSceneTransition('Entrate nella taverna');
        assert.equal(detector._sceneHistory.length, 1, 'History should have one entry');

        const historyEntry = detector._sceneHistory[0];
        assert.ok(historyEntry.type, 'History entry should have type');
        assert.ok(historyEntry.timestamp, 'History entry should have timestamp');
        assert.ok(historyEntry.text, 'History entry should have text');

        teardown();
    });

    // Test: detectSceneTransition respects disabled features
    runner.test('detectSceneTransition respects disabled combat detection', async () => {
        await setup();

        const detector = new SceneDetector({ enableCombatDetection: false });
        const text = 'Tirate l\'iniziativa!';
        const result = detector.detectSceneTransition(text);

        assert.equal(result.detected, false, 'Should not detect combat when disabled');

        teardown();
    });

    // Test: detectSceneTransition respects disabled location detection
    runner.test('detectSceneTransition respects disabled location detection', async () => {
        await setup();

        const detector = new SceneDetector({ enableLocationDetection: false });
        const text = 'Entrate nella taverna';
        const result = detector.detectSceneTransition(text);

        assert.equal(result.detected, false, 'Should not detect location when disabled');

        teardown();
    });

    // Test: detectSceneTransition respects disabled time detection
    runner.test('detectSceneTransition respects disabled time detection', async () => {
        await setup();

        const detector = new SceneDetector({ enableTimeDetection: false });
        const text = 'Il giorno dopo';
        const result = detector.detectSceneTransition(text);

        assert.equal(result.detected, false, 'Should not detect time skip when disabled');

        teardown();
    });

    // Test: identifySceneType returns unknown for empty text
    runner.test('identifySceneType returns unknown for empty text', async () => {
        await setup();

        const detector = new SceneDetector();
        const sceneType = detector.identifySceneType('');

        assert.equal(sceneType, SCENE_TYPES.UNKNOWN, 'Should return unknown for empty text');

        teardown();
    });

    // Test: identifySceneType handles null text
    runner.test('identifySceneType handles null text gracefully', async () => {
        await setup();

        const detector = new SceneDetector();
        const sceneType = detector.identifySceneType(null);

        assert.equal(sceneType, SCENE_TYPES.UNKNOWN, 'Should return unknown for null text');

        teardown();
    });

    // Test: identifySceneType identifies exploration scenes
    runner.test('identifySceneType identifies exploration scenes', async () => {
        await setup();

        const detector = new SceneDetector();
        const text = 'I giocatori esplorano il dungeon alla ricerca di tesori';
        const sceneType = detector.identifySceneType(text);

        assert.equal(sceneType, SCENE_TYPES.EXPLORATION, 'Should identify as exploration');

        teardown();
    });

    // Test: identifySceneType identifies combat scenes
    runner.test('identifySceneType identifies combat scenes', async () => {
        await setup();

        const detector = new SceneDetector();
        const text = 'Il guerriero tira per colpire e infligge 10 danni con la sua spada';
        const sceneType = detector.identifySceneType(text);

        assert.equal(sceneType, SCENE_TYPES.COMBAT, 'Should identify as combat');

        teardown();
    });

    // Test: identifySceneType identifies social scenes
    runner.test('identifySceneType identifies social scenes', async () => {
        await setup();

        const detector = new SceneDetector();
        const text = 'I giocatori negoziano con il mercante per ottenere un buon prezzo';
        const sceneType = detector.identifySceneType(text);

        assert.equal(sceneType, SCENE_TYPES.SOCIAL, 'Should identify as social');

        teardown();
    });

    // Test: identifySceneType identifies rest scenes
    runner.test('identifySceneType identifies rest scenes', async () => {
        await setup();

        const detector = new SceneDetector();
        const text = 'Il gruppo fa un lungo riposo per recuperare punti ferita';
        const sceneType = detector.identifySceneType(text);

        assert.equal(sceneType, SCENE_TYPES.REST, 'Should identify as rest');

        teardown();
    });

    // Test: identifySceneType returns unknown for ambiguous text
    runner.test('identifySceneType returns unknown for low confidence text', async () => {
        await setup();

        const detector = new SceneDetector();
        const text = 'Qualcosa succede';
        const sceneType = detector.identifySceneType(text);

        assert.equal(sceneType, SCENE_TYPES.UNKNOWN, 'Should return unknown for ambiguous text');

        teardown();
    });

    // Test: identifySceneType handles mixed keywords
    runner.test('identifySceneType returns highest scoring type for mixed keywords', async () => {
        await setup();

        const detector = new SceneDetector();
        const text = 'Durante l\'esplorazione, trovate una spada e scoprite una caverna';
        const sceneType = detector.identifySceneType(text);

        assert.equal(sceneType, SCENE_TYPES.EXPLORATION, 'Should identify dominant scene type');

        teardown();
    });

    // Test: getCurrentSceneType returns current scene type
    runner.test('getCurrentSceneType returns current scene type', async () => {
        await setup();

        const detector = new SceneDetector();
        assert.equal(detector.getCurrentSceneType(), SCENE_TYPES.UNKNOWN, 'Should start as unknown');

        detector.detectSceneTransition('Tirate l\'iniziativa!');
        assert.equal(detector.getCurrentSceneType(), SCENE_TYPES.COMBAT, 'Should update to combat');

        teardown();
    });

    // Test: setCurrentSceneType manually sets scene type
    runner.test('setCurrentSceneType manually sets scene type', async () => {
        await setup();

        const detector = new SceneDetector();
        detector.setCurrentSceneType(SCENE_TYPES.COMBAT);

        assert.equal(detector._currentSceneType, SCENE_TYPES.COMBAT, 'Should set to combat');
        assert.equal(detector._sceneHistory.length, 1, 'Should add to history');

        teardown();
    });

    // Test: setCurrentSceneType validates scene type
    runner.test('setCurrentSceneType ignores invalid scene types', async () => {
        await setup();

        const detector = new SceneDetector();
        const originalType = detector._currentSceneType;

        detector.setCurrentSceneType('invalid_type');
        assert.equal(detector._currentSceneType, originalType, 'Should not change for invalid type');

        teardown();
    });

    // Test: getSceneHistory returns history copy
    runner.test('getSceneHistory returns copy of history', async () => {
        await setup();

        const detector = new SceneDetector();
        detector.setCurrentSceneType(SCENE_TYPES.COMBAT);
        detector.setCurrentSceneType(SCENE_TYPES.EXPLORATION);

        const history = detector.getSceneHistory();
        assert.equal(history.length, 2, 'Should have 2 entries');

        // Modify returned array
        history.push({ type: 'test', timestamp: 0, text: '' });

        // Original should be unchanged
        const newHistory = detector.getSceneHistory();
        assert.equal(newHistory.length, 2, 'Original history should be unchanged');

        teardown();
    });

    // Test: clearHistory resets history and scene type
    runner.test('clearHistory resets history and scene type', async () => {
        await setup();

        const detector = new SceneDetector();
        detector.setCurrentSceneType(SCENE_TYPES.COMBAT);
        detector.setCurrentSceneType(SCENE_TYPES.EXPLORATION);

        assert.equal(detector._sceneHistory.length, 2, 'Should have history');
        assert.equal(detector._currentSceneType, SCENE_TYPES.EXPLORATION, 'Should have scene type');

        detector.clearHistory();

        assert.equal(detector._sceneHistory.length, 0, 'History should be cleared');
        assert.equal(detector._currentSceneType, SCENE_TYPES.UNKNOWN, 'Scene type should be reset');

        teardown();
    });

    // Test: Scene history maintains maximum size
    runner.test('scene history maintains maximum size', async () => {
        await setup();

        const detector = new SceneDetector();
        const maxSize = detector._maxHistorySize;

        // Add more than max entries
        for (let i = 0; i < maxSize + 5; i++) {
            detector.setCurrentSceneType(SCENE_TYPES.EXPLORATION);
        }

        assert.equal(detector._sceneHistory.length, maxSize, 'Should not exceed max size');

        teardown();
    });

    // Test: setFeatures updates feature flags
    runner.test('setFeatures updates feature flags', async () => {
        await setup();

        const detector = new SceneDetector();

        detector.setFeatures({
            combat: false,
            time: false,
            location: false
        });

        assert.equal(detector._enableCombatDetection, false, 'Combat should be disabled');
        assert.equal(detector._enableTimeDetection, false, 'Time should be disabled');
        assert.equal(detector._enableLocationDetection, false, 'Location should be disabled');

        teardown();
    });

    // Test: setFeatures handles partial updates
    runner.test('setFeatures handles partial updates', async () => {
        await setup();

        const detector = new SceneDetector();

        detector.setFeatures({ combat: false });

        assert.equal(detector._enableCombatDetection, false, 'Combat should be disabled');
        assert.equal(detector._enableTimeDetection, true, 'Time should remain enabled');
        assert.equal(detector._enableLocationDetection, true, 'Location should remain enabled');

        teardown();
    });

    // Test: setFeatures ignores non-boolean values
    runner.test('setFeatures ignores non-boolean values', async () => {
        await setup();

        const detector = new SceneDetector();
        const originalFeatures = detector.getFeatures();

        detector.setFeatures({ combat: 'invalid' });

        const newFeatures = detector.getFeatures();
        assert.equal(newFeatures.combat, originalFeatures.combat, 'Should not change for non-boolean');

        teardown();
    });

    // Test: getFeatures returns current feature flags
    runner.test('getFeatures returns current feature flags', async () => {
        await setup();

        const detector = new SceneDetector({
            enableCombatDetection: false,
            enableTimeDetection: true,
            enableLocationDetection: false
        });

        const features = detector.getFeatures();

        assert.equal(features.combat, false, 'Combat should be false');
        assert.equal(features.time, true, 'Time should be true');
        assert.equal(features.location, false, 'Location should be false');

        teardown();
    });

    // Test: Pattern matching is case-insensitive
    runner.test('pattern matching is case-insensitive', async () => {
        await setup();

        const detector = new SceneDetector();

        const lowerResult = detector.detectSceneTransition('entrate nella taverna');
        const upperResult = detector.detectSceneTransition('ENTRATE NELLA TAVERNA');
        const mixedResult = detector.detectSceneTransition('EnTrAtE nElLa TaVeRnA');

        assert.equal(lowerResult.detected, true, 'Should detect lowercase');
        assert.equal(upperResult.detected, true, 'Should detect uppercase');
        assert.equal(mixedResult.detected, true, 'Should detect mixed case');

        teardown();
    });

    // Test: Scene history stores truncated text
    runner.test('scene history stores truncated text for long passages', async () => {
        await setup();

        const detector = new SceneDetector();
        const longText = 'A'.repeat(200) + ' entrate nella taverna';

        detector.detectSceneTransition(longText);

        const history = detector.getSceneHistory();
        assert.equal(history[0].text.length, 100, 'Should truncate text to 100 chars');

        teardown();
    });

    // Test: Multiple pattern types work together
    runner.test('detector handles multiple scene types in sequence', async () => {
        await setup();

        const detector = new SceneDetector();

        // Location detection prioritizes movement patterns over specific locations
        const location = detector.detectSceneTransition('Entrate nella taverna');
        assert.ok([SCENE_TYPES.EXPLORATION, SCENE_TYPES.SOCIAL].includes(location.sceneType),
            'Should detect location change');

        const combat = detector.detectSceneTransition('Tirate l\'iniziativa!');
        assert.equal(combat.sceneType, SCENE_TYPES.COMBAT, 'Should detect combat start');

        const combatEnd = detector.detectSceneTransition('Fine del combattimento');
        assert.equal(combatEnd.sceneType, SCENE_TYPES.EXPLORATION, 'Should detect combat end');

        const rest = detector.detectSceneTransition('Vi riposate per la notte');
        assert.equal(rest.sceneType, SCENE_TYPES.REST, 'Should detect rest');

        assert.equal(detector._sceneHistory.length, 4, 'Should have 4 history entries');

        teardown();
    });

    // Test: SCENE_TYPES constant is exported
    runner.test('SCENE_TYPES constant is properly exported', async () => {
        await setup();

        assert.ok(SCENE_TYPES.EXPLORATION, 'Should have EXPLORATION type');
        assert.ok(SCENE_TYPES.COMBAT, 'Should have COMBAT type');
        assert.ok(SCENE_TYPES.SOCIAL, 'Should have SOCIAL type');
        assert.ok(SCENE_TYPES.REST, 'Should have REST type');
        assert.ok(SCENE_TYPES.UNKNOWN, 'Should have UNKNOWN type');

        teardown();
    });

    // Run all tests
    return await runner.run();
}

// Export for test runner
export default runTests;
