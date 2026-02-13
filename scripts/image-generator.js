/**
 * Image Generator Module for Narrator Master
 * Handles image generation via OpenAI Image API (gpt-image-1)
 * @module image-generator
 */

import { MODULE_ID, SETTINGS } from './settings.js';
import { OpenAIServiceBase } from './openai-service-base.js';
import { Logger } from './logger.js';

/**
 * Default model for image generation (gpt-image-1 is recommended for long-term support)
 * Note: dall-e-3 is deprecated and loses support on May 12, 2026
 * @constant {string}
 */
const DEFAULT_MODEL = 'gpt-image-1';

/**
 * URL expiration time in milliseconds (60 minutes)
 * OpenAI image URLs expire after 60 minutes
 * @constant {number}
 */
const URL_EXPIRATION_MS = 60 * 60 * 1000;

/**
 * Available image sizes for generation
 * @constant {Object}
 */
const IMAGE_SIZES = {
    SMALL: '256x256',
    MEDIUM: '512x512',
    LARGE: '1024x1024',
    WIDE: '1536x1024',
    TALL: '1024x1536'
};

/**
 * Available image quality settings
 * @constant {Object}
 */
const IMAGE_QUALITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
};

/**
 * Available image styles
 * @constant {Object}
 */
const IMAGE_STYLES = {
    VIVID: 'vivid',
    NATURAL: 'natural'
};

/**
 * Represents a cached image entry
 * @typedef {Object} CachedImage
 * @property {string} id - Unique identifier for the image
 * @property {string} url - The image URL
 * @property {string} base64 - Base64 encoded image data (if downloaded)
 * @property {string} prompt - The prompt used to generate the image
 * @property {Date} createdAt - When the image was generated
 * @property {Date} expiresAt - When the URL expires
 * @property {string} model - The model used for generation
 * @property {string} size - The image size
 * @property {string} [revisedPrompt] - The revised prompt from the API
 * @property {string[]} tags - Tags for organizing the image
 * @property {string} category - Category of the image (location, npc, scene, item, etc.)
 * @property {boolean} isFavorite - Whether the image is marked as favorite
 * @property {string} timestamp - ISO string timestamp when saved
 * @property {string} session - Session identifier or name
 * @property {string} scene - Scene name or identifier where image was generated
 */

/**
 * Represents an image generation result
 * @typedef {Object} GenerationResult
 * @property {string} id - Unique identifier for the image
 * @property {string} url - The generated image URL
 * @property {string} [base64] - Base64 encoded image data (if requested)
 * @property {string} prompt - The original prompt
 * @property {string} [revisedPrompt] - The revised prompt from the API
 * @property {string} model - The model used
 * @property {string} size - The image size
 * @property {Date} createdAt - When the image was generated
 * @property {string[]} tags - Tags for organizing the image
 * @property {string} category - Category of the image (location, npc, scene, item, etc.)
 * @property {boolean} isFavorite - Whether the image is marked as favorite
 * @property {string} timestamp - ISO string timestamp when saved
 * @property {string} session - Session identifier or name
 * @property {string} scene - Scene name or identifier where image was generated
 */

/**
 * Represents a gallery image entry (persistent storage)
 * @typedef {Object} GalleryEntry
 * @property {string} id - Unique identifier for the image
 * @property {string} url - The image URL
 * @property {string} base64 - Base64 encoded image data
 * @property {string} prompt - The prompt used to generate the image
 * @property {string} [revisedPrompt] - The revised prompt from the API
 * @property {string} model - The model used for generation
 * @property {string} size - The image size
 * @property {string[]} tags - Tags for organizing the image
 * @property {string} category - Category of the image (location, npc, scene, item, etc.)
 * @property {boolean} isFavorite - Whether the image is marked as favorite
 * @property {string} timestamp - ISO string timestamp when generated
 * @property {string} session - Session identifier or name
 * @property {string} scene - Scene name or identifier where image was generated
 * @property {string} savedAt - ISO string timestamp when saved to gallery
 */

/**
 * ImageGenerator - Handles AI-powered image generation for infographics and scene visuals
 * Uses OpenAI gpt-image-1 model (preferred) or dall-e-3 (deprecated May 2026)
 * @extends OpenAIServiceBase
 */
export class ImageGenerator extends OpenAIServiceBase {
    /**
     * Creates a new ImageGenerator instance
     * @param {string} apiKey - The OpenAI API key
     * @param {Object} [options={}] - Configuration options
     * @param {string} [options.model='gpt-image-1'] - The model to use for generation
     * @param {string} [options.defaultSize='1024x1024'] - Default image size
     * @param {string} [options.defaultQuality='standard'] - Default image quality
     * @param {boolean} [options.autoCacheImages=true] - Automatically download and cache images
     * @param {number} [options.maxHistorySize=50] - Maximum history entries to keep
     */
    constructor(apiKey, options = {}) {
        // Call parent constructor
        super(apiKey, options);

        /**
         * Model to use for image generation
         * @type {string}
         * @private
         */
        this._model = options.model || DEFAULT_MODEL;

        /**
         * Default image size
         * @type {string}
         * @private
         */
        this._defaultSize = options.defaultSize || IMAGE_SIZES.LARGE;

        /**
         * Default image quality
         * @type {string}
         * @private
         */
        this._defaultQuality = options.defaultQuality || IMAGE_QUALITY.MEDIUM;

        /**
         * Whether to automatically download and cache images
         * @type {boolean}
         * @private
         */
        this._autoCacheImages = options.autoCacheImages !== false;

        /**
         * Image cache to store generated images
         * @type {Map<string, CachedImage>}
         * @private
         */
        this._imageCache = new Map();

        /**
         * Maximum cache entries to keep
         * @type {number}
         * @private
         */
        this._maxCacheSize = 100;
    }

    /**
     * Sets the model to use for image generation
     * @param {string} model - The model name ('gpt-image-1' or 'dall-e-3')
     */
    setModel(model) {
        if (model === 'dall-e-3') {
            Logger.warn('dall-e-3 is deprecated and loses support on May 12, 2026. Consider using gpt-image-1.', 'ImageGenerator');
        }
        this._model = model || DEFAULT_MODEL;
    }

    /**
     * Gets the current model
     * @returns {string} The model name
     */
    getModel() {
        return this._model;
    }

    /**
     * Sets the default image size
     * @param {string} size - The size (e.g., '1024x1024')
     */
    setDefaultSize(size) {
        this._defaultSize = size || IMAGE_SIZES.LARGE;
    }

    /**
     * Gets the default image size
     * @returns {string} The default size
     */
    getDefaultSize() {
        return this._defaultSize;
    }

    /**
     * Sets the default image quality
     * @param {string} quality - The quality setting
     */
    setDefaultQuality(quality) {
        this._defaultQuality = quality || IMAGE_QUALITY.MEDIUM;
    }

    /**
     * Gets the default image quality
     * @returns {string} The default quality
     */
    getDefaultQuality() {
        return this._defaultQuality;
    }

    /**
     * Generates an image from a text prompt
     * @param {string} prompt - The text description of the image to generate
     * @param {Object} [options={}] - Generation options
     * @param {string} [options.size] - Image size (default: defaultSize)
     * @param {string} [options.quality] - Image quality (default: defaultQuality)
     * @param {string} [options.style] - Image style ('vivid' or 'natural')
     * @param {boolean} [options.returnBase64=false] - Return base64 instead of URL
     * @param {boolean} [options.cacheImage=true] - Download and cache the image
     * @returns {Promise<GenerationResult>} The generation result
     * @throws {Error} If generation fails
     */
    async generate(prompt, options = {}) {
        // Validate API key
        if (!this.isConfigured()) {
            throw new Error(game.i18n.localize('NARRATOR.Errors.NoApiKey'));
        }

        // Validate prompt
        if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
            throw new Error(game.i18n.localize('NARRATOR.Errors.NoPrompt'));
        }

        const size = options.size || this._defaultSize;
        const quality = options.quality || this._defaultQuality;
        const style = options.style || IMAGE_STYLES.VIVID;
        const returnBase64 = Boolean(options.returnBase64);
        const cacheImage = options.cacheImage !== false && this._autoCacheImages;

        Logger.info(`Generating image: "${prompt.substring(0, 50)}...", size: ${size}, quality: ${quality}`, 'ImageGenerator');

        try {
            // Build request body
            const requestBody = this._buildRequestBody(prompt, size, quality, style, returnBase64);

            // Make API request
            const response = await this._makeApiRequest(requestBody);

            // Parse response
            const result = this._parseResponse(response, prompt, size);

            // Cache the image if enabled
            if (cacheImage && result.url) {
                await this._cacheImage(result);
            }

            // Add to history
            this._addToHistory(result);

            Logger.info('Image generated successfully', 'ImageGenerator');

            return result;

        } catch (error) {
            if (error.status) {
                throw this._handleApiError(error);
            }
            throw error;
        }
    }

    /**
     * Generates an infographic for a game event or scene
     * Builds a specialized prompt for RPG-style infographics
     * @param {string} eventDescription - Description of the event or scene
     * @param {Object} [options={}] - Generation options
     * @param {string} [options.style='fantasy'] - Art style ('fantasy', 'realistic', 'sketch')
     * @param {string} [options.mood='dramatic'] - Image mood ('dramatic', 'peaceful', 'mysterious')
     * @param {string[]} [options.elements=[]] - Additional elements to include
     * @param {string} [options.sceneType] - Scene type ('exploration', 'combat', 'social', 'rest')
     * @returns {Promise<GenerationResult>} The generation result
     */
    async generateInfographic(eventDescription, options = {}) {
        if (!eventDescription || typeof eventDescription !== 'string') {
            throw new Error(game.i18n.localize('NARRATOR.Errors.NoDescription'));
        }

        const artStyle = options.style || 'fantasy';
        const mood = options.mood || 'dramatic';
        const elements = options.elements || [];
        const sceneType = options.sceneType || null;

        // Build a specialized prompt for RPG infographics
        const prompt = this._buildInfographicPrompt(eventDescription, artStyle, mood, elements, sceneType);

        Logger.info(`Generating infographic for: "${eventDescription.substring(0, 50)}..."`, 'ImageGenerator');

        return this.generate(prompt, {
            size: options.size || IMAGE_SIZES.LARGE,
            quality: options.quality || IMAGE_QUALITY.MEDIUM,
            style: IMAGE_STYLES.VIVID,
            cacheImage: true
        });
    }

    /**
     * Generates a scene illustration for the game
     * @param {string} sceneDescription - Description of the scene
     * @param {Object} [options={}] - Generation options
     * @param {string} [options.location] - Location type ('dungeon', 'forest', 'tavern', etc.)
     * @param {string} [options.lighting] - Lighting condition ('torchlit', 'moonlight', 'daylight')
     * @param {string[]} [options.characters=[]] - Characters in the scene
     * @param {string} [options.sceneType] - Scene type ('exploration', 'combat', 'social', 'rest')
     * @returns {Promise<GenerationResult>} The generation result
     */
    async generateSceneIllustration(sceneDescription, options = {}) {
        if (!sceneDescription || typeof sceneDescription !== 'string') {
            throw new Error(game.i18n.localize('NARRATOR.Errors.NoDescription'));
        }

        const location = options.location || '';
        const lighting = options.lighting || '';
        const characters = options.characters || [];
        const sceneType = options.sceneType || null;

        // Build scene-specific prompt
        const prompt = this._buildScenePrompt(sceneDescription, location, lighting, characters, sceneType);

        Logger.info(`Generating scene illustration: "${sceneDescription.substring(0, 50)}..."`, 'ImageGenerator');

        return this.generate(prompt, {
            size: options.size || IMAGE_SIZES.WIDE,
            quality: options.quality || IMAGE_QUALITY.MEDIUM,
            style: IMAGE_STYLES.VIVID,
            cacheImage: true
        });
    }

    /**
     * Builds the request body for the API
     * @param {string} prompt - The generation prompt
     * @param {string} size - Image size
     * @param {string} quality - Image quality
     * @param {string} style - Image style
     * @param {boolean} returnBase64 - Whether to return base64
     * @returns {Object} The request body
     * @private
     */
    _buildRequestBody(prompt, size, quality, style, returnBase64) {
        const body = {
            model: this._model,
            prompt: prompt,
            n: 1,
            size: size
        };

        // gpt-image-1: no response_format (always returns b64_json), uses output_format
        // dall-e-3: uses response_format
        if (this._model === 'dall-e-3') {
            body.response_format = returnBase64 ? 'b64_json' : 'url';
            if (style) {
                body.style = style;
            }
        }

        if (quality) {
            body.quality = quality;
        }

        return body;
    }

    /**
     * Makes the API request to OpenAI
     * @param {Object} requestBody - The request body
     * @returns {Promise<Object>} The API response
     * @private
     */
    async _makeApiRequest(requestBody) {
        let response;

        try {
            response = await fetch(`${this._baseUrl}/images/generations`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this._apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
        } catch (networkError) {
            // Handle network errors (no connection, timeout, etc.)
            Logger.error('Network error during image generation', 'ImageGenerator', networkError);
            throw this._createNetworkError(networkError);
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw {
                message: errorData.error?.message || 'Image generation failed',
                code: errorData.error?.code || 'unknown',
                status: response.status
            };
        }

        return await response.json();
    }

    /**
     * Parses the API response into a GenerationResult
     * @param {Object} response - The API response
     * @param {string} prompt - The original prompt
     * @param {string} size - The requested size
     * @returns {GenerationResult} The parsed result
     * @private
     */
    _parseResponse(response, prompt, size) {
        const imageData = response.data?.[0] || {};
        const now = new Date();

        return {
            id: foundry.utils.randomID(),
            url: imageData.url || '',
            base64: imageData.b64_json || null,
            prompt: prompt,
            revisedPrompt: imageData.revised_prompt,
            model: this._model,
            size: size,
            createdAt: now,
            tags: [],
            category: '',
            isFavorite: false,
            timestamp: now.toISOString(),
            session: '',
            scene: ''
        };
    }

    /**
     * Builds a prompt for RPG infographics
     * @param {string} description - Event description
     * @param {string} style - Art style
     * @param {string} mood - Image mood
     * @param {string[]} elements - Additional elements
     * @param {string} [sceneType] - Scene type ('exploration', 'combat', 'social', 'rest')
     * @returns {string} The constructed prompt
     * @private
     */
    _buildInfographicPrompt(description, style, mood, elements, sceneType) {
        const styleMap = {
            fantasy: 'high fantasy art style, magical, detailed illustration',
            realistic: 'realistic digital painting, photorealistic, detailed',
            sketch: 'pencil sketch style, hand-drawn, artistic'
        };

        const moodMap = {
            dramatic: 'dramatic lighting, epic composition, intense atmosphere',
            peaceful: 'serene atmosphere, soft lighting, tranquil scene',
            mysterious: 'dark atmosphere, foggy, enigmatic, shadows',
            action: 'dynamic composition, motion blur, intense action'
        };

        const sceneTypeMap = {
            combat: 'dynamic action, battle stance, intense combat',
            social: 'character interaction, conversation, interpersonal dynamics',
            exploration: 'discovery, landscape, adventure atmosphere',
            rest: 'calm, peaceful, restorative moment'
        };

        let prompt = `${styleMap[style] || styleMap.fantasy}, ${moodMap[mood] || moodMap.dramatic}. `;
        prompt += `Scene: ${description}. `;

        if (sceneType && sceneTypeMap[sceneType]) {
            prompt += `${sceneTypeMap[sceneType]}. `;
        }

        if (elements.length > 0) {
            prompt += `Include: ${elements.join(', ')}. `;
        }

        prompt += 'RPG tabletop game illustration, high quality, detailed.';

        return prompt;
    }

    /**
     * Builds a prompt for scene illustrations
     * @param {string} description - Scene description
     * @param {string} location - Location type
     * @param {string} lighting - Lighting condition
     * @param {string[]} characters - Characters in scene
     * @param {string} [sceneType] - Scene type ('exploration', 'combat', 'social', 'rest')
     * @returns {string} The constructed prompt
     * @private
     */
    _buildScenePrompt(description, location, lighting, characters, sceneType) {
        const sceneTypeMap = {
            combat: 'dynamic action, battle stance, intense combat',
            social: 'character interaction, conversation, interpersonal dynamics',
            exploration: 'discovery, landscape, adventure atmosphere',
            rest: 'calm, peaceful, restorative moment'
        };

        let prompt = 'Fantasy RPG scene illustration, high fantasy art style, detailed. ';
        prompt += `Scene: ${description}. `;

        if (sceneType && sceneTypeMap[sceneType]) {
            prompt += `${sceneTypeMap[sceneType]}. `;
        }

        if (location) {
            prompt += `Location: ${location}. `;
        }

        if (lighting) {
            const lightingMap = {
                torchlit: 'warm torchlight, flickering shadows, orange glow',
                moonlight: 'soft moonlight, silver tones, night atmosphere',
                daylight: 'bright daylight, clear skies, natural lighting',
                candlelight: 'soft candlelight, intimate atmosphere, warm tones',
                magical: 'magical glow, ethereal light, mystical atmosphere'
            };
            prompt += `Lighting: ${lightingMap[lighting] || lighting}. `;
        }

        if (characters.length > 0) {
            prompt += `Characters: ${characters.join(', ')}. `;
        }

        prompt += 'Cinematic composition, tabletop RPG game art.';

        return prompt;
    }

    /**
     * Caches an image by downloading it
     * @param {GenerationResult} result - The generation result
     * @returns {Promise<void>}
     * @private
     */
    async _cacheImage(result) {
        if (!result.url) {return;}

        try {
            // Download the image
            const response = await fetch(result.url);
            if (!response.ok) {
                Logger.warn(`Failed to cache image: ${response.status}`, 'ImageGenerator');
                return;
            }

            const blob = await response.blob();
            const base64 = await this._blobToBase64(blob);

            // Create cache entry
            const cacheKey = this._generateCacheKey(result.prompt);
            const cacheEntry = {
                id: result.id || foundry.utils.randomID(),
                url: result.url,
                base64: base64,
                prompt: result.prompt,
                createdAt: result.createdAt,
                expiresAt: new Date(result.createdAt.getTime() + URL_EXPIRATION_MS),
                model: result.model,
                size: result.size,
                revisedPrompt: result.revisedPrompt,
                tags: result.tags || [],
                category: result.category || '',
                isFavorite: result.isFavorite || false,
                timestamp: result.timestamp || result.createdAt.toISOString(),
                session: result.session || '',
                scene: result.scene || ''
            };

            this._imageCache.set(cacheKey, cacheEntry);

            // Trim cache if needed
            this._trimCache();

            Logger.debug('Image cached successfully', 'ImageGenerator');

        } catch (error) {
            Logger.warn('Failed to cache image', 'ImageGenerator', error);
        }
    }

    /**
     * Converts a Blob to base64 string
     * @param {Blob} blob - The blob to convert
     * @returns {Promise<string>} The base64 string
     * @private
     */
    _blobToBase64(blob) {
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
     * Generates a cache key from a prompt
     * @param {string} prompt - The prompt
     * @returns {string} The cache key
     * @private
     */
    _generateCacheKey(prompt) {
        // Simple hash function for cache key
        let hash = 0;
        for (let i = 0; i < prompt.length; i++) {
            const char = prompt.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return `img_${Math.abs(hash).toString(16)}`;
    }

    /**
     * Trims the cache to stay within limits
     * @private
     */
    _trimCache() {
        if (this._imageCache.size <= this._maxCacheSize) {return;}

        // Remove oldest entries
        const entries = Array.from(this._imageCache.entries())
            .sort((a, b) => a[1].createdAt - b[1].createdAt);

        const toRemove = entries.slice(0, this._imageCache.size - this._maxCacheSize);
        for (const [key] of toRemove) {
            this._imageCache.delete(key);
        }
    }

    /**
     * Gets a cached image by prompt
     * @param {string} prompt - The prompt to search for
     * @returns {CachedImage|null} The cached image or null
     */
    getCachedImage(prompt) {
        const cacheKey = this._generateCacheKey(prompt);
        const cached = this._imageCache.get(cacheKey);

        if (!cached) {return null;}

        // Check if URL has expired
        if (new Date() > cached.expiresAt && !cached.base64) {
            this._imageCache.delete(cacheKey);
            return null;
        }

        return cached;
    }

    /**
     * Gets all cached images
     * @returns {CachedImage[]} Array of cached images
     */
    getAllCachedImages() {
        return Array.from(this._imageCache.values());
    }

    /**
     * Gets valid (non-expired) cached images
     * @returns {CachedImage[]} Array of valid cached images
     */
    getValidCachedImages() {
        const now = new Date();
        return this.getAllCachedImages().filter(img =>
            img.base64 || now <= img.expiresAt
        );
    }

    /**
     * Clears expired cache entries
     */
    clearExpiredCache() {
        const now = new Date();
        const expiredKeys = [];

        for (const [key, entry] of this._imageCache.entries()) {
            // Keep entries with base64 data even if URL expired
            if (!entry.base64 && now > entry.expiresAt) {
                expiredKeys.push(key);
            }
        }

        for (const key of expiredKeys) {
            this._imageCache.delete(key);
        }

        Logger.info(`Cleared ${expiredKeys.length} expired cache entries`, 'ImageGenerator');
    }

    /**
     * Clears all cached images
     */
    clearCache() {
        this._imageCache.clear();
    }

    /**
     * Saves an image to the persistent gallery
     * @param {Object} imageData - The image data to save
     * @returns {Promise<void>}
     */
    async saveToGallery(imageData) {
        try {
            let gallery = await this.loadGallery();
            const now = new Date();

            // Ensure all required metadata fields are present
            const galleryEntry = {
                id: imageData.id || foundry.utils.randomID(),
                url: imageData.url || '',
                base64: imageData.base64 || null,
                prompt: imageData.prompt || '',
                revisedPrompt: imageData.revisedPrompt || null,
                model: imageData.model || this._model,
                size: imageData.size || this._defaultSize,
                tags: imageData.tags || [],
                category: imageData.category || '',
                isFavorite: imageData.isFavorite || false,
                timestamp: imageData.timestamp || now.toISOString(),
                session: imageData.session || '',
                scene: imageData.scene || '',
                savedAt: now.toISOString()
            };

            gallery.push(galleryEntry);

            // Enforce storage limit: keep only 50 most recent images
            if (gallery.length > 50) {
                // Sort by savedAt timestamp (oldest first)
                gallery.sort((a, b) => new Date(a.savedAt) - new Date(b.savedAt));

                // Keep only the 50 most recent images
                const removedCount = gallery.length - 50;
                gallery = gallery.slice(-50);

                Logger.warn(`Gallery limit reached. Removed ${removedCount} oldest image(s) to maintain 50 image limit.`, 'ImageGenerator');
            }

            await game.settings.set(MODULE_ID, SETTINGS.IMAGE_GALLERY, gallery);
        } catch (error) {
            Logger.error('Failed to save image to gallery', 'ImageGenerator', error);
            throw error;
        }
    }

    /**
     * Loads the persistent gallery
     * @returns {Promise<Array>} The gallery array
     */
    async loadGallery() {
        try {
            const gallery = await game.settings.get(MODULE_ID, SETTINGS.IMAGE_GALLERY);
            return gallery || [];
        } catch (error) {
            Logger.error('Failed to load gallery', 'ImageGenerator', error);
            return [];
        }
    }

    /**
     * Syncs the gallery with settings storage
     * @param {Array} gallery - The gallery array to sync
     * @returns {Promise<void>}
     * @private
     */
    async _syncWithSettings(gallery) {
        try {
            await game.settings.set(MODULE_ID, SETTINGS.IMAGE_GALLERY, gallery);
        } catch (error) {
            Logger.error('Failed to sync gallery with settings', 'ImageGenerator', error);
            throw error;
        }
    }

    /**
     * Adds a tag to an image in the gallery
     * @param {string} imageId - The image ID
     * @param {string} tag - The tag to add
     * @returns {Promise<boolean>} True if successful, false if image not found
     */
    async addTag(imageId, tag) {
        if (!imageId || !tag) {
            Logger.warn('Invalid imageId or tag provided', 'ImageGenerator');
            return false;
        }

        try {
            const gallery = await this.loadGallery();
            const image = gallery.find(img => img.id === imageId);

            if (!image) {
                Logger.warn(`Image not found: ${imageId}`, 'ImageGenerator');
                return false;
            }

            // Initialize tags array if it doesn't exist
            if (!Array.isArray(image.tags)) {
                image.tags = [];
            }

            // Add tag if it doesn't already exist
            const normalizedTag = tag.trim();
            if (!image.tags.includes(normalizedTag)) {
                image.tags.push(normalizedTag);
                await this._syncWithSettings(gallery);
                Logger.debug(`Added tag "${normalizedTag}" to image ${imageId}`, 'ImageGenerator');
                return true;
            }

            return false;
        } catch (error) {
            Logger.error('Failed to add tag', 'ImageGenerator', error);
            throw error;
        }
    }

    /**
     * Removes a tag from an image in the gallery
     * @param {string} imageId - The image ID
     * @param {string} tag - The tag to remove
     * @returns {Promise<boolean>} True if successful, false if image not found
     */
    async removeTag(imageId, tag) {
        if (!imageId || !tag) {
            Logger.warn('Invalid imageId or tag provided', 'ImageGenerator');
            return false;
        }

        try {
            const gallery = await this.loadGallery();
            const image = gallery.find(img => img.id === imageId);

            if (!image) {
                Logger.warn(`Image not found: ${imageId}`, 'ImageGenerator');
                return false;
            }

            if (!Array.isArray(image.tags)) {
                return false;
            }

            const normalizedTag = tag.trim();
            const index = image.tags.indexOf(normalizedTag);

            if (index !== -1) {
                image.tags.splice(index, 1);
                await this._syncWithSettings(gallery);
                Logger.debug(`Removed tag "${normalizedTag}" from image ${imageId}`, 'ImageGenerator');
                return true;
            }

            return false;
        } catch (error) {
            Logger.error('Failed to remove tag', 'ImageGenerator', error);
            throw error;
        }
    }

    /**
     * Toggles the favorite status of an image in the gallery
     * @param {string} imageId - The image ID
     * @returns {Promise<boolean>} The new favorite status, or null if image not found
     */
    async toggleFavorite(imageId) {
        if (!imageId) {
            Logger.warn('Invalid imageId provided', 'ImageGenerator');
            return null;
        }

        try {
            const gallery = await this.loadGallery();
            const image = gallery.find(img => img.id === imageId);

            if (!image) {
                Logger.warn(`Image not found: ${imageId}`, 'ImageGenerator');
                return null;
            }

            image.isFavorite = !image.isFavorite;
            await this._syncWithSettings(gallery);
            Logger.debug(`Toggled favorite for image ${imageId}: ${image.isFavorite}`, 'ImageGenerator');
            return image.isFavorite;
        } catch (error) {
            Logger.error('Failed to toggle favorite', 'ImageGenerator', error);
            throw error;
        }
    }

    /**
     * Sets the category of an image in the gallery
     * @param {string} imageId - The image ID
     * @param {string} category - The category to set (location, npc, scene, item, etc.)
     * @returns {Promise<boolean>} True if successful, false if image not found
     */
    async setCategory(imageId, category) {
        if (!imageId) {
            Logger.warn('Invalid imageId provided', 'ImageGenerator');
            return false;
        }

        try {
            const gallery = await this.loadGallery();
            const image = gallery.find(img => img.id === imageId);

            if (!image) {
                Logger.warn(`Image not found: ${imageId}`, 'ImageGenerator');
                return false;
            }

            image.category = category || '';
            await this._syncWithSettings(gallery);
            Logger.debug(`Set category for image ${imageId}: ${category}`, 'ImageGenerator');
            return true;
        } catch (error) {
            Logger.error('Failed to set category', 'ImageGenerator', error);
            throw error;
        }
    }

    /**
     * Deletes an image from the gallery
     * @param {string} imageId - The image ID to delete
     * @returns {Promise<boolean>} True if successful, false if image not found
     */
    async deleteImage(imageId) {
        if (!imageId) {
            Logger.warn('Invalid imageId provided', 'ImageGenerator');
            return false;
        }

        try {
            const gallery = await this.loadGallery();
            const index = gallery.findIndex(img => img.id === imageId);

            if (index === -1) {
                Logger.warn(`Image not found: ${imageId}`, 'ImageGenerator');
                return false;
            }

            gallery.splice(index, 1);
            await this._syncWithSettings(gallery);
            Logger.debug(`Deleted image ${imageId} from gallery`, 'ImageGenerator');
            return true;
        } catch (error) {
            Logger.error('Failed to delete image', 'ImageGenerator', error);
            throw error;
        }
    }

    /**
     * Gets all images from the gallery with optional filters
     * @param {Object} [filters={}] - Filter options
     * @param {string} [filters.category] - Filter by category
     * @param {string} [filters.tag] - Filter by tag
     * @param {boolean} [filters.isFavorite] - Filter by favorite status
     * @param {string} [filters.session] - Filter by session
     * @returns {Promise<GalleryEntry[]>} Filtered gallery entries
     */
    async getGalleryImages(filters = {}) {
        try {
            let gallery = await this.loadGallery();

            if (filters.category) {
                gallery = gallery.filter(img => img.category === filters.category);
            }

            if (filters.tag) {
                gallery = gallery.filter(img =>
                    Array.isArray(img.tags) && img.tags.includes(filters.tag)
                );
            }

            if (typeof filters.isFavorite === 'boolean') {
                gallery = gallery.filter(img => img.isFavorite === filters.isFavorite);
            }

            if (filters.session) {
                gallery = gallery.filter(img => img.session === filters.session);
            }

            return gallery;
        } catch (error) {
            Logger.error('Failed to get gallery images', 'ImageGenerator', error);
            return [];
        }
    }

    /**
     * Gets a single image from the gallery by ID
     * @param {string} imageId - The image ID
     * @returns {Promise<GalleryEntry|null>} The gallery entry or null if not found
     */
    async getGalleryImage(imageId) {
        if (!imageId) {
            return null;
        }

        try {
            const gallery = await this.loadGallery();
            return gallery.find(img => img.id === imageId) || null;
        } catch (error) {
            Logger.error('Failed to get gallery image', 'ImageGenerator', error);
            return null;
        }
    }

    /**
     * Clears the entire gallery
     * @returns {Promise<void>}
     */
    async clearGallery() {
        try {
            await this._syncWithSettings([]);
            Logger.info('Gallery cleared', 'ImageGenerator');
        } catch (error) {
            Logger.error('Failed to clear gallery', 'ImageGenerator', error);
            throw error;
        }
    }

    /**
     * Handles API errors and returns user-friendly error messages
     * Overrides base class to add image-specific error handling
     * @param {Object} error - The API error
     * @param {string} [operation='Image Generation'] - The operation being performed
     * @returns {Error} A user-friendly error
     * @private
     */
    _handleApiError(error, operation = 'Image Generation') {
        // Check for image-specific errors (content policy)
        if (error.status === 400 && error.message && error.message.includes('safety')) {
            const message = game.i18n.localize('NARRATOR.Errors.ContentPolicy');
            return new Error(message);
        }

        // Delegate to base class for standard error handling
        return super._handleApiError(error, operation);
    }

    /**
     * Gets available image sizes
     * @returns {Object} Object with size constants
     */
    static getSizes() {
        return { ...IMAGE_SIZES };
    }

    /**
     * Gets available quality options
     * @returns {Object} Object with quality constants
     */
    static getQualityOptions() {
        return { ...IMAGE_QUALITY };
    }

    /**
     * Gets available style options
     * @returns {Object} Object with style constants
     */
    static getStyleOptions() {
        return { ...IMAGE_STYLES };
    }

    /**
     * Gets service statistics
     * Overrides base class to add image-specific statistics
     * @returns {Object} Statistics about the service usage
     */
    getStats() {
        // Get base statistics
        const baseStats = super.getStats();

        // Add image-specific statistics
        return {
            ...baseStats,
            model: this._model,
            defaultSize: this._defaultSize,
            defaultQuality: this._defaultQuality,
            autoCacheEnabled: this._autoCacheImages,
            cacheSize: this._imageCache.size,
            validCacheEntries: this.getValidCachedImages().length,
            totalGenerated: this._history.length
        };
    }
}
