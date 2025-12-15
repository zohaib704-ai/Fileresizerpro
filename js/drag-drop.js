// drag-drop.js - Drag & Drop File Manager
class DragDropManager {
    constructor() {
        this.maxFiles = 100;
        this.maxSize = 50 * 1024 * 1024; // 50MB
        this.totalMaxSize = 500 * 1024 * 1024; // 500MB
        this.init();
    }
    
    init() {
        this.setupGlobalDragDrop();
        this.setupUploadZones();
        this.setupFileInputs();
    }
    
    setupGlobalDragDrop() {
        // Prevent default drag behaviors
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });
        
        document.addEventListener('drop', (e) => {
            e.preventDefault();
        });
        
        // Global file drop handler
        document.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleGlobalDrop(files);
            }
        });
    }
    
    setupUploadZones() {
        const uploadZones = document.querySelectorAll('.upload-zone');
        uploadZones.forEach(zone => this.setupUploadZone(zone));
    }
    
    setupUploadZone(uploadZone) {
        const fileInput = uploadZone.querySelector('input[type="file"]');
        const dragIndicator = uploadZone.querySelector('.drag-indicator');
        
        if (!fileInput) return;
        
        // Drag events
        ['dragenter', 'dragover'].forEach(event => {
            uploadZone.addEventListener(event, (e) => {
                e.preventDefault();
                uploadZone.classList.add('dragover');
                if (dragIndicator) dragIndicator.style.display = 'block';
            });
        });
        
        ['dragleave', 'drop'].forEach(event => {
            uploadZone.addEventListener(event, (e) => {
                e.preventDefault();
                uploadZone.classList.remove('dragover');
                if (dragIndicator) dragIndicator.style.display = 'none';
            });
        });
        
        // Drop handler
        uploadZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileDrop(files, fileInput);
            }
        });
        
        // Click handler
        uploadZone.addEventListener('click', (e) => {
            if (!e.target.closest('button') && !e.target.closest('input')) {
                fileInput.click();
            }
        });
    }
    
    setupFileInputs() {
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const files = e.target.files;
                if (files.length > 0) {
                    this.handleFileSelect(files, input);
                }
            });
        });
    }
    
    handleGlobalDrop(files) {
        if (files.length === 0) return;
        
        const validFiles = this.validateFiles(files);
        if (validFiles.length === 0) {
            FileOptimizer.showNotification('No valid files selected', 'error');
            return;
        }
        
        // Determine which tool to use
        const fileTypes = new Set();
        validFiles.forEach(file => fileTypes.add(file.type.split('/')[0]));
        
        let redirectTo = 'file-converter.html';
        
        if (fileTypes.has('image')) {
            if (validFiles.length === 1) {
                redirectTo = 'image-resizer.html';
            } else {
                redirectTo = 'batch-process.html';
            }
        } else if (Array.from(fileTypes).every(type => type === 'application')) {
            // Check if all are PDFs
            const allPDFs = validFiles.every(file => file.type === 'application/pdf');
            if (allPDFs) {
                redirectTo = 'pdf-tools.html';
            } else {
                redirectTo = 'file-converter.html';
            }
        }
        
        // Store files for next page
        this.storeFilesForRedirect(validFiles, redirectTo);
        
        // Show redirect notification
        FileOptimizer.showNotification(`Taking you to ${redirectTo.replace('.html', '')}...`, 'info');
        
        // Redirect after delay
        setTimeout(() => {
            window.location.href = redirectTo;
        }, 1500);
    }
    
    handleFileDrop(files, fileInput) {
        const validFiles = this.validateFiles(files);
        if (validFiles.length === 0) return;
        
        // Update file input
        const dataTransfer = new DataTransfer();
        validFiles.forEach(file => dataTransfer.items.add(file));
        fileInput.files = dataTransfer.files;
        
        // Trigger change event
        const event = new Event('change', { bubbles: true });
        fileInput.dispatchEvent(event);
        
        // Show success message
        FileOptimizer.showNotification(`Added ${validFiles.length} file(s)`, 'success');
    }
    
    handleFileSelect(files, fileInput) {
        const validFiles = this.validateFiles(files);
        if (validFiles.length === 0) {
            fileInput.value = ''; // Clear invalid selection
            return;
        }
        
        // Update file input with only valid files
        const dataTransfer = new DataTransfer();
        validFiles.forEach(file => dataTransfer.items.add(file));
        fileInput.files = dataTransfer.files;
        
        FileOptimizer.showNotification(`Selected ${validFiles.length} file(s)`, 'success');
    }
    
    validateFiles(files) {
        const validFiles = [];
        let totalSize = 0;
        
        for (const file of files) {
            // Check file count
            if (validFiles.length >= this.maxFiles) {
                FileOptimizer.showNotification(`Maximum ${this.maxFiles} files allowed`, 'error');
                break;
            }
            
            // Validate file
            const validation = FileOptimizer.validateFile(file, this.maxSize);
            if (!validation.valid) {
                FileOptimizer.showNotification(validation.error, 'error');
                continue;
            }
            
            // Check total size
            totalSize += file.size;
            if (totalSize > this.totalMaxSize) {
                FileOptimizer.showNotification('Total file size exceeds 500MB limit', 'error');
                break;
            }
            
            validFiles.push(file);
        }
        
        return validFiles;
    }
    
    storeFilesForRedirect(files, redirectTo) {
        try {
            const fileData = files.map(file => ({
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified
            }));
            
            sessionStorage.setItem('fileOptimizerPendingFiles', JSON.stringify({
                files: fileData,
                count: files.length,
                redirectTo: redirectTo,
                timestamp: Date.now()
            }));
        } catch (error) {
            console.error('Error storing files:', error);
        }
    }
    
    getPendingFiles() {
        try {
            const pending = sessionStorage.getItem('fileOptimizerPendingFiles');
            if (pending) {
                const data = JSON.parse(pending);
                sessionStorage.removeItem('fileOptimizerPendingFiles');
                return data;
            }
        } catch (error) {
            console.error('Error getting pending files:', error);
        }
        return null;
    }
}

// Initialize drag drop manager
document.addEventListener('DOMContentLoaded', () => {
    window.dragDropManager = new DragDropManager();
    
    // Check for pending files
    const pendingFiles = window.dragDropManager.getPendingFiles();
    if (pendingFiles) {
        console.log(`Loaded ${pendingFiles.count} pending files for ${pendingFiles.redirectTo}`);
        // You can process these files on the current page if needed
    }
});