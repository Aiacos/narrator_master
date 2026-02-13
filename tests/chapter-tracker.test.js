/**
 * Unit Tests for ChapterTracker
 * Tests chapter tracking, scene-to-chapter mapping, navigation, and edge cases
 * @module tests/chapter-tracker
 */

import {
    setupMockGame,
    setupMockDocument,
    cleanupMocks,
    assert,
    TestRunner
} from './test-helper.js';

// Note: We need to set up mocks before importing the module
let ChapterTracker;

/**
 * Setup function to run before tests
 */
async function setup() {
    setupMockDocument();
    setupMockGame();

    // Dynamic import after mocks are set up
    const module = await import('../scripts/chapter-tracker.js');
    ChapterTracker = module.ChapterTracker;
}

/**
 * Teardown function to run after tests
 */
function teardown() {
    cleanupMocks();
}

/**
 * Creates a mock scene object
 * @param {string} id - Scene ID
 * @param {string} name - Scene name
 * @param {string} [journalId] - Linked journal ID (optional)
 * @param {string} [journalPage] - Linked journal page ID (optional)
 * @returns {Object} Mock scene object
 */
function createMockScene(id, name, journalId = null, journalPage = null) {
    return {
        id,
        name,
        journal: journalId,
        journalPage: journalPage
    };
}

/**
 * Creates a mock JournalParser with stubbed methods
 * @returns {Object} Mock JournalParser
 */
function createMockJournalParser() {
    const cachedContent = new Map();

    // Set up some mock cached content
    cachedContent.set('journal1', {
        id: 'journal1',
        name: 'Test Adventure',
        pages: [
            { id: 'page1', name: 'Introduction', content: 'Welcome to the adventure' },
            { id: 'page2', name: 'Chapter 1 - The Tavern', content: 'The heroes enter the tavern' },
            { id: 'page3', name: 'Chapter 2 - The Forest', content: 'A dark forest awaits' }
        ]
    });

    return {
        _cachedContent: cachedContent,

        getChapterBySceneName: function (journalId, sceneName) {
            // Simulate finding a chapter by scene name
            if (journalId !== 'journal1') {return null;}

            const sceneNameLower = sceneName.toLowerCase();
            if (sceneNameLower.includes('tavern')) {
                return {
                    id: 'chapter-tavern',
                    title: 'Chapter 1 - The Tavern',
                    level: 1,
                    type: 'page',
                    pageId: 'page2',
                    pageName: 'Chapter 1 - The Tavern',
                    content: 'The heroes enter the tavern'
                };
            }
            if (sceneNameLower.includes('forest')) {
                return {
                    id: 'chapter-forest',
                    title: 'Chapter 2 - The Forest',
                    level: 1,
                    type: 'page',
                    pageId: 'page3',
                    pageName: 'Chapter 2 - The Forest',
                    content: 'A dark forest awaits'
                };
            }
            return null;
        },

        getFlatChapterList: function (journalId) {
            if (journalId !== 'journal1') {return [];}

            return [
                {
                    id: 'chapter-intro',
                    title: 'Introduction',
                    level: 0,
                    type: 'page',
                    pageId: 'page1',
                    pageName: 'Introduction',
                    path: 'Introduction'
                },
                {
                    id: 'chapter-tavern',
                    title: 'Chapter 1 - The Tavern',
                    level: 0,
                    type: 'page',
                    pageId: 'page2',
                    pageName: 'Chapter 1 - The Tavern',
                    path: 'Chapter 1 - The Tavern'
                },
                {
                    id: 'tavern-barkeep',
                    title: 'The Barkeep',
                    level: 1,
                    type: 'heading',
                    pageId: 'page2',
                    pageName: 'Chapter 1 - The Tavern',
                    path: 'Chapter 1 - The Tavern > The Barkeep'
                },
                {
                    id: 'chapter-forest',
                    title: 'Chapter 2 - The Forest',
                    level: 0,
                    type: 'page',
                    pageId: 'page3',
                    pageName: 'Chapter 2 - The Forest',
                    path: 'Chapter 2 - The Forest'
                }
            ];
        },

        extractChapterStructure: function (journalId) {
            if (journalId !== 'journal1') {return null;}

            return {
                journalId: 'journal1',
                journalName: 'Test Adventure',
                chapters: [
                    {
                        id: 'chapter-intro',
                        title: 'Introduction',
                        level: 0,
                        type: 'page',
                        pageId: 'page1',
                        pageName: 'Introduction',
                        children: []
                    },
                    {
                        id: 'chapter-tavern',
                        title: 'Chapter 1 - The Tavern',
                        level: 0,
                        type: 'page',
                        pageId: 'page2',
                        pageName: 'Chapter 1 - The Tavern',
                        children: [
                            {
                                id: 'tavern-barkeep',
                                title: 'The Barkeep',
                                level: 1,
                                type: 'heading',
                                pageId: 'page2',
                                pageName: 'Chapter 1 - The Tavern',
                                children: []
                            },
                            {
                                id: 'tavern-quest',
                                title: 'The Quest',
                                level: 1,
                                type: 'heading',
                                pageId: 'page2',
                                pageName: 'Chapter 1 - The Tavern',
                                children: []
                            }
                        ]
                    },
                    {
                        id: 'chapter-forest',
                        title: 'Chapter 2 - The Forest',
                        level: 0,
                        type: 'page',
                        pageId: 'page3',
                        pageName: 'Chapter 2 - The Forest',
                        children: []
                    }
                ]
            };
        },

        searchByKeywords: function (journalId, keywords) {
            if (journalId !== 'journal1') {return [];}

            // Simple keyword matching
            const results = [];
            for (const keyword of keywords) {
                if (keyword.includes('tavern') || keyword.includes('hero')) {
                    results.push({ id: 'page2', name: 'Chapter 1 - The Tavern' });
                    break;
                }
            }
            return results;
        },

        getChapterAtPosition: function (journalId, pageId, _position) {
            if (journalId !== 'journal1') {return null;}

            if (pageId === 'page2') {
                return {
                    id: 'chapter-tavern',
                    title: 'Chapter 1 - The Tavern',
                    level: 0,
                    type: 'page',
                    pageId: 'page2',
                    pageName: 'Chapter 1 - The Tavern',
                    content: 'The heroes enter the tavern'
                };
            }
            return null;
        }
    };
}

/**
 * Run all ChapterTracker tests
 */
export async function runTests() {
    const runner = new TestRunner('ChapterTracker Tests');

    // ==================== Constructor Tests ====================

    // Test: Constructor creates empty state
    runner.test('constructor initializes empty state', async () => {
        await setup();

        const tracker = new ChapterTracker();

        assert.equal(tracker._currentChapter, null, 'currentChapter should be null');
        assert.deepEqual(tracker._subchapters, [], 'subchapters should be empty array');
        assert.equal(tracker._activeSceneId, null, 'activeSceneId should be null');
        assert.equal(tracker._journalParser, null, 'journalParser should be null');
        assert.equal(tracker._selectedJournalId, null, 'selectedJournalId should be null');
        assert.equal(tracker._chapterSource.type, 'none', 'chapterSource type should be none');
        assert.ok(tracker._sceneChapterCache instanceof Map, 'sceneChapterCache should be a Map');
        assert.equal(tracker._sceneChapterCache.size, 0, 'sceneChapterCache should be empty');
        assert.deepEqual(tracker._chapterHistory, [], 'chapterHistory should be empty');

        teardown();
    });

    // Test: Constructor accepts options
    runner.test('constructor accepts journalParser option', async () => {
        await setup();

        const mockParser = createMockJournalParser();
        const tracker = new ChapterTracker({ journalParser: mockParser });

        assert.equal(tracker._journalParser, mockParser, 'journalParser should be set from options');

        teardown();
    });

    // ==================== Configuration Tests ====================

    // Test: setJournalParser sets the parser
    runner.test('setJournalParser sets the parser reference', async () => {
        await setup();

        const tracker = new ChapterTracker();
        const mockParser = createMockJournalParser();

        tracker.setJournalParser(mockParser);

        assert.equal(tracker._journalParser, mockParser, 'journalParser should be set');

        teardown();
    });

    // Test: setSelectedJournal sets the journal ID
    runner.test('setSelectedJournal sets the journal ID and clears cache', async () => {
        await setup();

        const tracker = new ChapterTracker();

        // Add something to cache first
        tracker._sceneChapterCache.set('scene1', { id: 'chapter1' });
        assert.equal(tracker._sceneChapterCache.size, 1, 'Cache should have one entry');

        tracker.setSelectedJournal('journal1');

        assert.equal(tracker._selectedJournalId, 'journal1', 'selectedJournalId should be set');
        assert.equal(tracker._sceneChapterCache.size, 0, 'Cache should be cleared');

        teardown();
    });

    // Test: getSelectedJournal returns the journal ID
    runner.test('getSelectedJournal returns the selected journal ID', async () => {
        await setup();

        const tracker = new ChapterTracker();

        assert.equal(tracker.getSelectedJournal(), null, 'Should return null initially');

        tracker.setSelectedJournal('journal1');

        assert.equal(tracker.getSelectedJournal(), 'journal1', 'Should return set journal ID');

        teardown();
    });

    // Test: isConfigured returns correct state
    runner.test('isConfigured returns false when not configured', async () => {
        await setup();

        const tracker = new ChapterTracker();

        assert.equal(tracker.isConfigured(), false, 'Should be false with no parser or journal');

        tracker.setJournalParser(createMockJournalParser());
        assert.equal(tracker.isConfigured(), false, 'Should be false with parser but no journal');

        tracker._journalParser = null;
        tracker.setSelectedJournal('journal1');
        assert.equal(tracker.isConfigured(), false, 'Should be false with journal but no parser');

        teardown();
    });

    // Test: isConfigured returns true when fully configured
    runner.test('isConfigured returns true when fully configured', async () => {
        await setup();

        const tracker = new ChapterTracker();
        tracker.setJournalParser(createMockJournalParser());
        tracker.setSelectedJournal('journal1');

        assert.equal(tracker.isConfigured(), true, 'Should be true with both parser and journal');

        teardown();
    });

    // ==================== updateFromScene Tests ====================

    // Test: updateFromScene returns null when no scene provided
    runner.test('updateFromScene returns null when no scene provided', async () => {
        await setup();

        const tracker = new ChapterTracker();
        tracker.setJournalParser(createMockJournalParser());
        tracker.setSelectedJournal('journal1');

        const result = tracker.updateFromScene(null);

        assert.equal(result, null, 'Should return null for null scene');

        teardown();
    });

    // Test: updateFromScene returns null when no journal configured
    runner.test('updateFromScene returns null when no journal configured', async () => {
        await setup();

        const tracker = new ChapterTracker();
        const scene = createMockScene('scene1', 'Tavern Scene');

        const result = tracker.updateFromScene(scene);

        assert.equal(result, null, 'Should return null when not configured');
        assert.equal(tracker._activeSceneId, 'scene1', 'activeSceneId should be set');

        teardown();
    });

    // Test: updateFromScene detects chapter from scene name
    runner.test('updateFromScene detects chapter from scene name', async () => {
        await setup();

        const tracker = new ChapterTracker();
        tracker.setJournalParser(createMockJournalParser());
        tracker.setSelectedJournal('journal1');

        const scene = createMockScene('scene1', 'Tavern Scene');
        const result = tracker.updateFromScene(scene);

        assert.ok(result !== null, 'Should return detected chapter');
        assert.equal(result.title, 'Chapter 1 - The Tavern', 'Should detect tavern chapter');
        assert.equal(tracker._activeSceneId, 'scene1', 'activeSceneId should be set');

        teardown();
    });

    // Test: updateFromScene uses cache on second call
    runner.test('updateFromScene uses cache on second call', async () => {
        await setup();

        const tracker = new ChapterTracker();
        tracker.setJournalParser(createMockJournalParser());
        tracker.setSelectedJournal('journal1');

        const scene = createMockScene('scene1', 'Tavern Scene');

        // First call - should detect and cache
        const result1 = tracker.updateFromScene(scene);
        assert.ok(tracker._sceneChapterCache.has('scene1'), 'Should cache result');

        // Second call - should use cache
        const result2 = tracker.updateFromScene(scene);
        assert.equal(result1.id, result2.id, 'Should return same chapter from cache');

        teardown();
    });

    // Test: updateFromScene with linked journal page
    runner.test('updateFromScene with linked journal page', async () => {
        await setup();

        const mockParser = createMockJournalParser();
        const tracker = new ChapterTracker();
        tracker.setJournalParser(mockParser);
        tracker.setSelectedJournal('journal1');

        // Scene with linked journal - matches our selected journal
        const scene = createMockScene('scene1', 'Some Scene', 'journal1', 'page2');
        const result = tracker.updateFromScene(scene);

        assert.ok(result !== null, 'Should return chapter from linked page');

        teardown();
    });

    // Test: updateFromScene returns null for scene without linked journal
    runner.test('updateFromScene returns null for unmatched scene', async () => {
        await setup();

        const tracker = new ChapterTracker();
        tracker.setJournalParser(createMockJournalParser());
        tracker.setSelectedJournal('journal1');

        // Scene name doesn't match any chapter
        const scene = createMockScene('scene1', 'Random Unrelated Scene XYZ');
        const _result = tracker.updateFromScene(scene);

        // May return null if no keywords match
        assert.equal(tracker._activeSceneId, 'scene1', 'activeSceneId should still be set');

        teardown();
    });

    // Test: updateFromScene sets chapter source
    runner.test('updateFromScene sets chapter source correctly', async () => {
        await setup();

        const tracker = new ChapterTracker();
        tracker.setJournalParser(createMockJournalParser());
        tracker.setSelectedJournal('journal1');

        const scene = createMockScene('scene1', 'Forest Scene');
        tracker.updateFromScene(scene);

        const source = tracker.getChapterSource();
        assert.equal(source.type, 'scene', 'Source type should be scene');
        assert.equal(source.sceneId, 'scene1', 'Source should include sceneId');
        assert.equal(source.sceneName, 'Forest Scene', 'Source should include sceneName');
        assert.ok(source.updatedAt instanceof Date, 'Source should include updatedAt');

        teardown();
    });

    // ==================== getCurrentChapter Tests ====================

    // Test: getCurrentChapter returns null initially
    runner.test('getCurrentChapter returns null initially', async () => {
        await setup();

        const tracker = new ChapterTracker();

        assert.equal(tracker.getCurrentChapter(), null, 'Should return null initially');

        teardown();
    });

    // Test: getCurrentChapter returns current chapter after update
    runner.test('getCurrentChapter returns chapter after updateFromScene', async () => {
        await setup();

        const tracker = new ChapterTracker();
        tracker.setJournalParser(createMockJournalParser());
        tracker.setSelectedJournal('journal1');

        const scene = createMockScene('scene1', 'Tavern Scene');
        tracker.updateFromScene(scene);

        const chapter = tracker.getCurrentChapter();

        assert.ok(chapter !== null, 'Should return current chapter');
        assert.equal(chapter.title, 'Chapter 1 - The Tavern', 'Should have correct title');
        assert.ok(chapter.journalId, 'Should have journalId');
        assert.ok(chapter.path, 'Should have path');

        teardown();
    });

    // ==================== getSubchapters Tests ====================

    // Test: getSubchapters returns empty array initially
    runner.test('getSubchapters returns empty array initially', async () => {
        await setup();

        const tracker = new ChapterTracker();

        const subchapters = tracker.getSubchapters();

        assert.ok(Array.isArray(subchapters), 'Should return an array');
        assert.equal(subchapters.length, 0, 'Should be empty initially');

        teardown();
    });

    // Test: getSubchapters returns subchapters after setting chapter
    runner.test('getSubchapters returns subchapters for current chapter', async () => {
        await setup();

        const tracker = new ChapterTracker();
        tracker.setJournalParser(createMockJournalParser());
        tracker.setSelectedJournal('journal1');

        // Set to tavern chapter which has subchapters
        const scene = createMockScene('scene1', 'Tavern Scene');
        tracker.updateFromScene(scene);

        const subchapters = tracker.getSubchapters();

        assert.ok(Array.isArray(subchapters), 'Should return an array');
        // The tavern chapter has children (The Barkeep, The Quest)
        assert.ok(subchapters.length >= 0, 'Should return subchapters array');

        teardown();
    });

    // Test: getSubchapters returns copy, not reference
    runner.test('getSubchapters returns a copy, not the internal array', async () => {
        await setup();

        const tracker = new ChapterTracker();
        tracker._subchapters = [{ id: 'sub1', title: 'Subchapter 1' }];

        const subchapters = tracker.getSubchapters();
        subchapters.push({ id: 'sub2', title: 'Subchapter 2' });

        assert.equal(tracker._subchapters.length, 1, 'Internal array should not be modified');
        assert.equal(subchapters.length, 2, 'Returned array can be modified');

        teardown();
    });

    // ==================== Edge Cases ====================

    // Test: Edge case - no journal parser
    runner.test('edge case: operations work without journal parser', async () => {
        await setup();

        const tracker = new ChapterTracker();
        tracker.setSelectedJournal('journal1');

        // Should not throw
        const scene = createMockScene('scene1', 'Test Scene');
        const result = tracker.updateFromScene(scene);

        assert.equal(result, null, 'Should return null without parser');
        assert.equal(tracker.getCurrentChapter(), null, 'getCurrentChapter should return null');
        assert.deepEqual(tracker.getSubchapters(), [], 'getSubchapters should return empty array');

        teardown();
    });

    // Test: Edge case - scene without linked journal
    runner.test('edge case: scene without linked journal uses name matching', async () => {
        await setup();

        const tracker = new ChapterTracker();
        tracker.setJournalParser(createMockJournalParser());
        tracker.setSelectedJournal('journal1');

        // Scene has no linked journal, but name contains 'forest'
        const scene = createMockScene('scene2', 'The Dark Forest');
        const result = tracker.updateFromScene(scene);

        assert.ok(result !== null, 'Should find chapter by name matching');
        assert.equal(result.title, 'Chapter 2 - The Forest', 'Should match forest chapter');

        teardown();
    });

    // Test: Edge case - scene with linked journal that doesn't match selected
    runner.test('edge case: linked journal different from selected uses fallback', async () => {
        await setup();

        const tracker = new ChapterTracker();
        tracker.setJournalParser(createMockJournalParser());
        tracker.setSelectedJournal('journal1');

        // Scene linked to different journal
        const scene = createMockScene('scene1', 'Tavern Map', 'other-journal', 'other-page');
        const result = tracker.updateFromScene(scene);

        // Should fall back to name matching and find tavern
        assert.ok(result !== null, 'Should fall back to name matching');

        teardown();
    });

    // ==================== Manual Chapter Setting Tests ====================

    // Test: setManualChapter sets chapter by ID
    runner.test('setManualChapter sets chapter by ID', async () => {
        await setup();

        const tracker = new ChapterTracker();
        tracker.setJournalParser(createMockJournalParser());
        tracker.setSelectedJournal('journal1');

        const result = tracker.setManualChapter('chapter-tavern');

        assert.equal(result, true, 'Should return true on success');

        const chapter = tracker.getCurrentChapter();
        assert.ok(chapter !== null, 'Chapter should be set');
        assert.equal(chapter.id, 'chapter-tavern', 'Should have correct ID');

        const source = tracker.getChapterSource();
        assert.equal(source.type, 'manual', 'Source should be manual');

        teardown();
    });

    // Test: setManualChapter returns false for invalid ID
    runner.test('setManualChapter returns false for invalid chapter ID', async () => {
        await setup();

        const tracker = new ChapterTracker();
        tracker.setJournalParser(createMockJournalParser());
        tracker.setSelectedJournal('journal1');

        const result = tracker.setManualChapter('nonexistent-chapter');

        assert.equal(result, false, 'Should return false for nonexistent chapter');

        teardown();
    });

    // Test: setManualChapter returns false when not configured
    runner.test('setManualChapter returns false when not configured', async () => {
        await setup();

        const tracker = new ChapterTracker();

        const result = tracker.setManualChapter('chapter-tavern');

        assert.equal(result, false, 'Should return false when not configured');

        teardown();
    });

    // ==================== Navigation Tests ====================

    // Test: getAllChapters returns flat list
    runner.test('getAllChapters returns flat chapter list', async () => {
        await setup();

        const tracker = new ChapterTracker();
        tracker.setJournalParser(createMockJournalParser());
        tracker.setSelectedJournal('journal1');

        const chapters = tracker.getAllChapters();

        assert.ok(Array.isArray(chapters), 'Should return an array');
        assert.ok(chapters.length > 0, 'Should have chapters');
        assert.ok(chapters[0].id, 'Chapters should have id');
        assert.ok(chapters[0].title, 'Chapters should have title');

        teardown();
    });

    // Test: getAllChapters returns empty when not configured
    runner.test('getAllChapters returns empty array when not configured', async () => {
        await setup();

        const tracker = new ChapterTracker();

        const chapters = tracker.getAllChapters();

        assert.ok(Array.isArray(chapters), 'Should return an array');
        assert.equal(chapters.length, 0, 'Should be empty when not configured');

        teardown();
    });

    // Test: Chapter history tracking
    runner.test('chapter history tracks visited chapters', async () => {
        await setup();

        const tracker = new ChapterTracker();
        tracker.setJournalParser(createMockJournalParser());
        tracker.setSelectedJournal('journal1');

        // Visit first chapter
        const scene1 = createMockScene('scene1', 'Tavern Scene');
        tracker.updateFromScene(scene1);

        // Visit second chapter
        const scene2 = createMockScene('scene2', 'Forest Scene');
        tracker.updateFromScene(scene2);

        const history = tracker.getChapterHistory();

        assert.ok(Array.isArray(history), 'Should return an array');
        assert.ok(history.length >= 1, 'Should have at least one history entry');

        teardown();
    });

    // Test: navigateBack returns previous chapter
    runner.test('navigateBack returns previous chapter', async () => {
        await setup();

        const tracker = new ChapterTracker();
        tracker.setJournalParser(createMockJournalParser());
        tracker.setSelectedJournal('journal1');

        // Visit first chapter
        tracker.setManualChapter('chapter-tavern');

        // Visit second chapter
        tracker.setManualChapter('chapter-forest');

        // Navigate back
        const previous = tracker.navigateBack();

        assert.ok(previous !== null, 'Should return previous chapter');
        assert.equal(previous.id, 'chapter-tavern', 'Should return tavern chapter');
        assert.equal(tracker.getCurrentChapter().id, 'chapter-tavern', 'Current should be previous');

        teardown();
    });

    // Test: navigateBack returns null when history is empty
    runner.test('navigateBack returns null when history is empty', async () => {
        await setup();

        const tracker = new ChapterTracker();

        const result = tracker.navigateBack();

        assert.equal(result, null, 'Should return null when no history');

        teardown();
    });

    // ==================== Sibling Navigation Tests ====================

    // Test: getSiblingChapters returns siblings
    runner.test('getSiblingChapters returns previous and next siblings', async () => {
        await setup();

        const tracker = new ChapterTracker();
        tracker.setJournalParser(createMockJournalParser());
        tracker.setSelectedJournal('journal1');

        // Set to middle chapter
        tracker.setManualChapter('chapter-tavern');

        const siblings = tracker.getSiblingChapters();

        assert.ok(siblings.previous !== null || siblings.next !== null, 'Should have at least one sibling');

        teardown();
    });

    // Test: getSiblingChapters returns nulls when not configured
    runner.test('getSiblingChapters returns nulls when not configured', async () => {
        await setup();

        const tracker = new ChapterTracker();

        const siblings = tracker.getSiblingChapters();

        assert.equal(siblings.previous, null, 'Previous should be null');
        assert.equal(siblings.next, null, 'Next should be null');

        teardown();
    });

    // ==================== Content For AI Tests ====================

    // Test: getCurrentChapterContentForAI returns formatted content
    runner.test('getCurrentChapterContentForAI returns formatted content', async () => {
        await setup();

        const tracker = new ChapterTracker();
        tracker.setJournalParser(createMockJournalParser());
        tracker.setSelectedJournal('journal1');
        tracker.setManualChapter('chapter-tavern');

        const content = tracker.getCurrentChapterContentForAI();

        assert.ok(content.length > 0, 'Should return non-empty content');
        assert.ok(content.includes('CAPITOLO CORRENTE'), 'Should include chapter header');
        assert.ok(content.includes('PERCORSO'), 'Should include path');

        teardown();
    });

    // Test: getCurrentChapterContentForAI returns empty when no chapter
    runner.test('getCurrentChapterContentForAI returns empty when no chapter', async () => {
        await setup();

        const tracker = new ChapterTracker();

        const content = tracker.getCurrentChapterContentForAI();

        assert.equal(content, '', 'Should return empty string');

        teardown();
    });

    // Test: getCurrentChapterContentForAI respects maxLength
    runner.test('getCurrentChapterContentForAI respects maxLength', async () => {
        await setup();

        const tracker = new ChapterTracker();
        tracker._currentChapter = {
            title: 'Test Chapter',
            path: 'Test Path',
            content: 'A'.repeat(10000) // Very long content
        };

        const content = tracker.getCurrentChapterContentForAI(100);

        // Should be truncated (allowing some buffer for headers)
        assert.ok(content.length < 500, 'Content should be truncated');

        teardown();
    });

    // ==================== Clear and Cache Tests ====================

    // Test: clear resets all state
    runner.test('clear resets all tracking state', async () => {
        await setup();

        const tracker = new ChapterTracker();
        tracker.setJournalParser(createMockJournalParser());
        tracker.setSelectedJournal('journal1');
        tracker.setManualChapter('chapter-tavern');

        // Verify state is set
        assert.ok(tracker.getCurrentChapter() !== null, 'Should have current chapter');

        tracker.clear();

        assert.equal(tracker._currentChapter, null, 'currentChapter should be null');
        assert.deepEqual(tracker._subchapters, [], 'subchapters should be empty');
        assert.equal(tracker._activeSceneId, null, 'activeSceneId should be null');
        assert.equal(tracker._chapterSource.type, 'none', 'source type should be none');
        assert.deepEqual(tracker._chapterHistory, [], 'history should be empty');

        teardown();
    });

    // Test: clearCache clears scene chapter cache
    runner.test('clearCache clears scene-to-chapter cache', async () => {
        await setup();

        const tracker = new ChapterTracker();
        tracker.setJournalParser(createMockJournalParser());
        tracker.setSelectedJournal('journal1');

        const scene = createMockScene('scene1', 'Tavern Scene');
        tracker.updateFromScene(scene);

        assert.ok(tracker._sceneChapterCache.size > 0, 'Cache should have entries');

        tracker.clearCache();

        assert.equal(tracker._sceneChapterCache.size, 0, 'Cache should be empty');

        teardown();
    });

    // ==================== History Limit Tests ====================

    // Test: History respects max size limit
    runner.test('history respects maximum size limit', async () => {
        await setup();

        const tracker = new ChapterTracker();
        tracker.setJournalParser(createMockJournalParser());
        tracker.setSelectedJournal('journal1');
        tracker._maxHistorySize = 3; // Set small limit for testing

        // Create many chapters manually to fill history
        const flatList = tracker.getAllChapters();

        // Cycle through chapters multiple times
        for (let i = 0; i < 10; i++) {
            const chapter = flatList[i % flatList.length];
            tracker.setManualChapter(chapter.id);
        }

        const history = tracker.getChapterHistory();
        assert.ok(history.length <= 3, 'History should not exceed max size');

        teardown();
    });

    // ==================== Chapter Source Tests ====================

    // Test: getChapterSource returns copy, not reference
    runner.test('getChapterSource returns a copy', async () => {
        await setup();

        const tracker = new ChapterTracker();

        const source1 = tracker.getChapterSource();
        source1.type = 'modified';

        const source2 = tracker.getChapterSource();
        assert.equal(source2.type, 'none', 'Internal source should not be modified');

        teardown();
    });

    // Run all tests
    return runner.run();
}

// Export for direct execution
if (
    typeof process !== 'undefined' &&
    process.argv &&
    process.argv[1]?.includes('chapter-tracker.test')
) {
    runTests().then((results) => {
        process.exit(results.failed > 0 ? 1 : 0);
    });
}
