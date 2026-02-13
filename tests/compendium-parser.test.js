/**
 * Unit Tests for CompendiumParser
 * Tests compendium parsing, content extraction, caching, search, and edge cases
 * @module tests/compendium-parser
 */

import {
    setupMockGame,
    setupMockDocument,
    cleanupMocks,
    assert,
    TestRunner
} from './test-helper.js';

// Note: We need to set up mocks before importing the module
let CompendiumParser;

/**
 * Mock for a Foundry VTT Compendium Document (JournalEntry, Item, etc.)
 */
class MockCompendiumDocument {
    constructor(id, name, type, data = {}) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.system = data.system || {};
        this.pages = data.pages || [];
        this.results = data.results || { size: 0 };
        this.description = data.description || '';
    }
}

/**
 * Mock for a Foundry VTT Journal Page
 */
class MockCompendiumJournalPage {
    constructor(id, name, type = 'text', content = '') {
        this.id = id;
        this.name = name;
        this.type = type;
        this.text = { content };
    }
}

/**
 * Mock for a Foundry VTT Compendium Pack
 */
class MockCompendiumPack {
    constructor(collection, label, documentName, documents = []) {
        this.collection = collection;
        this.documentName = documentName;
        this.title = label;
        this.metadata = {
            id: collection,
            label: label
        };
        this._documents = new Map();
        this._index = [];

        // Add documents to the pack
        for (const doc of documents) {
            this._documents.set(doc.id, doc);
            this._index.push({ _id: doc.id, name: doc.name });
        }
    }

    async getIndex() {
        return {
            size: this._index.length,
            [Symbol.iterator]: () => this._index[Symbol.iterator]()
        };
    }

    async getDocument(id) {
        return this._documents.get(id) || null;
    }
}

/**
 * Mock for game.packs collection
 */
class MockPacksCollection {
    constructor() {
        this._packs = [];
    }

    add(pack) {
        this._packs.push(pack);
    }

    filter(fn) {
        return this._packs.filter(fn);
    }

    [Symbol.iterator]() {
        return this._packs[Symbol.iterator]();
    }

    clear() {
        this._packs = [];
    }
}

/**
 * Setup function to run before tests
 */
async function setup() {
    setupMockDocument();
    const mockGame = setupMockGame();

    // Add mock packs collection
    mockGame.packs = new MockPacksCollection();

    // Dynamic import after mocks are set up
    const module = await import('../scripts/compendium-parser.js');
    CompendiumParser = module.CompendiumParser;
}

/**
 * Teardown function to run after tests
 */
function teardown() {
    cleanupMocks();
}

/**
 * Creates a test journal compendium with sample content
 */
function createTestJournalCompendium() {
    const doc1Pages = [
        new MockCompendiumJournalPage('page1', 'Introduzione', 'text', "<p>Benvenuti nell'avventura!</p>"),
        new MockCompendiumJournalPage('page2', 'Capitolo 1', 'text', '<h1>Il Viaggio</h1><p>I nostri eroi partono.</p>')
    ];

    const doc1 = new MockCompendiumDocument('doc1', 'La Grande Avventura', 'JournalEntry', {
        pages: doc1Pages
    });

    const doc2Pages = [
        new MockCompendiumJournalPage('page3', 'Luoghi', 'text', '<p>La <strong>taverna</strong> del drago.</p>')
    ];

    const doc2 = new MockCompendiumDocument('doc2', 'Luoghi Importanti', 'JournalEntry', {
        pages: doc2Pages
    });

    return new MockCompendiumPack(
        'world.adventure-journal',
        'Diario Avventura',
        'JournalEntry',
        [doc1, doc2]
    );
}

/**
 * Creates an empty compendium pack
 */
function createEmptyCompendium() {
    return new MockCompendiumPack(
        'world.empty-pack',
        'Compendio Vuoto',
        'JournalEntry',
        []
    );
}

/**
 * Creates a test item compendium
 */
function createTestItemCompendium() {
    const item1 = new MockCompendiumDocument('item1', 'Spada Magica', 'Item', {
        system: {
            description: {
                value: '<p>Una potente spada con incantesimo di fuoco.</p>'
            },
            source: 'Manuale Base'
        }
    });
    item1.type = 'weapon';

    const item2 = new MockCompendiumDocument('item2', 'Pozione di Cura', 'Item', {
        system: {
            description: {
                value: '<p>Ripristina 2d4+2 punti ferita.</p>'
            }
        }
    });
    item2.type = 'consumable';

    return new MockCompendiumPack(
        'world.items',
        'Oggetti',
        'Item',
        [item1, item2]
    );
}

/**
 * Run all CompendiumParser tests
 */
export async function runTests() {
    const runner = new TestRunner('CompendiumParser Tests');

    // Test: Constructor creates empty caches
    runner.test('constructor initializes empty caches', async () => {
        await setup();

        const parser = new CompendiumParser();

        assert.ok(parser._cachedContent instanceof Map, '_cachedContent should be a Map');
        assert.ok(parser._keywordIndex instanceof Map, '_keywordIndex should be a Map');
        assert.equal(parser._cachedContent.size, 0, '_cachedContent should be empty');
        assert.equal(parser._keywordIndex.size, 0, '_keywordIndex should be empty');
        assert.ok(Array.isArray(parser._journalCompendiums), '_journalCompendiums should be an array');
        assert.ok(Array.isArray(parser._rulesCompendiums), '_rulesCompendiums should be an array');
        assert.equal(parser._journalCompendiums.length, 0, '_journalCompendiums should be empty');
        assert.equal(parser._rulesCompendiums.length, 0, '_rulesCompendiums should be empty');

        teardown();
    });

    // Test: stripHtml removes HTML tags
    runner.test('stripHtml removes HTML tags while preserving text', async () => {
        await setup();

        const parser = new CompendiumParser();

        const result = parser.stripHtml('<p>Hello <strong>World</strong>!</p>');
        assert.equal(result, 'Hello World !', 'HTML tags should be stripped');

        teardown();
    });

    // Test: stripHtml handles empty input
    runner.test('stripHtml handles empty and null input', async () => {
        await setup();

        const parser = new CompendiumParser();

        assert.equal(parser.stripHtml(''), '', 'Empty string should return empty');
        assert.equal(parser.stripHtml(null), '', 'Null should return empty');
        assert.equal(parser.stripHtml(undefined), '', 'Undefined should return empty');
        assert.equal(parser.stripHtml(123), '', 'Non-string should return empty');

        teardown();
    });

    // Test: stripHtml normalizes whitespace
    runner.test('stripHtml normalizes whitespace', async () => {
        await setup();

        const parser = new CompendiumParser();

        const result = parser.stripHtml('<p>Multiple   spaces</p>  <p>and    tabs</p>');
        // After stripping, multiple spaces should be normalized to single spaces
        assert.ok(!result.includes('  '), 'Multiple spaces should be normalized');

        teardown();
    });

    // Test: stripHtml safely handles script tags
    runner.test('stripHtml safely strips script tags without execution', async () => {
        await setup();

        const parser = new CompendiumParser();

        const result = parser.stripHtml('<p>Hello</p><script>alert(1)</script><p>World</p>');

        assert.equal(result, 'Hello World', 'Script tags should be completely removed');
        assert.ok(!result.includes('script'), 'Result should not contain script text');
        assert.ok(!result.includes('alert'), 'Result should not contain script content');

        teardown();
    });

    // Test: parseJournalCompendiums returns empty when no packs available
    runner.test('parseJournalCompendiums returns empty when game.packs is undefined', async () => {
        await setup();

        // Remove packs from game
        game.packs = undefined;

        const parser = new CompendiumParser();
        const results = await parser.parseJournalCompendiums();

        assert.ok(Array.isArray(results), 'Should return an array');
        assert.equal(results.length, 0, 'Should return empty array when packs not available');

        teardown();
    });

    // Test: parseJournalCompendiums successfully parses journal compendiums
    runner.test('parseJournalCompendiums parses journal compendium packs', async () => {
        await setup();

        const journalPack = createTestJournalCompendium();
        game.packs.add(journalPack);

        const parser = new CompendiumParser();
        const results = await parser.parseJournalCompendiums();

        assert.ok(Array.isArray(results), 'Should return an array');
        assert.equal(results.length, 1, 'Should have one journal compendium');
        assert.equal(results[0].id, 'world.adventure-journal', 'Should have correct pack ID');
        assert.equal(results[0].name, 'Diario Avventura', 'Should have correct pack name');
        assert.equal(results[0].documentName, 'JournalEntry', 'Should have correct document type');
        assert.ok(results[0].entries.length > 0, 'Should have parsed entries');
        assert.ok(results[0].parsedAt instanceof Date, 'Should have parsedAt timestamp');

        teardown();
    });

    // Test: parseJournalCompendiums handles empty compendiums
    runner.test('parseJournalCompendiums handles empty compendiums gracefully', async () => {
        await setup();

        const emptyPack = createEmptyCompendium();
        game.packs.add(emptyPack);

        const parser = new CompendiumParser();
        const results = await parser.parseJournalCompendiums();

        assert.ok(Array.isArray(results), 'Should return an array');
        // Empty compendiums should be filtered out
        assert.equal(results.length, 0, 'Empty compendiums should not be included');

        teardown();
    });

    // Test: parseJournalCompendiums filters only JournalEntry packs
    runner.test('parseJournalCompendiums filters only JournalEntry packs', async () => {
        await setup();

        const journalPack = createTestJournalCompendium();
        const itemPack = createTestItemCompendium();
        game.packs.add(journalPack);
        game.packs.add(itemPack);

        const parser = new CompendiumParser();
        const results = await parser.parseJournalCompendiums();

        assert.equal(results.length, 1, 'Should only include journal compendiums');
        assert.equal(results[0].documentName, 'JournalEntry', 'Should only have JournalEntry type');

        teardown();
    });

    // Test: parseRulesCompendiums parses item compendiums
    runner.test('parseRulesCompendiums parses item compendiums', async () => {
        await setup();

        const itemPack = createTestItemCompendium();
        game.packs.add(itemPack);

        const parser = new CompendiumParser();
        const results = await parser.parseRulesCompendiums();

        assert.ok(Array.isArray(results), 'Should return an array');
        assert.equal(results.length, 1, 'Should have one rules compendium');
        assert.equal(results[0].documentName, 'Item', 'Should have Item document type');
        assert.ok(results[0].entries.length > 0, 'Should have parsed entries');

        teardown();
    });

    // Test: parseRulesCompendiums returns empty when no packs available
    runner.test('parseRulesCompendiums returns empty when game.packs is undefined', async () => {
        await setup();

        game.packs = undefined;

        const parser = new CompendiumParser();
        const results = await parser.parseRulesCompendiums();

        assert.ok(Array.isArray(results), 'Should return an array');
        assert.equal(results.length, 0, 'Should return empty array when packs not available');

        teardown();
    });

    // Test: Caching works correctly
    runner.test('parsed compendiums are cached', async () => {
        await setup();

        const journalPack = createTestJournalCompendium();
        game.packs.add(journalPack);

        const parser = new CompendiumParser();
        await parser.parseJournalCompendiums();

        assert.ok(parser.isCached('world.adventure-journal'), 'Compendium should be cached after parsing');

        teardown();
    });

    // Test: isCached returns correct values
    runner.test('isCached returns correct boolean values', async () => {
        await setup();

        const journalPack = createTestJournalCompendium();
        game.packs.add(journalPack);

        const parser = new CompendiumParser();

        assert.equal(parser.isCached('world.adventure-journal'), false, 'Should return false before parsing');

        await parser.parseJournalCompendiums();

        assert.equal(parser.isCached('world.adventure-journal'), true, 'Should return true after parsing');
        assert.equal(parser.isCached('nonexistent'), false, 'Should return false for non-existent pack');

        teardown();
    });

    // Test: clearCache removes specific compendium
    runner.test('clearCache removes specific compendium from cache', async () => {
        await setup();

        const journalPack = createTestJournalCompendium();
        game.packs.add(journalPack);

        const parser = new CompendiumParser();
        await parser.parseJournalCompendiums();

        assert.ok(parser.isCached('world.adventure-journal'), 'Should be cached');

        parser.clearCache('world.adventure-journal');

        assert.ok(!parser.isCached('world.adventure-journal'), 'Should not be cached after clear');

        teardown();
    });

    // Test: clearAllCache removes all cached content
    runner.test('clearAllCache removes all cached content', async () => {
        await setup();

        const journalPack = createTestJournalCompendium();
        const itemPack = createTestItemCompendium();
        game.packs.add(journalPack);
        game.packs.add(itemPack);

        const parser = new CompendiumParser();
        await parser.parseJournalCompendiums();
        await parser.parseRulesCompendiums();

        assert.ok(parser.isCached('world.adventure-journal'), 'Journal should be cached');
        assert.ok(parser.isCached('world.items'), 'Items should be cached');

        parser.clearAllCache();

        assert.ok(!parser.isCached('world.adventure-journal'), 'Journal should not be cached after clearAll');
        assert.ok(!parser.isCached('world.items'), 'Items should not be cached after clearAll');
        assert.equal(parser._journalCompendiums.length, 0, '_journalCompendiums should be empty');
        assert.equal(parser._rulesCompendiums.length, 0, '_rulesCompendiums should be empty');

        teardown();
    });

    // Test: getContentForAI returns formatted content
    runner.test('getContentForAI returns formatted content with headers', async () => {
        await setup();

        const journalPack = createTestJournalCompendium();
        game.packs.add(journalPack);

        const parser = new CompendiumParser();
        await parser.parseJournalCompendiums();

        const content = parser.getContentForAI();

        assert.ok(content.includes('# CONTENUTO COMPENDI'), 'Should have main header');
        assert.ok(content.includes('## Compendio:'), 'Should have compendium header');
        assert.ok(content.includes('Diario Avventura'), 'Should include compendium name');
        assert.ok(content.includes('La Grande Avventura'), 'Should include entry name');

        teardown();
    });

    // Test: getContentForAI returns empty for no compendiums
    runner.test('getContentForAI returns empty string when no compendiums parsed', async () => {
        await setup();

        const parser = new CompendiumParser();
        const content = parser.getContentForAI();

        assert.equal(content, '', 'Should return empty string when no compendiums');

        teardown();
    });

    // Test: getContentForAI respects maxLength
    runner.test('getContentForAI respects maxLength parameter', async () => {
        await setup();

        const journalPack = createTestJournalCompendium();
        game.packs.add(journalPack);

        const parser = new CompendiumParser();
        await parser.parseJournalCompendiums();

        const content = parser.getContentForAI(100);

        // Should be truncated (with some buffer for truncation message)
        assert.ok(content.length <= 200, 'Content should be truncated');
        assert.ok(content.includes('troncato'), 'Should include truncation notice');

        teardown();
    });

    // Test: getJournalContentForAI returns journal-specific content
    runner.test('getJournalContentForAI returns journal-specific formatted content', async () => {
        await setup();

        const journalPack = createTestJournalCompendium();
        game.packs.add(journalPack);

        const parser = new CompendiumParser();
        await parser.parseJournalCompendiums();

        const content = parser.getJournalContentForAI();

        assert.ok(content.includes('CONTENUTO AVVENTURA'), 'Should have adventure header');
        assert.ok(content.includes('Diario Avventura'), 'Should include journal compendium');

        teardown();
    });

    // Test: getRulesContentForAI returns rules-specific content
    runner.test('getRulesContentForAI returns rules-specific formatted content', async () => {
        await setup();

        const itemPack = createTestItemCompendium();
        game.packs.add(itemPack);

        const parser = new CompendiumParser();
        await parser.parseRulesCompendiums();

        const content = parser.getRulesContentForAI();

        assert.ok(content.includes('REGOLE E RIFERIMENTI'), 'Should have rules header');
        assert.ok(content.includes('Oggetti'), 'Should include items compendium');

        teardown();
    });

    // Test: search finds matching entries
    runner.test('search finds entries matching query', async () => {
        await setup();

        const journalPack = createTestJournalCompendium();
        game.packs.add(journalPack);

        const parser = new CompendiumParser();
        await parser.parseJournalCompendiums();

        const results = parser.search('avventura');

        assert.ok(Array.isArray(results), 'Should return an array');
        assert.ok(results.length > 0, 'Should find matching entries');
        assert.ok(results[0].entry, 'Results should have entry property');
        assert.ok(results[0].compendium, 'Results should have compendium property');
        assert.ok(typeof results[0].score === 'number', 'Results should have score property');

        teardown();
    });

    // Test: search returns empty for no matches
    runner.test('search returns empty array for no matches', async () => {
        await setup();

        const journalPack = createTestJournalCompendium();
        game.packs.add(journalPack);

        const parser = new CompendiumParser();
        await parser.parseJournalCompendiums();

        const results = parser.search('xyznonexistent');

        assert.ok(Array.isArray(results), 'Should return an array');
        assert.equal(results.length, 0, 'Should return empty array for no matches');

        teardown();
    });

    // Test: search handles empty and invalid input
    runner.test('search handles empty and invalid input gracefully', async () => {
        await setup();

        const parser = new CompendiumParser();

        assert.deepEqual(parser.search(''), [], 'Empty string should return empty array');
        assert.deepEqual(parser.search(null), [], 'Null should return empty array');
        assert.deepEqual(parser.search(undefined), [], 'Undefined should return empty array');
        assert.deepEqual(parser.search('  '), [], 'Whitespace only should return empty array');
        assert.deepEqual(parser.search('a'), [], 'Too short query should return empty array');

        teardown();
    });

    // Test: search results are sorted by score
    runner.test('search results are sorted by score (highest first)', async () => {
        await setup();

        const journalPack = createTestJournalCompendium();
        game.packs.add(journalPack);

        const parser = new CompendiumParser();
        await parser.parseJournalCompendiums();

        const results = parser.search('avventura');

        if (results.length > 1) {
            for (let i = 1; i < results.length; i++) {
                assert.ok(
                    results[i - 1].score >= results[i].score,
                    'Results should be sorted by score descending'
                );
            }
        }

        teardown();
    });

    // Test: searchByType filters by document type
    runner.test('searchByType filters results by document type', async () => {
        await setup();

        const journalPack = createTestJournalCompendium();
        const itemPack = createTestItemCompendium();
        game.packs.add(journalPack);
        game.packs.add(itemPack);

        const parser = new CompendiumParser();
        await parser.parseJournalCompendiums();
        await parser.parseRulesCompendiums();

        // Search for something that appears in both
        const itemResults = parser.searchByType('Spada', 'Item');

        for (const result of itemResults) {
            assert.equal(result.entry.type, 'Item', 'All results should be of type Item');
        }

        teardown();
    });

    // Test: getEntry retrieves specific entry
    runner.test('getEntry retrieves specific entry by ID', async () => {
        await setup();

        const journalPack = createTestJournalCompendium();
        game.packs.add(journalPack);

        const parser = new CompendiumParser();
        await parser.parseJournalCompendiums();

        const entry = parser.getEntry('world.adventure-journal', 'doc1');

        assert.ok(entry !== null, 'Should find the entry');
        assert.equal(entry.id, 'doc1', 'Entry ID should match');
        assert.equal(entry.name, 'La Grande Avventura', 'Entry name should match');

        teardown();
    });

    // Test: getEntry returns null for non-existent entry
    runner.test('getEntry returns null for non-existent entry', async () => {
        await setup();

        const journalPack = createTestJournalCompendium();
        game.packs.add(journalPack);

        const parser = new CompendiumParser();
        await parser.parseJournalCompendiums();

        const entry1 = parser.getEntry('world.adventure-journal', 'nonexistent');
        const entry2 = parser.getEntry('nonexistent-pack', 'doc1');

        assert.equal(entry1, null, 'Should return null for non-existent entry ID');
        assert.equal(entry2, null, 'Should return null for non-existent pack ID');

        teardown();
    });

    // Test: getEntries returns all entries from a pack
    runner.test('getEntries returns all entries from a cached pack', async () => {
        await setup();

        const journalPack = createTestJournalCompendium();
        game.packs.add(journalPack);

        const parser = new CompendiumParser();
        await parser.parseJournalCompendiums();

        const entries = parser.getEntries('world.adventure-journal');

        assert.ok(Array.isArray(entries), 'Should return an array');
        assert.equal(entries.length, 2, 'Should have two entries');

        teardown();
    });

    // Test: getEntries returns empty array for uncached pack
    runner.test('getEntries returns empty array for uncached pack', async () => {
        await setup();

        const parser = new CompendiumParser();
        const entries = parser.getEntries('nonexistent');

        assert.ok(Array.isArray(entries), 'Should return an array');
        assert.equal(entries.length, 0, 'Should return empty array');

        teardown();
    });

    // Test: listAvailablePacks lists all packs
    runner.test('listAvailablePacks returns list of all compendium packs', async () => {
        await setup();

        const journalPack = createTestJournalCompendium();
        const itemPack = createTestItemCompendium();
        game.packs.add(journalPack);
        game.packs.add(itemPack);

        const parser = new CompendiumParser();
        const packs = parser.listAvailablePacks();

        assert.ok(Array.isArray(packs), 'Should return an array');
        assert.equal(packs.length, 2, 'Should list two packs');
        assert.ok(packs[0].id, 'Pack should have id');
        assert.ok(packs[0].name, 'Pack should have name');
        assert.ok(packs[0].type, 'Pack should have type');

        teardown();
    });

    // Test: listAvailablePacks returns empty when packs unavailable
    runner.test('listAvailablePacks returns empty when game.packs is undefined', async () => {
        await setup();

        game.packs = undefined;

        const parser = new CompendiumParser();
        const packs = parser.listAvailablePacks();

        assert.ok(Array.isArray(packs), 'Should return an array');
        assert.equal(packs.length, 0, 'Should return empty array');

        teardown();
    });

    // Test: getCacheStats returns correct statistics
    runner.test('getCacheStats returns correct statistics', async () => {
        await setup();

        const journalPack = createTestJournalCompendium();
        const itemPack = createTestItemCompendium();
        game.packs.add(journalPack);
        game.packs.add(itemPack);

        const parser = new CompendiumParser();

        // Before parsing
        let stats = parser.getCacheStats();
        assert.equal(stats.cachedCompendiums, 0, 'Should have no cached compendiums initially');
        assert.equal(stats.totalEntries, 0, 'Should have no entries initially');

        // After parsing
        await parser.parseJournalCompendiums();
        await parser.parseRulesCompendiums();
        stats = parser.getCacheStats();

        assert.equal(stats.cachedCompendiums, 2, 'Should have two cached compendiums');
        assert.equal(stats.journalCompendiums, 1, 'Should have one journal compendium');
        assert.equal(stats.rulesCompendiums, 1, 'Should have one rules compendium');
        assert.ok(stats.totalEntries > 0, 'Should have entries');
        assert.ok(stats.totalCharacters > 0, 'Should have characters');
        assert.ok(stats.indexedKeywords > 0, 'Should have indexed keywords');

        teardown();
    });

    // Test: getTopicContent returns formatted content for a topic
    runner.test('getTopicContent returns formatted content for a topic', async () => {
        await setup();

        const journalPack = createTestJournalCompendium();
        game.packs.add(journalPack);

        const parser = new CompendiumParser();
        await parser.parseJournalCompendiums();

        const content = parser.getTopicContent('avventura');

        assert.ok(content.includes('# Informazioni su:'), 'Should have topic header');
        assert.ok(content.includes('avventura'), 'Should include topic name');
        assert.ok(content.includes('[Fonte:'), 'Should include source citations');

        teardown();
    });

    // Test: getTopicContent returns empty for no matches
    runner.test('getTopicContent returns empty string when no results', async () => {
        await setup();

        const parser = new CompendiumParser();
        const content = parser.getTopicContent('xyznonexistent');

        assert.equal(content, '', 'Should return empty string when no results');

        teardown();
    });

    // Test: getTopicContent respects maxResults
    runner.test('getTopicContent respects maxResults parameter', async () => {
        await setup();

        const journalPack = createTestJournalCompendium();
        game.packs.add(journalPack);

        const parser = new CompendiumParser();
        await parser.parseJournalCompendiums();

        const content1 = parser.getTopicContent('avventura', 1);
        const content5 = parser.getTopicContent('avventura', 5);

        // Content with maxResults=1 should be shorter or equal
        assert.ok(content1.length <= content5.length, 'Content with maxResults=1 should not be longer than maxResults=5');

        teardown();
    });

    // Test: Entries are sorted alphabetically by name
    runner.test('parsed entries are sorted alphabetically by name', async () => {
        await setup();

        const journalPack = createTestJournalCompendium();
        game.packs.add(journalPack);

        const parser = new CompendiumParser();
        await parser.parseJournalCompendiums();

        const entries = parser.getEntries('world.adventure-journal');

        for (let i = 1; i < entries.length; i++) {
            assert.ok(
                entries[i - 1].name.localeCompare(entries[i].name) <= 0,
                'Entries should be sorted alphabetically'
            );
        }

        teardown();
    });

    // Test: Async loading - multiple compendiums can be parsed concurrently
    runner.test('parseJournalCompendiums handles multiple packs asynchronously', async () => {
        await setup();

        // Create multiple journal packs
        const pack1 = new MockCompendiumPack(
            'world.journal1',
            'Journal 1',
            'JournalEntry',
            [
                new MockCompendiumDocument('d1', 'Entry 1', 'JournalEntry', {
                    pages: [new MockCompendiumJournalPage('p1', 'Page 1', 'text', '<p>Content 1</p>')]
                })
            ]
        );

        const pack2 = new MockCompendiumPack(
            'world.journal2',
            'Journal 2',
            'JournalEntry',
            [
                new MockCompendiumDocument('d2', 'Entry 2', 'JournalEntry', {
                    pages: [new MockCompendiumJournalPage('p2', 'Page 2', 'text', '<p>Content 2</p>')]
                })
            ]
        );

        game.packs.add(pack1);
        game.packs.add(pack2);

        const parser = new CompendiumParser();
        const results = await parser.parseJournalCompendiums();

        assert.equal(results.length, 2, 'Should parse both journal packs');
        assert.ok(parser.isCached('world.journal1'), 'Pack 1 should be cached');
        assert.ok(parser.isCached('world.journal2'), 'Pack 2 should be cached');

        teardown();
    });

    // Test: Error handling during document parsing
    runner.test('parseJournalCompendiums handles document parsing errors gracefully', async () => {
        await setup();

        // Create a pack with a document that will fail to parse
        const pack = new MockCompendiumPack(
            'world.error-test',
            'Error Test',
            'JournalEntry',
            []
        );

        // Override getDocument to simulate an error
        const originalGetDocument = pack.getDocument.bind(pack);
        pack.getDocument = async (id) => {
            if (id === 'error-doc') {
                throw new Error('Simulated parsing error');
            }
            return originalGetDocument(id);
        };

        // Add a valid document and an error-causing document to index
        pack._index.push({ _id: 'valid-doc', name: 'Valid Document' });
        pack._index.push({ _id: 'error-doc', name: 'Error Document' });
        pack._documents.set('valid-doc', new MockCompendiumDocument('valid-doc', 'Valid Document', 'JournalEntry', {
            pages: [new MockCompendiumJournalPage('p1', 'Page', 'text', '<p>Valid content</p>')]
        }));

        // Force index size to return correct value
        pack.getIndex = async () => ({
            size: pack._index.length,
            [Symbol.iterator]: () => pack._index[Symbol.iterator]()
        });

        game.packs.add(pack);

        const parser = new CompendiumParser();

        // Should not throw, but log warning
        await assert.notThrows(
            () => parser.parseJournalCompendiums(),
            'Should not throw on document parsing error'
        );

        teardown();
    });

    // Test: Items with no description are still parsed (using name only)
    runner.test('items with no description are parsed with name only', async () => {
        await setup();

        const itemNoDesc = new MockCompendiumDocument('item-no-desc', 'Simple Item', 'Item', {
            system: {}
        });
        itemNoDesc.type = 'equipment';

        const pack = new MockCompendiumPack(
            'world.simple-items',
            'Simple Items',
            'Item',
            [itemNoDesc]
        );
        game.packs.add(pack);

        const parser = new CompendiumParser();
        await parser.parseRulesCompendiums();

        const entries = parser.getEntries('world.simple-items');

        assert.equal(entries.length, 1, 'Should have one entry');
        assert.ok(entries[0].text.includes('Simple Item'), 'Entry should include item name');

        teardown();
    });

    // Test: Keyword index is built correctly
    runner.test('keyword index is built during parsing', async () => {
        await setup();

        const journalPack = createTestJournalCompendium();
        game.packs.add(journalPack);

        const parser = new CompendiumParser();
        await parser.parseJournalCompendiums();

        const stats = parser.getCacheStats();

        assert.ok(stats.indexedKeywords > 0, 'Should have indexed keywords');

        teardown();
    });

    // Test: clearCache also clears keyword index for that pack
    runner.test('clearCache removes keyword index entries for the pack', async () => {
        await setup();

        const journalPack = createTestJournalCompendium();
        game.packs.add(journalPack);

        const parser = new CompendiumParser();
        await parser.parseJournalCompendiums();

        const statsBefore = parser.getCacheStats();
        parser.clearCache('world.adventure-journal');
        const statsAfter = parser.getCacheStats();

        assert.ok(
            statsAfter.indexedKeywords < statsBefore.indexedKeywords,
            'Keyword index entries should be removed'
        );

        teardown();
    });

    // Run all tests
    return runner.run();
}

// Export for direct execution
if (
    typeof process !== 'undefined' &&
    process.argv &&
    process.argv[1]?.includes('compendium-parser.test')
) {
    runTests().then((results) => {
        process.exit(results.failed > 0 ? 1 : 0);
    });
}
