/**
 * Large Memory Test for JournalParser Bounded Keyword Index
 * Verifies that the keyword index stays bounded (<=5000 entries) with large journals
 * and that search functionality still works correctly
 * @module tests/journal-parser-large-memory
 */

import {
    setupMockGame,
    setupMockDocument,
    cleanupMocks,
    MockJournalEntry,
    MockJournalPage,
    assert,
    TestRunner
} from './test-helper.js';

// Note: We need to set up mocks before importing the module
let JournalParser;

/**
 * Setup function to run before tests
 */
async function setup() {
    setupMockDocument();
    setupMockGame();

    // Dynamic import after mocks are set up
    const module = await import('../scripts/journal-parser.js');
    JournalParser = module.JournalParser;
}

/**
 * Teardown function to run after tests
 */
function teardown() {
    cleanupMocks();
}

/**
 * Generates a large text block with many unique words
 * @param {number} targetWords - Target number of words
 * @returns {string} Generated text
 */
function generateLargeText(targetWords) {
    const baseWords = [
        'adventure', 'quest', 'dragon', 'hero', 'dungeon', 'treasure', 'magic',
        'sword', 'shield', 'battle', 'victory', 'journey', 'forest', 'mountain',
        'castle', 'wizard', 'warrior', 'rogue', 'cleric', 'paladin', 'ranger',
        'goblin', 'orc', 'troll', 'demon', 'angel', 'artifact', 'prophecy',
        'kingdom', 'empire', 'village', 'tavern', 'inn', 'merchant', 'guard'
    ];

    const paragraphs = [];
    let wordCount = 0;
    let sentenceCounter = 0;

    while (wordCount < targetWords) {
        const sentences = [];

        // Generate 5-10 sentences per paragraph
        const sentencesInParagraph = 5 + Math.floor(Math.random() * 6);

        for (let i = 0; i < sentencesInParagraph && wordCount < targetWords; i++) {
            const sentence = [];
            const wordsInSentence = 8 + Math.floor(Math.random() * 12); // 8-20 words

            for (let j = 0; j < wordsInSentence && wordCount < targetWords; j++) {
                // Mix base words with numbered variations to create unique keywords
                const baseWord = baseWords[Math.floor(Math.random() * baseWords.length)];
                const word = j % 3 === 0 ? `${baseWord}${sentenceCounter}` : baseWord;
                sentence.push(word);
                wordCount++;
            }

            // Capitalize first word and add period
            if (sentence.length > 0) {
                sentence[0] = sentence[0].charAt(0).toUpperCase() + sentence[0].slice(1);
                sentences.push(sentence.join(' ') + '.');
            }
            sentenceCounter++;
        }

        paragraphs.push(`<p>${sentences.join(' ')}</p>`);
    }

    return paragraphs.join('\n');
}

/**
 * Creates a large test journal with 50,000+ words
 * @returns {MockJournalEntry} Large test journal
 */
function createLargeTestJournal() {
    const wordsPerPage = 10000;
    const pages = [];

    // Create 6 pages with 10,000 words each = 60,000 words total
    for (let i = 1; i <= 6; i++) {
        const content = generateLargeText(wordsPerPage);
        pages.push(
            new MockJournalPage(
                `page${i}`,
                `Chapter ${i}`,
                'text',
                content,
                i
            )
        );
    }

    return new MockJournalEntry('large-journal', 'Large Adventure Journal', pages);
}

/**
 * Run large memory test for JournalParser
 */
export async function runTests() {
    const runner = new TestRunner('JournalParser Large Memory Tests');

    // Test: Large journal keyword index stays bounded
    runner.test('keyword index stays bounded with 60,000 word journal', async () => {
        await setup();

        const parser = new JournalParser();
        const largeJournal = createLargeTestJournal();

        // Add journal to mock game
        global.game.journal.add(largeJournal);

        // Parse the large journal
        console.log('\nParsing large journal with 60,000+ words...');
        const parsed = await parser.parseJournal(largeJournal.id);

        // Verify basic parsing worked
        assert.ok(parsed, 'Journal should be parsed');
        assert.equal(parsed.pages.length, 6, 'Should have 6 pages');
        assert.ok(parsed.totalCharacters > 50000, 'Should have 50,000+ characters');

        // Get cache stats
        const stats = parser.getCacheStats();
        console.log('Cache stats:', stats);

        // Verify index size is bounded
        assert.ok(
            stats.indexedKeywords <= 5000,
            `Keyword index should be bounded to 5000 entries, but has ${stats.indexedKeywords}`
        );

        console.log(`✓ Index bounded successfully: ${stats.indexedKeywords} entries (limit: 5000)`);

        teardown();
    });

    // Test: Search still works with bounded index
    runner.test('search functionality works correctly with bounded index', async () => {
        await setup();

        const parser = new JournalParser();
        const largeJournal = createLargeTestJournal();

        // Add journal to mock game
        global.game.journal.add(largeJournal);

        // Parse the large journal
        console.log('\nParsing journal for search test...');
        await parser.parseJournal(largeJournal.id);

        // Test search with common keywords that should definitely be indexed
        console.log('Testing search with common keywords...');
        const searchResults1 = parser.searchByKeywords(largeJournal.id, ['adventure', 'dragon', 'hero']);
        assert.ok(
            searchResults1.length > 0,
            'Search should return results for common keywords'
        );

        // Test search with specific keywords
        const searchResults2 = parser.searchByKeywords(largeJournal.id, ['quest']);
        assert.ok(
            searchResults2.length > 0,
            'Search should find pages with specific keywords'
        );

        console.log(`✓ Search found ${searchResults1.length} pages with common keywords`);
        console.log(`✓ Search found ${searchResults2.length} pages with specific keyword`);

        teardown();
    });

    // Test: Multiple large journals with bounded total memory
    runner.test('multiple large journals maintain bounded index', async () => {
        await setup();

        const parser = new JournalParser();

        console.log('\nCreating and parsing 2 large journals...');

        // Create and parse 2 large journals
        for (let i = 1; i <= 2; i++) {
            const journal = createLargeTestJournal();
            journal.id = `large-journal-${i}`;
            journal.name = `Large Adventure ${i}`;

            global.game.journal.add(journal);
            console.log(`  Parsing journal ${i}/2...`);
            await parser.parseJournal(journal.id);
        }

        // Get final stats
        const stats = parser.getCacheStats();
        console.log('Final cache stats after 2 large journals:', stats);

        // Even with 2 large journals (120,000 words), index should stay bounded
        assert.ok(
            stats.indexedKeywords <= 5000,
            `Keyword index should be bounded to 5000 entries even with multiple journals, but has ${stats.indexedKeywords}`
        );

        console.log(`✓ Index remains bounded with multiple journals: ${stats.indexedKeywords} entries`);

        teardown();
    });

    return runner.run();
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runTests().then(results => {
        console.log('\n' + '='.repeat(60));
        console.log('Large Memory Test Results:');
        console.log('='.repeat(60));
        console.log(`Total: ${results.total}`);
        console.log(`Passed: ${results.passed}`);
        console.log(`Failed: ${results.failed}`);
        console.log('='.repeat(60));
        process.exit(results.failed > 0 ? 1 : 0);
    }).catch(error => {
        console.error('Test execution error:', error);
        process.exit(1);
    });
}
