const STORAGE_KEY = 'canvas_items';
const MAX_FILE_SIZE = 5 * 1024 * 1024;

class CanvasApp {
    constructor() {
        this.items = this.loadFromStorage();
        this.setupEventListeners();
        this.renderItems();
    }

    // Storage
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

    // Event Listeners
    setupEventListeners() {
        // Header buttons
        document.getElementById('addBtn').addEventListener('click', () => this.openQuickAddModal());
        document.getElementById('menuBtn').addEventListener('click', () => this.openMenu());

        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => this.filterItems(e.target.value));

        // Quick add modal
        document.getElementById('quickAddClose').addEventListener('click', () => this.closeQuickAddModal());
        document.getElementById('quickAddCancel').addEventListener('click', () => this.closeQuickAddModal());
        document.getElementById('quickAddConfirm').addEventListener('click', () => this.confirmAdd());

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // File inputs
        document.getElementById('easyImage').addEventListener('change', (e) => this.handleFileSelect(e, 'easy'));
        document.getElementById('fullImage').addEventListener('change', (e) => this.handleFileSelect(e, 'full'));

        // Item modal
        document.getElementById('itemClose').addEventListener('click', () => this.closeItemModal());

        // Quick actions
        document.getElementById('pasteBtn').addEventListener('click', () => this.pasteFromClipboard());
        document.getElementById('importBtn').addEventListener('click', () => document.getElementById('jsonInput').click());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportJSON());

        // Import
        document.getElementById('jsonInput').addEventListener('change', (e) => {
            if (e.target.files[0]) this.importJSON(e.target.files[0]);
        });

        // Close modals on overlay click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.closest('.modal').classList.add('hidden');
                }
            });
        });

        // Close quick add modal on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.getElementById('quickAddModal').classList.add('hidden');
                document.getElementById('itemModal').classList.add('hidden');
            }
        });
    }

    switchTab(tabName) {
        // Update buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    handleFileSelect(e, tab) {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > MAX_FILE_SIZE) {
            alert('Image is too large. Max 5MB allowed.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            // Store the base64 image data
            if (tab === 'easy') {
                this.easyImageData = event.target.result;
            } else {
                this.fullImageData = event.target.result;
            }
        };
        reader.readAsDataURL(file);
    }

    openQuickAddModal() {
        // Clear form
        document.getElementById('easyName').value = '';
        document.getElementById('easyLink').value = '';
        document.getElementById('easyImage').value = '';
        document.getElementById('fullName').value = '';
        document.getElementById('fullLink').value = '';
        document.getElementById('fullImage').value = '';
        this.easyImageData = null;
        this.fullImageData = null;

        // Reset to easy tab
        this.switchTab('easy');

        // Show modal
        document.getElementById('quickAddModal').classList.remove('hidden');
        document.getElementById('easyName').focus();
    }

    closeQuickAddModal() {
        document.getElementById('quickAddModal').classList.add('hidden');
    }

    confirmAdd() {
        const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
        
        let name, link, image;

        if (activeTab === 'easy') {
            name = document.getElementById('easyName').value.trim();
            link = document.getElementById('easyLink').value.trim();
            image = this.easyImageData || null;
        } else {
            name = document.getElementById('fullName').value.trim();
            link = document.getElementById('fullLink').value.trim();
            image = this.fullImageData || null;
        }

        // Validate: at least a name
        if (!name) {
            alert('Please enter a name for the item');
            return;
        }

        // Validate: if link provided, must be valid URL
        if (link && !this.isValidUrl(link)) {
            alert('Please enter a valid URL');
            return;
        }

        // Create item
        const item = {
            id: Date.now().toString(),
            name: name,
            link: link || null,
            image: image,
            timestamp: new Date().toISOString()
        };

        this.items.unshift(item);
        this.saveToStorage();
        this.renderItems();
        this.closeQuickAddModal();
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
                    document.getElementById('easyLink').value = text;
                    this.switchTab('easy');
                    this.openQuickAddModal();
                    document.getElementById('easyName').focus();
                } else {
                    alert('Clipboard does not contain a valid URL');
                }
            })
            .catch(() => {
                alert('Unable to read clipboard. Please check permissions.');
            });
    }

    filterItems(query) {
        const cards = document.querySelectorAll('.item-card');
        query = query.toLowerCase().trim();

        if (!query) {
            cards.forEach(card => card.style.display = '');
            return;
        }

        cards.forEach(card => {
            const name = card.dataset.name.toLowerCase();
            const link = card.dataset.link.toLowerCase();
            if (name.includes(query) || link.includes(query)) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    }

    renderItems() {
        const grid = document.getElementById('itemsGrid');
        const emptyState = document.getElementById('emptyState');
        const itemCount = document.getElementById('itemCount');

        grid.innerHTML = '';
        itemCount.textContent = this.items.length;

        if (this.items.length === 0) {
            grid.style.display = 'none';
            emptyState.classList.add('visible');
            return;
        }

        grid.style.display = 'grid';
        emptyState.classList.remove('visible');

        this.items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'item-card';
            card.dataset.name = item.name;
            card.dataset.link = item.link || '';

            const imageHtml = item.image 
                ? `<img src="${item.image}" alt="${this.escapeHtml(item.name)}" />`
                : `<div class="item-image-placeholder">📦</div>`;

            card.innerHTML = `
                <div class="item-image">
                    ${imageHtml}
                </div>
                <div class="item-name">${this.escapeHtml(item.name)}</div>
            `;

            card.addEventListener('click', () => this.showItemModal(item));
            grid.appendChild(card);
        });
    }

    showItemModal(item) {
        const modal = document.getElementById('itemModal');
        const content = document.getElementById('itemContent');

        const dateStr = new Date(item.timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        let imageHtml = '';
        if (item.image) {
            imageHtml = `<div class="item-modal-image"><img src="${item.image}" alt="${this.escapeHtml(item.name)}" /></div>`;
        }

        let linkHtml = '';
        if (item.link) {
            linkHtml = `<div class="item-modal-link" title="Click to open" onclick="window.open('${this.escapeHtml(item.link)}', '_blank')">${this.escapeHtml(item.link)}</div>`;
        }

        content.innerHTML = `
            ${imageHtml}
            <div class="item-modal-info">
                <div class="item-modal-name">${this.escapeHtml(item.name)}</div>
                <div class="item-modal-date">Added ${dateStr}</div>
                ${linkHtml}
                <div class="item-modal-actions">
                    ${item.link ? `<button class="btn btn-primary" onclick="window.open('${this.escapeHtml(item.link)}', '_blank')">Visit Source</button>` : ''}
                    <button class="btn btn-danger" onclick="app.deleteItem('${item.id}')">Delete</button>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
    }

    closeItemModal() {
        document.getElementById('itemModal').classList.add('hidden');
    }

    deleteItem(id) {
        if (confirm('Delete this item?')) {
            this.items = this.items.filter(item => item.id !== id);
            this.saveToStorage();
            this.renderItems();
            this.closeItemModal();
        }
    }

    openMenu() {
        // Simple menu using browser confirm
        const choice = confirm('Menu: OK to export, Cancel to continue');
        if (choice) {
            this.exportJSON();
        }
    }

    exportJSON() {
        const dataStr = JSON.stringify(this.items, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `canvas_backup_${new Date().toISOString().split('T')[0]}.json`;
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
                    item.id && item.name && item.timestamp &&
                    (item.image === null || typeof item.image === 'string') &&
                    (item.link === null || typeof item.link === 'string')
                );

                if (!valid) {
                    alert('Invalid file format. Some items are missing required fields.');
                    return;
                }

                if (confirm(`Import ${imported.length} item(s)? Existing items will be preserved.`)) {
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
                    this.renderItems();
                    alert(`Successfully imported ${imported.length} item(s)!`);
                }
            } catch (error) {
                alert('Failed to parse JSON file. Make sure it\'s a valid export.');
            }
        };
        reader.readAsText(file);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new CanvasApp();
});
