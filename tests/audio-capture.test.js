/**
 * Unit Tests for AudioCapture
 * Tests browser audio recording, MediaRecorder, and Web Audio API interactions
 * @module tests/audio-capture
 */

import {
    setupMockGame,
    setupMockUI,
    cleanupMocks,
    createMockBlob,
    assert,
    TestRunner
} from './test-helper.js';

// Note: We need to set up mocks before importing the module
let AudioCapture, RecordingState, AudioCaptureEvent;

/**
 * Creates a mock MediaStream
 */
function createMockMediaStream() {
    const tracks = [
        {
            kind: 'audio',
            stop: function() { this.stopped = true; },
            stopped: false
        }
    ];

    return {
        getTracks: () => tracks,
        getAudioTracks: () => tracks,
        active: true
    };
}

/**
 * Creates a mock MediaRecorder
 */
function createMockMediaRecorder(stream, options) {
    const recorder = {
        state: 'inactive',
        stream,
        mimeType: options?.mimeType || 'audio/webm;codecs=opus',
        ondataavailable: null,
        onstart: null,
        onstop: null,
        onerror: null,
        onpause: null,
        onresume: null,
        _timeslice: null,

        start(timeslice) {
            this.state = 'recording';
            this._timeslice = timeslice;
            if (this.onstart) {
                setTimeout(() => this.onstart(), 0);
            }
        },

        stop() {
            this.state = 'inactive';
            if (this.onstop) {
                setTimeout(() => this.onstop(), 0);
            }
        },

        pause() {
            this.state = 'paused';
            if (this.onpause) {
                setTimeout(() => this.onpause(), 0);
            }
        },

        resume() {
            this.state = 'recording';
            if (this.onresume) {
                setTimeout(() => this.onresume(), 0);
            }
        },

        // Test helper to simulate data available
        _triggerDataAvailable(size = 1024) {
            if (this.ondataavailable) {
                const blob = createMockBlob(this.mimeType, size);
                this.ondataavailable({ data: blob });
            }
        },

        // Test helper to simulate error
        _triggerError(error) {
            if (this.onerror) {
                this.onerror({ error });
            }
        }
    };

    return recorder;
}

/**
 * Creates a mock AudioContext
 */
function createMockAudioContext() {
    const context = {
        state: 'running',
        sampleRate: 48000,
        currentTime: 0,
        destination: {},

        createMediaStreamSource(_stream) {
            return {
                connect(destination) {
                    this._destination = destination;
                },
                disconnect() {
                    this._destination = null;
                }
            };
        },

        createAnalyser() {
            return {
                fftSize: 2048,
                frequencyBinCount: 1024,
                getByteFrequencyData(array) {
                    // Fill with mock audio data
                    for (let i = 0; i < array.length; i++) {
                        array[i] = Math.floor(Math.random() * 128);
                    }
                },
                connect() {},
                disconnect() {}
            };
        },

        close() {
            this.state = 'closed';
            return Promise.resolve();
        }
    };

    return context;
}

/**
 * Setup function to run before tests
 */
async function setup() {
    setupMockGame();
    setupMockUI();

    // Set up browser API mocks
    if (typeof globalThis !== 'undefined') {
        // Create mock getUserMedia function
        const getUserMedia = async function(constraints) {
            getUserMedia.calls = getUserMedia.calls || [];
            getUserMedia.calls.push(constraints);

            if (getUserMedia._shouldFail) {
                const error = new Error('Permission denied');
                error.name = getUserMedia._errorName || 'NotAllowedError';
                throw error;
            }

            return createMockMediaStream();
        };

        // Mock navigator.mediaDevices using defineProperty
        const mockNavigator = {
            mediaDevices: {
                getUserMedia,
                enumerateDevices: async function() {
                    return [
                        { deviceId: 'default', kind: 'audioinput', label: 'Default Microphone' },
                        { deviceId: 'mic1', kind: 'audioinput', label: 'Microphone 1' }
                    ];
                }
            }
        };

        Object.defineProperty(globalThis, 'navigator', {
            value: mockNavigator,
            writable: true,
            configurable: true
        });

        // Mock MediaRecorder
        globalThis.MediaRecorder = function(stream, options) {
            const recorder = createMockMediaRecorder(stream, options);
            MediaRecorder._lastInstance = recorder;
            return recorder;
        };

        globalThis.MediaRecorder.isTypeSupported = function(mimeType) {
            const supported = [
                'audio/webm;codecs=opus',
                'audio/webm',
                'audio/ogg;codecs=opus'
            ];
            return supported.includes(mimeType);
        };

        // Mock AudioContext
        globalThis.AudioContext = function() {
            return createMockAudioContext();
        };

        globalThis.window = globalThis.window || {};
        globalThis.window.AudioContext = globalThis.AudioContext;
    }

    // Dynamic import after mocks are set up
    const module = await import('../scripts/audio-capture.js');
    AudioCapture = module.AudioCapture;
    RecordingState = module.RecordingState;
    AudioCaptureEvent = module.AudioCaptureEvent;
}

/**
 * Teardown function to run after tests
 */
function teardown() {
    cleanupMocks();

    if (typeof globalThis !== 'undefined') {
        // Clean up browser API mocks
        delete globalThis.MediaRecorder;
        delete globalThis.AudioContext;

        // Restore or delete navigator
        try {
            delete globalThis.navigator;
        } catch (e) {
            // If deletion fails, try to reset to undefined
            Object.defineProperty(globalThis, 'navigator', {
                value: undefined,
                writable: true,
                configurable: true
            });
        }
    }
}

/**
 * Run all AudioCapture tests
 */
export async function runTests() {
    const runner = new TestRunner('AudioCapture Tests');

    // Test: Constructor initializes with default values
    runner.test('constructor initializes with default values', async () => {
        await setup();

        const capture = new AudioCapture();

        assert.equal(capture._timeslice, 1000, 'Default timeslice should be 1000ms');
        assert.equal(capture._maxDuration, 300000, 'Default max duration should be 300000ms');
        assert.ok(capture._constraints, 'Constraints should be set');
        assert.equal(capture._chunks.length, 0, 'Chunks should be empty');
        assert.equal(capture.state, RecordingState.INACTIVE, 'Initial state should be inactive');
        assert.equal(capture._stream, null, 'Stream should be null initially');
        assert.equal(capture._recorder, null, 'Recorder should be null initially');
        assert.equal(capture._cumulativeSize, 0, 'Cumulative size should be 0');

        teardown();
    });

    // Test: Constructor accepts custom options
    runner.test('constructor accepts custom options', async () => {
        await setup();

        const customConstraints = {
            audio: {
                sampleRate: 44100,
                channelCount: 2
            },
            video: false
        };

        const capture = new AudioCapture({
            timeslice: 500,
            maxDuration: 60000,
            constraints: customConstraints
        });

        assert.equal(capture._timeslice, 500, 'Custom timeslice should be set');
        assert.equal(capture._maxDuration, 60000, 'Custom max duration should be set');
        assert.equal(capture._constraints.audio.sampleRate, 44100, 'Custom constraints should be set');

        teardown();
    });

    // Test: isSupported returns correct state
    runner.test('isSupported returns correct state', async () => {
        await setup();

        const capture = new AudioCapture();
        assert.ok(capture.isSupported, 'Should be supported with mocked APIs');

        teardown();
    });

    // Test: isRecording returns correct state
    runner.test('isRecording returns correct state', async () => {
        await setup();

        const capture = new AudioCapture();
        assert.equal(capture.isRecording, false, 'Should not be recording initially');

        teardown();
    });

    // Test: mimeType is selected from supported types
    runner.test('mimeType is selected from supported types', async () => {
        await setup();

        const capture = new AudioCapture();
        assert.equal(capture.mimeType, 'audio/webm;codecs=opus', 'Should select opus codec');

        teardown();
    });

    // Test: duration returns 0 when not recording
    runner.test('duration returns 0 when not recording', async () => {
        await setup();

        const capture = new AudioCapture();
        assert.equal(capture.duration, 0, 'Duration should be 0 when not recording');

        teardown();
    });

    // Test: cumulativeSize returns current size
    runner.test('cumulativeSize returns current size', async () => {
        await setup();

        const capture = new AudioCapture();
        assert.equal(capture.cumulativeSize, 0, 'Cumulative size should be 0 initially');

        teardown();
    });

    // Test: requestPermission succeeds
    runner.test('requestPermission succeeds with user consent', async () => {
        await setup();

        const capture = new AudioCapture();
        const stream = await capture.requestPermission();

        assert.ok(stream, 'Should return media stream');
        assert.ok(capture._stream, 'Stream should be stored');
        assert.equal(globalThis.navigator.mediaDevices.getUserMedia.calls.length, 1, 'getUserMedia should be called once');

        teardown();
    });

    // Test: requestPermission emits PERMISSION_GRANTED event
    runner.test('requestPermission emits PERMISSION_GRANTED event', async () => {
        await setup();

        const capture = new AudioCapture();
        let permissionGranted = false;

        capture.on(AudioCaptureEvent.PERMISSION_GRANTED, () => {
            permissionGranted = true;
        });

        await capture.requestPermission();
        assert.ok(permissionGranted, 'PERMISSION_GRANTED event should be emitted');

        teardown();
    });

    // Test: requestPermission emits STREAM_STARTED event
    runner.test('requestPermission emits STREAM_STARTED event', async () => {
        await setup();

        const capture = new AudioCapture();
        let streamStarted = false;

        capture.on(AudioCaptureEvent.STREAM_STARTED, (stream) => {
            streamStarted = true;
            assert.ok(stream, 'Stream should be passed to event');
        });

        await capture.requestPermission();
        assert.ok(streamStarted, 'STREAM_STARTED event should be emitted');

        teardown();
    });

    // Test: requestPermission throws on permission denied
    runner.test('requestPermission throws on permission denied', async () => {
        await setup();

        const capture = new AudioCapture();
        globalThis.navigator.mediaDevices.getUserMedia._shouldFail = true;

        await assert.throws(
            () => capture.requestPermission(),
            'Should throw when permission denied'
        );

        teardown();
    });

    // Test: requestPermission emits PERMISSION_DENIED event on error
    runner.test('requestPermission emits PERMISSION_DENIED event on error', async () => {
        await setup();

        const capture = new AudioCapture();
        let permissionDenied = false;

        capture.on(AudioCaptureEvent.PERMISSION_DENIED, (error) => {
            permissionDenied = true;
            assert.ok(error.code, 'Error should have code');
            assert.ok(error.message, 'Error should have message');
        });

        globalThis.navigator.mediaDevices.getUserMedia._shouldFail = true;

        await assert.throws(() => capture.requestPermission());
        assert.ok(permissionDenied, 'PERMISSION_DENIED event should be emitted');

        teardown();
    });

    // Test: requestPermission handles NotFoundError
    runner.test('requestPermission handles NotFoundError', async () => {
        await setup();

        const capture = new AudioCapture();
        let errorCode = null;

        capture.on(AudioCaptureEvent.PERMISSION_DENIED, (error) => {
            errorCode = error.code;
        });

        globalThis.navigator.mediaDevices.getUserMedia._shouldFail = true;
        globalThis.navigator.mediaDevices.getUserMedia._errorName = 'NotFoundError';

        await assert.throws(() => capture.requestPermission());
        assert.equal(errorCode, 'not_found', 'Should return not_found error code');

        teardown();
    });

    // Test: requestPermission handles SecurityError
    runner.test('requestPermission handles SecurityError', async () => {
        await setup();

        const capture = new AudioCapture();
        let errorCode = null;

        capture.on(AudioCaptureEvent.PERMISSION_DENIED, (error) => {
            errorCode = error.code;
        });

        globalThis.navigator.mediaDevices.getUserMedia._shouldFail = true;
        globalThis.navigator.mediaDevices.getUserMedia._errorName = 'SecurityError';

        await assert.throws(() => capture.requestPermission());
        assert.equal(errorCode, 'security', 'Should return security error code');

        teardown();
    });

    // Test: start() requests permission if no stream
    runner.test('start() requests permission if no stream', async () => {
        await setup();

        const capture = new AudioCapture();
        await capture.start();

        assert.ok(capture._stream, 'Stream should be created');
        assert.ok(capture._recorder, 'Recorder should be created');

        teardown();
    });

    // Test: start() creates MediaRecorder
    runner.test('start() creates MediaRecorder with correct options', async () => {
        await setup();

        const capture = new AudioCapture();
        await capture.start();

        assert.ok(globalThis.MediaRecorder._lastInstance, 'MediaRecorder should be created');
        assert.equal(globalThis.MediaRecorder._lastInstance.mimeType, 'audio/webm;codecs=opus', 'Should use correct MIME type');

        teardown();
    });

    // Test: start() emits STATE_CHANGE event
    runner.test('start() emits STATE_CHANGE event', async () => {
        await setup();

        const capture = new AudioCapture();
        let stateChanged = false;
        let newState = null;

        capture.on(AudioCaptureEvent.STATE_CHANGE, (state) => {
            stateChanged = true;
            newState = state;
        });

        await capture.start();

        // Wait for async state change
        await new Promise(resolve => setTimeout(resolve, 10));

        assert.ok(stateChanged, 'STATE_CHANGE event should be emitted');
        assert.equal(newState, RecordingState.RECORDING, 'State should be RECORDING');

        teardown();
    });

    // Test: start() clears previous chunks
    runner.test('start() clears previous chunks', async () => {
        await setup();

        const capture = new AudioCapture();
        capture._chunks = [createMockBlob('audio/webm', 1024)];
        capture._cumulativeSize = 1024;

        await capture.start();

        assert.equal(capture._chunks.length, 0, 'Chunks should be cleared');
        assert.equal(capture._cumulativeSize, 0, 'Cumulative size should be reset');

        teardown();
    });

    // Test: start() does not start if already recording
    runner.test('start() does not start if already recording', async () => {
        await setup();

        const capture = new AudioCapture();
        await capture.start();

        // Wait for recording to start
        await new Promise(resolve => setTimeout(resolve, 10));

        const initialRecorder = globalThis.MediaRecorder._lastInstance;
        const chunksBeforeSecondStart = capture._chunks.length;

        await capture.start();

        // Should still be the same recorder instance (no new instance created)
        assert.equal(globalThis.MediaRecorder._lastInstance, initialRecorder, 'Should not create new recorder');
        assert.equal(capture._chunks.length, chunksBeforeSecondStart, 'Chunks should not be cleared on duplicate start');

        teardown();
    });

    // Test: ondataavailable collects audio chunks
    runner.test('ondataavailable collects audio chunks', async () => {
        await setup();

        const capture = new AudioCapture();
        await capture.start();

        const recorder = globalThis.MediaRecorder._lastInstance;
        recorder._triggerDataAvailable(2048);

        assert.equal(capture._chunks.length, 1, 'Should have one chunk');
        assert.equal(capture._cumulativeSize, 2048, 'Cumulative size should be updated');

        teardown();
    });

    // Test: ondataavailable emits DATA_AVAILABLE event
    runner.test('ondataavailable emits DATA_AVAILABLE event', async () => {
        await setup();

        const capture = new AudioCapture();
        let dataReceived = false;

        capture.on(AudioCaptureEvent.DATA_AVAILABLE, (data) => {
            dataReceived = true;
            assert.ok(data, 'Data should be passed to event');
        });

        await capture.start();

        const recorder = globalThis.MediaRecorder._lastInstance;
        recorder._triggerDataAvailable(1024);

        assert.ok(dataReceived, 'DATA_AVAILABLE event should be emitted');

        teardown();
    });

    // Test: ondataavailable emits SIZE_THRESHOLD event
    runner.test('ondataavailable emits SIZE_THRESHOLD event when threshold reached', async () => {
        await setup();

        const capture = new AudioCapture();
        let thresholdReached = false;

        capture.on(AudioCaptureEvent.SIZE_THRESHOLD, (data) => {
            thresholdReached = true;
            assert.ok(data.size >= 20 * 1024 * 1024, 'Size should be at threshold');
        });

        await capture.start();

        const recorder = globalThis.MediaRecorder._lastInstance;
        recorder._triggerDataAvailable(21 * 1024 * 1024);

        assert.ok(thresholdReached, 'SIZE_THRESHOLD event should be emitted');

        teardown();
    });

    // Test: stop() stops recording and returns blob
    runner.test('stop() stops recording and returns blob', async () => {
        await setup();

        const capture = new AudioCapture();
        await capture.start();

        const recorder = globalThis.MediaRecorder._lastInstance;
        recorder._triggerDataAvailable(1024);

        const blob = await capture.stop();

        assert.ok(blob, 'Should return audio blob');
        assert.equal(capture.state, RecordingState.INACTIVE, 'State should be inactive');

        teardown();
    });

    // Test: stop() clears max duration timeout
    runner.test('stop() clears max duration timeout', async () => {
        await setup();

        const capture = new AudioCapture({ maxDuration: 5000 });
        await capture.start();

        // Wait for recording to start and timeout to be set
        await new Promise(resolve => setTimeout(resolve, 10));

        const timeoutId = capture._maxDurationTimeout;
        assert.ok(timeoutId !== null && timeoutId !== undefined, 'Timeout should be set');

        await capture.stop();

        // Wait for stop to complete
        await new Promise(resolve => setTimeout(resolve, 10));

        assert.equal(capture._maxDurationTimeout, null, 'Timeout should be cleared');

        teardown();
    });

    // Test: stop() returns blob when not recording
    runner.test('stop() returns blob when not recording', async () => {
        await setup();

        const capture = new AudioCapture();
        const blob = await capture.stop();

        assert.equal(blob, null, 'Should return null when no chunks');

        teardown();
    });

    // Test: pause() pauses recording
    runner.test('pause() pauses recording', async () => {
        await setup();

        const capture = new AudioCapture();
        await capture.start();

        // Wait for recording to start
        await new Promise(resolve => setTimeout(resolve, 10));

        capture.pause();

        // Wait for pause to complete
        await new Promise(resolve => setTimeout(resolve, 10));

        assert.equal(capture.state, RecordingState.PAUSED, 'State should be paused');

        teardown();
    });

    // Test: resume() resumes recording
    runner.test('resume() resumes recording', async () => {
        await setup();

        const capture = new AudioCapture();
        await capture.start();

        // Wait for recording to start
        await new Promise(resolve => setTimeout(resolve, 10));

        capture.pause();
        await new Promise(resolve => setTimeout(resolve, 10));

        capture.resume();
        await new Promise(resolve => setTimeout(resolve, 10));

        assert.equal(capture.state, RecordingState.RECORDING, 'State should be recording');

        teardown();
    });

    // Test: getAudioBlob() returns null when no chunks
    runner.test('getAudioBlob() returns null when no chunks', async () => {
        await setup();

        const capture = new AudioCapture();
        const blob = capture.getAudioBlob();

        assert.equal(blob, null, 'Should return null when no chunks');

        teardown();
    });

    // Test: getAudioBlob() returns blob with correct type
    runner.test('getAudioBlob() returns blob with correct type', async () => {
        await setup();

        const capture = new AudioCapture();
        capture._chunks = [createMockBlob('audio/webm;codecs=opus', 1024)];

        const blob = capture.getAudioBlob();

        assert.ok(blob, 'Should return blob');
        assert.equal(blob.type, capture.mimeType, 'Blob should have correct MIME type');

        teardown();
    });

    // Test: clearRecording() clears chunks
    runner.test('clearRecording() clears chunks and resets size', async () => {
        await setup();

        const capture = new AudioCapture();
        capture._chunks = [createMockBlob('audio/webm', 1024)];
        capture._cumulativeSize = 1024;

        capture.clearRecording();

        assert.equal(capture._chunks.length, 0, 'Chunks should be cleared');
        assert.equal(capture._cumulativeSize, 0, 'Cumulative size should be reset');

        teardown();
    });

    // Test: resetChunkBoundary() returns blob and resets
    runner.test('resetChunkBoundary() returns blob and resets chunks', async () => {
        await setup();

        const capture = new AudioCapture();
        capture._chunks = [createMockBlob('audio/webm', 1024)];
        capture._cumulativeSize = 1024;

        const blob = capture.resetChunkBoundary();

        assert.ok(blob, 'Should return accumulated blob');
        assert.equal(capture._chunks.length, 0, 'Chunks should be cleared');
        assert.equal(capture._cumulativeSize, 0, 'Cumulative size should be reset');

        teardown();
    });

    // Test: resetChunkBoundary() returns null when no chunks
    runner.test('resetChunkBoundary() returns null when no chunks', async () => {
        await setup();

        const capture = new AudioCapture();
        const blob = capture.resetChunkBoundary();

        assert.equal(blob, null, 'Should return null when no chunks');

        teardown();
    });

    // Test: releaseStream() stops all tracks
    runner.test('releaseStream() stops all media tracks', async () => {
        await setup();

        const capture = new AudioCapture();
        await capture.requestPermission();

        const track = capture._stream.getTracks()[0];
        capture.releaseStream();

        assert.ok(track.stopped, 'Track should be stopped');
        assert.equal(capture._stream, null, 'Stream should be null');

        teardown();
    });

    // Test: releaseStream() emits STREAM_STOPPED event
    runner.test('releaseStream() emits STREAM_STOPPED event', async () => {
        await setup();

        const capture = new AudioCapture();
        let streamStopped = false;

        capture.on(AudioCaptureEvent.STREAM_STOPPED, () => {
            streamStopped = true;
        });

        await capture.requestPermission();
        capture.releaseStream();

        assert.ok(streamStopped, 'STREAM_STOPPED event should be emitted');

        teardown();
    });

    // Test: destroy() cleans up all resources
    runner.test('destroy() cleans up all resources', async () => {
        await setup();

        const capture = new AudioCapture();
        await capture.start();

        capture.destroy();

        assert.equal(capture._stream, null, 'Stream should be null');
        assert.equal(capture._recorder, null, 'Recorder should be null');
        assert.equal(capture._chunks.length, 0, 'Chunks should be empty');
        assert.equal(capture.state, RecordingState.INACTIVE, 'State should be inactive');

        teardown();
    });

    // Test: initializeAnalyser() creates AudioContext
    runner.test('initializeAnalyser() creates AudioContext and analyser', async () => {
        await setup();

        const capture = new AudioCapture();
        await capture.requestPermission();

        const analyser = capture.initializeAnalyser();

        assert.ok(analyser, 'Should return analyser node');
        assert.ok(capture._audioContext, 'AudioContext should be created');
        assert.ok(capture._analyser, 'Analyser should be stored');

        teardown();
    });

    // Test: initializeAnalyser() returns null without stream
    runner.test('initializeAnalyser() returns null without stream', async () => {
        await setup();

        const capture = new AudioCapture();
        const analyser = capture.initializeAnalyser();

        assert.equal(analyser, null, 'Should return null without stream');

        teardown();
    });

    // Test: getAudioLevel() returns 0 without analyser
    runner.test('getAudioLevel() returns 0 without analyser', async () => {
        await setup();

        const capture = new AudioCapture();
        const level = capture.getAudioLevel();

        assert.equal(level, 0, 'Should return 0 without analyser');

        teardown();
    });

    // Test: getAudioLevel() returns normalized level
    runner.test('getAudioLevel() returns normalized level with analyser', async () => {
        await setup();

        const capture = new AudioCapture();
        await capture.requestPermission();
        capture.initializeAnalyser();

        const level = capture.getAudioLevel();

        assert.ok(level >= 0 && level <= 1, 'Level should be normalized 0-1');

        teardown();
    });

    // Test: on() registers event listener
    runner.test('on() registers event listener', async () => {
        await setup();

        const capture = new AudioCapture();
        let eventFired = false;

        capture.on(AudioCaptureEvent.STATE_CHANGE, () => {
            eventFired = true;
        });

        capture._emit(AudioCaptureEvent.STATE_CHANGE, RecordingState.RECORDING);

        assert.ok(eventFired, 'Event listener should be called');

        teardown();
    });

    // Test: off() removes event listener
    runner.test('off() removes event listener', async () => {
        await setup();

        const capture = new AudioCapture();
        let eventCount = 0;

        const listener = () => {
            eventCount++;
        };

        capture.on(AudioCaptureEvent.STATE_CHANGE, listener);
        capture._emit(AudioCaptureEvent.STATE_CHANGE, RecordingState.RECORDING);

        capture.off(AudioCaptureEvent.STATE_CHANGE, listener);
        capture._emit(AudioCaptureEvent.STATE_CHANGE, RecordingState.RECORDING);

        assert.equal(eventCount, 1, 'Listener should only fire once');

        teardown();
    });

    // Test: event listener errors are caught
    runner.test('event listener errors are caught and logged', async () => {
        await setup();

        const capture = new AudioCapture();

        capture.on(AudioCaptureEvent.STATE_CHANGE, () => {
            throw new Error('Test error');
        });

        // Should not throw
        await assert.notThrows(
            () => capture._emit(AudioCaptureEvent.STATE_CHANGE, RecordingState.RECORDING),
            'Errors in listeners should be caught'
        );

        teardown();
    });

    // Test: listAudioDevices() returns device list
    runner.test('listAudioDevices() returns audio input devices', async () => {
        await setup();

        const devices = await AudioCapture.listAudioDevices();

        assert.ok(Array.isArray(devices), 'Should return array');
        assert.ok(devices.length > 0, 'Should have devices');
        assert.equal(devices[0].kind, 'audioinput', 'Should be audio input device');

        teardown();
    });

    // Test: isAudioCaptureSupported() returns true with mocked APIs
    runner.test('isAudioCaptureSupported() returns true with mocked APIs', async () => {
        await setup();

        const supported = AudioCapture.isAudioCaptureSupported();

        assert.ok(supported, 'Should be supported with mocked APIs');

        teardown();
    });

    // Test: isMimeTypeSupported() checks MIME type support
    runner.test('isMimeTypeSupported() checks MIME type support', async () => {
        await setup();

        const opusSupported = AudioCapture.isMimeTypeSupported('audio/webm;codecs=opus');
        const mp3Supported = AudioCapture.isMimeTypeSupported('audio/mp3');

        assert.ok(opusSupported, 'Opus should be supported');
        assert.equal(mp3Supported, false, 'MP3 should not be supported');

        teardown();
    });

    // Test: getStats() returns recording statistics
    runner.test('getStats() returns comprehensive recording statistics', async () => {
        await setup();

        const capture = new AudioCapture();
        await capture.start();

        const recorder = globalThis.MediaRecorder._lastInstance;
        recorder._triggerDataAvailable(1024);

        await new Promise(resolve => setTimeout(resolve, 10));

        const stats = capture.getStats();

        assert.equal(stats.state, RecordingState.RECORDING, 'State should be in stats');
        assert.equal(stats.isRecording, true, 'isRecording should be true');
        assert.equal(stats.chunksCount, 1, 'Chunks count should be 1');
        assert.equal(stats.totalSize, 1024, 'Total size should be 1024');
        assert.equal(stats.cumulativeSize, 1024, 'Cumulative size should be 1024');
        assert.equal(stats.mimeType, 'audio/webm;codecs=opus', 'MIME type should be in stats');
        assert.equal(stats.hasStream, true, 'hasStream should be true');
        assert.equal(stats.hasAnalyser, false, 'hasAnalyser should be false');

        teardown();
    });

    // Test: duration increases while recording
    runner.test('duration increases while recording', async () => {
        await setup();

        const capture = new AudioCapture();
        await capture.start();

        // Wait for recording to start
        await new Promise(resolve => setTimeout(resolve, 10));

        const duration1 = capture.duration;

        // Wait a bit more
        await new Promise(resolve => setTimeout(resolve, 20));

        const duration2 = capture.duration;

        assert.ok(duration2 > duration1, 'Duration should increase over time');

        teardown();
    });

    // Test: onerror emits ERROR event
    runner.test('onerror emits ERROR event', async () => {
        await setup();

        const capture = new AudioCapture();
        let errorReceived = false;

        capture.on(AudioCaptureEvent.ERROR, (error) => {
            errorReceived = true;
            assert.ok(error.message, 'Error should have message');
            assert.ok(error.code, 'Error should have code');
        });

        await capture.start();

        const recorder = globalThis.MediaRecorder._lastInstance;
        recorder._triggerError(new Error('Recording failed'));

        assert.ok(errorReceived, 'ERROR event should be emitted');

        teardown();
    });

    // Test: max duration stops recording automatically
    runner.test('max duration stops recording automatically', async () => {
        await setup();

        const capture = new AudioCapture({ maxDuration: 50 });
        await capture.start();

        // Wait for max duration to trigger
        await new Promise(resolve => setTimeout(resolve, 100));

        assert.equal(capture.state, RecordingState.INACTIVE, 'Should stop after max duration');

        teardown();
    });

    // Test: releaseStream closes AudioContext
    runner.test('releaseStream closes AudioContext if initialized', async () => {
        await setup();

        const capture = new AudioCapture();
        await capture.requestPermission();
        capture.initializeAnalyser();

        const context = capture._audioContext;
        capture.releaseStream();

        assert.equal(context.state, 'closed', 'AudioContext should be closed');
        assert.equal(capture._audioContext, null, 'AudioContext reference should be null');
        assert.equal(capture._analyser, null, 'Analyser reference should be null');

        teardown();
    });

    return await runner.run();
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runTests().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    });
}
