// social-presets.js - Social Media Preset Manager

class SocialPresets {
    constructor() {
        this.selectedPresets = new Set();
        this.customPresets = [];
        this.currentImage = null;
        this.generatedImages = [];
        
        this.initializeElements();
        this.initializeEventListeners();
        this.loadPresets();
    }
    
    initializeElements() {
        // Upload Elements
        this.socialUploadZone = document.getElementById('socialUploadZone');
        this.socialFileInput = document.getElementById('socialFileInput');
        this.socialPreviewImage = document.getElementById('socialPreviewImage');
        this.socialImagePreview = document.getElementById('socialImagePreview');
        this.cropArea = document.getElementById('cropArea');
        
        // Category Elements
        this.presetCategories = document.querySelectorAll('.preset-category');
        this.presetsGrid = document.getElementById('presetsGrid');
        
        // Custom Size Elements
        this.customWidth = document.getElementById('customWidth');
        this.customHeight = document.getElementById('customHeight');
        this.customName = document.getElementById('customName');
        this.ratioButtons = document.querySelectorAll('.ratio-btn');
        this.addCustomPresetBtn = document.getElementById('addCustomPreset');
        
        // Batch Elements
        this.batchPresets = document.getElementById('batchPresets');
        this.processBatchSocialBtn = document.getElementById('processBatchSocial');
        this.clearBatchSelectionBtn = document.getElementById('clearBatchSelection');
        
        // Results Elements
        this.socialResults = document.getElementById('socialResults');
        this.socialResultsGrid = document.getElementById('socialResultsGrid');
        this.downloadAllSocialBtn = document.getElementById('downloadAllSocial');
        this.downloadIndividualSocialBtn = document.getElementById('downloadIndividualSocial');
    }
    
    initializeEventListeners() {
        // File Upload
        this.socialUploadZone.addEventListener('click', () => {
            this.socialFileInput.click();
        });
        
        this.socialFileInput.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files[0]);
        });
        
        // Drag and Drop
        this.socialUploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.socialUploadZone.style.backgroundColor = 'rgba(37, 99, 235, 0.1)';
        });
        
        this.socialUploadZone.addEventListener('dragleave', () => {
            this.socialUploadZone.style.backgroundColor = '';
        });
        
        this.socialUploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.socialUploadZone.style.backgroundColor = '';
            this.handleFileUpload(e.dataTransfer.files[0]);
        });
        
        // Category Switching
        this.presetCategories.forEach(category => {
            category.addEventListener('click', () => {
                const categoryName = category.dataset.category;
                this.switchCategory(categoryName);
            });
        });
        
        // Ratio Buttons
        this.ratioButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const ratio = e.currentTarget.dataset.ratio;
                this.applyAspectRatio(ratio);
            });
        });
        
        // Custom Preset
        this.addCustomPresetBtn.addEventListener('click', () => {
            this.addCustomPreset();
        });
        
        // Batch Processing
        this.processBatchSocialBtn.addEventListener('click', () => {
            this.processBatchSocial();
        });
        
        this.clearBatchSelectionBtn.addEventListener('click', () => {
            this.clearBatchSelection();
        });
        
        // Download Results
        this.downloadAllSocialBtn.addEventListener('click', () => {
            this.downloadAllSocial();
        });
        
        this.downloadIndividualSocialBtn.addEventListener('click', () => {
            this.downloadIndividualSocial();
        });
    }
    
    handleFileUpload(file) {
        if (!file) return;
        
        try {
            // Validate file
            if (!file.type.startsWith('image/')) {
                throw new Error('Please select a valid image file');
            }
            
            // Check file size
            if (file.size > 10 * 1024 * 1024) {
                throw new Error('File size must be less than 10MB');
            }
            
            // Show preview
            const reader = new FileReader();
            reader.onload = (e) => {
                this.socialPreviewImage.src = e.target.result;
                this.socialImagePreview.style.display = 'block';
                this.currentImage = e.target.result;
                
                // Enable batch processing button
                this.processBatchSocialBtn.disabled = false;
                
                // Initialize cropping
                this.initializeCropping();
            };
            reader.readAsDataURL(file);
            
            ImageResizerUtils.showSuccess('Image uploaded successfully!');
            
        } catch (error) {
            ImageResizerUtils.showError(error.message);
        }
    }
    
    initializeCropping() {
        // This is a simplified cropping implementation
        // In a real app, you would use a cropping library like Cropper.js
        
        const img = this.socialPreviewImage;
        const overlay = this.socialImagePreview.querySelector('.crop-overlay');
        
        img.onload = () => {
            // Set crop area to center
            const cropSize = Math.min(img.width, img.height) * 0.8;
            this.cropArea.style.width = `${cropSize}px`;
            this.cropArea.style.height = `${cropSize}px`;
            this.cropArea.style.left = `${(img.width - cropSize) / 2}px`;
            this.cropArea.style.top = `${(img.height - cropSize) / 2}px`;
        };
    }
    
    loadPresets() {
        // Social media presets data
        this.presets = {
            'all': [
                { id: 'fb_profile', name: 'Facebook Profile', icon: 'fab fa-facebook', width: 360, height: 360, category: 'facebook', ratio: '1:1' },
                { id: 'fb_cover', name: 'Facebook Cover', icon: 'fab fa-facebook', width: 820, height: 312, category: 'facebook', ratio: '2.63:1' },
                { id: 'fb_post', name: 'Facebook Post', icon: 'fab fa-facebook', width: 1200, height: 630, category: 'facebook', ratio: '1.91:1' },
                { id: 'ig_profile', name: 'Instagram Profile', icon: 'fab fa-instagram', width: 320, height: 320, category: 'instagram', ratio: '1:1' },
                { id: 'ig_post', name: 'Instagram Post', icon: 'fab fa-instagram', width: 1080, height: 1080, category: 'instagram', ratio: '1:1' },
                { id: 'ig_story', name: 'Instagram Story', icon: 'fab fa-instagram', width: 1080, height: 1920, category: 'instagram', ratio: '9:16' },
                { id: 'tw_profile', name: 'Twitter Profile', icon: 'fab fa-twitter', width: 400, height: 400, category: 'twitter', ratio: '1:1' },
                { id: 'tw_header', name: 'Twitter Header', icon: 'fab fa-twitter', width: 1500, height: 500, category: 'twitter', ratio: '3:1' },
                { id: 'tw_post', name: 'Twitter Post', icon: 'fab fa-twitter', width: 1200, height: 675, category: 'twitter', ratio: '16:9' },
                { id: 'li_profile', name: 'LinkedIn Profile', icon: 'fab fa-linkedin', width: 400, height: 400, category: 'linkedin', ratio: '1:1' },
                { id: 'li_cover', name: 'LinkedIn Cover', icon: 'fab fa-linkedin', width: 1584, height: 396, category: 'linkedin', ratio: '4:1' },
                { id: 'li_post', name: 'LinkedIn Post', icon: 'fab fa-linkedin', width: 1200, height: 627, category: 'linkedin', ratio: '1.91:1' },
                { id: 'pin_post', name: 'Pinterest Pin', icon: 'fab fa-pinterest', width: 1000, height: 1500, category: 'pinterest', ratio: '2:3' },
                { id: 'tt_profile', name: 'TikTok Profile', icon: 'fab fa-tiktok', width: 600, height: 600, category: 'tiktok', ratio: '1:1' },
                { id: 'tt_video', name: 'TikTok Video', icon: 'fab fa-tiktok', width: 1080, height: 1920, category: 'tiktok', ratio: '9:16' },
                { id: 'yt_thumbnail', name: 'YouTube Thumbnail', icon: 'fab fa-youtube', width: 1280, height: 720, category: 'youtube', ratio: '16:9' },
                { id: 'yt_channel', name: 'YouTube Channel', icon: 'fab fa-youtube', width: 2560, height: 1440, category: 'youtube', ratio: '16:9' }
            ],
            'facebook': [],
            'instagram': [],
            'twitter': [],
            'linkedin': [],
            'pinterest': [],
            'tiktok': [],
            'youtube': []
        };
        
        // Organize presets by category
        this.presets.all.forEach(preset => {
            if (this.presets[preset.category]) {
                this.presets[preset.category].push(preset);
            }
        });
        
        // Load all presets initially
        this.switchCategory('all');
    }
    
    switchCategory(category) {
        // Update active category
        this.presetCategories.forEach(cat => {
            cat.classList.toggle('active', cat.dataset.category === category);
        });
        
        // Clear presets grid
        this.presetsGrid.innerHTML = '';
        
        // Get presets for selected category
        const presetsToShow = category === 'all' 
            ? this.presets.all 
            : this.presets[category];
        
        // Add custom presets if showing all
        if (category === 'all') {
            this.customPresets.forEach(preset => {
                presetsToShow.push(preset);
            });
        }
        
        // Render presets
        presetsToShow.forEach(preset => {
            const presetCard = this.createPresetCard(preset);
            this.presetsGrid.appendChild(presetCard);
        });
    }
    
    createPresetCard(preset) {
        const card = document.createElement('div');
        card.className = 'preset-card';
        card.dataset.id = preset.id;
        card.dataset.width = preset.width;
        card.dataset.height = preset.height;
        
        // Check if preset is selected
        if (this.selectedPresets.has(preset.id)) {
            card.classList.add('active');
        }
        
        card.innerHTML = `
            <div class="preset-icon">
                <i class="${preset.icon}"></i>
            </div>
            <h3>${preset.name}</h3>
            <div class="preset-dimensions">${preset.width} × ${preset.height}</div>
            <div class="preset-ratio">${preset.ratio || 'Custom'}</div>
            <div class="preset-category">${preset.category || 'Custom'}</div>
        `;
        
        // Add click event
        card.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePresetSelection(preset.id, preset);
        });
        
        return card;
    }
    
    togglePresetSelection(presetId, preset) {
        const card = document.querySelector(`.preset-card[data-id="${presetId}"]`);
        
        if (this.selectedPresets.has(presetId)) {
            // Deselect
            this.selectedPresets.delete(presetId);
            card.classList.remove('active');
            
            // Remove from batch display
            this.updateBatchDisplay();
        } else {
            // Select
            this.selectedPresets.add(presetId);
            card.classList.add('active');
            
            // Add to batch display
            this.addToBatchDisplay(preset);
        }
        
        // Update UI
        this.updateBatchButton();
    }
    
    addToBatchDisplay(preset) {
        const presetItem = document.createElement('div');
        presetItem.className = 'batch-preset-item';
        presetItem.dataset.id = preset.id;
        presetItem.innerHTML = `
            <span>${preset.name}</span>
            <span class="batch-dimensions">${preset.width}×${preset.height}</span>
            <button class="remove-batch-preset" data-id="${preset.id}">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        this.batchPresets.appendChild(presetItem);
        
        // Add remove event
        presetItem.querySelector('.remove-batch-preset').addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePresetSelection(preset.id, preset);
        });
    }
    
    updateBatchDisplay() {
        const items = this.batchPresets.querySelectorAll('.batch-preset-item');
        items.forEach(item => {
            const presetId = item.dataset.id;
            if (!this.selectedPresets.has(presetId)) {
                item.remove();
            }
        });
    }
    
    updateBatchButton() {
        const hasSelections = this.selectedPresets.size > 0;
        const hasImage = !!this.currentImage;
        
        this.processBatchSocialBtn.disabled = !(hasSelections && hasImage);
    }
    
    applyAspectRatio(ratio) {
        const [widthRatio, heightRatio] = ratio.split(':').map(Number);
        
        // Update ratio buttons
        this.ratioButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.ratio === ratio);
        });
        
        // If width is entered, calculate height
        if (this.customWidth.value) {
            const width = parseInt(this.customWidth.value);
            const height = Math.round(width * (heightRatio / widthRatio));
            this.customHeight.value = height;
        }
        // If height is entered, calculate width
        else if (this.customHeight.value) {
            const height = parseInt(this.customHeight.value);
            const width = Math.round(height * (widthRatio / heightRatio));
            this.customWidth.value = width;
        }
    }
    
    addCustomPreset() {
        const width = parseInt(this.customWidth.value);
        const height = parseInt(this.customHeight.value);
        const name = this.customName.value || `Custom ${width}×${height}`;
        
        if (!width || !height) {
            ImageResizerUtils.showError('Please enter both width and height');
            return;
        }
        
        if (width > 5000 || height > 5000) {
            ImageResizerUtils.showError('Dimensions too large. Max 5000px');
            return;
        }
        
        // Calculate aspect ratio
        const gcd = this.greatestCommonDivisor(width, height);
        const ratio = `${width/gcd}:${height/gcd}`;
        
        const customPreset = {
            id: `custom_${Date.now()}`,
            name: name,
            icon: 'fas fa-user-cog',
            width: width,
            height: height,
            category: 'custom',
            ratio: ratio,
            isCustom: true
        };
        
        // Add to custom presets
        this.customPresets.push(customPreset);
        
        // Add to presets grid
        if (this.currentCategory === 'all') {
            const presetCard = this.createPresetCard(customPreset);
            this.presetsGrid.appendChild(presetCard);
        }
        
        // Clear form
        this.customWidth.value = '';
        this.customHeight.value = '';
        this.customName.value = '';
        
        ImageResizerUtils.showSuccess('Custom preset added!');
    }
    
    greatestCommonDivisor(a, b) {
        return b === 0 ? a : this.greatestCommonDivisor(b, a % b);
    }
    
    clearBatchSelection() {
        // Clear all selections
        this.selectedPresets.clear();
        
        // Update UI
        this.presetsGrid.querySelectorAll('.preset-card.active').forEach(card => {
            card.classList.remove('active');
        });
        
        this.batchPresets.innerHTML = '';
        this.updateBatchButton();
        
        ImageResizerUtils.showSuccess('Selection cleared!');
    }
    
    async processBatchSocial() {
        if (!this.currentImage || this.selectedPresets.size === 0) {
            ImageResizerUtils.showError('Please select an image and at least one preset');
            return;
        }
        
        ImageResizerUtils.showLoading(`Processing ${this.selectedPresets.size} images...`);
        
        try {
            this.generatedImages = [];
            
            // Get all selected presets
            const selectedPresetData = Array.from(this.selectedPresets).map(presetId => {
                // Find preset in all presets or custom presets
                let preset = this.presets.all.find(p => p.id === presetId);
                if (!preset) {
                    preset = this.customPresets.find(p => p.id === presetId);
                }
                return preset;
            }).filter(Boolean);
            
            // Process each preset
            for (let i = 0; i < selectedPresetData.length; i++) {
                const preset = selectedPresetData[i];
                
                // Update progress
                const progress = ((i + 1) / selectedPresetData.length) * 100;
                ImageResizerUtils.updateProgress(progress);
                
                // Resize image for this preset
                const resizedImage = await this.resizeImageForPreset(preset);
                
                if (resizedImage) {
                    this.generatedImages.push({
                        ...preset,
                        blob: resizedImage,
                        filename: `${preset.name.replace(/\s+/g, '-').toLowerCase()}-${preset.width}x${preset.height}.png`
                    });
                }
            }
            
            // Display results
            this.displayResults();
            ImageResizerUtils.hideLoading();
            ImageResizerUtils.showSuccess(`Successfully generated ${this.generatedImages.length} images!`);
            
        } catch (error) {
            console.error('Batch processing error:', error);
            ImageResizerUtils.showError('Error processing images: ' + error.message);
            ImageResizerUtils.hideLoading();
        }
    }
    
    async resizeImageForPreset(preset) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                try {
                    // Create canvas with preset dimensions
                    const canvas = document.createElement('canvas');
                    canvas.width = preset.width;
                    canvas.height = preset.height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    
                    // Calculate scaling to fill the preset dimensions while maintaining aspect ratio
                    const scale = Math.max(
                        preset.width / img.width,
                        preset.height / img.height
                    );
                    
                    const scaledWidth = img.width * scale;
                    const scaledHeight = img.height * scale;
                    
                    // Center the image
                    const x = (preset.width - scaledWidth) / 2;
                    const y = (preset.height - scaledHeight) / 2;
                    
                    // Draw image
                    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
                    
                    // Convert to blob
                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Failed to create image blob'));
                        }
                    }, 'image/png', 0.95);
                    
                } catch (error) {
                    reject(error);
                }
            };
            
            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };
            
            img.src = this.currentImage;
        });
    }
    
    displayResults() {
        this.socialResults.style.display = 'block';
        this.socialResultsGrid.innerHTML = '';
        
        if (this.generatedImages.length === 0) {
            this.socialResultsGrid.innerHTML = `
                <div class="empty-results">
                    <i class="fas fa-images"></i>
                    <p>No images generated yet</p>
                </div>
            `;
            return;
        }
        
        // Display each generated image
        this.generatedImages.forEach((image, index) => {
            const resultCard = this.createResultCard(image, index);
            this.socialResultsGrid.appendChild(resultCard);
        });
        
        // Enable download buttons
        this.downloadAllSocialBtn.disabled = false;
        this.downloadIndividualSocialBtn.disabled = false;
        
        // Scroll to results
        this.socialResults.scrollIntoView({ behavior: 'smooth' });
    }
    
    createResultCard(image, index) {
        const card = document.createElement('div');
        card.className = 'result-card';
        
        // Create object URL for preview
        const objectUrl = URL.createObjectURL(image.blob);
        
        card.innerHTML = `
            <div class="result-image">
                <img src="${objectUrl}" alt="${image.name}">
            </div>
            <div class="result-info">
                <h4>${image.name}</h4>
                <p><i class="fas fa-expand-alt"></i> ${image.width} × ${image.height}</p>
                <p><i class="${image.icon}"></i> ${image.category}</p>
                <button class="btn small" data-index="${index}">
                    <i class="fas fa-download"></i> Download
                </button>
            </div>
        `;
        
        // Add download event
        card.querySelector('button').addEventListener('click', (e) => {
            const index = parseInt(e.currentTarget.dataset.index);
            this.downloadSingleImage(index);
        });
        
        // Clean up object URL when card is removed
        card.addEventListener('remove', () => {
            URL.revokeObjectURL(objectUrl);
        });
        
        return card;
    }
    
    downloadSingleImage(index) {
        if (index >= 0 && index < this.generatedImages.length) {
            const image = this.generatedImages[index];
            ImageResizerUtils.downloadFile(image.blob, image.filename);
            ImageResizerUtils.showSuccess(`Downloaded ${image.name}!`);
        }
    }
    
    async downloadAllSocial() {
        if (this.generatedImages.length === 0) return;
        
        ImageResizerUtils.showLoading('Creating ZIP file...');
        
        try {
            const zip = new JSZip();
            
            // Add each image to ZIP
            this.generatedImages.forEach(image => {
                zip.file(image.filename, image.blob);
            });
            
            // Generate ZIP
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            
            // Download
            saveAs(zipBlob, `social-media-images-${Date.now()}.zip`);
            
            ImageResizerUtils.showSuccess('ZIP file downloaded successfully!');
            
        } catch (error) {
            console.error('ZIP creation error:', error);
            ImageResizerUtils.showError('Error creating ZIP file: ' + error.message);
        } finally {
            ImageResizerUtils.hideLoading();
        }
    }
    
    downloadIndividualSocial() {
        if (this.generatedImages.length === 0) return;
        
        // Download each image individually
        this.generatedImages.forEach((image, index) => {
            setTimeout(() => {
                this.downloadSingleImage(index);
            }, index * 100); // Stagger downloads
        });
        
        ImageResizerUtils.showSuccess('Downloads started...');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SocialPresets();
});