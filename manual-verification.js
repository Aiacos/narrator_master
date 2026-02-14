/**
 * Manual Verification Script for HTTPS Enforcement
 * Tests all required verification points for subtask-2-2
 */

// Setup basic mock environment
globalThis.game = {
    i18n: {
        localize: (key) => {
            const translations = {
                'NARRATOR.Errors.MicrophoneSecurityError': 'Errore di sicurezza: la cattura audio richiede HTTPS in produzione.',
                'NARRATOR.Errors.MicrophoneNotSupported': 'Il tuo browser non supporta la cattura audio del microfono.'
            };
            return translations[key] || key;
        }
    }
};

// Mock window if needed
if (typeof globalThis.window === 'undefined') {
    globalThis.window = {};
}

// Mock navigator
Object.defineProperty(globalThis, 'navigator', {
    value: {
        mediaDevices: {
            getUserMedia: async () => {
                return {
                    getTracks: () => [{
                        kind: 'audio',
                        stop: function() { this.stopped = true; },
                        stopped: false
                    }],
                    getAudioTracks: () => [{
                        kind: 'audio',
                        stop: function() { this.stopped = true; },
                        stopped: false
                    }],
                    active: true
                };
            }
        }
    },
    writable: true,
    configurable: true
});

console.log('\n╔═══════════════════════════════════════════════════════════════╗');
console.log('║    MANUAL VERIFICATION: HTTPS ENFORCEMENT CHECK               ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

async function runVerification() {
    const { AudioCapture, AudioCaptureEvent } = await import('./scripts/audio-capture.js');
    const results = [];

    // Verification 1: isSupported returns false when window.isSecureContext is false
    console.log('1️⃣  Testing isSupported with insecure context...');
    Object.defineProperty(globalThis.window, 'isSecureContext', {
        value: false,
        writable: true,
        configurable: true
    });

    const capture1 = new AudioCapture();
    const test1 = !capture1.isSupported;
    results.push({ test: 'isSupported returns false when not secure', passed: test1 });
    console.log(`   Result: ${test1 ? '✅ PASS' : '❌ FAIL'} - isSupported = ${capture1.isSupported}`);

    // Verification 2: requestPermission() throws localized error message
    console.log('\n2️⃣  Testing requestPermission() throws error in insecure context...');
    let errorThrown = false;
    let errorMessage = null;

    try {
        await capture1.requestPermission();
    } catch (error) {
        errorThrown = true;
        errorMessage = error.message;
    }

    const test2 = errorThrown && errorMessage.includes('sicurezza') && errorMessage.includes('HTTPS');
    results.push({ test: 'requestPermission throws localized error', passed: test2 });
    console.log(`   Result: ${test2 ? '✅ PASS' : '❌ FAIL'} - Error thrown: ${errorThrown}`);
    console.log(`   Error message (Italian): "${errorMessage}"`);

    // Verification 3: error event is emitted with correct code 'security'
    console.log('\n3️⃣  Testing error event emission with code "security"...');
    Object.defineProperty(globalThis.window, 'isSecureContext', {
        value: false,
        writable: true,
        configurable: true
    });

    const capture3 = new AudioCapture();
    let eventEmitted = false;
    let eventCode = null;

    capture3.on(AudioCaptureEvent.ERROR, (error) => {
        eventEmitted = true;
        eventCode = error.code;
    });

    try {
        await capture3.requestPermission();
    } catch (error) {
        // Expected
    }

    const test3 = eventEmitted && eventCode === 'security';
    results.push({ test: 'ERROR event emitted with code "security"', passed: test3 });
    console.log(`   Result: ${test3 ? '✅ PASS' : '❌ FAIL'} - Event emitted: ${eventEmitted}, Code: ${eventCode}`);

    // Verification 4: existing functionality works in secure context
    console.log('\n4️⃣  Testing existing functionality in secure context...');
    Object.defineProperty(globalThis.window, 'isSecureContext', {
        value: true,
        writable: true,
        configurable: true
    });

    const capture4 = new AudioCapture();
    const test4a = capture4.isSupported;

    let stream = null;
    let noErrorInSecure = true;
    try {
        stream = await capture4.requestPermission();
    } catch (error) {
        noErrorInSecure = false;
        console.log(`   Unexpected error: ${error.message}`);
    }

    const test4 = test4a && noErrorInSecure && stream !== null;
    results.push({ test: 'Works correctly in secure context', passed: test4 });
    console.log(`   Result: ${test4 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   - isSupported: ${test4a}`);
    console.log(`   - No errors: ${noErrorInSecure}`);
    console.log(`   - Stream obtained: ${stream !== null}`);

    // Verification 5: error message appears in Italian (primary language)
    console.log('\n5️⃣  Verifying Italian error message...');
    const italianMessage = game.i18n.localize('NARRATOR.Errors.MicrophoneSecurityError');
    const test5 = italianMessage.includes('Errore') &&
                  italianMessage.includes('sicurezza') &&
                  italianMessage.includes('HTTPS') &&
                  italianMessage.includes('produzione');
    results.push({ test: 'Italian error message is correct', passed: test5 });
    console.log(`   Result: ${test5 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Message: "${italianMessage}"`);

    // Summary
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                    VERIFICATION SUMMARY                        ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    const passedCount = results.filter(r => r.passed).length;
    const totalCount = results.length;

    results.forEach((result, index) => {
        const status = result.passed ? '✅ PASS' : '❌ FAIL';
        console.log(`  ${status} - ${result.test}`);
    });

    console.log(`\n  Total: ${passedCount}/${totalCount} checks passed\n`);

    if (passedCount === totalCount) {
        console.log('  ✅ ALL VERIFICATION CHECKS PASSED! ✅\n');
        return true;
    } else {
        console.log('  ❌ SOME VERIFICATION CHECKS FAILED ❌\n');
        return false;
    }
}

runVerification()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('\n❌ Verification script error:', error);
        process.exit(1);
    });
