// batch-process.js - Batch Processing Tool
class BatchProcessor {
    constructor() {
        this.files = [];
        this.processedFiles = [];
        this.settings = {
            quality: 80,
            maxSize: 500, // KB
            format: 'jpeg',
            maintainNames: true,
            addPrefix: true
        };
        this.batchSize = 5; // Process 5 files at a time
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupSliders();
        this.setupFileList();
    }
    
    setupEventListeners() {
        // File input
        const fileInput = document.getElementById('batchFileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.handleFiles(e.target.files);
            });
        }
        
        // Process button
        const processBtn = document.getElementById('processBatchBtn');
        if (processBtn) {
            processBtn.addEventListener('click', () => this.processBatch());
        }
        
        // Clear button
        const clearBtn = document.getElementById('clearBatchBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearFiles());
        }
        
        // Download ZIP button
        const downloadZipBtn = document.getElementById('downloadZipBtn');
        if (downloadZipBtn) {
            downloadZipBtn.addEventListener('click', () => this.downloadZip());
        }
    }
    
    setupSliders() {
        // Quality slider
        const qualitySlider = document.getElementById('batchQualitySlider');
        const qualityValue = document.getElementById('batchQualityValue');
        
        if (qualitySlider && qualityValue) {
            qualitySlider.addEventListener('input', (e) => {
                this.settings.quality = parseInt(e.target.value);
                qualityValue.textContent = `${this.settings.quality}%`;
            });
        }
        
        // Max size slider
        const sizeSlider = document.getElementById('batchMaxSizeSlider');
        const sizeValue = document.getElementById('batchMaxSizeValue');
        
        if (sizeSlider && sizeValue) {
            sizeSlider.addEventListener('input', (e) => {
                this.settings.maxSize = parseInt(e.target.value);
                sizeValue.textContent = `${this.settings.maxSize} KB`;
            });
        }
        
        // Format select
        const formatSelect = document.getElementById('batchFormatSelect');
        if (formatSelect) {
            formatSelect.addEventListener('change', (e) => {
                this.settings.format = e.target.value;
            });
        }
        
        // Checkboxes
        const maintainNames = document.getElementById('maintainNamesCheckbox');
        const addPrefix = document.getElementById('addPrefixCheckbox');
        
        if (maintainNames) {
            maintainNames.addEventListener('change', (e) => {
                this.settings.maintainNames = e.target.checked;
            });
        }
        
        if (addPrefix) {
            addPrefix.addEventListener('change', (e) => {
                this.settings.addPrefix = e.target.checked;
            });
        }
    }
    
    setupFileList() {
        // This would set up the file list display
    }
    
    handleFiles(fileList) {
        const files = Array.from(fileList);
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            FileOptimizer.showNotification('Please select image files', 'error');
            return;
        }
        
        // Check limits
        if (imageFiles.length > 100) {
            FileOptimizer.showNotification('Maximum 100 files allowed', 'error');
            return;
        }
        
        this.files = [...this.files, ...imageFiles];
        this.updateFileList();
        this.updateProcessButton();
        
        FileOptimizer.showNotification(`Added ${imageFiles.length} image(s)`, 'success');
    }
    
    updateFileList() {
        const fileList = document.getElementById('batchFileList');
        if (!fileList) return;
        
        fileList.innerHTML = '';
        
        this.files.forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'file-item';
            item.innerHTML = `
                <div class="file-info">
                    <i class="fas fa-${FileOptimizer.getFileIcon(file.name)} file-icon"></i>
                    <div class="file-details">
                        <div class="file-name">${file.name}</div>
                        <div class="file-size">${FileOptimizer.formatFileSize(file.size)}</div>
                    </div>
                </div>
                <button class="remove-file-btn" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            fileList.appendChild(item);
            
            // Remove button
            item.querySelector('.remove-file-btn').addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('button').dataset.index);
                this.removeFile(index);
            });
        });
    }
    
    removeFile(index) {
        this.files.splice(index, 1);
        this.updateFileList();
        this.updateProcessButton();
    }
    
    updateProcessButton() {
        const processBtn = document.getElementById('processBatchBtn');
        if (processBtn) {
            processBtn.disabled = this.files.length === 0;
        }
    }
    
    async processBatch() {
        if (this.files.length === 0) {
            FileOptimizer.showNotification('Please select files to process', 'error');
            return;
        }
        
        FileOptimizer.showLoading(`Processing ${this.files.length} files...`);
        
        this.processedFiles = [];
        const totalFiles = this.files.length;
        const progressBar = document.getElementById('batchProgress');
        const progressText = document.getElementById('batchProgressText');
        
        // Process in chunks to avoid blocking
        const chunkSize = this.batchSize;
        const chunks = [];
        
        for (let i = 0; i < totalFiles; i += chunkSize) {
            chunks.push(this.files.slice(i, i + chunkSize));
        }
        
        for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
            const chunk = chunks[chunkIndex];
            const chunkPromises = chunk.map(async (file, indexInChunk) => {
                const fileIndex = chunkIndex * chunkSize + indexInChunk;
                
                try {
                    const processed = await this.processFile(file);
                    this.processedFiles.push(processed);
                    
                    // Update progress
                    const progress = ((fileIndex + 1) / totalFiles) * 100;
                    if (progressBar) progressBar.style.width = `${progress}%`;
                    if (progressText) {
                        progressText.textContent = `Processed ${fileIndex + 1} of ${totalFiles} files`;
                    }
                    
                    return processed;
                    
                } catch (error) {
                    console.error(`Failed to process ${file.name}:`, error);
                    return null;
                }
            });
            
            await Promise.all(chunkPromises);
            
            // Small delay between chunks
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        FileOptimizer.hideLoading();
        
        const successCount = this.processedFiles.filter(f => f !== null).length;
        FileOptimizer.showNotification(`Successfully processed ${successCount} of ${totalFiles} files`, 'success');
        
        // Enable download button
        const downloadBtn = document.getElementById('downloadZipBtn');
        if (downloadBtn) downloadBtn.disabled = false;
        
        // Show results summary
        this.showResultsSummary();
    }
    
    async processFile(file) {
        const quality = this.settings.quality / 100;
        const maxSizeKB = this.settings.maxSize;
        
        // Calculate target dimensions based on file size
        const targetSizeBytes = maxSizeKB * 1024;
        const scaleFactor = Math.sqrt(targetSizeBytes / file.size);
        
        let maxWidth = null;
        let maxHeight = null;
        
        if (scaleFactor < 1) {
            // Read image dimensions
            const dataUrl = await FileOptimizer.readFileAsDataURL(file);
            const img = new Image();
            
            await new Promise((resolve) => {
                img.onload = resolve;
                img.src = dataUrl;
            });
            
            maxWidth = Math.floor(img.width * scaleFactor);
            maxHeight = Math.floor(img.height * scaleFactor);
        }
        
        // Compress image
        const compressedDataUrl = await FileOptimizer.compressImage(
            file, 
            quality, 
            maxWidth, 
            maxHeight
        );
        
        // Convert to blob
        const blob = this.dataURLToBlob(compressedDataUrl);
        
        // Generate filename
        const filename = this.generateFilename(file.name);
        
        return {
            name: filename,
            size: blob.size,
            dataUrl: compressedDataUrl,
            blob: blob,
            original: file
        };
    }
    
    dataURLToBlob(dataUrl) {
        const arr = dataUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        
        return new Blob([u8arr], { type: mime });
    }
    
    generateFilename(originalName) {
        let name = originalName.replace(/\.[^/.]+$/, "");
        const ext = this.settings.format === 'jpeg' ? 'jpg' : this.settings.format;
        
        if (this.settings.addPrefix) {
            name = `optimized-${name}`;
        }
        
        if (!this.settings.maintainNames) {
            const timestamp = Date.now();
            const random = Math.floor(Math.random() * 1000);
            name = `image-${timestamp}-${random}`;
        }
        
        return `${name}.${ext}`;
    }
    
    showResultsSummary() {
        const summary = document.getElementById('resultsSummary');
        if (!summary) return;
        
        const totalOriginalSize = this.files.reduce((sum, file) => sum + file.size, 0);
        const totalProcessedSize = this.processedFiles.reduce((sum, file) => sum + file.size, 0);
        const reduction = ((totalOriginalSize - totalProcessedSize) / totalOriginalSize * 100).toFixed(1);
        
        summary.innerHTML = `
            <div class="results-stats">
                <div class="stat">
                    <span class="stat-number">${this.processedFiles.length}</span>
                    <span class="stat-label">Files Processed</span>
                </div>
                <div class="stat">
                    <span class="stat-number">${FileOptimizer.formatFileSize(totalOriginalSize)}</span>
                    <span class="stat-label">Original Size</span>
                </div>
                <div class="stat">
                    <span class="stat-number">${FileOptimizer.formatFileSize(totalProcessedSize)}</span>
                    <span class="stat-label">Processed Size</span>
                </div>
                <div class="stat">
                    <span class="stat-number">${reduction}%</span>
                    <span class="stat-label">Size Reduction</span>
                </div>
            </div>
        `;
        
        summary.style.display = 'block';
    }
    
    async downloadZip() {
        if (this.processedFiles.length === 0) {
            FileOptimizer.showNotification('No files to download', 'error');
            return;
        }
        
        FileOptimizer.showLoading('Creating ZIP file...');
        
        try {
            // Check if JSZip is available
            if (typeof JSZip === 'undefined') {
                throw new Error('JSZip library not loaded');
            }
            
            const zip = new JSZip();
            
            // Add files to zip
            this.processedFiles.forEach((file, index) => {
                zip.file(file.name, file.blob);
            });
            
            // Generate zip file
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            
            // Download
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'batch-processed-files.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            FileOptimizer.hideLoading();
            FileOptimizer.showNotification('ZIP download started', 'success');
            
        } catch (error) {
            FileOptimizer.hideLoading();
            console.error('ZIP creation error:', error);
            FileOptimizer.showNotification('Failed to create ZIP file', 'error');
            
            // Fallback: Download files individually
            this.downloadIndividual();
        }
    }
    
    downloadIndividual() {
        if (this.processedFiles.length === 0) return;
        
        FileOptimizer.showNotification('Starting individual downloads...', 'info');
        
        // Download each file
        this.processedFiles.forEach((file, index) => {
            setTimeout(() => {
                const url = file.dataUrl;
                const a = document.createElement('a');
                a.href = url;
                a.download = file.name;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }, index * 100); // Stagger downloads
        });
    }
    
    clearFiles() {
        this.files = [];
        this.processedFiles = [];
        
        // Clear UI
        const fileList = document.getElementById('batchFileList');
        const summary = document.getElementById('resultsSummary');
        const processBtn = document.getElementById('processBatchBtn');
        const downloadBtn = document.getElementById('downloadZipBtn');
        
        if (fileList) fileList.innerHTML = '';
        if (summary) summary.style.display = 'none';
        if (processBtn) processBtn.disabled = true;
        if (downloadBtn) downloadBtn.disabled = true;
        
        // Reset progress
        const progressBar = document.getElementById('batchProgress');
        const progressText = document.getElementById('batchProgressText');
        
        if (progressBar) progressBar.style.width = '0%';
        if (progressText) progressText.textContent = '';
        
        FileOptimizer.showNotification('All files cleared', 'info');
    }
}

// Initialize batch processor
document.addEventListener('DOMContentLoaded', () => {
    window.batchProcessor = new BatchProcessor();
});