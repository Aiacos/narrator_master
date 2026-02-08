/**
 * Test Runner for Narrator Master
 * Runs all unit tests and reports results
 * @module tests/run-tests
 */

import { runTests as runJournalParserTests } from './journal-parser.test.js';
import { runTests as runTranscriptionTests } from './transcription.test.js';
import { runTests as runAIAssistantTests } from './ai-assistant.test.js';
import { runTests as runSettingsTests } from './settings.test.js';
import { runTests as runValidationTests } from './validation.test.js';
import { runTests as runSessionAnalyticsTests } from './session-analytics.test.js';
import { runTests as runSceneDetectorTests } from './scene-detector.test.js';
import { runTests as runRulesReferenceTests } from './rules-reference.test.js';
import { runTests as runAudioCaptureTests } from './audio-capture.test.js';
import { runTests as runImageGeneratorTests } from './image-generator.test.js';
import { runTests as runUIPanelTests } from './ui-panel.test.js';

/**
 * Runs all test suites and reports aggregate results
 */
async function runAllTests() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║            NARRATOR MASTER - UNIT TEST SUITE               ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    const startTime = Date.now();
    const results = [];

    try {
        // Run each test suite
        results.push(await runJournalParserTests());
        results.push(await runTranscriptionTests());
        results.push(await runAIAssistantTests());
        results.push(await runSettingsTests());
        results.push(await runValidationTests());
        results.push(await runSessionAnalyticsTests());
        results.push(await runSceneDetectorTests());
        results.push(await runRulesReferenceTests());
        results.push(await runAudioCaptureTests());
        results.push(await runImageGeneratorTests());
        results.push(await runUIPanelTests());
    } catch (error) {
        console.error('\n❌ Test execution error:', error.message);
        return { success: false, error: error.message };
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // Calculate totals
    const totalPassed = results.reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
    const totalTests = results.reduce((sum, r) => sum + r.total, 0);

    // Print summary
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                      TEST SUMMARY                          ║');
    console.log('╠════════════════════════════════════════════════════════════╣');

    for (const result of results) {
        const status = result.failed === 0 ? '✓' : '✗';
        const padding = 40 - result.suite.length;
        console.log(`║  ${status} ${result.suite}${' '.repeat(padding)} ${result.passed}/${result.total} ║`);
    }

    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log(`║  Total: ${totalPassed} passed, ${totalFailed} failed, ${totalTests} total${' '.repeat(20)}║`);
    console.log(`║  Duration: ${duration}s${' '.repeat(45 - duration.length)}║`);
    console.log('╚════════════════════════════════════════════════════════════╝');

    if (totalFailed > 0) {
        console.log('\n❌ Some tests failed!\n');

        // List failed tests
        console.log('Failed tests:');
        for (const result of results) {
            for (const test of result.results) {
                if (!test.passed) {
                    console.log(`  - ${result.suite}: ${test.name}`);
                    if (test.error) {
                        console.log(`    Error: ${test.error}`);
                    }
                }
            }
        }
    } else {
        console.log('\n✓ All tests passed!\n');
    }

    return {
        success: totalFailed === 0,
        passed: totalPassed,
        failed: totalFailed,
        total: totalTests,
        duration,
        results
    };
}

// Export for use as module
export { runAllTests };

// Run if executed directly
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('run-tests')) {
    runAllTests().then(summary => {
        process.exit(summary.success ? 0 : 1);
    });
}
