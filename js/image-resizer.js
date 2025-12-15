// image-resizer.js - Image Resizer Tool
class ImageResizer {
    constructor() {
        this.images = [];
        this.resizedImages = [];
        this.currentSettings = {
            quality: 80,
            maxWidth: null,
            maxHeight: null,
            format: 'jpeg',
            maintainAspect: true
        };
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupSliders();
    }
    
    setupEventListeners() {
        // File input
        const fileInput = document.getElementById('imageFileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.handleImages(e.target.files);
            });
        }
        
        // Process button
        const processBtn = document.getElementById('processImageBtn');
        if (processBtn) {
            processBtn.addEventListener('click', () => this.processImages());
        }
        
        // Download button
        const downloadBtn = document.getElementById('downloadImageBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadImage());
        }
        
        // Reset button
        const resetBtn = document.getElementById('resetImageBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.reset());
        }
    }
    
    setupSliders() {
        // Quality slider
        const qualitySlider = document.getElementById('qualitySlider');
        const qualityValue = document.getElementById('qualityValue');
        
        if (qualitySlider && qualityValue) {
            qualitySlider.addEventListener('input', (e) => {
                this.currentSettings.quality = parseInt(e.target.value);
                qualityValue.textContent = `${this.currentSettings.quality}%`;
            });
        }
        
        // Width input
        const widthInput = document.getElementById('widthInput');
        if (widthInput) {
            widthInput.addEventListener('input', (e) => {
                this.currentSettings.maxWidth = e.target.value ? parseInt(e.target.value) : null;
            });
        }
        
        // Height input
        const heightInput = document.getElementById('heightInput');
        if (heightInput) {
            heightInput.addEventListener('input', (e) => {
                this.currentSettings.maxHeight = e.target.value ? parseInt(e.target.value) : null;
            });
        }
        
        // Format select
        const formatSelect = document.getElementById('formatSelect');
        if (formatSelect) {
            formatSelect.addEventListener('change', (e) => {
                this.currentSettings.format = e.target.value;
            });
        }
        
        // Aspect ratio checkbox
        const aspectCheckbox = document.getElementById('maintainAspect');
        if (aspectCheckbox) {
            aspectCheckbox.addEventListener('change', (e) => {
                this.currentSettings.maintainAspect = e.target.checked;
            });
        }
    }
    
    handleImages(fileList) {
        const files = Array.from(fileList);
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            FileOptimizer.showNotification('Please select image files', 'error');
            return;
        }
        
        // For now, handle only first image (single image mode)
        const imageFile = imageFiles[0];
        this.images = [imageFile];
        
        // Show preview
        this.showPreview(imageFile);
        
        // Enable process button
        const processBtn = document.getElementById('processImageBtn');
        if (processBtn) processBtn.disabled = false;
    }
    
    async showPreview(file) {
        const preview = document.getElementById('imagePreview');
        const previewSize = document.getElementById('previewSize');
        const previewDimensions = document.getElementById('previewDimensions');
        const previewFormat = document.getElementById('previewFormat');
        
        if (!preview) return;
        
        try {
            const dataUrl = await FileOptimizer.readFileAsDataURL(file);
            preview.src = dataUrl;
            preview.style.display = 'block';
            
            // Update info
            if (previewSize) {
                previewSize.textContent = FileOptimizer.formatFileSize(file.size);
            }
            
            if (previewDimensions) {
                const img = new Image();
                img.onload = () => {
                    previewDimensions.textContent = `${img.width} × ${img.height}`;
                };
                img.src = dataUrl;
            }
            
            if (previewFormat) {
                previewFormat.textContent = file.type.split('/')[1].toUpperCase();
            }
            
        } catch (error) {
            console.error('Preview error:', error);
            FileOptimizer.showNotification('Failed to load image preview', 'error');
        }
    }
    
    async processImages() {
        if (this.images.length === 0) {
            FileOptimizer.showNotification('Please select an image', 'error');
            return;
        }
        
        FileOptimizer.showLoading('Processing image...');
        
        try {
            const imageFile = this.images[0];
            const quality = this.currentSettings.quality / 100;
            const maxWidth = this.currentSettings.maxWidth;
            const maxHeight = this.currentSettings.maxHeight;
            
            // Compress image
            const compressedDataUrl = await FileOptimizer.compressImage(
                imageFile, 
                quality, 
                maxWidth, 
                maxHeight
            );
            
            // Convert to blob
            const blob = this.dataURLToBlob(compressedDataUrl);
            
            this.resizedImages = [{
                name: this.generateFilename(imageFile.name),
                size: blob.size,
                dataUrl: compressedDataUrl,
                blob: blob,
                original: imageFile
            }];
            
            // Show results
            this.showResults();
            
            FileOptimizer.hideLoading();
            FileOptimizer.showNotification('Image processed successfully', 'success');
            
        } catch (error) {
            FileOptimizer.hideLoading();
            console.error('Processing error:', error);
            FileOptimizer.showNotification('Failed to process image', 'error');
        }
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
        const ext = this.currentSettings.format === 'jpeg' ? 'jpg' : this.currentSettings.format;
        const name = originalName.replace(/\.[^/.]+$/, "");
        return `optimized-${name}.${ext}`;
    }
    
    showResults() {
        const resultSection = document.getElementById('resultsSection');
        const originalSize = document.getElementById('originalSize');
        const originalDimensions = document.getElementById('originalDimensions');
        const compressedSize = document.getElementById('compressedSize');
        const compressedDimensions = document.getElementById('compressedDimensions');
        const reductionPercent = document.getElementById('reductionPercent');
        const compressedImage = document.getElementById('compressedImage');
        const downloadBtn = document.getElementById('downloadImageBtn');
        
        if (!resultSection || !this.resizedImages[0]) return;
        
        const original = this.images[0];
        const compressed = this.resizedImages[0];
        
        // Show result section
        resultSection.style.display = 'block';
        
        // Update original info
        if (originalSize) {
            originalSize.textContent = FileOptimizer.formatFileSize(original.size);
        }
        
        // Update compressed info
        if (compressedSize) {
            compressedSize.textContent = FileOptimizer.formatFileSize(compressed.size);
        }
        
        // Calculate reduction
        const reduction = ((original.size - compressed.size) / original.size * 100).toFixed(1);
        if (reductionPercent) {
            reductionPercent.textContent = `${reduction}% reduction`;
        }
        
        // Show compressed image
        if (compressedImage) {
            compressedImage.src = compressed.dataUrl;
        }
        
        // Enable download button
        if (downloadBtn) {
            downloadBtn.disabled = false;
        }
        
        // Scroll to results
        resultSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    downloadImage() {
        if (this.resizedImages.length === 0) return;
        
        const image = this.resizedImages[0];
        const url = image.dataUrl;
        const a = document.createElement('a');
        a.href = url;
        a.download = image.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        FileOptimizer.showNotification('Download started', 'success');
    }
    
    reset() {
        this.images = [];
        this.resizedImages = [];
        
        // Hide preview and results
        const preview = document.getElementById('imagePreview');
        const resultSection = document.getElementById('resultsSection');
        const processBtn = document.getElementById('processImageBtn');
        const downloadBtn = document.getElementById('downloadImageBtn');
        
        if (preview) {
            preview.src = '';
            preview.style.display = 'none';
        }
        
        if (resultSection) {
            resultSection.style.display = 'none';
        }
        
        if (processBtn) processBtn.disabled = true;
        if (downloadBtn) downloadBtn.disabled = true;
        
        // Reset info displays
        const infoElements = [
            'previewSize', 'previewDimensions', 'previewFormat',
            'originalSize', 'originalDimensions',
            'compressedSize', 'compressedDimensions', 'reductionPercent'
        ];
        
        infoElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = '-';
        });
        
        // Reset settings
        this.currentSettings = {
            quality: 80,
            maxWidth: null,
            maxHeight: null,
            format: 'jpeg',
            maintainAspect: true
        };
        
        // Reset UI
        const qualitySlider = document.getElementById('qualitySlider');
        const qualityValue = document.getElementById('qualityValue');
        const widthInput = document.getElementById('widthInput');
        const heightInput = document.getElementById('heightInput');
        const formatSelect = document.getElementById('formatSelect');
        const aspectCheckbox = document.getElementById('maintainAspect');
        
        if (qualitySlider) qualitySlider.value = 80;
        if (qualityValue) qualityValue.textContent = '80%';
        if (widthInput) widthInput.value = '';
        if (heightInput) heightInput.value = '';
        if (formatSelect) formatSelect.value = 'jpeg';
        if (aspectCheckbox) aspectCheckbox.checked = true;
        
        FileOptimizer.showNotification('Reset complete', 'info');
    }
}

// Initialize image resizer
document.addEventListener('DOMContentLoaded', () => {
    window.imageResizer = new ImageResizer();
});