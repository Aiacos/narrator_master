/**
 * Test Helper Module for Narrator Master
 * Provides mocks and utilities for unit testing
 * @module test-helper
 */

/**
 * Mock for game.i18n.localize and format
 * Returns the key with any format parameters appended
 */
export const mockI18n = {
    localize: (key) => key,
    format: (key, data) => {
        let result = key;
        if (data) {
            Object.entries(data).forEach(([k, v]) => {
                result += ` [${k}:${v}]`;
            });
        }
        return result;
    }
};

/**
 * Mock for game.settings
 * Stores settings in memory for testing
 */
export class MockSettings {
    constructor() {
        this._storage = new Map();
        this._registered = new Map();
    }

    register(moduleId, key, config) {
        const fullKey = `${moduleId}.${key}`;
        this._registered.set(fullKey, config);
        if (!this._storage.has(fullKey)) {
            this._storage.set(fullKey, config.default);
        }
    }

    get(moduleId, key) {
        const fullKey = `${moduleId}.${key}`;
        return this._storage.get(fullKey);
    }

    async set(moduleId, key, value) {
        const fullKey = `${moduleId}.${key}`;
        const oldValue = this._storage.get(fullKey);
        this._storage.set(fullKey, value);

        // Trigger onChange if registered
        const config = this._registered.get(fullKey);
        if (config && config.onChange && oldValue !== value) {
            config.onChange(value);
        }
    }

    getRegistered(moduleId, key) {
        return this._registered.get(`${moduleId}.${key}`);
    }

    clear() {
        this._storage.clear();
        this._registered.clear();
    }
}

/**
 * Mock for Foundry VTT Journal Entry
 */
export class MockJournalEntry {
    constructor(id, name, pages = []) {
        this.id = id;
        this.name = name;
        this.pages = pages;
    }
}

/**
 * Mock for Foundry VTT Journal Page
 */
export class MockJournalPage {
    constructor(id, name, type = 'text', content = '', sort = 0) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.text = { content };
        this.sort = sort;
    }
}

/**
 * Mock for game.journal collection
 */
export class MockJournalCollection {
    constructor() {
        this._journals = new Map();
    }

    get(id) {
        return this._journals.get(id);
    }

    add(journal) {
        this._journals.set(journal.id, journal);
    }

    map(fn) {
        return Array.from(this._journals.values()).map(fn);
    }

    clear() {
        this._journals.clear();
    }

    get size() {
        return this._journals.size;
    }
}

/**
 * Mock for ui.notifications
 */
export const mockNotifications = {
    _calls: [],
    info: function (message) {
        this._calls.push({ type: 'info', message });
    },
    warn: function (message) {
        this._calls.push({ type: 'warn', message });
    },
    error: function (message) {
        this._calls.push({ type: 'error', message });
    },
    clear: function () {
        this._calls = [];
    }
};

/**
 * Creates a mock fetch function that returns predefined responses
 * @param {Object} responseData - The data to return from fetch
 * @param {Object} options - Additional options (status, ok, etc.)
 * @returns {Function} Mock fetch function
 */
export function createMockFetch(responseData, options = {}) {
    const { status = 200, ok = true, headers = {} } = options;

    return async function mockFetch(url, fetchOptions) {
        // Store call info for assertions
        mockFetch.calls = mockFetch.calls || [];
        mockFetch.calls.push({ url, options: fetchOptions });

        if (!ok) {
            return {
                ok: false,
                status,
                json: async () => responseData,
                text: async () => JSON.stringify(responseData)
            };
        }

        return {
            ok: true,
            status,
            headers: new Map(Object.entries(headers)),
            json: async () => responseData,
            text: async () => JSON.stringify(responseData)
        };
    };
}

/**
 * Creates a mock fetch that simulates network errors
 * @param {string} errorMessage - The error message
 * @returns {Function} Mock fetch function that throws
 */
export function createMockFetchError(errorMessage = 'Network error') {
    return async function mockFetch(url, options) {
        mockFetch.calls = mockFetch.calls || [];
        mockFetch.calls.push({ url, options });
        throw new Error(errorMessage);
    };
}

/**
 * Sets up the global game object for testing
 * @param {Object} overrides - Custom values to override defaults
 * @returns {Object} The mock game object
 */
export function setupMockGame(overrides = {}) {
    const mockSettings = new MockSettings();
    const mockJournal = new MockJournalCollection();

    const game = {
        i18n: mockI18n,
        settings: mockSettings,
        journal: mockJournal,
        user: { isGM: true },
        ...overrides
    };

    // Set up mock window object if it doesn't exist
    if (typeof window === 'undefined') {
        if (typeof globalThis !== 'undefined') {
            globalThis.window = {};
        } else if (typeof global !== 'undefined') {
            global.window = {};
        }
    }

    // Make it available globally
    if (typeof globalThis !== 'undefined') {
        globalThis.game = game;
    } else if (typeof global !== 'undefined') {
        global.game = game;
    } else if (typeof window !== 'undefined') {
        window.game = game;
    }

    return game;
}

/**
 * Sets up the global ui object for testing
 * @returns {Object} The mock ui object
 */
export function setupMockUI() {
    mockNotifications.clear();

    const ui = {
        notifications: mockNotifications
    };

    if (typeof globalThis !== 'undefined') {
        globalThis.ui = ui;
    } else if (typeof global !== 'undefined') {
        global.ui = ui;
    } else if (typeof window !== 'undefined') {
        window.ui = ui;
    }

    return ui;
}

/**
 * Sets up a mock document object with createElement
 * @returns {Object} The mock document object
 */
export function setupMockDocument() {
    const mockDocument = {
        createElement: (tag) => {
            const element = {
                tagName: tag.toUpperCase(),
                innerHTML: '',
                textContent: '',
                innerText: '',
                children: [],
                appendChild: function (child) {
                    this.children.push(child);
                },
                querySelector: function () {
                    return null;
                },
                querySelectorAll: function () {
                    return [];
                }
            };

            // Handle HTML parsing for div elements
            Object.defineProperty(element, 'innerHTML', {
                set: function (value) {
                    this._innerHTML = value;
                    // Simple HTML to text conversion for testing
                    this.textContent = value
                        .replace(/<[^>]*>/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim();
                    this.innerText = this.textContent;
                },
                get: function () {
                    return this._innerHTML || '';
                }
            });

            return element;
        }
    };

    if (typeof globalThis !== 'undefined') {
        globalThis.document = mockDocument;
    } else if (typeof global !== 'undefined') {
        global.document = mockDocument;
    }

    // Set up DOMParser mock for safe HTML parsing
    const MockDOMParser = class {
        parseFromString(htmlString, mimeType) {
            // Create a mock document that safely extracts text without executing scripts
            const bodyElement = {
                textContent: '',
                innerHTML: ''
            };

            // Simple HTML to text conversion that strips all tags
            // This simulates DOMParser's safe parsing without script execution
            bodyElement.textContent = htmlString
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
                .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove style tags
                .replace(/<[^>]*>/g, ' ') // Remove all other tags
                .replace(/\s+/g, ' ') // Normalize whitespace
                .trim();

            return {
                body: bodyElement,
                documentElement: bodyElement
            };
        }
    };

    // Install DOMParser globally
    if (typeof globalThis !== 'undefined') {
        globalThis.DOMParser = MockDOMParser;
    } else if (typeof global !== 'undefined') {
        global.DOMParser = MockDOMParser;
    } else if (typeof window !== 'undefined') {
        window.DOMParser = MockDOMParser;
    }

    return mockDocument;
}

/**
 * Cleans up all global mocks
 */
export function cleanupMocks() {
    const targets = [globalThis, global].filter((t) => typeof t !== 'undefined');

    for (const target of targets) {
        delete target.game;
        delete target.ui;
        delete target.document;
        delete target.DOMParser;
        delete target.fetch;
        // Clean up window if we created it
        if (target.window && !target.window.document) {
            delete target.window;
        }
    }

    // Clean window object if it exists
    if (typeof window !== 'undefined') {
        delete window.game;
        delete window.ui;
        delete window.document;
        delete window.DOMParser;
        delete window.fetch;
    }
}

/**
 * Simple test assertion helper
 */
export const assert = {
    equal: (actual, expected, message = '') => {
        if (actual !== expected) {
            throw new Error(
                `Assertion failed${message ? ': ' + message : ''}: expected ${expected}, got ${actual}`
            );
        }
    },

    deepEqual: (actual, expected, message = '') => {
        const actualStr = JSON.stringify(actual);
        const expectedStr = JSON.stringify(expected);
        if (actualStr !== expectedStr) {
            throw new Error(
                `Assertion failed${message ? ': ' + message : ''}: expected ${expectedStr}, got ${actualStr}`
            );
        }
    },

    ok: (value, message = '') => {
        if (!value) {
            throw new Error(
                `Assertion failed${message ? ': ' + message : ''}: expected truthy value, got ${value}`
            );
        }
    },

    throws: async (fn, message = '') => {
        try {
            await fn();
            throw new Error(
                `Assertion failed${message ? ': ' + message : ''}: expected function to throw`
            );
        } catch (error) {
            if (error.message.startsWith('Assertion failed')) {
                throw error;
            }
            // Expected error was thrown
            return error;
        }
    },

    notThrows: async (fn, message = '') => {
        try {
            await fn();
        } catch (error) {
            throw new Error(
                `Assertion failed${message ? ': ' + message : ''}: function threw: ${error.message}`
            );
        }
    },

    includes: (array, item, message = '') => {
        if (!Array.isArray(array) || !array.includes(item)) {
            throw new Error(
                `Assertion failed${message ? ': ' + message : ''}: expected array to include ${item}`
            );
        }
    },

    contains: (str, substr, message = '') => {
        if (typeof str !== 'string' || !str.includes(substr)) {
            throw new Error(
                `Assertion failed${message ? ': ' + message : ''}: expected "${str}" to contain "${substr}"`
            );
        }
    }
};

/**
 * Simple test runner
 */
export class TestRunner {
    constructor(suiteName) {
        this.suiteName = suiteName;
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
        this.results = [];
    }

    test(name, fn) {
        this.tests.push({ name, fn });
    }

    async run() {
        console.log(`\n========== ${this.suiteName} ==========\n`);

        for (const test of this.tests) {
            try {
                await test.fn();
                this.passed++;
                this.results.push({ name: test.name, passed: true });
                console.log(`  ✓ ${test.name}`);
            } catch (error) {
                this.failed++;
                this.results.push({ name: test.name, passed: false, error: error.message });
                console.log(`  ✗ ${test.name}`);
                console.log(`    Error: ${error.message}`);
            }
        }

        console.log(`\n  Results: ${this.passed} passed, ${this.failed} failed`);
        console.log('==========================================\n');

        return {
            suite: this.suiteName,
            passed: this.passed,
            failed: this.failed,
            total: this.tests.length,
            results: this.results
        };
    }
}

/**
 * Creates a mock Blob for testing audio upload
 * @param {string} type - MIME type
 * @param {number} size - Size in bytes
 * @returns {Blob} Mock Blob instance
 */
export function createMockBlob(type = 'audio/webm', size = 1024) {
    // Create a buffer of the specified size
    const buffer = new ArrayBuffer(size);
    // Use the Blob constructor to create a proper Blob instance
    return new Blob([buffer], { type });
}

/**
 * Creates a mock FormData for testing
 * @returns {Object} Mock FormData object
 */
export function createMockFormData() {
    const data = new Map();
    return {
        append: (key, value, filename) => {
            data.set(key, { value, filename });
        },
        get: (key) => data.get(key)?.value,
        has: (key) => data.has(key),
        entries: () => data.entries(),
        _data: data
    };
}

// Set up FormData mock globally if not available
if (typeof FormData === 'undefined') {
    if (typeof globalThis !== 'undefined') {
        globalThis.FormData = function () {
            return createMockFormData();
        };
    } else if (typeof global !== 'undefined') {
        global.FormData = function () {
            return createMockFormData();
        };
    }
}

// Set up Blob mock globally if not available
if (typeof Blob === 'undefined') {
    const MockBlob = function (parts = [], options = {}) {
        // Calculate total size from all parts
        let totalSize = 0;
        for (const part of parts) {
            if (typeof part === 'string') {
                totalSize += part.length;
            } else if (part instanceof ArrayBuffer) {
                totalSize += part.byteLength;
            } else if (part && part.byteLength !== undefined) {
                totalSize += part.byteLength;
            } else if (part && part.length !== undefined) {
                totalSize += part.length;
            }
        }

        this.type = options.type || '';
        this.size = totalSize;
        this.arrayBuffer = async () => new ArrayBuffer(totalSize);
        this.text = async () => '';
        this.slice = () => new MockBlob(parts, options);
    };

    if (typeof globalThis !== 'undefined') {
        globalThis.Blob = MockBlob;
    } else if (typeof global !== 'undefined') {
        global.Blob = MockBlob;
    }
}
