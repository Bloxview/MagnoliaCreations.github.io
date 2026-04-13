const STORAGE_KEY = 'giftful';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

class Wishlist {
    constructor() {
        this.items = this.loadFromStorage();
        this.setupEventListeners();
        this.renderWishlist();
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

    setupEventListeners() {
        // Add button
        document.getElementById('addBtn').addEventListener('click', () => this.addItem());
        
        // URL input - add on Enter
        document.getElementById('urlInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addItem();
        });

        // Image upload zone
        const uploadZone = document.getElementById('uploadZone');
        const imageInput = document.getElementById('imageInput');

        uploadZone.addEventListener('click', () => imageInput.click());
        
        imageInput.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.processImageFile(e.target.files[0]);
            }
        });

        // Drag and drop
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('dragover');
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files[0] && files[0].type.startsWith('image/')) {
                this.processImageFile(files[0]);
            }
        });

        // Export/Import buttons
        document.getElementById('downloadBtn').addEventListener('click', () => this.exportJSON());
        document.getElementById('uploadBtn').addEventListener('click', () => {
            document.getElementById('jsonInput').click();
        });

        document.getElementById('jsonInput').addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.importJSON(e.target.files[0]);
            }
        });

        // Clear all button
        document.getElementById('clearAllBtn').addEventListener('click', () => this.clearAll());
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
            this.currentImage = e.target.result;
        };
        reader.onerror = () => {
            alert('Failed to read image');
        };
        reader.readAsDataURL(file);
    }

    addItem() {
        const urlInput = document.getElementById('urlInput');
        const url = urlInput.value.trim();

        if (!url) {
            alert('Please enter a URL');
            return;
        }

        try {
            new URL(url);
        } catch {
            alert('Please enter a valid URL (including https://)');
            return;
        }

        const item = {
            id: Date.now().toString(),
            link: url,
            image: this.currentImage || null,
            timestamp: new Date().toISOString()
        };

        this.items.unshift(item);
        this.saveToStorage();
        this.renderWishlist();

        // Reset form
        urlInput.value = '';
        this.currentImage = null;
        document.getElementById('imageInput').value = '';
    }

    deleteItem(id) {
        if (confirm('Remove this item from your wishlist?')) {
            this.items = this.items.filter(item => item.id !== id);
            this.saveToStorage();
            this.renderWishlist();
        }
    }

    clearAll() {
        if (this.items.length === 0) {
            alert('Your wishlist is already empty');
            return;
        }

        if (confirm(`Remove all ${this.items.length} items from your wishlist? This cannot be undone.`)) {
            this.items = [];
            this.saveToStorage();
            this.renderWishlist();
        }
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            const notification = document.createElement('div');
            notification.textContent = 'Copied to clipboard!';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #2c2c2c;
                color: #fefdfb;
                padding: 0.75rem 1rem;
                border-radius: 8px;
                font-size: 0.85rem;
                z-index: 1000;
                animation: slideIn 0.3s ease;
            `;
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 2000);
        });
    }

    formatDate(isoString) {
        const date = new Date(isoString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today at ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    }

    renderWishlist() {
        const grid = document.getElementById('wishlistGrid');
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
            card.className = 'wishlist-card';

            const imageHtml = item.image
                ? `<img src="${item.image}" alt="Wishlist item" loading="lazy">`
                : `
                    <div class="card-image-placeholder">
                        <svg class="placeholder-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <path d="M21 15l-5-5L7 21"/>
                        </svg>
                    </div>
                `;

            const hostname = new URL(item.link).hostname.replace('www.', '');

            card.innerHTML = `
                <div class="card-image">
                    ${imageHtml}
                </div>
                <div class="card-content">
                    <div class="card-url" title="${item.link}">${hostname}</div>
                    <div class="card-timestamp">${this.formatDate(item.timestamp)}</div>
                    <div class="card-actions">
                        <button class="card-btn copy-btn" title="Copy link">📋 Copy</button>
                        <button class="card-btn delete" title="Delete item">🗑 Delete</button>
                    </div>
                </div>
            `;

            // Click card to open link
            card.querySelector('.card-image').addEventListener('click', (e) => {
                e.stopPropagation();
                window.open(item.link, '_blank');
            });

            // Copy button
            card.querySelector('.copy-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.copyToClipboard(item.link);
            });

            // Delete button
            card.querySelector('.delete').addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteItem(item.id);
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
        link.download = `giftful-wishlist-${new Date().toISOString().split('T')[0]}.json`;
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
                    item.id && item.link && item.timestamp &&
                    (item.image === null || typeof item.image === 'string')
                );

                if (!valid) {
                    alert('Invalid file format. Some items are missing required fields.');
                    return;
                }

                if (confirm(`Import ${imported.length} item(s)? Existing items will be merged.`)) {
                    this.items = [...imported, ...this.items];
                    this.saveToStorage();
                    this.renderWishlist();
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
}

// Initialize app
let wishlist;
document.addEventListener('DOMContentLoaded', () => {
    wishlist = new Wishlist();
});

// Add animation helper
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
