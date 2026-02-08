/**
 * JournalPicker - Journal and Folder Selection Dialog
 * FormApplication for selecting multiple journals and folders as AI context sources
 * @module journal-picker
 */

import { MODULE_ID, SettingsManager } from './settings.js';

/**
 * JournalPicker - Multi-select journal/folder picker dialog
 * Displays hierarchical tree of folders and journals with checkboxes
 * @extends FormApplication
 */
export class JournalPicker extends FormApplication {
    /**
     * Creates a new JournalPicker instance
     * @param {Object} options - Application options
     */
    constructor(options = {}) {
        super({}, options);

        /**
         * Settings manager instance
         * @type {SettingsManager}
         */
        this.settingsManager = new SettingsManager();

        /**
         * Currently selected journal/folder IDs
         * @type {Set<string>}
         */
        this.selectedIds = new Set(this.settingsManager.getSelectedJournals());

        /**
         * Expanded folder IDs (UI state)
         * @type {Set<string>}
         */
        this.expandedFolders = new Set();

        /**
         * Callback when selection is saved
         * @type {Function|null}
         */
        this.onSave = null;
    }

    /**
     * Default application options
     * @returns {Object} The default options
     */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: 'narrator-journal-picker',
            title: game.i18n.localize('NARRATOR.Panel.JournalPicker.Title'),
            template: `modules/${MODULE_ID}/templates/journal-picker.hbs`,
            classes: ['narrator-master', 'journal-picker'],
            width: 500,
            height: 600,
            resizable: true,
            closeOnSubmit: false,
            submitOnChange: false,
            submitOnClose: false
        });
    }

    /**
     * Gets data for the Handlebars template
     * @returns {Object} Template data
     */
    getData() {
        // Build hierarchical folder structure
        const folderTree = this._buildFolderTree();

        // Get root-level journals (no folder)
        const rootJournals = this._getRootJournals();

        // Count totals
        const totalFolders = game.folders.filter(f => f.type === 'JournalEntry').length;
        const totalJournals = game.journal.size;

        return {
            // Module info
            moduleId: MODULE_ID,

            // Tree data
            folderTree,
            rootJournals,
            hasFolders: folderTree.length > 0,
            hasJournals: totalJournals > 0,

            // Selection state
            selectedCount: this.selectedIds.size,
            totalCount: totalFolders + totalJournals,

            // UI state
            expandedFolders: Array.from(this.expandedFolders)
        };
    }

    /**
     * Builds hierarchical folder tree with nested journals
     * @returns {Array<Object>} Folder tree structure
     * @private
     */
    _buildFolderTree() {
        const journalFolders = game.folders.filter(f => f.type === 'JournalEntry');

        // Get root-level folders (no parent)
        const rootFolders = journalFolders.filter(f => !f.folder);

        // Recursively build tree
        return rootFolders.map(folder => this._buildFolderNode(folder));
    }

    /**
     * Builds a single folder node with children
     * @param {Folder} folder - Foundry Folder object
     * @returns {Object} Folder node data
     * @private
     */
    _buildFolderNode(folder) {
        // Get child folders
        const childFolders = game.folders.filter(f =>
            f.type === 'JournalEntry' && f.folder?.id === folder.id
        );

        // Get journals in this folder
        const journals = game.journal.filter(j => j.folder?.id === folder.id);

        // Build node
        return {
            id: folder.id,
            name: folder.name,
            type: 'folder',
            selected: this.selectedIds.has(folder.id),
            expanded: this.expandedFolders.has(folder.id),

            // Children
            folders: childFolders.map(f => this._buildFolderNode(f)),
            journals: journals.map(j => ({
                id: j.id,
                name: j.name,
                type: 'journal',
                selected: this.selectedIds.has(j.id)
            })),

            // Counts
            hasChildren: childFolders.length > 0 || journals.length > 0,
            journalCount: journals.length,
            folderCount: childFolders.length
        };
    }

    /**
     * Gets journals not in any folder
     * @returns {Array<Object>} Root journal data
     * @private
     */
    _getRootJournals() {
        return game.journal
            .filter(j => !j.folder)
            .map(j => ({
                id: j.id,
                name: j.name,
                type: 'journal',
                selected: this.selectedIds.has(j.id)
            }));
    }

    /**
     * Activates event listeners
     * @param {jQuery} html - Rendered HTML
     */
    activateListeners(html) {
        super.activateListeners(html);

        // Journal/folder checkbox toggle
        html.find('.journal-checkbox, .folder-checkbox').change(this._onToggleSelection.bind(this));

        // Folder expand/collapse
        html.find('.folder-toggle').click(this._onToggleFolder.bind(this));

        // Select All / Deselect All buttons
        html.find('.select-all-btn').click(this._onSelectAll.bind(this));
        html.find('.deselect-all-btn').click(this._onDeselectAll.bind(this));

        // Save button
        html.find('.save-selection-btn').click(this._onSaveSelection.bind(this));

        // Cancel button
        html.find('.cancel-btn').click(this._onCancel.bind(this));
    }

    /**
     * Handles journal/folder selection toggle
     * @param {Event} event - Change event
     * @private
     */
    _onToggleSelection(event) {
        event.preventDefault();
        const checkbox = event.currentTarget;
        const itemId = checkbox.dataset.id;
        const itemType = checkbox.dataset.type;

        if (checkbox.checked) {
            this.selectedIds.add(itemId);

            // If folder selected, auto-select all contained journals
            if (itemType === 'folder') {
                this._selectFolderContents(itemId);
            }
        } else {
            this.selectedIds.delete(itemId);

            // If folder deselected, deselect all contained journals
            if (itemType === 'folder') {
                this._deselectFolderContents(itemId);
            }
        }

        // Re-render to update UI
        this.render(false);
    }

    /**
     * Selects all journals in a folder recursively
     * @param {string} folderId - Folder ID
     * @private
     */
    _selectFolderContents(folderId) {
        // Select journals in this folder
        const journals = game.journal.filter(j => j.folder?.id === folderId);
        journals.forEach(j => this.selectedIds.add(j.id));

        // Recursively select child folders and their contents
        const childFolders = game.folders.filter(f =>
            f.type === 'JournalEntry' && f.folder?.id === folderId
        );
        childFolders.forEach(f => {
            this.selectedIds.add(f.id);
            this._selectFolderContents(f.id);
        });
    }

    /**
     * Deselects all journals in a folder recursively
     * @param {string} folderId - Folder ID
     * @private
     */
    _deselectFolderContents(folderId) {
        // Deselect journals in this folder
        const journals = game.journal.filter(j => j.folder?.id === folderId);
        journals.forEach(j => this.selectedIds.delete(j.id));

        // Recursively deselect child folders and their contents
        const childFolders = game.folders.filter(f =>
            f.type === 'JournalEntry' && f.folder?.id === folderId
        );
        childFolders.forEach(f => {
            this.selectedIds.delete(f.id);
            this._deselectFolderContents(f.id);
        });
    }

    /**
     * Handles folder expand/collapse toggle
     * @param {Event} event - Click event
     * @private
     */
    _onToggleFolder(event) {
        event.preventDefault();
        const folderId = event.currentTarget.dataset.folderId;

        if (this.expandedFolders.has(folderId)) {
            this.expandedFolders.delete(folderId);
        } else {
            this.expandedFolders.add(folderId);
        }

        // Re-render to update UI
        this.render(false);
    }

    /**
     * Handles Select All button click
     * @param {Event} event - Click event
     * @private
     */
    _onSelectAll(event) {
        event.preventDefault();

        // Select all folders
        game.folders
            .filter(f => f.type === 'JournalEntry')
            .forEach(f => this.selectedIds.add(f.id));

        // Select all journals
        game.journal.forEach(j => this.selectedIds.add(j.id));

        // Re-render to update UI
        this.render(false);
    }

    /**
     * Handles Deselect All button click
     * @param {Event} event - Click event
     * @private
     */
    _onDeselectAll(event) {
        event.preventDefault();

        // Clear all selections
        this.selectedIds.clear();

        // Re-render to update UI
        this.render(false);
    }

    /**
     * Handles Save Selection button click
     * @param {Event} event - Click event
     * @private
     */
    async _onSaveSelection(event) {
        event.preventDefault();

        // Save to settings
        const selectedArray = Array.from(this.selectedIds);
        await this.settingsManager.setSelectedJournals(selectedArray);

        // Notify success
        ui.notifications.info(
            game.i18n.localize('NARRATOR.Notifications.SettingsSaved')
        );

        // Trigger callback if provided
        if (this.onSave && typeof this.onSave === 'function') {
            this.onSave(selectedArray);
        }

        // Close dialog
        this.close();
    }

    /**
     * Handles Cancel button click
     * @param {Event} event - Click event
     * @private
     */
    _onCancel(event) {
        event.preventDefault();

        // Reset selections to saved state
        this.selectedIds = new Set(this.settingsManager.getSelectedJournals());

        // Close dialog
        this.close();
    }

    /**
     * Override _updateObject to prevent default form submission
     * @param {Event} event - Form submission event
     * @param {Object} formData - Form data
     * @private
     */
    async _updateObject(event, formData) {
        // Do nothing - we handle saves manually via buttons
    }
}
