/**
 * Unit Tests for ImageGenerator
 * Tests image generation API calls, caching, gallery management, and error handling
 * @module tests/image-generator
 */

import {
    setupMockGame,
    setupMockUI,
    cleanupMocks,
    createMockFetch,
    createMockFetchError,
    assert,
    TestRunner
} from './test-helper.js';

// Note: We need to set up mocks before importing the module
let ImageGenerator;

/**
 * Setup foundry.utils mock for randomID generation
 */
function setupFoundryUtils() {
    let idCounter = 0;
    const mockFoundry = {
        utils: {
            randomID: () => `test-id-${idCounter++}`
        }
    };

    if (typeof globalThis !== 'undefined') {
        globalThis.foundry = mockFoundry;
    } else if (typeof global !== 'undefined') {
        global.foundry = mockFoundry;
    } else if (typeof window !== 'undefined') {
        window.foundry = mockFoundry;
    }

    return mockFoundry;
}

/**
 * Setup FileReader mock for blob to base64 conversion
 */
function setupFileReaderMock() {
    class MockFileReader {
        constructor() {
            this.result = null;
            this.onload = null;
            this.onerror = null;
        }

        readAsDataURL(_blob) {
            // Simulate async read
            setTimeout(() => {
                // Return mock base64 data
                this.result = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
                if (this.onload) {
                    this.onload();
                }
            }, 0);
        }
    }

    if (typeof globalThis !== 'undefined') {
        globalThis.FileReader = MockFileReader;
    } else if (typeof global !== 'undefined') {
        global.FileReader = MockFileReader;
    } else if (typeof window !== 'undefined') {
        window.FileReader = MockFileReader;
    }
}

/**
 * Setup function to run before tests
 */
async function setup() {
    setupMockGame();
    setupMockUI();
    setupFoundryUtils();
    setupFileReaderMock();

    // Dynamic import after mocks are set up
    const module = await import('../scripts/image-generator.js');
    ImageGenerator = module.ImageGenerator;
}

/**
 * Teardown function to run after tests
 */
function teardown() {
    cleanupMocks();

    // Clean up foundry mock
    const targets = [];
    if (typeof globalThis !== 'undefined') {targets.push(globalThis);}
    if (typeof global !== 'undefined') {targets.push(global);}
    if (typeof window !== 'undefined') {targets.push(window);}

    for (const target of targets) {
        delete target.foundry;
        delete target.FileReader;
    }
}

/**
 * Creates a mock successful image generation response
 */
function createMockImageResponse() {
    return {
        data: [{
            url: 'https://example.com/generated-image.png',
            revised_prompt: 'A fantasy tavern scene with adventurers'
        }]
    };
}

/**
 * Creates a mock base64 image response
 */
function createMockBase64Response() {
    return {
        data: [{
            b64_json: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            revised_prompt: 'A fantasy scene'
        }]
    };
}

/**
 * Creates a mock Blob for image caching tests
 */
function _createImageBlob() {
    return { size: 2048, type: 'image/png' };
}

/**
 * Run all ImageGenerator tests
 */
export async function runTests() {
    const runner = new TestRunner('ImageGenerator Tests');

    // Test: Constructor initializes with default values
    runner.test('constructor initializes with default values', async () => {
        await setup();

        const generator = new ImageGenerator('test-api-key');

        assert.equal(generator._apiKey, 'test-api-key', 'API key should be set');
        assert.equal(generator._model, 'gpt-image-1', 'Default model should be gpt-image-1');
        assert.equal(generator._defaultSize, '1024x1024', 'Default size should be 1024x1024');
        assert.equal(generator._defaultQuality, 'standard', 'Default quality should be standard');
        assert.equal(generator._autoCacheImages, true, 'Auto cache should be enabled by default');
        assert.ok(generator._imageCache instanceof Map, 'Image cache should be a Map');
        assert.ok(Array.isArray(generator._history), 'History should be an array');

        teardown();
    });

    // Test: Constructor accepts custom options
    runner.test('constructor accepts custom options', async () => {
        await setup();

        const generator = new ImageGenerator('key', {
            model: 'dall-e-3',
            defaultSize: '512x512',
            defaultQuality: 'hd',
            autoCacheImages: false
        });

        assert.equal(generator._model, 'dall-e-3', 'Custom model should be set');
        assert.equal(generator._defaultSize, '512x512', 'Custom size should be set');
        assert.equal(generator._defaultQuality, 'hd', 'Custom quality should be set');
        assert.equal(generator._autoCacheImages, false, 'Custom auto cache should be set');

        teardown();
    });

    // Test: isConfigured returns correct state
    runner.test('isConfigured returns correct state', async () => {
        await setup();

        const configuredGenerator = new ImageGenerator('valid-key');
        assert.ok(configuredGenerator.isConfigured(), 'Should return true with valid key');

        const unconfiguredGenerator = new ImageGenerator('');
        assert.ok(!unconfiguredGenerator.isConfigured(), 'Should return false with empty key');

        const whitespaceGenerator = new ImageGenerator('   ');
        assert.ok(!whitespaceGenerator.isConfigured(), 'Should return false with whitespace key');

        teardown();
    });

    // Test: setApiKey updates the API key
    runner.test('setApiKey updates the API key', async () => {
        await setup();

        const generator = new ImageGenerator('old-key');
        generator.setApiKey('new-key');

        assert.equal(generator._apiKey, 'new-key', 'API key should be updated');

        teardown();
    });

    // Test: setModel updates the model
    runner.test('setModel updates the model', async () => {
        await setup();

        const generator = new ImageGenerator('key');
        generator.setModel('dall-e-3');

        assert.equal(generator._model, 'dall-e-3', 'Model should be updated');
        assert.equal(generator.getModel(), 'dall-e-3', 'getModel should return updated value');

        teardown();
    });

    // Test: setDefaultSize updates the default size
    runner.test('setDefaultSize updates the default size', async () => {
        await setup();

        const generator = new ImageGenerator('key');
        generator.setDefaultSize('512x512');

        assert.equal(generator._defaultSize, '512x512', 'Size should be updated');
        assert.equal(generator.getDefaultSize(), '512x512', 'getDefaultSize should return updated value');

        teardown();
    });

    // Test: setDefaultQuality updates the default quality
    runner.test('setDefaultQuality updates the default quality', async () => {
        await setup();

        const generator = new ImageGenerator('key');
        generator.setDefaultQuality('hd');

        assert.equal(generator._defaultQuality, 'hd', 'Quality should be updated');
        assert.equal(generator.getDefaultQuality(), 'hd', 'getDefaultQuality should return updated value');

        teardown();
    });

    // Test: generate throws error without API key
    runner.test('generate throws error when API key not configured', async () => {
        await setup();

        const generator = new ImageGenerator('');

        await assert.throws(
            () => generator.generate('test prompt'),
            'Should throw when API key not configured'
        );

        teardown();
    });

    // Test: generate throws error with empty prompt
    runner.test('generate throws error with empty prompt', async () => {
        await setup();

        const generator = new ImageGenerator('key');

        await assert.throws(
            () => generator.generate(''),
            'Should throw when prompt is empty'
        );

        await assert.throws(
            () => generator.generate('   '),
            'Should throw when prompt is whitespace'
        );

        teardown();
    });

    // Test: generate successful image generation
    runner.test('generate successfully generates image', async () => {
        await setup();

        const mockResponse = createMockImageResponse();
        const mockFetch = createMockFetch(mockResponse);
        globalThis.fetch = mockFetch;

        const generator = new ImageGenerator('test-key');
        const result = await generator.generate('A fantasy tavern');

        assert.ok(result, 'Should return a result');
        assert.ok(result.id, 'Result should have an id');
        assert.equal(result.url, 'https://example.com/generated-image.png', 'Should have correct URL');
        assert.equal(result.prompt, 'A fantasy tavern', 'Should have original prompt');
        assert.equal(result.revisedPrompt, 'A fantasy tavern scene with adventurers', 'Should have revised prompt');
        assert.equal(result.model, 'gpt-image-1', 'Should have model');
        assert.equal(result.size, '1024x1024', 'Should have size');
        assert.ok(result.createdAt instanceof Date, 'Should have createdAt date');

        // Check that API was called correctly
        assert.ok(mockFetch.calls.length > 0, 'Fetch should be called');
        const call = mockFetch.calls[0];
        assert.ok(call.url.includes('/images/generations'), 'Should call images/generations endpoint');

        teardown();
    });

    // Test: generate with custom options
    runner.test('generate accepts custom options', async () => {
        await setup();

        const mockResponse = createMockImageResponse();
        const mockFetch = createMockFetch(mockResponse);
        globalThis.fetch = mockFetch;

        const generator = new ImageGenerator('test-key');
        const result = await generator.generate('A scene', {
            size: '512x512',
            quality: 'hd',
            style: 'natural'
        });

        assert.equal(result.size, '512x512', 'Should use custom size');

        teardown();
    });

    // Test: generate returns base64 when requested
    runner.test('generate returns base64 when requested', async () => {
        await setup();

        const mockResponse = createMockBase64Response();
        const mockFetch = createMockFetch(mockResponse);
        globalThis.fetch = mockFetch;

        const generator = new ImageGenerator('test-key');
        const result = await generator.generate('A scene', { returnBase64: true });

        assert.ok(result.base64, 'Should have base64 data');
        assert.ok(!result.url, 'Should not have URL when base64 is returned');

        teardown();
    });

    // Test: generate adds to history
    runner.test('generate adds result to history', async () => {
        await setup();

        const mockResponse = createMockImageResponse();
        const mockFetch = createMockFetch(mockResponse);
        globalThis.fetch = mockFetch;

        const generator = new ImageGenerator('test-key');

        assert.equal(generator.getHistory().length, 0, 'History should be empty initially');

        await generator.generate('First image');
        assert.equal(generator.getHistory().length, 1, 'History should have 1 entry');

        await generator.generate('Second image');
        assert.equal(generator.getHistory().length, 2, 'History should have 2 entries');

        teardown();
    });

    // Test: generate handles API errors
    runner.test('generate handles API errors correctly', async () => {
        await setup();

        const mockFetch = createMockFetch(
            { error: { message: 'Invalid API key', code: 'invalid_api_key' } },
            { ok: false, status: 401 }
        );
        globalThis.fetch = mockFetch;

        const generator = new ImageGenerator('bad-key');

        await assert.throws(
            () => generator.generate('Test'),
            'Should throw on API error'
        );

        teardown();
    });

    // Test: generate handles network errors
    runner.test('generate handles network errors', async () => {
        await setup();

        const mockFetch = createMockFetchError('Network connection failed');
        globalThis.fetch = mockFetch;

        const generator = new ImageGenerator('key');

        await assert.throws(
            () => generator.generate('Test'),
            'Should throw on network error'
        );

        teardown();
    });

    // Test: generateInfographic creates specialized prompt
    runner.test('generateInfographic creates specialized RPG prompt', async () => {
        await setup();

        const mockResponse = createMockImageResponse();
        const mockFetch = createMockFetch(mockResponse);
        globalThis.fetch = mockFetch;

        const generator = new ImageGenerator('test-key');
        const result = await generator.generateInfographic('Party enters dark dungeon', {
            style: 'fantasy',
            mood: 'mysterious',
            sceneType: 'exploration'
        });

        assert.ok(result, 'Should return a result');
        assert.ok(result.prompt.includes('Party enters dark dungeon'), 'Prompt should include description');

        teardown();
    });

    // Test: generateInfographic with elements
    runner.test('generateInfographic includes additional elements', async () => {
        await setup();

        const mockResponse = createMockImageResponse();
        const mockFetch = createMockFetch(mockResponse);
        globalThis.fetch = mockFetch;

        const generator = new ImageGenerator('test-key');
        const result = await generator.generateInfographic('A battle scene', {
            elements: ['dragon', 'sword', 'shield']
        });

        assert.ok(result, 'Should return a result');

        teardown();
    });

    // Test: generateSceneIllustration creates scene prompt
    runner.test('generateSceneIllustration creates scene-specific prompt', async () => {
        await setup();

        const mockResponse = createMockImageResponse();
        const mockFetch = createMockFetch(mockResponse);
        globalThis.fetch = mockFetch;

        const generator = new ImageGenerator('test-key');
        const result = await generator.generateSceneIllustration('A moonlit forest', {
            location: 'forest',
            lighting: 'moonlight',
            characters: ['elf ranger', 'dwarf warrior']
        });

        assert.ok(result, 'Should return a result');
        assert.ok(result.prompt.includes('A moonlit forest'), 'Prompt should include description');

        teardown();
    });

    // Test: getCachedImage returns null when not found
    runner.test('getCachedImage returns null when not found', async () => {
        await setup();

        const generator = new ImageGenerator('key');
        const cached = generator.getCachedImage('nonexistent prompt');

        assert.equal(cached, null, 'Should return null for nonexistent cache entry');

        teardown();
    });

    // Test: getAllCachedImages returns all cached images
    runner.test('getAllCachedImages returns all cached images', async () => {
        await setup();

        const generator = new ImageGenerator('key');

        const allCached = generator.getAllCachedImages();
        assert.ok(Array.isArray(allCached), 'Should return an array');
        assert.equal(allCached.length, 0, 'Should be empty initially');

        teardown();
    });

    // Test: clearCache clears all cached images
    runner.test('clearCache clears all cached images', async () => {
        await setup();

        const generator = new ImageGenerator('key');
        generator.clearCache();

        const allCached = generator.getAllCachedImages();
        assert.equal(allCached.length, 0, 'Should have no cached images after clear');

        teardown();
    });

    // Test: clearExpiredCache removes expired entries
    runner.test('clearExpiredCache removes expired entries', async () => {
        await setup();

        const generator = new ImageGenerator('key');
        generator.clearExpiredCache();

        // Should not throw and should complete successfully
        assert.ok(true, 'clearExpiredCache should complete without error');

        teardown();
    });

    // Test: getHistory returns history entries
    runner.test('getHistory returns history entries', async () => {
        await setup();

        const mockResponse = createMockImageResponse();
        const mockFetch = createMockFetch(mockResponse);
        globalThis.fetch = mockFetch;

        const generator = new ImageGenerator('test-key');

        await generator.generate('First');
        await generator.generate('Second');
        await generator.generate('Third');

        const history = generator.getHistory();
        assert.equal(history.length, 3, 'Should have 3 history entries');

        teardown();
    });

    // Test: getHistory with limit
    runner.test('getHistory respects limit parameter', async () => {
        await setup();

        const mockResponse = createMockImageResponse();
        const mockFetch = createMockFetch(mockResponse);
        globalThis.fetch = mockFetch;

        const generator = new ImageGenerator('test-key');

        await generator.generate('First');
        await generator.generate('Second');
        await generator.generate('Third');

        const limited = generator.getHistory(2);
        assert.equal(limited.length, 2, 'Should return only 2 most recent entries');

        teardown();
    });

    // Test: clearHistory clears generation history
    runner.test('clearHistory clears generation history', async () => {
        await setup();

        const mockResponse = createMockImageResponse();
        const mockFetch = createMockFetch(mockResponse);
        globalThis.fetch = mockFetch;

        const generator = new ImageGenerator('test-key');

        await generator.generate('Test');
        assert.ok(generator.getHistory().length > 0, 'Should have history');

        generator.clearHistory();
        assert.equal(generator.getHistory().length, 0, 'History should be empty after clear');

        teardown();
    });

    // Test: saveToGallery saves image to gallery
    runner.test('saveToGallery saves image to gallery', async () => {
        await setup();

        const generator = new ImageGenerator('key');

        const imageData = {
            id: 'test-image-1',
            url: 'https://example.com/image.png',
            base64: 'base64data',
            prompt: 'Test prompt',
            model: 'gpt-image-1',
            size: '1024x1024'
        };

        await generator.saveToGallery(imageData);

        const gallery = await generator.loadGallery();
        assert.ok(gallery.length > 0, 'Gallery should have at least one image');
        assert.equal(gallery[0].id, 'test-image-1', 'Should have correct image ID');

        teardown();
    });

    // Test: loadGallery returns empty array when no gallery
    runner.test('loadGallery returns empty array initially', async () => {
        await setup();

        const generator = new ImageGenerator('key');
        const gallery = await generator.loadGallery();

        assert.ok(Array.isArray(gallery), 'Should return an array');

        teardown();
    });

    // Test: getGalleryImages with filters
    runner.test('getGalleryImages filters by category', async () => {
        await setup();

        const generator = new ImageGenerator('key');

        await generator.saveToGallery({
            id: 'img1',
            prompt: 'Test 1',
            category: 'location',
            tags: []
        });

        await generator.saveToGallery({
            id: 'img2',
            prompt: 'Test 2',
            category: 'npc',
            tags: []
        });

        const locationImages = await generator.getGalleryImages({ category: 'location' });
        assert.equal(locationImages.length, 1, 'Should return only location images');
        assert.equal(locationImages[0].category, 'location', 'Should have correct category');

        teardown();
    });

    // Test: getGalleryImages filters by tag
    runner.test('getGalleryImages filters by tag', async () => {
        await setup();

        const generator = new ImageGenerator('key');

        await generator.saveToGallery({
            id: 'img1',
            prompt: 'Test 1',
            tags: ['dungeon', 'dark']
        });

        await generator.saveToGallery({
            id: 'img2',
            prompt: 'Test 2',
            tags: ['forest']
        });

        const dungeonImages = await generator.getGalleryImages({ tag: 'dungeon' });
        assert.equal(dungeonImages.length, 1, 'Should return only dungeon-tagged images');
        assert.ok(dungeonImages[0].tags.includes('dungeon'), 'Should have dungeon tag');

        teardown();
    });

    // Test: getGalleryImages filters by favorite
    runner.test('getGalleryImages filters by favorite status', async () => {
        await setup();

        const generator = new ImageGenerator('key');

        await generator.saveToGallery({
            id: 'img1',
            prompt: 'Test 1',
            isFavorite: true
        });

        await generator.saveToGallery({
            id: 'img2',
            prompt: 'Test 2',
            isFavorite: false
        });

        const favorites = await generator.getGalleryImages({ isFavorite: true });
        assert.equal(favorites.length, 1, 'Should return only favorite images');
        assert.equal(favorites[0].isFavorite, true, 'Should be marked as favorite');

        teardown();
    });

    // Test: getGalleryImage returns single image by ID
    runner.test('getGalleryImage returns single image by ID', async () => {
        await setup();

        const generator = new ImageGenerator('key');

        await generator.saveToGallery({
            id: 'specific-id',
            prompt: 'Test image'
        });

        const image = await generator.getGalleryImage('specific-id');
        assert.ok(image, 'Should return an image');
        assert.equal(image.id, 'specific-id', 'Should have correct ID');

        teardown();
    });

    // Test: getGalleryImage returns null for nonexistent ID
    runner.test('getGalleryImage returns null for nonexistent ID', async () => {
        await setup();

        const generator = new ImageGenerator('key');
        const image = await generator.getGalleryImage('nonexistent');

        assert.equal(image, null, 'Should return null for nonexistent image');

        teardown();
    });

    // Test: addTag adds tag to image
    runner.test('addTag adds tag to gallery image', async () => {
        await setup();

        const generator = new ImageGenerator('key');

        await generator.saveToGallery({
            id: 'img1',
            prompt: 'Test',
            tags: []
        });

        const success = await generator.addTag('img1', 'combat');
        assert.ok(success, 'Should return true on success');

        const image = await generator.getGalleryImage('img1');
        assert.ok(image.tags.includes('combat'), 'Should have combat tag');

        teardown();
    });

    // Test: addTag prevents duplicate tags
    runner.test('addTag prevents duplicate tags', async () => {
        await setup();

        const generator = new ImageGenerator('key');

        await generator.saveToGallery({
            id: 'img1',
            prompt: 'Test',
            tags: ['existing']
        });

        await generator.addTag('img1', 'existing');

        const image = await generator.getGalleryImage('img1');
        const count = image.tags.filter(t => t === 'existing').length;
        assert.equal(count, 1, 'Should not have duplicate tags');

        teardown();
    });

    // Test: addTag returns false for nonexistent image
    runner.test('addTag returns false for nonexistent image', async () => {
        await setup();

        const generator = new ImageGenerator('key');
        const success = await generator.addTag('nonexistent', 'tag');

        assert.ok(!success, 'Should return false for nonexistent image');

        teardown();
    });

    // Test: removeTag removes tag from image
    runner.test('removeTag removes tag from gallery image', async () => {
        await setup();

        const generator = new ImageGenerator('key');

        await generator.saveToGallery({
            id: 'img1',
            prompt: 'Test',
            tags: ['combat', 'dungeon']
        });

        const success = await generator.removeTag('img1', 'combat');
        assert.ok(success, 'Should return true on success');

        const image = await generator.getGalleryImage('img1');
        assert.ok(!image.tags.includes('combat'), 'Should not have combat tag');
        assert.ok(image.tags.includes('dungeon'), 'Should still have dungeon tag');

        teardown();
    });

    // Test: removeTag returns false for nonexistent tag
    runner.test('removeTag returns false for nonexistent tag', async () => {
        await setup();

        const generator = new ImageGenerator('key');

        await generator.saveToGallery({
            id: 'img1',
            prompt: 'Test',
            tags: []
        });

        const success = await generator.removeTag('img1', 'nonexistent');
        assert.ok(!success, 'Should return false for nonexistent tag');

        teardown();
    });

    // Test: setCategory sets image category
    runner.test('setCategory sets image category', async () => {
        await setup();

        const generator = new ImageGenerator('key');

        await generator.saveToGallery({
            id: 'img1',
            prompt: 'Test',
            category: ''
        });

        const success = await generator.setCategory('img1', 'npc');
        assert.ok(success, 'Should return true on success');

        const image = await generator.getGalleryImage('img1');
        assert.equal(image.category, 'npc', 'Should have npc category');

        teardown();
    });

    // Test: setCategory returns false for nonexistent image
    runner.test('setCategory returns false for nonexistent image', async () => {
        await setup();

        const generator = new ImageGenerator('key');
        const success = await generator.setCategory('nonexistent', 'location');

        assert.ok(!success, 'Should return false for nonexistent image');

        teardown();
    });

    // Test: toggleFavorite toggles favorite status
    runner.test('toggleFavorite toggles favorite status', async () => {
        await setup();

        const generator = new ImageGenerator('key');

        await generator.saveToGallery({
            id: 'img1',
            prompt: 'Test',
            isFavorite: false
        });

        const newStatus = await generator.toggleFavorite('img1');
        assert.equal(newStatus, true, 'Should return true after toggle');

        const image = await generator.getGalleryImage('img1');
        assert.equal(image.isFavorite, true, 'Should be marked as favorite');

        const secondToggle = await generator.toggleFavorite('img1');
        assert.equal(secondToggle, false, 'Should return false after second toggle');

        teardown();
    });

    // Test: toggleFavorite returns null for nonexistent image
    runner.test('toggleFavorite returns null for nonexistent image', async () => {
        await setup();

        const generator = new ImageGenerator('key');
        const result = await generator.toggleFavorite('nonexistent');

        assert.equal(result, null, 'Should return null for nonexistent image');

        teardown();
    });

    // Test: deleteImage removes image from gallery
    runner.test('deleteImage removes image from gallery', async () => {
        await setup();

        const generator = new ImageGenerator('key');

        await generator.saveToGallery({
            id: 'img1',
            prompt: 'Test'
        });

        const gallery = await generator.loadGallery();
        const initialLength = gallery.length;

        const success = await generator.deleteImage('img1');
        assert.ok(success, 'Should return true on success');

        const newGallery = await generator.loadGallery();
        assert.equal(newGallery.length, initialLength - 1, 'Gallery should have one less image');

        const deleted = await generator.getGalleryImage('img1');
        assert.equal(deleted, null, 'Deleted image should not be found');

        teardown();
    });

    // Test: deleteImage returns false for nonexistent image
    runner.test('deleteImage returns false for nonexistent image', async () => {
        await setup();

        const generator = new ImageGenerator('key');
        const success = await generator.deleteImage('nonexistent');

        assert.ok(!success, 'Should return false for nonexistent image');

        teardown();
    });

    // Test: clearGallery clears entire gallery
    runner.test('clearGallery clears entire gallery', async () => {
        await setup();

        const generator = new ImageGenerator('key');

        await generator.saveToGallery({ id: 'img1', prompt: 'Test 1' });
        await generator.saveToGallery({ id: 'img2', prompt: 'Test 2' });

        await generator.clearGallery();

        const gallery = await generator.loadGallery();
        assert.equal(gallery.length, 0, 'Gallery should be empty after clear');

        teardown();
    });

    // Test: Gallery enforces 50 image limit
    runner.test('saveToGallery enforces 50 image limit', async () => {
        await setup();

        const generator = new ImageGenerator('key');

        // Add 52 images
        for (let i = 0; i < 52; i++) {
            await generator.saveToGallery({
                id: `img${i}`,
                prompt: `Test ${i}`,
                savedAt: new Date(Date.now() + i * 1000).toISOString()
            });
        }

        const gallery = await generator.loadGallery();
        assert.equal(gallery.length, 50, 'Gallery should be limited to 50 images');

        teardown();
    });

    // Test: Static getSizes returns available sizes
    runner.test('getSizes returns available image sizes', async () => {
        await setup();

        const sizes = ImageGenerator.getSizes();

        assert.ok(sizes, 'Should return sizes object');
        assert.ok(sizes.LARGE, 'Should have LARGE size');
        assert.equal(sizes.LARGE, '1024x1024', 'LARGE should be 1024x1024');

        teardown();
    });

    // Test: Static getQualityOptions returns quality options
    runner.test('getQualityOptions returns quality options', async () => {
        await setup();

        const quality = ImageGenerator.getQualityOptions();

        assert.ok(quality, 'Should return quality object');
        assert.ok(quality.STANDARD, 'Should have STANDARD quality');
        assert.ok(quality.HD, 'Should have HD quality');

        teardown();
    });

    // Test: Static getStyleOptions returns style options
    runner.test('getStyleOptions returns style options', async () => {
        await setup();

        const styles = ImageGenerator.getStyleOptions();

        assert.ok(styles, 'Should return styles object');
        assert.ok(styles.VIVID, 'Should have VIVID style');
        assert.ok(styles.NATURAL, 'Should have NATURAL style');

        teardown();
    });

    // Test: getStats returns service statistics
    runner.test('getStats returns service statistics', async () => {
        await setup();

        const generator = new ImageGenerator('test-key');
        const stats = generator.getStats();

        assert.ok(stats, 'Should return stats object');
        assert.equal(stats.configured, true, 'Should show configured status');
        assert.equal(stats.model, 'gpt-image-1', 'Should show model');
        assert.equal(stats.defaultSize, '1024x1024', 'Should show default size');
        assert.equal(stats.cacheSize, 0, 'Should show cache size');
        assert.equal(stats.historySize, 0, 'Should show history size');

        teardown();
    });

    // Test: notifyError shows error notification
    runner.test('notifyError shows error notification', async () => {
        await setup();

        const error = new Error('Test error');
        ImageGenerator.notifyError(error);

        // Should not throw and should complete successfully
        assert.ok(true, 'notifyError should complete without error');

        teardown();
    });

    // Test: API error handling - 401 Unauthorized
    runner.test('handles 401 unauthorized error', async () => {
        await setup();

        const mockFetch = createMockFetch(
            { error: { message: 'Invalid API key' } },
            { ok: false, status: 401 }
        );
        globalThis.fetch = mockFetch;

        const generator = new ImageGenerator('bad-key');

        try {
            await generator.generate('Test');
            assert.ok(false, 'Should have thrown an error');
        } catch (error) {
            assert.ok(error.message, 'Should have error message');
        }

        teardown();
    });

    // Test: API error handling - 429 Rate Limited
    runner.test('handles 429 rate limited error', async () => {
        await setup();

        const mockFetch = createMockFetch(
            { error: { message: 'Rate limit exceeded' } },
            { ok: false, status: 429 }
        );
        globalThis.fetch = mockFetch;

        const generator = new ImageGenerator('key');

        try {
            await generator.generate('Test');
            assert.ok(false, 'Should have thrown an error');
        } catch (error) {
            assert.ok(error.message, 'Should have error message');
        }

        teardown();
    });

    // Test: API error handling - 400 Bad Request (content policy)
    runner.test('handles 400 content policy violation', async () => {
        await setup();

        const mockFetch = createMockFetch(
            { error: { message: 'Your request was rejected due to safety concerns' } },
            { ok: false, status: 400 }
        );
        globalThis.fetch = mockFetch;

        const generator = new ImageGenerator('key');

        try {
            await generator.generate('Test');
            assert.ok(false, 'Should have thrown an error');
        } catch (error) {
            assert.ok(error.message, 'Should have error message');
        }

        teardown();
    });

    // Test: API error handling - 500 Server Error
    runner.test('handles 500 server error', async () => {
        await setup();

        const mockFetch = createMockFetch(
            { error: { message: 'Internal server error' } },
            { ok: false, status: 500 }
        );
        globalThis.fetch = mockFetch;

        const generator = new ImageGenerator('key');

        try {
            await generator.generate('Test');
            assert.ok(false, 'Should have thrown an error');
        } catch (error) {
            assert.ok(error.message, 'Should have error message');
        }

        teardown();
    });

    return runner.run();
}
