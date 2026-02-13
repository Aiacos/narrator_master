/**
 * Cache Manager Module for Narrator Master
 * Provides generic key-value caching with expiration and size limits
 * @module cache-manager
 */

import { MODULE_ID as _MODULE_ID } from './settings.js';
import { Logger } from './logger.js';

/**
 * Represents a cache entry with value, timestamps, and optional metadata
 * @typedef {Object} CacheEntry
 * @property {*} value - The cached value (can be any type: string, object, array, etc.)
 * @property {Date} createdAt - Timestamp when the entry was created
 * @property {Date} expiresAt - Timestamp when the entry expires and should be removed
 * @property {Object} [metadata] - Optional metadata associated with the entry (e.g., tags, source info)
 */

/**
 * CacheManager - Generic key-value cache with expiration and LRU trimming
 *
 * Provides a flexible caching mechanism with automatic expiration handling and size limits.
 * Uses LRU (Least Recently Used) strategy to maintain cache size within configured limits.
 * Suitable for caching any type of data including images, text, objects, or API responses.
 *
 * Features:
 * - Automatic expiration checking and cleanup
 * - LRU-based cache trimming when max size is exceeded
 * - Optional metadata storage per cache entry
 * - Support for batch operations (getAll, getValid, clearExpired)
 * - Static utility methods for cache key generation and blob conversion
 *
 * Usage Patterns:
 *
 * 1. Basic Caching:
 * @example
 * // Create a cache instance
 * const cache = new CacheManager({ name: 'myCache', maxSize: 50 });
 *
 * // Store a value with 1 hour expiration
 * const expiresAt = new Date(Date.now() + 3600000);
 * cache.set('key1', { data: 'value' }, expiresAt, { tag: 'important' });
 *
 * // Retrieve the value
 * const value = cache.get('key1'); // Returns { data: 'value' } or null if expired
 *
 * 2. Image Caching:
 * @example
 * // Create an image cache
 * const imageCache = new CacheManager({ name: 'images', maxSize: 100 });
 *
 * // Generate cache key from prompt
 * const cacheKey = CacheManager.generateCacheKey(prompt, 'img');
 *
 * // Download and cache an image
 * const response = await fetch(imageUrl);
 * const blob = await response.blob();
 * const base64 = await CacheManager.blobToBase64(blob);
 *
 * const expiresAt = new Date(Date.now() + 3600000); // 1 hour
 * imageCache.set(cacheKey, {
 *     url: imageUrl,
 *     base64: base64,
 *     prompt: prompt
 * }, expiresAt, { type: 'infographic' });
 *
 * // Retrieve cached image
 * const cachedImage = imageCache.get(cacheKey);
 * if (cachedImage) {
 *     console.log('Using cached image:', cachedImage.url);
 * }
 *
 * 3. API Response Caching:
 * @example
 * // Create an API response cache
 * const apiCache = new CacheManager({ name: 'api', maxSize: 200 });
 *
 * // Cache an API response for 30 minutes
 * const cacheKey = CacheManager.generateCacheKey(JSON.stringify(requestParams), 'api');
 * const expiresAt = new Date(Date.now() + 1800000); // 30 minutes
 * apiCache.set(cacheKey, apiResponse, expiresAt, { endpoint: '/chat/completions' });
 *
 * // Check cache before making request
 * const cached = apiCache.get(cacheKey);
 * if (cached) {
 *     return cached; // Use cached response
 * }
 * // Otherwise make API request...
 *
 * 4. Cache Maintenance:
 * @example
 * // Clear expired entries periodically
 * setInterval(() => {
 *     const removed = cache.clearExpired();
 *     console.log(`Removed ${removed} expired entries`);
 * }, 600000); // Every 10 minutes
 *
 * // Get statistics
 * console.log(`Cache size: ${cache.size()}`);
 * console.log(`Valid entries: ${cache.getValid().length}`);
 *
 * // Clear entire cache when needed
 * cache.clear();
 *
 * 5. Working with Cache Entries and Metadata:
 * @example
 * // Store with metadata
 * cache.set('key1', data, expiresAt, {
 *     source: 'api',
 *     priority: 'high',
 *     tags: ['important', 'user-data']
 * });
 *
 * // Get full entry with metadata
 * const entry = cache.getEntry('key1');
 * if (entry) {
 *     console.log('Value:', entry.value);
 *     console.log('Created:', entry.createdAt);
 *     console.log('Expires:', entry.expiresAt);
 *     console.log('Metadata:', entry.metadata);
 * }
 *
 * // Get all valid entries with metadata
 * const validEntries = cache.getValidEntries();
 * for (const entry of validEntries) {
 *     console.log(entry.value, entry.metadata);
 * }
 *
 * Important Notes:
 * - Cache automatically trims oldest entries when maxSize is exceeded (LRU strategy)
 * - Expired entries are removed on-access or via clearExpired()
 * - get() method checks expiration by default; use get(key, false) to skip expiration check
 * - Static methods (blobToBase64, generateCacheKey) can be used without instantiation
 * - Metadata is optional and can store any additional information about cache entries
 */
export class CacheManager {
    /**
     * Creates a new CacheManager instance
     * @param {Object} [options={}] - Configuration options
     * @param {number} [options.maxSize=100] - Maximum number of cache entries
     * @param {string} [options.name='cache'] - Cache name for logging purposes
     */
    constructor(options = {}) {
        /**
         * Cache name for logging
         * @type {string}
         * @private
         */
        this._name = options.name || 'cache';

        /**
         * Internal cache storage
         * @type {Map<string, CacheEntry>}
         * @private
         */
        this._cache = new Map();

        /**
         * Maximum cache entries to keep
         * @type {number}
         * @private
         */
        this._maxSize = options.maxSize || 100;
    }

    /**
     * Stores a value in the cache
     * @param {string} key - The cache key
     * @param {*} value - The value to cache
     * @param {Date} expiresAt - When the entry expires
     * @param {Object} [metadata={}] - Optional metadata
     */
    set(key, value, expiresAt, metadata = {}) {
        const cacheEntry = {
            value: value,
            createdAt: new Date(),
            expiresAt: expiresAt,
            metadata: metadata
        };

        this._cache.set(key, cacheEntry);

        // Trim cache if needed
        this._trim();
    }

    /**
     * Retrieves a value from the cache
     * @param {string} key - The cache key
     * @param {boolean} [checkExpiration=true] - Whether to check if entry is expired
     * @returns {*|null} The cached value or null if not found/expired
     */
    get(key, checkExpiration = true) {
        const entry = this._cache.get(key);

        if (!entry) {return null;}

        // Check if entry has expired
        if (checkExpiration && new Date() > entry.expiresAt) {
            this._cache.delete(key);
            return null;
        }

        return entry.value;
    }

    /**
     * Gets a cache entry with full metadata
     * @param {string} key - The cache key
     * @returns {CacheEntry|null} The cache entry or null if not found
     */
    getEntry(key) {
        return this._cache.get(key) || null;
    }

    /**
     * Gets all cached entries
     * @returns {Array<*>} Array of all cached values
     */
    getAll() {
        return Array.from(this._cache.values()).map(entry => entry.value);
    }

    /**
     * Gets all cache entries with metadata
     * @returns {Array<CacheEntry>} Array of all cache entries
     */
    getAllEntries() {
        return Array.from(this._cache.values());
    }

    /**
     * Gets valid (non-expired) cached values
     * @returns {Array<*>} Array of valid cached values
     */
    getValid() {
        const now = new Date();
        return Array.from(this._cache.values())
            .filter(entry => now <= entry.expiresAt)
            .map(entry => entry.value);
    }

    /**
     * Gets valid (non-expired) cache entries
     * @returns {Array<CacheEntry>} Array of valid cache entries
     */
    getValidEntries() {
        const now = new Date();
        return Array.from(this._cache.values())
            .filter(entry => now <= entry.expiresAt);
    }

    /**
     * Clears expired cache entries
     * @returns {number} Number of entries removed
     */
    clearExpired() {
        const now = new Date();
        const expiredKeys = [];

        for (const [key, entry] of this._cache.entries()) {
            if (now > entry.expiresAt) {
                expiredKeys.push(key);
            }
        }

        for (const key of expiredKeys) {
            this._cache.delete(key);
        }

        if (expiredKeys.length > 0) {
            Logger.info(`Cleared ${expiredKeys.length} expired cache entries`, this._name);
        }

        return expiredKeys.length;
    }

    /**
     * Clears all cached entries
     */
    clear() {
        this._cache.clear();
        Logger.info('Cache cleared', this._name);
    }

    /**
     * Gets the current cache size
     * @returns {number} Number of entries in cache
     */
    size() {
        return this._cache.size;
    }

    /**
     * Checks if a key exists in the cache
     * @param {string} key - The cache key
     * @returns {boolean} True if key exists
     */
    has(key) {
        return this._cache.has(key);
    }

    /**
     * Removes a specific entry from the cache
     * @param {string} key - The cache key
     * @returns {boolean} True if entry was removed
     */
    delete(key) {
        return this._cache.delete(key);
    }

    /**
     * Trims the cache to stay within size limits using LRU strategy
     * @private
     */
    _trim() {
        if (this._cache.size <= this._maxSize) {return;}

        // Remove oldest entries (LRU - Least Recently Used)
        const entries = Array.from(this._cache.entries())
            .sort((a, b) => a[1].createdAt - b[1].createdAt);

        const toRemove = entries.slice(0, this._cache.size - this._maxSize);
        for (const [key] of toRemove) {
            this._cache.delete(key);
        }

        Logger.info(`Trimmed ${toRemove.length} old cache entries`, this._name);
    }

    /**
     * Converts a Blob to base64 string
     * @param {Blob} blob - The blob to convert
     * @returns {Promise<string>} The base64 string (without data URL prefix)
     * @static
     */
    static blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result;
                // Remove data URL prefix
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Generates a cache key from a string using simple hash function
     * @param {string} input - The input string
     * @param {string} [prefix='cache'] - Prefix for the cache key
     * @returns {string} The cache key
     * @static
     */
    static generateCacheKey(input, prefix = 'cache') {
        // Simple hash function for cache key
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return `${prefix}_${Math.abs(hash).toString(16)}`;
    }
}
