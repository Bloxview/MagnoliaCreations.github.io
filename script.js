const STORAGE_KEY = 'dlu_vault';
const MAX_FILE_SIZE = 5 * 1024 * 1024;

class Canvas {
    constructor() {
        this.items = this.loadFromStorage();
        this.currentQuickAddImage = null;
        this.setupEventListeners();
        this.renderCanvas();
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
        }
    }

    setupEventListeners() {
        // Quick add button
        document.getElementById('quickAddBtn').addEventListener('click', () => {
            this.openQuickAdd();
        });

        // Quick add modal close
        document.getElementById('quickAddClose').addEventListener('click', () => {
            this.closeQuickAdd();
        });

        document.getElementById('quickAddOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'quickAddOverlay') this.closeQuickAdd();
        });

        // Quick add form
        document.getElementById('quickAddForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addItemFromQuickAdd();
        });

        // Image upload in quick add
        document.getElementById('quickAddImageInput').addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.handleImageSelect(e.target.files[0]);
            }
        });

        document.getElementById('quickAddImageBtn').addEventListener('click', () => {
            document.getElementById('quickAddImageInput').click();
        });

        // Drag and drop on body
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            document.body.classList.add('drag-active');
        });

        document.addEventListener('dragleave', () => {
            document.body.classList.remove('drag-active');
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
            document.body.classList.remove('drag-active');
            this.handleGlobalDrop(e);
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

        // Item details modal
        document.getElementById('itemDetailsClose').addEventListener('click', () => {
            this.closeItemDetails();
        });

        document.getElementById('itemDetailsOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'itemDetailsOverlay') this.closeItemDetails();
        });

        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterCanvas(e.target.value);
        });
    }

    openQuickAdd() {
        document.getElementById('quickAddModal').classList.remove('hidden');
        document.getElementById('quickAddTitle').focus();
        this.resetQuickAddForm();
    }

    closeQuickAdd() {
        document.getElementById('quickAddModal').classList.add('hidden');
        this.resetQuickAddForm();
    }

    resetQuickAddForm() {
        document.getElementById('quickAddTitle').value = '';
        document.getElementById('quickAddLink').value = '';
        document.getElementById('quickAddImage').innerHTML = '<div class="quick-add-image-placeholder">No image</div>';
        document.getElementById('quickAddImageInput').value = '';
        this.currentQuickAddImage = null;
    }

    handleImageSelect(file) {
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
            this.currentQuickAddImage = e.target.result;
            document.getElementById('quickAddImage').innerHTML = `<img src="${this.currentQuickAddImage}" alt="Preview" />`;
        };
        reader.readAsDataURL(file);
    }

    handleGlobalDrop(e) {
        const files = e.dataTransfer.files;
        const items = e.dataTransfer.items;

        // Check for URL links first
        if (items) {
            for (let item of items) {
                if (item.type === 'text/uri-list') {
                    item.getAsString((url) => {
                        if (this.isValidUrl(url)) {
                            this.openQuickAdd();
                            document.getElementById('quickAddLink').value = url;
                            document.getElementById('quickAddTitle').focus();
                        }
                    });
                    return;
                }
            }
        }

        // Handle image files
        if (files[0] && files[0].type.startsWith('image/')) {
            this.openQuickAdd();
            this.handleImageSelect(files[0]);
            document.getElementById('quickAddTitle').focus();
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

    addItemFromQuickAdd() {
        const title = document.getElementById('quickAddTitle').value.trim();
        const link = document.getElementById('quickAddLink').value.trim();

        if (!title) {
            alert('Please enter a title');
            return;
        }

        if (link && !this.isValidUrl(link)) {
            alert('Invalid URL format');
            return;
        }

        const item = {
            id: Date.now().toString(),
            name: title,
            link: link || null,
            image: this.currentQuickAddImage || null,
            timestamp: new Date().toISOString()
        };

        this.items.unshift(item);
        this.saveToStorage();
        this.renderCanvas();
        this.closeQuickAdd();
    }

    deleteItem(id) {
        if (confirm('Delete this item?')) {
            this.items = this.items.filter(item => item.id !== id);
            this.saveToStorage();
            this.renderCanvas();
            this.closeItemDetails();
        }
    }

    showItemDetails(item) {
        const modal = document.getElementById('itemDetailsModal');
        const body = document.getElementById('itemDetailsBody');

        const dateStr = new Date(item.timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        let imageHtml = '';
        if (item.image) {
            imageHtml = `
                <div class="item-details-image">
                    <img src="${item.image}" alt="${item.name}" />
                </div>
            `;
        }

        let linkHtml = '';
        if (item.link) {
            linkHtml = `
                <div class="item-details-link">${this.escapeHtml(item.link)}</div>
                <button class="btn btn-primary" id="visitBtn">Visit</button>
            `;
        }

        body.innerHTML = `
            ${imageHtml}
            <div class="item-details-info">
                <div class="item-details-name">${this.escapeHtml(item.name)}</div>
                <div class="item-details-date">${dateStr}</div>
                ${linkHtml}
                <button class="btn btn-danger" id="deleteBtn">Delete</button>
            </div>
        `;

        if (item.link) {
            document.getElementById('visitBtn').addEventListener('click', () => {
                window.open(item.link, '_blank');
            });
        }

        document.getElementById('deleteBtn').addEventListener('click', () => {
            this.deleteItem(item.id);
        });

        modal.classList.remove('hidden');
    }

    closeItemDetails() {
        document.getElementById('itemDetailsModal').classList.add('hidden');
    }

    filterCanvas(query) {
        const cards = document.querySelectorAll('.canvas-card');
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

    renderCanvas() {
        const grid = document.getElementById('canvasGrid');
        const emptyState = document.getElementById('emptyState');
        const itemCount = document.getElementById('itemCount');

        grid.innerHTML = '';

        if (this.items.length === 0) {
            grid.style.display = 'none';
            emptyState.classList.remove('hidden');
            itemCount.textContent = '0';
            return;
        }

        grid.style.display = 'grid';
        emptyState.classList.add('hidden');
        itemCount.textContent = this.items.length;

        this.items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'canvas-card';
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
                <div class="card-label">${this.escapeHtml(item.name)}</div>
            `;

            card.addEventListener('click', () => {
                this.showItemDetails(item);
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
                    alert('Invalid file format.');
                    return;
                }

                const valid = imported.every(item =>
                    item.id && item.name && item.timestamp &&
                    (item.link === null || typeof item.link === 'string') &&
                    (item.image === null || typeof item.image === 'string')
                );

                if (!valid) {
                    alert('Invalid file format.');
                    return;
                }

                if (confirm(`Import ${imported.length} item(s)?`)) {
                    this.items = [...imported, ...this.items];
                    const seenIds = new Set();
                    this.items = this.items.filter(item => {
                        if (seenIds.has(item.id)) {
                            return false;
                        }
                        seenIds.add(item.id);
                        return true;
                    });

                    this.saveToStorage();
                    this.renderCanvas();
                }
            } catch (error) {
                alert('Failed to import file.');
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

document.addEventListener('DOMContentLoaded', () => {
    new Canvas();
});
