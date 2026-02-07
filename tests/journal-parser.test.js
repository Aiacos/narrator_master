/**
 * Unit Tests for JournalParser
 * Tests journal parsing, HTML stripping, caching, and content extraction
 * @module tests/journal-parser
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
 * Creates test journal data
 */
function createTestJournal() {
    const pages = [
        new MockJournalPage('page1', 'Introduzione', 'text', '<p>Benvenuti nell\'avventura!</p>', 1),
        new MockJournalPage('page2', 'Capitolo 1', 'text', '<h1>Il Viaggio</h1><p>I nostri eroi partono.</p>', 2),
        new MockJournalPage('page3', 'Mappa', 'image', '', 3), // Non-text page
        new MockJournalPage('page4', 'Capitolo 2', 'text', '<p>La <strong>battaglia</strong> inizia.</p>', 4)
    ];

    return new MockJournalEntry('journal1', 'Avventura Test', pages);
}

/**
 * Run all JournalParser tests
 */
export async function runTests() {
    const runner = new TestRunner('JournalParser Tests');

    // Test: Constructor creates empty caches
    runner.test('constructor initializes empty caches', async () => {
        await setup();

        const parser = new JournalParser();

        assert.ok(parser._cachedContent instanceof Map, 'cachedContent should be a Map');
        assert.ok(parser._keywordIndex instanceof Map, 'keywordIndex should be a Map');
        assert.equal(parser._cachedContent.size, 0, 'cachedContent should be empty');
        assert.equal(parser._keywordIndex.size, 0, 'keywordIndex should be empty');

        teardown();
    });

    // Test: stripHtml removes HTML tags
    runner.test('stripHtml removes HTML tags while preserving text', async () => {
        await setup();

        const parser = new JournalParser();

        const result = parser.stripHtml('<p>Hello <strong>World</strong>!</p>');
        assert.equal(result, 'Hello World !', 'HTML tags should be stripped');

        teardown();
    });

    // Test: stripHtml handles empty input
    runner.test('stripHtml handles empty and null input', async () => {
        await setup();

        const parser = new JournalParser();

        assert.equal(parser.stripHtml(''), '', 'Empty string should return empty');
        assert.equal(parser.stripHtml(null), '', 'Null should return empty');
        assert.equal(parser.stripHtml(undefined), '', 'Undefined should return empty');
        assert.equal(parser.stripHtml(123), '', 'Non-string should return empty');

        teardown();
    });

    // Test: stripHtml normalizes whitespace
    runner.test('stripHtml normalizes whitespace', async () => {
        await setup();

        const parser = new JournalParser();

        const result = parser.stripHtml('<p>Multiple   spaces</p>  <p>and    tabs</p>');
        // After stripping, multiple spaces should be normalized to single spaces
        assert.ok(!result.includes('  '), 'Multiple spaces should be normalized');

        teardown();
    });

    // XSS Security Tests
    // Test: stripHtml safely handles script tags
    runner.test('stripHtml safely strips script tags without execution', async () => {
        await setup();

        const parser = new JournalParser();

        const result = parser.stripHtml('<p>Hello</p><script>alert(1)</script><p>World</p>');

        assert.equal(result, 'Hello World', 'Script tags should be completely removed');
        assert.ok(!result.includes('script'), 'Result should not contain script text');
        assert.ok(!result.includes('alert'), 'Result should not contain script content');

        teardown();
    });

    // Test: stripHtml safely handles img with onerror
    runner.test('stripHtml safely strips img onerror handlers', async () => {
        await setup();

        const parser = new JournalParser();

        const result = parser.stripHtml('<p>Image test</p><img src=x onerror=alert(1)>');

        assert.equal(result, 'Image test', 'Image with onerror should be stripped');
        assert.ok(!result.includes('onerror'), 'Result should not contain onerror');
        assert.ok(!result.includes('alert'), 'Result should not contain alert');

        teardown();
    });

    // Test: stripHtml safely handles SVG with onload
    runner.test('stripHtml safely strips SVG onload handlers', async () => {
        await setup();

        const parser = new JournalParser();

        const result = parser.stripHtml('<p>SVG test</p><svg onload=alert(1)></svg>');

        assert.equal(result, 'SVG test', 'SVG with onload should be stripped');
        assert.ok(!result.includes('onload'), 'Result should not contain onload');
        assert.ok(!result.includes('alert'), 'Result should not contain alert');

        teardown();
    });

    // Test: stripHtml safely handles inline event handlers
    runner.test('stripHtml safely strips inline event handlers', async () => {
        await setup();

        const parser = new JournalParser();

        const xssPayloads = [
            '<div onclick=alert(1)>Click me</div>',
            '<body onload=alert(1)>Content</body>',
            '<input onfocus=alert(1)>',
            '<button onmouseover=alert(1)>Hover</button>'
        ];

        for (const payload of xssPayloads) {
            const result = parser.stripHtml(payload);
            assert.ok(!result.includes('alert'), `Should not contain alert for payload: ${payload}`);
            assert.ok(!result.includes('onclick'), 'Should not contain onclick');
            assert.ok(!result.includes('onload'), 'Should not contain onload');
            assert.ok(!result.includes('onfocus'), 'Should not contain onfocus');
            assert.ok(!result.includes('onmouseover'), 'Should not contain onmouseover');
        }

        teardown();
    });

    // Test: stripHtml safely handles javascript: URLs
    runner.test('stripHtml safely strips javascript: protocol URLs', async () => {
        await setup();

        const parser = new JournalParser();

        const result = parser.stripHtml('<a href="javascript:alert(1)">Click</a>');

        assert.equal(result, 'Click', 'Link text should be preserved');
        assert.ok(!result.includes('javascript:'), 'Result should not contain javascript: protocol');
        assert.ok(!result.includes('alert'), 'Result should not contain alert');

        teardown();
    });

    // Test: stripHtml safely handles data: URLs with scripts
    runner.test('stripHtml safely strips data: URLs with scripts', async () => {
        await setup();

        const parser = new JournalParser();

        const result = parser.stripHtml('<a href="data:text/html,<script>alert(1)</script>">Link</a>');

        assert.equal(result, 'Link', 'Link text should be preserved');
        assert.ok(!result.includes('data:'), 'Result should not contain data: protocol');
        assert.ok(!result.includes('alert'), 'Result should not contain alert');

        teardown();
    });

    // Test: stripHtml safely handles iframe injection
    runner.test('stripHtml safely strips iframe tags', async () => {
        await setup();

        const parser = new JournalParser();

        const result = parser.stripHtml('<p>Before</p><iframe src="javascript:alert(1)"></iframe><p>After</p>');

        assert.equal(result, 'Before After', 'Iframe should be completely removed');
        assert.ok(!result.includes('iframe'), 'Result should not contain iframe');
        assert.ok(!result.includes('alert'), 'Result should not contain alert');

        teardown();
    });

    // Test: stripHtml safely handles object and embed tags
    runner.test('stripHtml safely strips object and embed tags', async () => {
        await setup();

        const parser = new JournalParser();

        const result1 = parser.stripHtml('<object data="javascript:alert(1)"></object>');
        const result2 = parser.stripHtml('<embed src="javascript:alert(1)">');

        assert.equal(result1, '', 'Object tag should be removed');
        assert.equal(result2, '', 'Embed tag should be removed');
        assert.ok(!result1.includes('alert'), 'Result should not contain alert');
        assert.ok(!result2.includes('alert'), 'Result should not contain alert');

        teardown();
    });

    // Test: stripHtml safely handles mixed XSS attacks
    runner.test('stripHtml safely handles complex mixed XSS payloads', async () => {
        await setup();

        const parser = new JournalParser();

        const complexPayload = `
            <p>Legitimate content</p>
            <script>alert('XSS1')</script>
            <img src=x onerror=alert('XSS2')>
            <svg onload=alert('XSS3')></svg>
            <a href="javascript:alert('XSS4')">Link</a>
            <div onclick=alert('XSS5')>Click</div>
            <p>More legitimate content</p>
        `;

        const result = parser.stripHtml(complexPayload);

        assert.ok(result.includes('Legitimate content'), 'Should preserve legitimate content');
        assert.ok(result.includes('More legitimate content'), 'Should preserve all legitimate content');
        assert.ok(result.includes('Link'), 'Should preserve link text');
        assert.ok(result.includes('Click'), 'Should preserve div text');
        assert.ok(!result.includes('alert'), 'Should not contain any alert calls');
        assert.ok(!result.includes('script'), 'Should not contain script tags');
        assert.ok(!result.includes('onerror'), 'Should not contain onerror handlers');
        assert.ok(!result.includes('onload'), 'Should not contain onload handlers');
        assert.ok(!result.includes('onclick'), 'Should not contain onclick handlers');
        assert.ok(!result.includes('javascript:'), 'Should not contain javascript: protocol');

        teardown();
    });

    // Test: parseJournal throws error for invalid journal ID
    runner.test('parseJournal throws error for invalid journal ID', async () => {
        await setup();

        const parser = new JournalParser();

        await assert.throws(
            () => parser.parseJournal(''),
            'Should throw for empty journal ID'
        );

        await assert.throws(
            () => parser.parseJournal(null),
            'Should throw for null journal ID'
        );

        teardown();
    });

    // Test: parseJournal throws error when journal not found
    runner.test('parseJournal throws error when journal not found', async () => {
        await setup();

        const parser = new JournalParser();

        await assert.throws(
            () => parser.parseJournal('nonexistent'),
            'Should throw for non-existent journal'
        );

        teardown();
    });

    // Test: parseJournal successfully parses a journal
    runner.test('parseJournal successfully parses journal with multiple pages', async () => {
        await setup();

        // Add test journal to mock game
        const testJournal = createTestJournal();
        game.journal.add(testJournal);

        const parser = new JournalParser();
        const result = await parser.parseJournal('journal1');

        assert.equal(result.id, 'journal1', 'Journal ID should match');
        assert.equal(result.name, 'Avventura Test', 'Journal name should match');
        assert.equal(result.pages.length, 3, 'Should have 3 text pages (excluding image page)');
        assert.ok(result.parsedAt instanceof Date, 'Should have parsedAt timestamp');

        teardown();
    });

    // Test: parseJournal excludes non-text pages
    runner.test('parseJournal excludes non-text pages', async () => {
        await setup();

        const testJournal = createTestJournal();
        game.journal.add(testJournal);

        const parser = new JournalParser();
        const result = await parser.parseJournal('journal1');

        // Original journal has 4 pages, but one is image type
        const pageTypes = result.pages.map(p => p.type);
        assert.ok(!pageTypes.includes('image'), 'Image pages should be excluded');
        assert.ok(pageTypes.every(t => t === 'text'), 'All pages should be text type');

        teardown();
    });

    // Test: parseJournal caches results
    runner.test('parseJournal caches parsed results', async () => {
        await setup();

        const testJournal = createTestJournal();
        game.journal.add(testJournal);

        const parser = new JournalParser();

        // First parse
        const result1 = await parser.parseJournal('journal1');

        // Should be cached now
        assert.ok(parser.isCached('journal1'), 'Journal should be cached after parsing');

        // Second parse should return cached version
        const result2 = await parser.parseJournal('journal1');
        assert.equal(result1.parsedAt.getTime(), result2.parsedAt.getTime(), 'Should return same cached result');

        teardown();
    });

    // Test: clearCache removes cached journal
    runner.test('clearCache removes cached journal', async () => {
        await setup();

        const testJournal = createTestJournal();
        game.journal.add(testJournal);

        const parser = new JournalParser();
        await parser.parseJournal('journal1');

        assert.ok(parser.isCached('journal1'), 'Should be cached');

        parser.clearCache('journal1');

        assert.ok(!parser.isCached('journal1'), 'Should not be cached after clear');

        teardown();
    });

    // Test: clearAllCache removes all cached journals
    runner.test('clearAllCache removes all cached journals', async () => {
        await setup();

        const testJournal = createTestJournal();
        game.journal.add(testJournal);

        const testJournal2 = new MockJournalEntry('journal2', 'Second Journal', [
            new MockJournalPage('p1', 'Page 1', 'text', '<p>Content</p>', 1)
        ]);
        game.journal.add(testJournal2);

        const parser = new JournalParser();
        await parser.parseJournal('journal1');
        await parser.parseJournal('journal2');

        assert.ok(parser.isCached('journal1'), 'Journal 1 should be cached');
        assert.ok(parser.isCached('journal2'), 'Journal 2 should be cached');

        parser.clearAllCache();

        assert.ok(!parser.isCached('journal1'), 'Journal 1 should not be cached');
        assert.ok(!parser.isCached('journal2'), 'Journal 2 should not be cached');

        teardown();
    });

    // Test: getFullText returns combined text
    runner.test('getFullText returns combined text from all pages', async () => {
        await setup();

        const testJournal = createTestJournal();
        game.journal.add(testJournal);

        const parser = new JournalParser();
        await parser.parseJournal('journal1');

        const fullText = parser.getFullText('journal1');

        assert.ok(fullText.includes('Introduzione'), 'Should include first page title');
        assert.ok(fullText.includes('Capitolo 1'), 'Should include second page title');
        assert.ok(fullText.includes('Capitolo 2'), 'Should include third page title');

        teardown();
    });

    // Test: getFullText returns empty string for uncached journal
    runner.test('getFullText returns empty string for uncached journal', async () => {
        await setup();

        const parser = new JournalParser();
        const result = parser.getFullText('uncached');

        assert.equal(result, '', 'Should return empty string for uncached journal');

        teardown();
    });

    // Test: getContentForAI formats content appropriately
    runner.test('getContentForAI formats content with adventure title', async () => {
        await setup();

        const testJournal = createTestJournal();
        game.journal.add(testJournal);

        const parser = new JournalParser();
        await parser.parseJournal('journal1');

        const content = parser.getContentForAI('journal1');

        assert.ok(content.startsWith('# Avventura:'), 'Should start with adventure header');
        assert.ok(content.includes('Avventura Test'), 'Should include journal name');
        assert.ok(content.includes('## Introduzione'), 'Should include page headers');

        teardown();
    });

    // Test: getContentForAI respects maxLength
    runner.test('getContentForAI truncates content at maxLength', async () => {
        await setup();

        const testJournal = createTestJournal();
        game.journal.add(testJournal);

        const parser = new JournalParser();
        await parser.parseJournal('journal1');

        // Use very small maxLength
        const content = parser.getContentForAI('journal1', 50);

        assert.ok(content.length <= 100, 'Content should be truncated'); // Some buffer for truncation message
        assert.ok(content.includes('troncato'), 'Should include truncation notice');

        teardown();
    });

    // Test: getSummary returns journal summary
    runner.test('getSummary returns correct journal summary', async () => {
        await setup();

        const testJournal = createTestJournal();
        game.journal.add(testJournal);

        const parser = new JournalParser();
        await parser.parseJournal('journal1');

        const summary = parser.getSummary('journal1');

        assert.ok(summary !== null, 'Summary should not be null');
        assert.equal(summary.id, 'journal1', 'Should have correct ID');
        assert.equal(summary.name, 'Avventura Test', 'Should have correct name');
        assert.equal(summary.pageCount, 3, 'Should have correct page count');
        assert.ok(Array.isArray(summary.pageNames), 'Should have page names array');

        teardown();
    });

    // Test: getSummary returns null for uncached journal
    runner.test('getSummary returns null for uncached journal', async () => {
        await setup();

        const parser = new JournalParser();
        const summary = parser.getSummary('uncached');

        assert.equal(summary, null, 'Should return null for uncached journal');

        teardown();
    });

    // Test: getPage returns specific page
    runner.test('getPage returns specific page by ID', async () => {
        await setup();

        const testJournal = createTestJournal();
        game.journal.add(testJournal);

        const parser = new JournalParser();
        await parser.parseJournal('journal1');

        const page = parser.getPage('journal1', 'page1');

        assert.ok(page !== null, 'Page should be found');
        assert.equal(page.id, 'page1', 'Page ID should match');
        assert.equal(page.name, 'Introduzione', 'Page name should match');

        teardown();
    });

    // Test: getPage returns null for non-existent page
    runner.test('getPage returns null for non-existent page', async () => {
        await setup();

        const testJournal = createTestJournal();
        game.journal.add(testJournal);

        const parser = new JournalParser();
        await parser.parseJournal('journal1');

        const page = parser.getPage('journal1', 'nonexistent');

        assert.equal(page, null, 'Should return null for non-existent page');

        teardown();
    });

    // Test: listAvailableJournals returns journal list
    runner.test('listAvailableJournals returns list of journals', async () => {
        await setup();

        const testJournal = createTestJournal();
        game.journal.add(testJournal);

        const parser = new JournalParser();
        const journals = parser.listAvailableJournals();

        assert.ok(Array.isArray(journals), 'Should return an array');
        assert.equal(journals.length, 1, 'Should have one journal');
        assert.equal(journals[0].id, 'journal1', 'Should have correct ID');
        assert.equal(journals[0].name, 'Avventura Test', 'Should have correct name');

        teardown();
    });

    // Test: searchByKeywords finds matching pages
    runner.test('searchByKeywords finds pages with matching keywords', async () => {
        await setup();

        const testJournal = createTestJournal();
        game.journal.add(testJournal);

        const parser = new JournalParser();
        await parser.parseJournal('journal1');

        const results = parser.searchByKeywords('journal1', ['eroi']);

        assert.ok(Array.isArray(results), 'Should return an array');
        // The word 'eroi' appears in Capitolo 1
        assert.ok(results.length > 0, 'Should find pages with keyword');

        teardown();
    });

    // Test: searchByKeywords returns empty for uncached journal
    runner.test('searchByKeywords returns empty array for uncached journal', async () => {
        await setup();

        const parser = new JournalParser();
        const results = parser.searchByKeywords('uncached', ['keyword']);

        assert.ok(Array.isArray(results), 'Should return an array');
        assert.equal(results.length, 0, 'Should return empty array');

        teardown();
    });

    // Test: refreshJournal clears and re-parses
    runner.test('refreshJournal clears cache and re-parses', async () => {
        await setup();

        const testJournal = createTestJournal();
        game.journal.add(testJournal);

        const parser = new JournalParser();

        const result1 = await parser.parseJournal('journal1');
        const firstParsedAt = result1.parsedAt;

        // Wait a tiny bit to ensure different timestamp
        await new Promise(resolve => setTimeout(resolve, 10));

        const result2 = await parser.refreshJournal('journal1');

        assert.ok(result2.parsedAt.getTime() > firstParsedAt.getTime(), 'Should have newer timestamp after refresh');

        teardown();
    });

    // Test: getCacheStats returns correct statistics
    runner.test('getCacheStats returns correct statistics', async () => {
        await setup();

        const testJournal = createTestJournal();
        game.journal.add(testJournal);

        const parser = new JournalParser();

        // Before parsing
        let stats = parser.getCacheStats();
        assert.equal(stats.cachedJournals, 0, 'Should have no cached journals initially');

        // After parsing
        await parser.parseJournal('journal1');
        stats = parser.getCacheStats();

        assert.equal(stats.cachedJournals, 1, 'Should have one cached journal');
        assert.ok(stats.totalPages > 0, 'Should have pages');
        assert.ok(stats.totalCharacters > 0, 'Should have characters');

        teardown();
    });

    // Test: Pages are sorted by sort order
    runner.test('parsed pages are sorted by sort order', async () => {
        await setup();

        // Create journal with unsorted pages
        const pages = [
            new MockJournalPage('p3', 'Third', 'text', '<p>Third</p>', 30),
            new MockJournalPage('p1', 'First', 'text', '<p>First</p>', 10),
            new MockJournalPage('p2', 'Second', 'text', '<p>Second</p>', 20)
        ];
        const journal = new MockJournalEntry('sorted-test', 'Sorted Test', pages);
        game.journal.add(journal);

        const parser = new JournalParser();
        const result = await parser.parseJournal('sorted-test');

        assert.equal(result.pages[0].name, 'First', 'First page should be sorted first');
        assert.equal(result.pages[1].name, 'Second', 'Second page should be in middle');
        assert.equal(result.pages[2].name, 'Third', 'Third page should be last');

        teardown();
    });

    // Test: isCached returns correct boolean
    runner.test('isCached returns correct boolean values', async () => {
        await setup();

        const testJournal = createTestJournal();
        game.journal.add(testJournal);

        const parser = new JournalParser();

        assert.equal(parser.isCached('journal1'), false, 'Should return false before parsing');

        await parser.parseJournal('journal1');

        assert.equal(parser.isCached('journal1'), true, 'Should return true after parsing');
        assert.equal(parser.isCached('other'), false, 'Should return false for different ID');

        teardown();
    });

    // Run all tests
    return runner.run();
}

// Export for direct execution
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('journal-parser.test')) {
    runTests().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    });
}
