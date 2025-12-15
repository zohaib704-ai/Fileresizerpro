// theme-switcher.js - Theme Switching Functionality
class ThemeSwitcher {
    constructor() {
        this.themes = ['dark', 'light', 'blue'];
        this.currentTheme = this.getSavedTheme() || 'dark';
        this.init();
    }
    
    init() {
        this.loadTheme();
        this.setupEventListeners();
        this.setupThemeModal();
        this.updateToggleIcon();
    }
    
    setupEventListeners() {
        // Theme toggle button
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.showThemeModal());
        }
        
        // Theme modal close button
        const closeModal = document.getElementById('closeThemeModal');
        if (closeModal) {
            closeModal.addEventListener('click', () => this.hideThemeModal());
        }
        
        // Theme modal background click
        const themeModal = document.getElementById('themeModal');
        if (themeModal) {
            themeModal.addEventListener('click', (e) => {
                if (e.target === themeModal) {
                    this.hideThemeModal();
                }
            });
        }
        
        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideThemeModal();
            }
        });
    }
    
    setupThemeModal() {
        const themeOptions = document.querySelectorAll('.theme-option');
        if (!themeOptions.length) return;
        
        themeOptions.forEach(option => {
            option.addEventListener('click', () => {
                const theme = option.dataset.theme;
                this.setTheme(theme);
                this.hideThemeModal();
            });
        });
    }
    
    loadTheme() {
        const themeStyle = document.getElementById('theme-style');
        if (!themeStyle) {
            console.error('Theme style element not found');
            return;
        }
        
        // Load the theme CSS file
        themeStyle.href = `css/themes/${this.currentTheme}.css`;
        
        // Update theme option active state
        this.updateThemeOptions();
        
        // Update body class
        document.body.className = '';
        document.body.classList.add(`${this.currentTheme}-theme`);
        
        console.log(`Theme loaded: ${this.currentTheme}`);
    }
    
    setTheme(theme) {
        if (!this.themes.includes(theme)) {
            console.error(`Invalid theme: ${theme}`);
            return;
        }
        
        this.currentTheme = theme;
        this.saveTheme();
        this.loadTheme();
        this.updateToggleIcon();
        
        // Show notification
        this.showNotification(`Theme changed to ${theme}`, 'success');
    }
    
    updateThemeOptions() {
        const themeOptions = document.querySelectorAll('.theme-option');
        themeOptions.forEach(option => {
            const theme = option.dataset.theme;
            if (theme === this.currentTheme) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
    }
    
    updateToggleIcon() {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;
        
        const moonIcon = themeToggle.querySelector('.fa-moon');
        const sunIcon = themeToggle.querySelector('.fa-sun');
        
        if (this.currentTheme === 'dark') {
            moonIcon.style.display = 'block';
            sunIcon.style.display = 'none';
        } else {
            moonIcon.style.display = 'none';
            sunIcon.style.display = 'block';
        }
    }
    
    showThemeModal() {
        const themeModal = document.getElementById('themeModal');
        if (themeModal) {
            themeModal.style.display = 'flex';
            this.updateThemeOptions();
        }
    }
    
    hideThemeModal() {
        const themeModal = document.getElementById('themeModal');
        if (themeModal) {
            themeModal.style.display = 'none';
        }
    }
    
    getSavedTheme() {
        try {
            return localStorage.getItem('fileOptimizerTheme');
        } catch (e) {
            console.error('Error getting saved theme:', e);
            return null;
        }
    }
    
    saveTheme() {
        try {
            localStorage.setItem('fileOptimizerTheme', this.currentTheme);
        } catch (e) {
            console.error('Error saving theme:', e);
        }
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Close button
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }
}

// Initialize theme switcher when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.themeSwitcher = new ThemeSwitcher();
    
    // Also initialize any existing theme modal if not in index.html
    const themeModal = document.getElementById('themeModal');
    if (themeModal && !themeModal.querySelector('.theme-options')) {
        const modalContent = `
            <div class="theme-modal-content">
                <h3><i class="fas fa-palette"></i> Choose Theme</h3>
                <div class="theme-options">
                    <button class="theme-option" data-theme="dark">
                        <div class="theme-preview dark"></div>
                        <span>Dark</span>
                    </button>
                    <button class="theme-option" data-theme="light">
                        <div class="theme-preview light"></div>
                        <span>Light</span>
                    </button>
                    <button class="theme-option" data-theme="blue">
                        <div class="theme-preview blue"></div>
                        <span>Blue</span>
                    </button>
                </div>
                <button class="btn secondary" id="closeThemeModal">Close</button>
            </div>
        `;
        themeModal.innerHTML = modalContent;
        window.themeSwitcher.setupThemeModal();
        
        // Re-add close button listener
        const closeModal = document.getElementById('closeThemeModal');
        if (closeModal) {
            closeModal.addEventListener('click', () => window.themeSwitcher.hideThemeModal());
        }
    }
});