/**
 * Canvas - Personal Visual Collection Manager
 * 
 * A privacy-first, device-local application for managing visual collections.
 * All data is stored locally using browser storage.
 * 
 * @author DLU
 * @version 2.0.0
 */

// ========================================
// Configuration & Constants
// ========================================

const CONFIG = {
    STORAGE_KEY: 'canvas_vault_v2',
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    DEBOUNCE_DELAY: 300,
    TOAST_DURATION: 3000
};

// ========================================
// Utility Functions
// ========================================

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text safe for HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Create a unique ID
 * @returns {string} Unique identifier
 */
function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate URL string
 * @param {string} string - URL to validate
 * @returns {boolean} True if valid URL
 */
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch {
        return false;
    }
}

/**
 * Debounce function to limit execution frequency
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
}

/**
 * Format date to user-friendly string
 * @param {string} isoDate - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(isoDate) {
    return new Date(isoDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Show temporary notification
 * @param {string} message - Message to display
 * @param {string} type - Type: 'success', 'error', 'info'
 */
function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.textContent = message;
    
    // Add to DOM
    document.body.appendChild(toast);
    
    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('toast-visible');
    });
    
    // Remove after delay
    setTimeout(() => {
        toast.classList.remove('toast-visible');
        setTimeout(() => toast.remove(), 300);
    }, CONFIG.TOAST_DURATION);
}

// ========================================
// Canvas Class
// ========================================

class Canvas {
    constructor() {
        this.items = [];
        this.filteredItems = [];
        this.currentDraftImage = null;
        this.currentDraftLink = null;
        this.searchQuery = '';
        
        // Initialize
        this.loadFromStorage();
        this.attachEventListeners();
        this.checkFirstRun();
        this.render();
    }

    /**
     * Load items from browser storage
     */
    loadFromStorage() {
        try {
            const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
            this.items = stored ? JSON.parse(stored) : [];
            this.validateItems();
        } catch (error) {
            console.error('Failed to load items from storage:', error);
            this.items = [];
        }
    }

    /**
     * Save items to browser storage
     */
    saveToStorage() {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(this.items));
        } catch (error) {
            console.error('Failed to save to storage:', error);
            
            if (error.name === 'QuotaExceededError') {
                showToast('Storage is full. Please export and clear some items.', 'error');
            } else {
                showToast('Failed to save. Please try again.', 'error');
            }
        }
    }

    /**
     * Validate items structure and remove invalid ones
     */
    validateItems() {
        this.items = this.items.filter(item => {
            const isValid = item.id && item.name && item.link && item.timestamp;
            if (!isValid) {
                console.warn('Invalid item removed:', item);
            }
            return isValid;
        });
    }

    /**
     * Show welcome modal on first run
     */
    checkFirstRun() {
        const hasVisited = sessionStorage.getItem('canvas_visited');
        if (!hasVisited && this.items.length === 0) {
            const modal = document.getElementById('welcomeModal');
            modal?.classList.remove('hidden');
            sessionStorage.setItem('canvas_visited', 'true');
        }
    }

    /**
     * Attach all event listeners
     */
    attachEventListeners() {
        // Welcome modal
        document.getElementById('welcomeClose')?.addEventListener('click', () => {
            document.getElementById('welcomeModal').classList.add('hidden');
        });

        // Input handlers
        const urlInput = document.getElementById('urlInput');
        urlInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('imageInput')?.click();
            }
        });

        // Paste button
        document.getElementById('pasteBtn')?.addEventListener('click', () => {
            this.pasteFromClipboard();
        });

        // File input
        const imageInput = document.getElementById('imageInput');
        imageInput?.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.processImageFile(e.target.files[0]);
            }
        });

        // Drop zone
        this.attachDropZoneListeners();

        // Draft modal
        document.getElementById('draftCancel')?.addEventListener('click', () => {
            this.closeDraftModal();
        });

        document.getElementById('draftConfirm')?.addEventListener('click', () => {
            this.confirmDraftAdd();
        });

        // Item modal
        document.getElementById('modalClose')?.addEventListener('click', () => {
            this.closeItemModal();
        });

        // Search with debounce
        const searchInput = document.getElementById('searchInput');
        searchInput?.addEventListener('input', debounce((e) => {
            this.filterItems(e.target.value);
        }, CONFIG.DEBOUNCE_DELAY));

        // Export/Import
        document.getElementById('exportBtn')?.addEventListener('click', () => {
            this.exportJSON();
        });

        document.getElementById('importBtn')?.addEventListener('click', () => {
            document.getElementById('jsonInput')?.click();
        });

        document.getElementById('jsonInput')?.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.importJSON(e.target.files[0]);
            }
        });

        // Close modals on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.getElementById('draftModal')?.classList.add('hidden');
                document.getElementById('itemModal')?.classList.add('hidden');
            }
        });

        // Drop zone keyboard support
        const dropZone = document.getElementById('dropZone');
        dropZone?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                document.getElementById('imageInput')?.click();
            }
        });
    }

    /**
     * Attach drop zone specific listeners
     */
    attachDropZoneListeners() {
        const dropZone = document.getElementById('dropZone');
        if (!dropZone) return;

        dropZone.addEventListener('click', () => {
            document.getElementById('imageInput')?.click();
        });

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            this.handleDropZoneDrop(e);
        });
    }

    /**
     * Handle file drops on drop zone
     * @param {DragEvent} e - Drop event
     */
    handleDropZoneDrop(e) {
        const items = e.dataTransfer.items;
        const files = e.dataTransfer.files;

        // Check for URL drops
        if (items) {
            for (let item of items) {
                if (item.type === 'text/uri-list' || item.type === 'text/plain') {
                    item.getAsString((url) => {
                        if (isValidUrl(url)) {
                            document.getElementById('urlInput').value = url;
                            document.getElementById('imageInput')?.click();
                        }
                    });
                    return;
                }
            }
        }

        // Handle image files
        if (files?.[0]?.type.startsWith('image/')) {
            this.processImageFile(files[0]);
        }
    }

    /**
     * Paste URL from clipboard
     */
    async pasteFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            if (isValidUrl(text)) {
                document.getElementById('urlInput').value = text;
                showToast('URL pasted', 'success');
            } else {
                showToast('Clipboard does not contain a valid URL', 'error');
            }
        } catch {
            showToast('Unable to read clipboard. Please check permissions.', 'error');
        }
    }

    /**
     * Process image file
     * @param {File} file - Image file to process
     */
    processImageFile(file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            showToast('Please select an image file', 'error');
            return;
        }

        // Validate file size
        if (file.size > CONFIG.MAX_FILE_SIZE) {
            showToast('Image is too large. Maximum 5MB allowed.', 'error');
            return;
        }

        // Read file
        const reader = new FileReader();
        reader.onload = (e) => {
            const urlInput = document.getElementById('urlInput');
            this.currentDraftImage = e.target.result;
            this.currentDraftLink = urlInput?.value.trim() || '';

            if (!this.currentDraftLink) {
                showToast('Please enter a URL first', 'error');
                this.currentDraftImage = null;
                return;
            }

            this.showDraftModal();
        };

        reader.onerror = () => {
            showToast('Failed to read image', 'error');
        };

        reader.readAsDataURL(file);
    }

    /**
     * Show draft preview modal
     */
    showDraftModal() {
        const modal = document.getElementById('draftModal');
        const draftImage = document.getElementById('draftImage');
        const draftName = document.getElementById('draftName');

        if (!modal) return;

        // Set image preview
        if (this.currentDraftImage) {
            draftImage.innerHTML = `<img src="${this.currentDraftImage}" alt="Preview" />`;
        } else {
            draftImage.innerHTML = '<div class="card-placeholder">No image</div>';
        }

        // Clear and focus name input
        if (draftName) {
            draftName.value = '';
            draftName.focus();
        }

        modal.classList.remove('hidden');
        modal.scrollTop = 0;
    }

    /**
     * Close draft modal
     */
    closeDraftModal() {
        const modal = document.getElementById('draftModal');
        if (modal) {
            modal.classList.add('hidden');
        }
        
        this.currentDraftImage = null;
        this.currentDraftLink = null;
        document.getElementById('urlInput').value = '';
        document.getElementById('imageInput').value = '';
    }

    /**
     * Confirm adding draft item to canvas
     */
    confirmDraftAdd() {
        const name = document.getElementById('draftName')?.value.trim();

        if (!name) {
            showToast('Please enter an item name', 'error');
            return;
        }

        if (!isValidUrl(this.currentDraftLink)) {
            showToast('Invalid URL', 'error');
            return;
        }

        // Create item
        const item = {
            id: generateId(),
            name: name,
            link: this.currentDraftLink,
            image: this.currentDraftImage,
            timestamp: new Date().toISOString()
        };

        // Add to collection
        this.items.unshift(item);
        this.saveToStorage();
        this.render();
        this.closeDraftModal();

        showToast('Item added to canvas', 'success');
    }

    /**
     * Delete item by ID
     * @param {string} id - Item ID
     */
    deleteItem(id) {
        if (!confirm('Delete this item from your canvas?')) {
            return;
        }

        this.items = this.items.filter(item => item.id !== id);
        this.saveToStorage();
        this.render();
        this.closeItemModal();

        showToast('Item deleted', 'success');
    }

    /**
     * Show item detail modal
     * @param {Object} item - Item to display
     */
    showItemModal(item) {
        const modal = document.getElementById('itemModal');
        const body = document.getElementById('modalBody');

        if (!modal || !body) return;

        const date = formatDate(item.timestamp);
        const imageHtml = item.image 
            ? `<div class="item-modal-image"><img src="${item.image}" alt="${escapeHtml(item.name)}" /></div>` 
            : '';

        body.innerHTML = `
            ${imageHtml}
            <div class="item-modal-info">
                <div class="item-modal-name">${escapeHtml(item.name)}</div>
                <div class="item-modal-date">Added ${date}</div>
                <div class="item-modal-link">${escapeHtml(item.link)}</div>
                <div class="modal-actions">
                    <button class="btn btn-primary" id="visitBtn">Visit Source</button>
                    <button class="btn btn-secondary" id="deleteBtn">Delete</button>
                </div>
            </div>
        `;

        // Event listeners for buttons
        document.getElementById('visitBtn')?.addEventListener('click', () => {
            window.open(item.link, '_blank', 'noopener,noreferrer');
        });

        document.getElementById('deleteBtn')?.addEventListener('click', () => {
            this.deleteItem(item.id);
        });

        modal.classList.remove('hidden');
        modal.scrollTop = 0;
    }

    /**
     * Close item detail modal
     */
    closeItemModal() {
        const modal = document.getElementById('itemModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    /**
     * Filter items by search query
     * @param {string} query - Search query
     */
    filterItems(query) {
        this.searchQuery = query.toLowerCase();
        
        const cards = document.querySelectorAll('.canvas-card');
        let visibleCount = 0;

        cards.forEach(card => {
            const itemName = card.dataset.name.toLowerCase();
            const match = itemName.includes(this.searchQuery);
            
            card.style.display = match ? '' : 'none';
            if (match) visibleCount++;
        });

        // Update empty state if needed
        const emptyState = document.getElementById('emptyState');
        if (emptyState && visibleCount === 0 && this.searchQuery) {
            emptyState.style.display = 'flex';
            emptyState.querySelector('.empty-title').textContent = 'No results found';
        }
    }

    /**
     * Render canvas grid with all items
     */
    render() {
        const grid = document.getElementById('canvasGrid');
        const emptyState = document.getElementById('emptyState');
        const itemCount = document.getElementById('itemCount');

        if (!grid || !emptyState || !itemCount) return;

        // Clear grid
        grid.innerHTML = '';

        // Show empty state if no items
        if (this.items.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'flex';
            itemCount.textContent = '0 items';
            return;
        }

        // Show grid
        grid.style.display = 'grid';
        emptyState.style.display = 'none';
        itemCount.textContent = `${this.items.length} item${this.items.length !== 1 ? 's' : ''}`;

        // Render cards
        this.items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'canvas-card';
            card.dataset.name = item.name;
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');

            const imageHtml = item.image
                ? `<img src="${item.image}" alt="" />`
                : '<div class="card-placeholder">No image</div>';

            card.innerHTML = `
                <div class="card-image">
                    ${imageHtml}
                </div>
                <div class="card-name">${escapeHtml(item.name)}</div>
            `;

            // Click handler
            card.addEventListener('click', () => this.showItemModal(item));

            // Keyboard handler
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.showItemModal(item);
                }
            });

            grid.appendChild(card);
        });
    }

    /**
     * Export items as JSON file
     */
    exportJSON() {
        if (this.items.length === 0) {
            showToast('Nothing to export', 'error');
            return;
        }

        const data = JSON.stringify(this.items, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = `canvas-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        URL.revokeObjectURL(url);
        showToast('Collection exported', 'success');
    }

    /**
     * Import items from JSON file
     * @param {File} file - JSON file to import
     */
    importJSON(file) {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);

                // Validate structure
                if (!Array.isArray(imported)) {
                    throw new Error('Invalid format: expected an array');
                }

                const validItems = imported.filter(item => {
                    const isValid = item.id && item.name && item.link && item.timestamp;
                    if (!isValid) {
                        console.warn('Skipping invalid item:', item);
                    }
                    return isValid;
                });

                if (validItems.length === 0) {
                    throw new Error('No valid items found in file');
                }

                // Confirm import
                const message = `Import ${validItems.length} item${validItems.length !== 1 ? 's' : ''}? Duplicates will be skipped.`;
                if (!confirm(message)) {
                    return;
                }

                // Merge items (newer first)
                const existingIds = new Set(this.items.map(i => i.id));
                const newItems = validItems.filter(item => !existingIds.has(item.id));

                this.items.unshift(...newItems);
                this.saveToStorage();
                this.render();

                showToast(`Imported ${newItems.length} new item${newItems.length !== 1 ? 's' : ''}`, 'success');
            } catch (error) {
                console.error('Import error:', error);
                showToast('Failed to import. Check file format.', 'error');
            }
        };

        reader.onerror = () => {
            showToast('Failed to read file', 'error');
        };

        reader.readAsText(file);
        document.getElementById('jsonInput').value = '';
    }
}

// ========================================
// Initialize Application
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    new Canvas();
});
