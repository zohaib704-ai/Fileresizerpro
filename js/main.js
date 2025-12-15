// main.js - Core Utilities for FileOptimizer Pro
const FileOptimizer = {
    // Show loading overlay
    showLoading(message = 'Processing...') {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            const text = overlay.querySelector('#loadingText');
            if (text) text.textContent = message;
            overlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    },
    
    // Hide loading overlay
    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
            document.body.style.overflow = '';
        }
    },
    
    // Show notification
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            info: 'info-circle',
            warning: 'exclamation-triangle'
        };
        
        notification.innerHTML = `
            <i class="fas fa-${icons[type] || 'info-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close"><i class="fas fa-times"></i></button>
        `;
        
        document.body.appendChild(notification);
        
        // Close button
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    },
    
    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    // Get file icon
    getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const icons = {
            // Images
            'jpg': 'file-image', 'jpeg': 'file-image', 'png': 'file-image',
            'gif': 'file-image', 'webp': 'file-image', 'bmp': 'file-image',
            'svg': 'file-image',
            // Documents
            'pdf': 'file-pdf',
            'doc': 'file-word', 'docx': 'file-word',
            'xls': 'file-excel', 'xlsx': 'file-excel',
            'ppt': 'file-powerpoint', 'pptx': 'file-powerpoint',
            'txt': 'file-alt', 'rtf': 'file-alt',
            // Archives
            'zip': 'file-archive', 'rar': 'file-archive',
            '7z': 'file-archive', 'tar': 'file-archive',
            'gz': 'file-archive'
        };
        return icons[ext] || 'file';
    },
    
    // Download file
    downloadFile(data, filename) {
        try {
            const blob = new Blob([data]);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            return true;
        } catch (error) {
            console.error('Download error:', error);
            return false;
        }
    },
    
    // Validate file
    validateFile(file, maxSize = 50 * 1024 * 1024) {
        const allowedTypes = [
            // Images
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
            'image/webp', 'image/bmp', 'image/svg+xml',
            // Documents
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'application/rtf',
            // Archives
            'application/zip',
            'application/x-rar-compressed',
            'application/x-7z-compressed',
            'application/x-tar',
            'application/gzip'
        ];
        
        const allowedExtensions = [
            'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg',
            'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf',
            'zip', 'rar', '7z', 'tar', 'gz'
        ];
        
        // Check file type
        const isValidType = allowedTypes.includes(file.type) || 
            allowedExtensions.includes(file.name.split('.').pop().toLowerCase());
        
        if (!isValidType) {
            return { valid: false, error: `Unsupported file type: ${file.name}` };
        }
        
        // Check file size
        if (file.size > maxSize) {
            return { valid: false, error: `File too large (max ${this.formatFileSize(maxSize)}): ${file.name}` };
        }
        
        return { valid: true, error: null };
    },
    
    // Read file as data URL
    readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
        });
    },
    
    // Read file as array buffer
    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsArrayBuffer(file);
        });
    },
    
    // Compress image
    async compressImage(file, quality = 0.8, maxWidth = null, maxHeight = null) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                // Create canvas
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Resize if needed
                if (maxWidth && width > maxWidth) {
                    height = Math.round(height * maxWidth / width);
                    width = maxWidth;
                }
                if (maxHeight && height > maxHeight) {
                    width = Math.round(width * maxHeight / height);
                    height = maxHeight;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Draw and compress
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Get compressed data URL
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }
};

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            mobileMenu.classList.toggle('active');
            mobileMenuBtn.classList.toggle('active');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                mobileMenu.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
            }
        });
    }
    
    // Format tabs
    const formatTabs = document.querySelectorAll('.format-tab');
    const formatGrids = document.querySelectorAll('.format-grid');
    
    formatTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const format = tab.dataset.format;
            
            // Update tabs
            formatTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show/hide grids
            formatGrids.forEach(grid => {
                if (grid.id === `${format}-format`) {
                    grid.classList.add('active');
                } else {
                    grid.classList.remove('active');
                }
            });
        });
    });
    
    // Close notification when clicking close button
    document.addEventListener('click', (e) => {
        if (e.target.closest('.notification-close')) {
            e.target.closest('.notification').remove();
        }
    });
    
    // Progress animation
    const progressBar = document.querySelector('.progress');
    if (progressBar) {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 10;
            if (progress > 90) {
                progress = 90;
                clearInterval(interval);
            }
            progressBar.style.width = `${progress}%`;
        }, 300);
    }
});
// Helper function to show notifications
FileOptimizer.showNotification = function(message, type = 'info') {
    // Use the theme switcher's notification system
    if (window.themeSwitcher) {
        window.themeSwitcher.showNotification(message, type);
    } else {
        // Fallback
        alert(message);
    }
};
// Make utilities globally available
window.FileOptimizer = FileOptimizer;