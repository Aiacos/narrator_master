/**
 * Journal Utilities Module for Narrator Master
 * Provides utility functions for working with journals and folders
 * @module journal-utils
 */

import { MODULE_ID } from './settings.js';
import { Logger } from './logger.js';

/**
 * Expands a folder ID to all journal IDs contained within it (recursively)
 * @param {string} folderId - The folder ID to expand
 * @returns {string[]} Array of journal IDs contained in the folder and its subfolders
 * @throws {Error} If the folder is not found or is not a JournalEntry folder
 */
export function expandFolderToJournals(folderId) {
    if (!folderId || typeof folderId !== 'string') {
        throw new Error('Invalid folder ID provided');
    }

    // Access folder via Foundry VTT API
    const folder = game.folders.get(folderId);
    if (!folder) {
        throw new Error(`Folder not found: ${folderId}`);
    }

    // Verify it's a JournalEntry folder
    if (folder.type !== 'JournalEntry') {
        throw new Error(`Folder is not a JournalEntry folder: ${folderId}`);
    }

    const journalIds = [];

    // Get journals directly in this folder
    const journals = game.journal.filter(j => j.folder?.id === folderId);
    journals.forEach(j => journalIds.push(j.id));

    // Recursively get journals from child folders
    const childFolders = game.folders.filter(f =>
        f.type === 'JournalEntry' && f.folder?.id === folderId
    );

    for (const childFolder of childFolders) {
        const childJournalIds = expandFolderToJournals(childFolder.id);
        journalIds.push(...childJournalIds);
    }

    Logger.debug(`Expanded folder "${folder.name}" to ${journalIds.length} journals`, 'expandFolderToJournals');

    return journalIds;
}

/**
 * Resolves a mixed array of folder and journal IDs to just journal IDs
 * Expands any folder IDs to their contained journal IDs
 * @param {string[]} ids - Array of folder and/or journal IDs
 * @returns {string[]} Array of unique journal IDs
 */
export function resolveToJournalIds(ids) {
    if (!Array.isArray(ids)) {
        Logger.warn(`resolveToJournalIds expects an array, got: ${typeof ids}`, 'resolveToJournalIds');
        return [];
    }

    const journalIds = new Set();

    for (const id of ids) {
        if (!id || typeof id !== 'string') {
            Logger.warn('Invalid ID in array', 'resolveToJournalIds', id);
            continue;
        }

        // Check if it's a folder
        const folder = game.folders.get(id);
        if (folder && folder.type === 'JournalEntry') {
            // Expand folder to journal IDs
            try {
                const expandedIds = expandFolderToJournals(id);
                expandedIds.forEach(jId => journalIds.add(jId));
            } catch (error) {
                Logger.warn(`Failed to expand folder ${id}`, 'resolveToJournalIds', error);
            }
            continue;
        }

        // Check if it's a journal
        const journal = game.journal.get(id);
        if (journal) {
            journalIds.add(id);
            continue;
        }

        // ID not found
        Logger.warn(`ID not found (not a journal or folder): ${id}`, 'resolveToJournalIds');
    }

    const result = Array.from(journalIds);
    Logger.debug(`Resolved ${ids.length} IDs to ${result.length} unique journal IDs`, 'resolveToJournalIds');

    return result;
}

/**
 * Gets all journal IDs in the game
 * @returns {string[]} Array of all journal IDs
 */
export function getAllJournalIds() {
    if (!game.journal) {
        Logger.warn('Journal collection not available', 'getAllJournalIds');
        return [];
    }

    return game.journal.map(j => j.id);
}

/**
 * Checks if an ID is a folder ID
 * @param {string} id - The ID to check
 * @returns {boolean} True if the ID is a JournalEntry folder
 */
export function isJournalFolder(id) {
    if (!id || typeof id !== 'string') {
        return false;
    }

    const folder = game.folders.get(id);
    return folder && folder.type === 'JournalEntry';
}

/**
 * Checks if an ID is a journal ID
 * @param {string} id - The ID to check
 * @returns {boolean} True if the ID is a journal
 */
export function isJournal(id) {
    if (!id || typeof id !== 'string') {
        return false;
    }

    return game.journal.has(id);
}

/**
 * Gets statistics about a selection of IDs
 * @param {string[]} ids - Array of folder and/or journal IDs
 * @returns {Object} Statistics object with folder and journal counts
 */
export function getSelectionStats(ids) {
    if (!Array.isArray(ids)) {
        return { folders: 0, journals: 0, totalJournals: 0 };
    }

    let folderCount = 0;
    let directJournalCount = 0;
    const allJournalIds = resolveToJournalIds(ids);

    for (const id of ids) {
        if (isJournalFolder(id)) {
            folderCount++;
        } else if (isJournal(id)) {
            directJournalCount++;
        }
    }

    return {
        folders: folderCount,
        journals: directJournalCount,
        totalJournals: allJournalIds.length
    };
}
