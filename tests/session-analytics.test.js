/**
 * Unit Tests for SessionAnalytics
 * Tests session tracking, speaker metrics, timeline generation, and persistence
 * @module tests/session-analytics
 */

import {
    setupMockGame,
    setupMockUI,
    cleanupMocks,
    assert,
    TestRunner
} from './test-helper.js';

// Note: We need to set up mocks before importing the module
let SessionAnalytics;

/**
 * Setup function to run before tests
 */
async function setup() {
    setupMockGame();
    setupMockUI();

    // Set up window mock for settings.js
    if (typeof window === 'undefined') {
        if (typeof globalThis !== 'undefined') {
            globalThis.window = { narratorMaster: null };
        } else if (typeof global !== 'undefined') {
            global.window = { narratorMaster: null };
        }
    }

    // Dynamic import after mocks are set up
    const module = await import('../scripts/session-analytics.js');
    SessionAnalytics = module.SessionAnalytics;
}

/**
 * Teardown function to run after tests
 */
function teardown() {
    cleanupMocks();
}

/**
 * Creates a mock transcription segment
 */
function createMockSegment(speaker, text, start, end) {
    return {
        speaker,
        text,
        start,
        end
    };
}

/**
 * Creates a mock settings manager for testing persistence
 */
function createMockSettingsManager() {
    const storage = {
        sessionData: null
    };

    return {
        getSessionData: () => storage.sessionData,
        setSessionData: async (data) => {
            storage.sessionData = data;
        },
        _storage: storage
    };
}

/**
 * Run all SessionAnalytics tests
 */
export async function runTests() {
    const runner = new TestRunner('SessionAnalytics Tests');

    // Test: Constructor initializes with default values
    runner.test('constructor initializes with default values', async () => {
        await setup();

        const analytics = new SessionAnalytics();

        assert.equal(analytics._bucketSize, 60, 'Default bucket size should be 60 seconds');
        assert.equal(analytics._maxHistorySize, 100, 'Default max history size should be 100');
        assert.equal(analytics._currentSession, null, 'Current session should be null');
        assert.ok(typeof analytics._speakerMetrics === 'object', 'Speaker metrics should be an object');
        assert.ok(Array.isArray(analytics._segments), 'Segments should be an array');
        assert.ok(Array.isArray(analytics._sessionHistory), 'Session history should be an array');

        teardown();
    });

    // Test: Constructor accepts custom options
    runner.test('constructor accepts custom options', async () => {
        await setup();

        const mockSettingsManager = createMockSettingsManager();
        const analytics = new SessionAnalytics({
            settingsManager: mockSettingsManager,
            bucketSize: 30,
            maxHistorySize: 50
        });

        assert.equal(analytics._bucketSize, 30, 'Custom bucket size should be set');
        assert.equal(analytics._maxHistorySize, 50, 'Custom max history size should be set');
        assert.equal(analytics._settingsManager, mockSettingsManager, 'Settings manager should be set');

        teardown();
    });

    // Test: startSession creates a new session
    runner.test('startSession creates a new session', async () => {
        await setup();

        const analytics = new SessionAnalytics();
        const sessionId = analytics.startSession();

        assert.ok(sessionId, 'Session ID should be returned');
        assert.ok(analytics._currentSession, 'Current session should be set');
        assert.equal(analytics._currentSession.status, 'active', 'Session should be active');
        assert.ok(analytics._currentSession.startTime, 'Start time should be set');
        assert.equal(analytics._currentSession.endTime, null, 'End time should be null');

        teardown();
    });

    // Test: startSession accepts custom session ID
    runner.test('startSession accepts custom session ID', async () => {
        await setup();

        const analytics = new SessionAnalytics();
        const customId = 'custom-session-123';
        const sessionId = analytics.startSession(customId);

        assert.equal(sessionId, customId, 'Should return custom session ID');
        assert.equal(analytics._currentSession.sessionId, customId, 'Session should have custom ID');

        teardown();
    });

    // Test: startSession ends previous active session
    runner.test('startSession ends previous active session', async () => {
        await setup();

        const analytics = new SessionAnalytics();
        const firstId = analytics.startSession('session-1');
        assert.equal(analytics._sessionHistory.length, 0, 'History should be empty initially');

        const secondId = analytics.startSession('session-2');

        assert.equal(analytics._currentSession.sessionId, 'session-2', 'Current session should be new one');
        assert.equal(analytics._sessionHistory.length, 1, 'Previous session should be in history');
        assert.equal(analytics._sessionHistory[0].metadata.sessionId, 'session-1', 'History should contain first session');

        teardown();
    });

    // Test: endSession completes the session
    runner.test('endSession completes the session', async () => {
        await setup();

        const analytics = new SessionAnalytics();
        analytics.startSession('test-session');

        const summary = analytics.endSession();

        assert.ok(summary, 'Should return session summary');
        assert.equal(summary.metadata.status, 'completed', 'Session should be marked completed');
        assert.ok(summary.metadata.endTime, 'End time should be set');
        assert.ok(summary.metadata.duration >= 0, 'Duration should be calculated');
        assert.equal(analytics._currentSession, null, 'Current session should be cleared');

        teardown();
    });

    // Test: endSession returns null when no active session
    runner.test('endSession returns null when no active session', async () => {
        await setup();

        const analytics = new SessionAnalytics();
        const summary = analytics.endSession();

        assert.equal(summary, null, 'Should return null when no active session');

        teardown();
    });

    // Test: pauseSession changes status to paused
    runner.test('pauseSession changes status to paused', async () => {
        await setup();

        const analytics = new SessionAnalytics();
        analytics.startSession();
        analytics.pauseSession();

        assert.equal(analytics._currentSession.status, 'paused', 'Session should be paused');

        teardown();
    });

    // Test: resumeSession changes status back to active
    runner.test('resumeSession changes status back to active', async () => {
        await setup();

        const analytics = new SessionAnalytics();
        analytics.startSession();
        analytics.pauseSession();
        analytics.resumeSession();

        assert.equal(analytics._currentSession.status, 'active', 'Session should be active again');

        teardown();
    });

    // Test: addSegment adds segment and initializes metrics
    runner.test('addSegment adds segment and initializes metrics', async () => {
        await setup();

        const analytics = new SessionAnalytics();
        analytics.startSession();

        const segment = createMockSegment('Player1', 'Hello world', 0, 2);
        analytics.addSegment(segment);

        assert.equal(analytics._segments.length, 1, 'Should have one segment');
        assert.ok(analytics._speakerMetrics['Player1'], 'Should initialize metrics for Player1');
        assert.equal(analytics._speakerMetrics['Player1'].segmentCount, 1, 'Segment count should be 1');
        assert.equal(analytics._speakerMetrics['Player1'].speakingTime, 2, 'Speaking time should be 2 seconds');

        teardown();
    });

    // Test: addSegment updates existing speaker metrics
    runner.test('addSegment updates existing speaker metrics', async () => {
        await setup();

        const analytics = new SessionAnalytics();
        analytics.startSession();

        analytics.addSegment(createMockSegment('Player1', 'First', 0, 2));
        analytics.addSegment(createMockSegment('Player1', 'Second', 3, 5));

        const metrics = analytics._speakerMetrics['Player1'];
        assert.equal(metrics.segmentCount, 2, 'Should have 2 segments');
        assert.equal(metrics.speakingTime, 4, 'Speaking time should be 4 seconds total');
        assert.equal(metrics.firstSpeakTime, 0, 'First speak time should be 0');
        assert.equal(metrics.lastSpeakTime, 5, 'Last speak time should be 5');

        teardown();
    });

    // Test: addSegment handles multiple speakers
    runner.test('addSegment handles multiple speakers', async () => {
        await setup();

        const analytics = new SessionAnalytics();
        analytics.startSession();

        analytics.addSegment(createMockSegment('Player1', 'Hello', 0, 2));
        analytics.addSegment(createMockSegment('Player2', 'Hi', 2, 3));
        analytics.addSegment(createMockSegment('DM', 'Welcome', 3, 6));

        assert.equal(Object.keys(analytics._speakerMetrics).length, 3, 'Should have 3 speakers');
        assert.ok(analytics._speakerMetrics['Player1'], 'Player1 metrics should exist');
        assert.ok(analytics._speakerMetrics['Player2'], 'Player2 metrics should exist');
        assert.ok(analytics._speakerMetrics['DM'], 'DM metrics should exist');

        teardown();
    });

    // Test: addSegment rejects invalid segments
    runner.test('addSegment rejects invalid segments', async () => {
        await setup();

        const analytics = new SessionAnalytics();
        analytics.startSession();

        // Test invalid segment (no speaker)
        analytics.addSegment({ text: 'test', start: 0, end: 1 });
        assert.equal(analytics._segments.length, 0, 'Should not add segment without speaker');

        // Test invalid segment (no start time)
        analytics.addSegment({ speaker: 'Player1', text: 'test', end: 1 });
        assert.equal(analytics._segments.length, 0, 'Should not add segment without start time');

        // Test null segment
        analytics.addSegment(null);
        assert.equal(analytics._segments.length, 0, 'Should not add null segment');

        teardown();
    });

    // Test: addSegment warns when no active session
    runner.test('addSegment warns when no active session', async () => {
        await setup();

        const analytics = new SessionAnalytics();

        // Should not throw, just warn and ignore
        analytics.addSegment(createMockSegment('Player1', 'test', 0, 1));

        assert.equal(analytics._segments.length, 0, 'Should not add segment without session');

        teardown();
    });

    // Test: calculateMetrics updates percentages and averages
    runner.test('calculateMetrics updates percentages and averages', async () => {
        await setup();

        const analytics = new SessionAnalytics();
        analytics.startSession();

        analytics.addSegment(createMockSegment('Player1', 'test', 0, 6)); // 6 seconds
        analytics.addSegment(createMockSegment('Player2', 'test', 6, 10)); // 4 seconds

        analytics.calculateMetrics();

        const p1 = analytics._speakerMetrics['Player1'];
        const p2 = analytics._speakerMetrics['Player2'];

        assert.equal(p1.percentage, 60, 'Player1 should have 60% (6 of 10 seconds)');
        assert.equal(p2.percentage, 40, 'Player2 should have 40% (4 of 10 seconds)');
        assert.equal(p1.avgSegmentDuration, 6, 'Player1 avg should be 6 seconds');
        assert.equal(p2.avgSegmentDuration, 4, 'Player2 avg should be 4 seconds');

        teardown();
    });

    // Test: getSpeakerStats returns sorted array
    runner.test('getSpeakerStats returns sorted array by speaking time', async () => {
        await setup();

        const analytics = new SessionAnalytics();
        analytics.startSession();

        analytics.addSegment(createMockSegment('Player1', 'test', 0, 2)); // 2 seconds
        analytics.addSegment(createMockSegment('Player2', 'test', 2, 7)); // 5 seconds
        analytics.addSegment(createMockSegment('Player3', 'test', 7, 10)); // 3 seconds

        const stats = analytics.getSpeakerStats();

        assert.equal(stats.length, 3, 'Should have 3 speakers');
        assert.equal(stats[0].speakerId, 'Player2', 'First should be Player2 (most speaking time)');
        assert.equal(stats[1].speakerId, 'Player3', 'Second should be Player3');
        assert.equal(stats[2].speakerId, 'Player1', 'Third should be Player1 (least speaking time)');

        teardown();
    });

    // Test: getCurrentMetrics returns shallow copy of metrics
    runner.test('getCurrentMetrics returns shallow copy of metrics', async () => {
        await setup();

        const analytics = new SessionAnalytics();
        analytics.startSession();
        analytics.addSegment(createMockSegment('Player1', 'test', 0, 2));

        const metrics = analytics.getCurrentMetrics();

        assert.ok(metrics['Player1'], 'Should have Player1 metrics');

        // Verify it's a shallow copy (outer object is copied)
        metrics['Player2'] = { speakerId: 'Player2', speakingTime: 10 };
        assert.ok(!analytics._speakerMetrics['Player2'], 'Adding to returned object should not affect original');

        // Note: nested objects are still references (shallow copy behavior)
        assert.ok(metrics['Player1'], 'Player1 metrics should exist');

        teardown();
    });

    // Test: getTimeline generates timeline buckets
    runner.test('getTimeline generates timeline buckets', async () => {
        await setup();

        const analytics = new SessionAnalytics({ bucketSize: 60 });
        analytics.startSession();

        // Add segments across multiple minutes
        analytics.addSegment(createMockSegment('Player1', 'test', 10, 30)); // 0-60 bucket
        analytics.addSegment(createMockSegment('Player2', 'test', 70, 90)); // 60-120 bucket
        analytics.addSegment(createMockSegment('Player1', 'test', 130, 140)); // 120-180 bucket

        const timeline = analytics.getTimeline();

        assert.equal(timeline.length, 3, 'Should have 3 time buckets');
        assert.equal(timeline[0].timestamp, 0, 'First bucket should start at 0');
        assert.equal(timeline[1].timestamp, 60, 'Second bucket should start at 60');
        assert.equal(timeline[2].timestamp, 120, 'Third bucket should start at 120');

        teardown();
    });

    // Test: getTimeline handles segments spanning multiple buckets
    runner.test('getTimeline handles segments spanning multiple buckets', async () => {
        await setup();

        const analytics = new SessionAnalytics({ bucketSize: 60 });
        analytics.startSession();

        // Segment spanning from first to second bucket
        analytics.addSegment(createMockSegment('Player1', 'test', 50, 70));

        const timeline = analytics.getTimeline();

        assert.equal(timeline.length, 2, 'Should span 2 buckets');
        assert.ok(timeline[0].speakers['Player1'] > 0, 'First bucket should have Player1 activity');
        assert.ok(timeline[1].speakers['Player1'] > 0, 'Second bucket should have Player1 activity');

        teardown();
    });

    // Test: getTimeline accepts custom bucket size
    runner.test('getTimeline accepts custom bucket size', async () => {
        await setup();

        const analytics = new SessionAnalytics({ bucketSize: 60 });
        analytics.startSession();

        analytics.addSegment(createMockSegment('Player1', 'test', 0, 90));

        const timeline30 = analytics.getTimeline(30);
        const timeline60 = analytics.getTimeline(60);

        assert.ok(timeline30.length >= timeline60.length, 'Smaller bucket size should create more buckets');

        teardown();
    });

    // Test: getTimeline calculates total activity per bucket
    runner.test('getTimeline calculates total activity per bucket', async () => {
        await setup();

        const analytics = new SessionAnalytics({ bucketSize: 60 });
        analytics.startSession();

        analytics.addSegment(createMockSegment('Player1', 'test', 0, 20)); // 20 seconds
        analytics.addSegment(createMockSegment('Player2', 'test', 20, 30)); // 10 seconds

        const timeline = analytics.getTimeline();

        assert.equal(timeline[0].totalActivity, 30, 'Total activity should be 30 seconds');

        teardown();
    });

    // Test: getSessionSummary returns complete summary
    runner.test('getSessionSummary returns complete summary', async () => {
        await setup();

        const analytics = new SessionAnalytics();
        analytics.startSession('test-session');

        analytics.addSegment(createMockSegment('Player1', 'test', 0, 5));
        analytics.addSegment(createMockSegment('Player2', 'test', 5, 8));

        const summary = analytics.getSessionSummary();

        assert.ok(summary, 'Summary should exist');
        assert.ok(summary.metadata, 'Should have metadata');
        assert.ok(summary.speakers, 'Should have speakers');
        assert.ok(summary.timeline, 'Should have timeline');
        assert.equal(summary.speakerCount, 2, 'Should have 2 speakers');
        assert.equal(summary.totalSpeakingTime, 8, 'Total speaking time should be 8 seconds');
        assert.equal(summary.dominantSpeaker, 'Player1', 'Player1 should be dominant (5 seconds)');
        assert.equal(summary.quietestSpeaker, 'Player2', 'Player2 should be quietest (3 seconds)');

        teardown();
    });

    // Test: getSessionSummary returns null when no session
    runner.test('getSessionSummary returns null when no session', async () => {
        await setup();

        const analytics = new SessionAnalytics();
        const summary = analytics.getSessionSummary();

        assert.equal(summary, null, 'Should return null when no active session');

        teardown();
    });

    // Test: getSessionHistory returns history array
    runner.test('getSessionHistory returns history array', async () => {
        await setup();

        const analytics = new SessionAnalytics();

        // Create and end multiple sessions
        analytics.startSession('session-1');
        analytics.addSegment(createMockSegment('Player1', 'test', 0, 5));
        analytics.endSession();

        analytics.startSession('session-2');
        analytics.addSegment(createMockSegment('Player2', 'test', 0, 3));
        analytics.endSession();

        const history = analytics.getSessionHistory();

        assert.equal(history.length, 2, 'Should have 2 sessions in history');
        assert.equal(history[0].metadata.sessionId, 'session-2', 'Most recent should be first');
        assert.equal(history[1].metadata.sessionId, 'session-1', 'Oldest should be last');

        teardown();
    });

    // Test: getSessionHistory respects limit parameter
    runner.test('getSessionHistory respects limit parameter', async () => {
        await setup();

        const analytics = new SessionAnalytics();

        // Create 3 sessions
        for (let i = 1; i <= 3; i++) {
            analytics.startSession(`session-${i}`);
            analytics.endSession();
        }

        const limitedHistory = analytics.getSessionHistory(2);

        assert.equal(limitedHistory.length, 2, 'Should return only 2 sessions when limit is 2');

        teardown();
    });

    // Test: Session history is trimmed to max size
    runner.test('session history is trimmed to max size', async () => {
        await setup();

        const analytics = new SessionAnalytics({ maxHistorySize: 3 });

        // Create 5 sessions
        for (let i = 1; i <= 5; i++) {
            analytics.startSession(`session-${i}`);
            analytics.endSession();
        }

        assert.equal(analytics._sessionHistory.length, 3, 'History should be trimmed to max size of 3');
        assert.equal(analytics._sessionHistory[0].metadata.sessionId, 'session-5', 'Should keep most recent sessions');

        teardown();
    });

    // Test: clearCurrentSession clears session data
    runner.test('clearCurrentSession clears session data', async () => {
        await setup();

        const analytics = new SessionAnalytics();
        analytics.startSession();
        analytics.addSegment(createMockSegment('Player1', 'test', 0, 5));

        analytics.clearCurrentSession();

        assert.equal(analytics._currentSession, null, 'Current session should be null');
        assert.equal(Object.keys(analytics._speakerMetrics).length, 0, 'Speaker metrics should be empty');
        assert.equal(analytics._segments.length, 0, 'Segments should be empty');

        teardown();
    });

    // Test: clearHistory clears all history
    runner.test('clearHistory clears all history', async () => {
        await setup();

        const analytics = new SessionAnalytics();

        analytics.startSession('session-1');
        analytics.endSession();
        analytics.startSession('session-2');
        analytics.endSession();

        assert.ok(analytics._sessionHistory.length > 0, 'History should have sessions');

        analytics.clearHistory();

        assert.equal(analytics._sessionHistory.length, 0, 'History should be empty');

        teardown();
    });

    // Test: isSessionActive returns correct state
    runner.test('isSessionActive returns correct state', async () => {
        await setup();

        const analytics = new SessionAnalytics();

        assert.equal(analytics.isSessionActive(), false, 'Should be false initially');

        analytics.startSession();
        assert.equal(analytics.isSessionActive(), true, 'Should be true when session active');

        analytics.pauseSession();
        assert.equal(analytics.isSessionActive(), false, 'Should be false when paused');

        analytics.resumeSession();
        assert.equal(analytics.isSessionActive(), true, 'Should be true when resumed');

        analytics.endSession();
        assert.equal(analytics.isSessionActive(), false, 'Should be false when ended');

        teardown();
    });

    // Test: getCurrentSessionId returns current session ID
    runner.test('getCurrentSessionId returns current session ID', async () => {
        await setup();

        const analytics = new SessionAnalytics();

        assert.equal(analytics.getCurrentSessionId(), null, 'Should be null initially');

        const id = analytics.startSession('my-session');
        assert.equal(analytics.getCurrentSessionId(), 'my-session', 'Should return session ID');

        analytics.endSession();
        assert.equal(analytics.getCurrentSessionId(), null, 'Should be null after ending');

        teardown();
    });

    // Test: saveSession saves to settings manager
    runner.test('saveSession saves to settings manager', async () => {
        await setup();

        const mockSettingsManager = createMockSettingsManager();
        const analytics = new SessionAnalytics({ settingsManager: mockSettingsManager });

        analytics.startSession('test-session');
        analytics.addSegment(createMockSegment('Player1', 'test', 0, 5));

        await analytics.saveSession();

        const saved = mockSettingsManager._storage.sessionData;
        assert.ok(saved, 'Session data should be saved');
        assert.ok(saved.currentSession, 'Should save current session');
        assert.equal(saved.currentSession.metadata.sessionId, 'test-session', 'Should save correct session ID');

        teardown();
    });

    // Test: saveSession warns without settings manager
    runner.test('saveSession warns without settings manager', async () => {
        await setup();

        const analytics = new SessionAnalytics();

        // Should not throw, just warn
        await assert.notThrows(
            () => analytics.saveSession(),
            'Should not throw when settings manager not configured'
        );

        teardown();
    });

    // Test: loadSessions restores from settings manager
    runner.test('loadSessions restores from settings manager', async () => {
        await setup();

        const mockSettingsManager = createMockSettingsManager();

        // Create and save a session
        const analytics1 = new SessionAnalytics({ settingsManager: mockSettingsManager });
        analytics1.startSession('original-session');
        analytics1.addSegment(createMockSegment('Player1', 'test', 0, 5));
        await analytics1.saveSession();

        // Create new instance and load
        const analytics2 = new SessionAnalytics({ settingsManager: mockSettingsManager });
        await analytics2.loadSessions();

        assert.equal(analytics2.getCurrentSessionId(), 'original-session', 'Should restore session ID');
        assert.ok(analytics2._speakerMetrics['Player1'], 'Should restore speaker metrics');
        assert.equal(analytics2._segments.length, 1, 'Should restore segments');

        teardown();
    });

    // Test: loadSessions handles missing data gracefully
    runner.test('loadSessions handles missing data gracefully', async () => {
        await setup();

        const mockSettingsManager = createMockSettingsManager();
        const analytics = new SessionAnalytics({ settingsManager: mockSettingsManager });

        // Load without any saved data
        await assert.notThrows(
            () => analytics.loadSessions(),
            'Should not throw when no data exists'
        );

        teardown();
    });

    // Test: loadSessions warns without settings manager
    runner.test('loadSessions warns without settings manager', async () => {
        await setup();

        const analytics = new SessionAnalytics();

        // Should not throw, just warn
        await assert.notThrows(
            () => analytics.loadSessions(),
            'Should not throw when settings manager not configured'
        );

        teardown();
    });

    // Test: Session summary has complete speaker metrics
    runner.test('session summary has complete speaker metrics', async () => {
        await setup();

        const analytics = new SessionAnalytics();
        analytics.startSession();

        analytics.addSegment(createMockSegment('DM', 'Welcome players', 0, 3));
        analytics.addSegment(createMockSegment('DM', 'What do you do?', 5, 7));
        analytics.addSegment(createMockSegment('Player1', 'I attack', 7, 9));

        const summary = analytics.getSessionSummary();
        const dmMetrics = summary.speakers['DM'];

        assert.ok(dmMetrics, 'DM metrics should exist');
        assert.equal(dmMetrics.speakerId, 'DM', 'Speaker ID should be DM');
        assert.equal(dmMetrics.speakingTime, 5, 'DM speaking time should be 5 seconds');
        assert.equal(dmMetrics.segmentCount, 2, 'DM should have 2 segments');
        assert.equal(dmMetrics.firstSpeakTime, 0, 'First speak time should be 0');
        assert.equal(dmMetrics.lastSpeakTime, 7, 'Last speak time should be 7');
        assert.ok(dmMetrics.avgSegmentDuration > 0, 'Average duration should be calculated');
        assert.ok(dmMetrics.percentage > 0, 'Percentage should be calculated');

        teardown();
    });

    return await runner.run();
}
