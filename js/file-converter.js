// file-converter.js - File Converter Tool
class FileConverter {
    constructor() {
        this.files = [];
        this.convertedFiles = [];
        this.currentConversion = null;
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupConverterTabs();
        this.setupFormatOptions();
    }
    
    setupEventListeners() {
        // File input
        const fileInput = document.getElementById('converterFileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.handleFiles(e.target.files);
            });
        }
        
        // Convert button
        const convertBtn = document.getElementById('convertBtn');
        if (convertBtn) {
            convertBtn.addEventListener('click', () => this.convertFiles());
        }
        
        // Download buttons
        const downloadAllBtn = document.getElementById('downloadAllBtn');
        if (downloadAllBtn) {
            downloadAllBtn.addEventListener('click', () => this.downloadAll());
        }
        
        const downloadIndividualBtn = document.getElementById('downloadIndividualBtn');
        if (downloadIndividualBtn) {
            downloadIndividualBtn.addEventListener('click', () => this.downloadIndividual());
        }
        
        // Clear button
        const clearBtn = document.getElementById('clearFilesBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearFiles());
        }
    }
    
    setupConverterTabs() {
        const tabs = document.querySelectorAll('.converter-tab');
        const tabContents = document.querySelectorAll('.converter-tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.dataset.tab;
                
                // Update tabs
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Show/hide contents
                tabContents.forEach(content => {
                    if (content.id === `${tabId}Tab`) {
                        content.classList.add('active');
                    } else {
                        content.classList.remove('active');
                    }
                });
                
                // Set current conversion type
                this.currentConversion = tabId;
            });
        });
    }
    
    setupFormatOptions() {
        const formatOptions = document.querySelectorAll('.format-option');
        formatOptions.forEach(option => {
            option.addEventListener('click', () => {
                const from = option.dataset.from;
                const to = option.dataset.to;
                this.setConversionFormat(from, to);
                
                // Update active state
                formatOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
            });
        });
    }
    
    handleFiles(fileList) {
        const files = Array.from(fileList);
        const validFiles = [];
        
        files.forEach(file => {
            const validation = FileOptimizer.validateFile(file);
            if (validation.valid) {
                validFiles.push(file);
                this.addFileToPreview(file);
            } else {
                FileOptimizer.showNotification(validation.error, 'error');
            }
        });
        
        this.files = [...this.files, ...validFiles];
        this.updateConvertButton();
    }
    
    addFileToPreview(file) {
        const container = document.getElementById('filePreviewContainer');
        if (!container) return;
        
        const preview = document.createElement('div');
        preview.className = 'file-preview';
        preview.innerHTML = `
            <i class="fas fa-${FileOptimizer.getFileIcon(file.name)} file-preview-icon"></i>
            <div class="file-preview-name">${file.name}</div>
            <div class="file-preview-size">${FileOptimizer.formatFileSize(file.size)}</div>
            <button class="remove-file" data-filename="${file.name}">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(preview);
        
        // Remove button
        preview.querySelector('.remove-file').addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeFile(file.name);
            preview.remove();
        });
    }
    
    removeFile(filename) {
        this.files = this.files.filter(file => file.name !== filename);
        this.updateConvertButton();
    }
    
    updateConvertButton() {
        const convertBtn = document.getElementById('convertBtn');
        if (convertBtn) {
            convertBtn.disabled = this.files.length === 0 || !this.currentConversion;
        }
    }
    
    setConversionFormat(from, to) {
        this.conversionFormat = { from, to };
        this.updateConvertButton();
    }
    
    async convertFiles() {
        if (this.files.length === 0) {
            FileOptimizer.showNotification('Please select files to convert', 'error');
            return;
        }
        
        if (!this.conversionFormat) {
            FileOptimizer.showNotification('Please select a conversion format', 'error');
            return;
        }
        
        FileOptimizer.showLoading(`Converting ${this.files.length} file(s)...`);
        
        this.convertedFiles = [];
        const totalFiles = this.files.length;
        
        for (let i = 0; i < totalFiles; i++) {
            const file = this.files[i];
            try {
                const converted = await this.convertFile(file);
                if (converted) {
                    this.convertedFiles.push(converted);
                    this.addConvertedFilePreview(converted, i + 1);
                }
                
                // Update progress
                const progress = ((i + 1) / totalFiles) * 100;
                const progressBar = document.getElementById('progress');
                if (progressBar) progressBar.style.width = `${progress}%`;
                
            } catch (error) {
                console.error('Conversion error:', error);
                FileOptimizer.showNotification(`Failed to convert ${file.name}: ${error.message}`, 'error');
            }
        }
        
        FileOptimizer.hideLoading();
        FileOptimizer.showNotification(`Successfully converted ${this.convertedFiles.length} file(s)`, 'success');
        
        // Show download buttons
        const downloadAllBtn = document.getElementById('downloadAllBtn');
        if (downloadAllBtn) downloadAllBtn.disabled = false;
    }
    
    async convertFile(file) {
        // This is a simulation - in real implementation, you would use:
        // - pdf-lib for PDF manipulation
        // - jsPDF for PDF generation
        // - Office.js for document conversion
        
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulate conversion
                const extension = this.conversionFormat.to;
                const convertedFile = {
                    name: file.name.replace(/\.[^/.]+$/, "") + '.' + extension,
                    size: Math.floor(file.size * 0.7), // Simulate size reduction
                    type: this.getMimeType(extension),
                    data: `simulated-conversion-data-for-${file.name}`,
                    originalName: file.name
                };
                resolve(convertedFile);
            }, 1000);
        });
    }
    
    getMimeType(extension) {
        const mimeTypes = {
            'pdf': 'application/pdf',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'doc': 'application/msword',
            'txt': 'text/plain',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'webp': 'image/webp',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'xls': 'application/vnd.ms-excel',
            'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'ppt': 'application/vnd.ms-powerpoint'
        };
        return mimeTypes[extension] || 'application/octet-stream';
    }
    
    addConvertedFilePreview(convertedFile, index) {
        const container = document.getElementById('convertedFilesContainer');
        if (!container) return;
        
        const preview = document.createElement('div');
        preview.className = 'file-preview';
        preview.innerHTML = `
            <i class="fas fa-${FileOptimizer.getFileIcon(convertedFile.name)} file-preview-icon"></i>
            <div class="file-preview-name">${convertedFile.name}</div>
            <div class="file-preview-size">${FileOptimizer.formatFileSize(convertedFile.size)}</div>
            <button class="download-file" data-index="${index - 1}">
                <i class="fas fa-download"></i>
            </button>
        `;
        
        container.appendChild(preview);
        
        // Download button
        preview.querySelector('.download-file').addEventListener('click', (e) => {
            e.stopPropagation();
            this.downloadFile(index - 1);
        });
    }
    
    downloadFile(index) {
        if (this.convertedFiles[index]) {
            const file = this.convertedFiles[index];
            const blob = new Blob([file.data], { type: file.type });
            FileOptimizer.downloadFile(blob, file.name);
        }
    }
    
    downloadAll() {
        if (this.convertedFiles.length === 0) return;
        
        // Create ZIP file (simulated)
        FileOptimizer.showNotification('Preparing download...', 'info');
        
        setTimeout(() => {
            // In real implementation, use JSZip library
            const zipContent = `ZIP file containing ${this.convertedFiles.length} converted files`;
            const zipBlob = new Blob([zipContent], { type: 'application/zip' });
            
            if (FileOptimizer.downloadFile(zipBlob, 'converted-files.zip')) {
                FileOptimizer.showNotification('Download started', 'success');
            }
        }, 1000);
    }
    
    downloadIndividual() {
        FileOptimizer.showNotification('Click individual download buttons for each file', 'info');
    }
    
    clearFiles() {
        this.files = [];
        this.convertedFiles = [];
        
        // Clear previews
        const previewContainer = document.getElementById('filePreviewContainer');
        const convertedContainer = document.getElementById('convertedFilesContainer');
        
        if (previewContainer) previewContainer.innerHTML = '';
        if (convertedContainer) convertedContainer.innerHTML = '';
        
        // Reset buttons
        const convertBtn = document.getElementById('convertBtn');
        const downloadAllBtn = document.getElementById('downloadAllBtn');
        
        if (convertBtn) convertBtn.disabled = true;
        if (downloadAllBtn) downloadAllBtn.disabled = true;
        
        FileOptimizer.showNotification('All files cleared', 'info');
    }
}

// Initialize file converter
document.addEventListener('DOMContentLoaded', () => {
    window.fileConverter = new FileConverter();
});