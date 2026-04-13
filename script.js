const STORAGE_KEY = 'dlu_vault';
const MAX_FILE_SIZE = 5 * 1024 * 1024;

class Vault {
    constructor() {
        this.items = this.loadFromStorage();
        this.currentDraftImage = null;
        this.currentDraftLink = null;
        this.setupEventListeners();
        this.checkFirstRun();
        this.renderVault();
    }

    loadFromStorage() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading from storage:', error);
            return [];
        }
    }

    saveToStorage() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
        } catch (error) {
            console.error('Error saving to storage:', error);
            alert('Failed to save. Storage may be full.');
        }
    }

    checkFirstRun() {
        const hasVisited = localStorage.getItem('vault_visited');
        if (!hasVisited && this.items.length === 0) {
            this.showWelcomeModal();
            localStorage.setItem('vault_visited', 'true');
            this.showTooltips();
        }
    }

    showWelcomeModal() {
        const modal = document.getElementById('welcomeModal');
        modal.classList.remove('hidden');
        document.getElementById('welcomeClose').addEventListener('click', () => {
            modal.classList.add('hidden');
        });
    }

    showTooltips() {
        const tooltips = [
            {
                element: document.getElementById('urlInput'),
                text: 'Paste or type a URL here',
                position: 'bottom'
            },
            {
                element: document.getElementById('dropZone'),
                text: 'Drop images or URLs here',
                position: 'bottom'
            },
            {
                element: document.getElementById('exportBtn'),
                text: 'Download your vault as JSON',
                position: 'bottom'
            }
        ];

        const container = document.getElementById('tooltipContainer');
        tooltips.forEach((tip, index) => {
            setTimeout(() => {
                this.createTooltip(tip, container);
            }, index * 1500);
        });
    }

    createTooltip(config, container) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = config.text;

        const rect = config.element.getBoundingClientRect();
        tooltip.style.left = (rect.left + rect.width / 2 - 50) + 'px';

        if (config.position === 'bottom') {
            tooltip.style.top = (rect.bottom + 10) + 'px';
        }

        container.appendChild(tooltip);

        setTimeout(() => {
            tooltip.style.transition = 'opacity 0.3s';
            tooltip.style.opacity = '0';
            setTimeout(() => tooltip.remove(), 300);
        }, 2500);
    }

    setupEventListeners() {
        // URL input
        document.getElementById('urlInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.triggerFilePicker();
        });

        // Paste button
        document.getElementById('pasteBtn').addEventListener('click', () => this.pasteFromClipboard());

        // Drop zone
        const dropZone = document.getElementById('dropZone');
        const imageInput = document.getElementById('imageInput');

        dropZone.addEventListener('click', () => imageInput.click());

        imageInput.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.processImageFile(e.target.files[0]);
            }
        });

        // Drag and drop
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

        // Export/Import
        document.getElementById('exportBtn').addEventListener('click', () => this.exportJSON());
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('jsonInput').click();
        });

        document.getElementById('jsonInput').addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.importJSON(e.target.files[0]);
            }
        });

        // Draft modal
        document.getElementById('draftCancel').addEventListener('click', () => {
            this.closeDraftModal();
        });

        document.getElementById('draftConfirm').addEventListener('click', () => {
            this.confirmDraftAdd();
        });

        // Item modal
        document.getElementById('modalClose').addEventListener('click', () => {
            this.closeItemModal();
        });

        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterVault(e.target.value);
        });
    }

    handleDropZoneDrop(e) {
        const files = e.dataTransfer.files;
        const items = e.dataTransfer.items;

        // Check for URL links first (text/uri-list)
        if (items) {
            for (let item of items) {
                if (item.type === 'text/uri-list') {
                    item.getAsString((url) => {
                        if (this.isValidUrl(url)) {
                            document.getElementById('urlInput').value = url;
                            this.triggerFilePicker();
                        }
                    });
                    return;
                }
            }
        }

        // Otherwise handle image files
        if (files[0] && files[0].type.startsWith('image/')) {
            this.processImageFile(files[0]);
        }
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    pasteFromClipboard() {
        navigator.clipboard.readText()
            .then(text => {
                if (this.isValidUrl(text)) {
                    document.getElementById('urlInput').value = text;
                } else {
                    alert('Clipboard does not contain a valid URL');
                }
            })
            .catch(() => {
                alert('Unable to read clipboard. Please check permissions.');
            });
    }

    triggerFilePicker() {
        document.getElementById('imageInput').click();
    }

    processImageFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            alert('Image is too large. Max 5MB allowed.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentDraftImage = e.target.result;
            this.currentDraftLink = document.getElementById('urlInput').value.trim();

            if (!this.currentDraftLink) {
                alert('Please enter a URL first');
                this.currentDraftImage = null;
                return;
            }

            this.showDraftModal();
        };

        reader.onerror = () => {
            alert('Failed to read image');
        };

        reader.readAsDataURL(file);
    }

    showDraftModal() {
        const modal = document.getElementById('draftModal');
        const draftImage = document.getElementById('draftImage');

        if (this.currentDraftImage) {
            draftImage.innerHTML = `<img src="${this.currentDraftImage}" alt="Draft preview" />`;
        } else {
            draftImage.innerHTML = '<div class="card-placeholder">No image</div>';
        }

        document.getElementById('draftName').value = '';
        document.getElementById('draftName').focus();

        modal.classList.remove('hidden');
    }

    closeDraftModal() {
        document.getElementById('draftModal').classList.add('hidden');
        this.currentDraftImage = null;
        this.currentDraftLink = null;
        document.getElementById('urlInput').value = '';
        document.getElementById('imageInput').value = '';
    }

    confirmDraftAdd() {
        const name = document.getElementById('draftName').value.trim();

        if (!name) {
            alert('Please enter an item name');
            return;
        }

        if (!this.isValidUrl(this.currentDraftLink)) {
            alert('Invalid URL');
            return;
        }

        const item = {
            id: Date.now().toString(),
            name: name,
            link: this.currentDraftLink,
            image: this.currentDraftImage,
            timestamp: new Date().toISOString()
        };

        this.items.unshift(item);
        this.saveToStorage();
        this.renderVault();
        this.closeDraftModal();
    }

    deleteItem(id) {
        if (confirm('Delete this item from your vault?')) {
            this.items = this.items.filter(item => item.id !== id);
            this.saveToStorage();
            this.renderVault();
        }
    }

    showItemModal(item) {
        const modal = document.getElementById('itemModal');
        const body = document.getElementById('modalBody');

        const dateStr = new Date(item.timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        let imageHtml = '';
        if (item.image) {
            imageHtml = `
                <div class="item-modal-image">
                    <img src="${item.image}" alt="${item.name}" />
                </div>
            `;
        }

        body.innerHTML = `
            ${imageHtml}
            <div class="item-modal-info">
                <div class="item-modal-name">${this.escapeHtml(item.name)}</div>
                <div class="item-modal-date">Added on ${dateStr}</div>
                <div class="item-modal-link">${this.escapeHtml(item.link)}</div>
                <div class="modal-actions">
                    <button class="btn btn-primary" id="visitBtn">Visit Source</button>
                    <button class="btn btn-secondary" id="deleteBtn">Delete</button>
                </div>
            </div>
        `;

        document.getElementById('visitBtn').addEventListener('click', () => {
            window.open(item.link, '_blank');
        });

        document.getElementById('deleteBtn').addEventListener('click', () => {
            this.closeItemModal();
            this.deleteItem(item.id);
        });

        modal.classList.remove('hidden');
    }

    closeItemModal() {
        document.getElementById('itemModal').classList.add('hidden');
    }

    filterVault(query) {
        const cards = document.querySelectorAll('.vault-card');
        query = query.toLowerCase();

        cards.forEach(card => {
            const name = card.dataset.name.toLowerCase();
            if (name.includes(query)) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    }

    renderVault() {
        const grid = document.getElementById('vaultGrid');
        const emptyState = document.getElementById('emptyState');
        const itemCount = document.getElementById('itemCount');

        grid.innerHTML = '';

        if (this.items.length === 0) {
            grid.style.display = 'none';
            emptyState.classList.add('visible');
            itemCount.textContent = '0 items';
            return;
        }

        grid.style.display = 'grid';
        emptyState.classList.remove('visible');
        itemCount.textContent = `${this.items.length} item${this.items.length !== 1 ? 's' : ''}`;

        this.items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'vault-card';
            card.dataset.name = item.name;

            let imageHtml = '';
            if (item.image) {
                imageHtml = `<img src="${item.image}" alt="${item.name}" />`;
            } else {
                imageHtml = '<div class="card-placeholder">No image</div>';
            }

            card.innerHTML = `
                <div class="card-image">
                    ${imageHtml}
                </div>
                <div class="card-name">${this.escapeHtml(item.name)}</div>
            `;

            card.addEventListener('click', () => {
                this.showItemModal(item);
            });

            grid.appendChild(card);
        });
    }

    exportJSON() {
        const dataStr = JSON.stringify(this.items, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'vault_backup.json';
        link.click();
        URL.revokeObjectURL(url);
    }

    importJSON(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);

                if (!Array.isArray(imported)) {
                    alert('Invalid file format. Expected an array of items.');
                    return;
                }

                // Validate structure
                const valid = imported.every(item =>
                    item.id && item.name && item.link && item.timestamp &&
                    (item.image === null || typeof item.image === 'string')
                );

                if (!valid) {
                    alert('Invalid file format. Some items are missing required fields.');
                    return;
                }

                if (confirm(`Import ${imported.length} item(s)? Existing items will be merged.`)) {
                    this.items = [...imported, ...this.items];
                    // Remove duplicates by ID
                    const seenIds = new Set();
                    this.items = this.items.filter(item => {
                        if (seenIds.has(item.id)) {
                            return false;
                        }
                        seenIds.add(item.id);
                        return true;
                    });

                    this.saveToStorage();
                    this.renderVault();
                    alert(`Successfully imported ${imported.length} item(s)!`);
                }
            } catch (error) {
                alert('Failed to parse JSON file. Make sure it\'s a valid export.');
            }
        };
        reader.onerror = () => {
            alert('Failed to read file');
        };
        reader.readAsText(file);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    new Vault();
});
