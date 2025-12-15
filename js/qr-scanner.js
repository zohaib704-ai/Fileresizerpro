// qr-scanner.js - QR Code Scanner and Generator

class QRScanner {
    constructor() {
        this.currentStream = null;
        this.scanInterval = null;
        this.isScanning = false;
        this.lastResult = null;
        
        this.initializeElements();
        this.initializeEventListeners();
    }
    
    initializeElements() {
        // Tab Elements
        this.qrTabs = document.querySelectorAll('.qr-tab');
        this.uploadTab = document.getElementById('uploadTab');
        this.cameraTab = document.getElementById('cameraTab');
        
        // Upload Elements
        this.qrUploadZone = document.getElementById('qrUploadZone');
        this.qrFileInput = document.getElementById('qrFileInput');
        this.qrPreviewImage = document.getElementById('qrPreviewImage');
        this.qrImagePreview = document.getElementById('qrImagePreview');
        this.qrOverlay = document.getElementById('qrOverlay');
        this.qrBox = document.getElementById('qrBox');
        
        // Camera Elements
        this.qrCameraVideo = document.getElementById('qrCameraVideo');
        this.qrCameraCanvas = document.getElementById('qrCameraCanvas');
        this.startCameraBtn = document.getElementById('startCamera');
        this.stopCameraBtn = document.getElementById('stopCamera');
        this.captureQrBtn = document.getElementById('captureQr');
        
        // Result Elements
        this.qrContent = document.getElementById('qrContent');
        this.copyQrContentBtn = document.getElementById('copyQrContent');
        this.clearQrResultsBtn = document.getElementById('clearQrResults');
        this.qrType = document.getElementById('qrType');
        this.qrSize = document.getElementById('qrSize');
        this.qrPosition = document.getElementById('qrPosition');
        this.qrScanTime = document.getElementById('qrScanTime');
        
        // URL Actions
        this.urlActions = document.getElementById('urlActions');
        this.openUrlBtn = document.getElementById('openUrl');
        this.testUrlSafetyBtn = document.getElementById('testUrlSafety');
        
        // Text Actions
        this.textActions = document.getElementById('textActions');
        this.saveAsTextBtn = document.getElementById('saveAsText');
        this.translateTextBtn = document.getElementById('translateText');
        
        // Generator Elements
        this.qrText = document.getElementById('qrText');
        this.qrSizeSelect = document.getElementById('qrSizeSelect');
        this.qrColor = document.getElementById('qrColor');
        this.generateQrBtn = document.getElementById('generateQr');
        this.generatedQr = document.getElementById('generatedQr');
        this.downloadQrPngBtn = document.getElementById('downloadQrPng');
        this.downloadQrSvgBtn = document.getElementById('downloadQrSvg');
        this.copyQrImageBtn = document.getElementById('copyQrImage');
    }
    
    initializeEventListeners() {
        // Tab Switching
        this.qrTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.dataset.tab;
                this.switchTab(tabId);
            });
        });
        
        // File Upload
        this.qrUploadZone.addEventListener('click', () => {
            this.qrFileInput.click();
        });
        
        this.qrFileInput.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files[0]);
        });
        
        // Drag and Drop
        this.qrUploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.qrUploadZone.style.backgroundColor = 'rgba(37, 99, 235, 0.1)';
        });
        
        this.qrUploadZone.addEventListener('dragleave', () => {
            this.qrUploadZone.style.backgroundColor = '';
        });
        
        this.qrUploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.qrUploadZone.style.backgroundColor = '';
            this.handleFileUpload(e.dataTransfer.files[0]);
        });
        
        // Camera Controls
        this.startCameraBtn.addEventListener('click', () => {
            this.startCamera();
        });
        
        this.stopCameraBtn.addEventListener('click', () => {
            this.stopCamera();
        });
        
        this.captureQrBtn.addEventListener('click', () => {
            this.captureAndScan();
        });
        
        // Result Actions
        this.copyQrContentBtn.addEventListener('click', () => {
            this.copyQrContent();
        });
        
        this.clearQrResultsBtn.addEventListener('click', () => {
            this.clearResults();
        });
        
        this.openUrlBtn.addEventListener('click', () => {
            this.openDetectedUrl();
        });
        
        this.testUrlSafetyBtn.addEventListener('click', () => {
            this.testUrlSafety();
        });
        
        this.saveAsTextBtn.addEventListener('click', () => {
            this.saveAsTextFile();
        });
        
        // QR Generator
        this.generateQrBtn.addEventListener('click', () => {
            this.generateQRCode();
        });
        
        this.downloadQrPngBtn.addEventListener('click', () => {
            this.downloadQRCode('png');
        });
        
        this.downloadQrSvgBtn.addEventListener('click', () => {
            this.downloadQRCode('svg');
        });
        
        this.copyQrImageBtn.addEventListener('click', () => {
            this.copyQRImage();
        });
    }
    
    switchTab(tabId) {
        // Update active tab
        this.qrTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });
        
        // Show active content
        document.querySelectorAll('.qr-tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabId}Tab`);
        });
        
        // Stop camera if switching away from camera tab
        if (tabId !== 'camera' && this.currentStream) {
            this.stopCamera();
        }
    }
    
    async handleFileUpload(file) {
        if (!file) return;
        
        try {
            // Validate file
            if (!file.type.startsWith('image/')) {
                throw new Error('Please select a valid image file');
            }
            
            // Read file
            const reader = new FileReader();
            reader.onload = (e) => {
                this.qrPreviewImage.src = e.target.result;
                this.qrImagePreview.style.display = 'block';
                this.scanQRCodeFromImage(e.target.result);
            };
            reader.readAsDataURL(file);
            
        } catch (error) {
            ImageResizerUtils.showError(error.message);
        }
    }
    
    async startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            
            this.currentStream = stream;
            this.qrCameraVideo.srcObject = stream;
            
            // Enable/disable buttons
            this.startCameraBtn.disabled = true;
            this.stopCameraBtn.disabled = false;
            this.captureQrBtn.disabled = false;
            
            // Start continuous scanning
            this.startContinuousScan();
            
        } catch (error) {
            console.error('Camera error:', error);
            ImageResizerUtils.showError('Unable to access camera. Please check permissions.');
        }
    }
    
    stopCamera() {
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
            this.qrCameraVideo.srcObject = null;
            
            // Stop scanning
            this.stopContinuousScan();
            
            // Enable/disable buttons
            this.startCameraBtn.disabled = false;
            this.stopCameraBtn.disabled = true;
            this.captureQrBtn.disabled = true;
        }
    }
    
    startContinuousScan() {
        this.isScanning = true;
        this.scanInterval = setInterval(() => {
            this.scanCameraFrame();
        }, 500); // Scan every 500ms
    }
    
    stopContinuousScan() {
        this.isScanning = false;
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
        }
    }
    
    scanCameraFrame() {
        const canvas = this.qrCameraCanvas;
        const video = this.qrCameraVideo;
        const ctx = canvas.getContext('2d');
        
        // Set canvas size to video size
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw current frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Scan for QR code
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
        });
        
        if (code) {
            this.processQRResult(code);
            this.highlightQRCode(code.location);
        }
    }
    
    captureAndScan() {
        const canvas = this.qrCameraCanvas;
        const video = this.qrCameraVideo;
        const ctx = canvas.getContext('2d');
        
        // Capture current frame
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/png');
        
        // Show in preview
        this.qrPreviewImage.src = dataUrl;
        this.qrImagePreview.style.display = 'block';
        
        // Scan the captured image
        this.scanQRCodeFromImage(dataUrl);
    }
    
    async scanQRCodeFromImage(imageSrc) {
        ImageResizerUtils.showLoading('Scanning QR code...');
        
        try {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Set canvas size to image size
                canvas.width = img.width;
                canvas.height = img.height;
                
                // Draw image
                ctx.drawImage(img, 0, 0);
                
                // Get image data
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                
                // Scan for QR code
                const code = jsQR(imageData.data, canvas.width, canvas.height, {
                    inversionAttempts: 'dontInvert',
                });
                
                if (code) {
                    this.processQRResult(code);
                    this.highlightQRCode(code.location);
                } else {
                    ImageResizerUtils.showError('No QR code found in the image.');
                }
                
                ImageResizerUtils.hideLoading();
            };
            
            img.onerror = () => {
                ImageResizerUtils.showError('Failed to load image.');
                ImageResizerUtils.hideLoading();
            };
            
            img.src = imageSrc;
            
        } catch (error) {
            console.error('Scan error:', error);
            ImageResizerUtils.showError('Error scanning QR code: ' + error.message);
            ImageResizerUtils.hideLoading();
        }
    }
    
    processQRResult(code) {
        // Don't process same result multiple times
        if (this.lastResult === code.data) return;
        this.lastResult = code.data;
        
        // Update content
        this.qrContent.value = code.data;
        
        // Update QR info
        this.qrType.textContent = this.detectContentType(code.data);
        this.qrSize.textContent = `${code.location.topRightCorner.x - code.location.topLeftCorner.x}x${code.location.bottomLeftCorner.y - code.location.topLeftCorner.y}`;
        this.qrPosition.textContent = `(${code.location.topLeftCorner.x}, ${code.location.topLeftCorner.y})`;
        this.qrScanTime.textContent = new Date().toLocaleTimeString();
        
        // Show appropriate action buttons
        const isUrl = this.isValidUrl(code.data);
        this.urlActions.style.display = isUrl ? 'block' : 'none';
        this.textActions.style.display = !isUrl ? 'block' : 'none';
        
        // Show success message
        ImageResizerUtils.showSuccess('QR code scanned successfully!');
    }
    
    highlightQRCode(location) {
        if (!location) return;
        
        // Calculate position and size
        const qrWidth = location.topRightCorner.x - location.topLeftCorner.x;
        const qrHeight = location.bottomLeftCorner.y - location.topLeftCorner.y;
        
        // Update overlay box
        this.qrBox.style.display = 'block';
        this.qrBox.style.left = `${location.topLeftCorner.x}px`;
        this.qrBox.style.top = `${location.topLeftCorner.y}px`;
        this.qrBox.style.width = `${qrWidth}px`;
        this.qrBox.style.height = `${qrHeight}px`;
    }
    
    detectContentType(content) {
        if (this.isValidUrl(content)) return 'URL';
        if (content.startsWith('mailto:')) return 'Email';
        if (content.startsWith('tel:')) return 'Phone';
        if (content.startsWith('WIFI:')) return 'WiFi';
        if (content.match(/^[A-Za-z0-9+/=]+$/)) return 'Base64';
        if (content.match(/^[0-9]+$/)) return 'Numeric';
        return 'Text';
    }
    
    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }
    
    copyQrContent() {
        if (!this.qrContent.value) {
            ImageResizerUtils.showError('No content to copy');
            return;
        }
        
        ImageResizerUtils.copyToClipboard(this.qrContent.value);
    }
    
    clearResults() {
        this.qrContent.value = '';
        this.qrType.textContent = '-';
        this.qrSize.textContent = '-';
        this.qrPosition.textContent = '-';
        this.qrScanTime.textContent = '-';
        this.urlActions.style.display = 'none';
        this.textActions.style.display = 'none';
        this.qrBox.style.display = 'none';
        this.lastResult = null;
    }
    
    openDetectedUrl() {
        const url = this.qrContent.value;
        if (this.isValidUrl(url)) {
            window.open(url, '_blank');
        } else {
            ImageResizerUtils.showError('Invalid URL');
        }
    }
    
    testUrlSafety() {
        const url = this.qrContent.value;
        if (!this.isValidUrl(url)) {
            ImageResizerUtils.showError('Invalid URL');
            return;
        }
        
        ImageResizerUtils.showLoading('Checking URL safety...');
        
        // Note: In a real application, you would call a URL safety API here
        // This is a simplified version
        setTimeout(() => {
            ImageResizerUtils.hideLoading();
            
            // Check for known malicious patterns
            const maliciousPatterns = [
                'phishing',
                'malware',
                'virus',
                'hack',
                'steal',
                'password',
                'login',
                'bank',
                'paypal',
                'bitcoin'
            ];
            
            const lowerUrl = url.toLowerCase();
            const isSuspicious = maliciousPatterns.some(pattern => lowerUrl.includes(pattern));
            
            if (isSuspicious) {
                ImageResizerUtils.showError('⚠️ Warning: This URL looks suspicious. Proceed with caution.');
            } else {
                ImageResizerUtils.showSuccess('✅ This URL appears to be safe.');
            }
        }, 1500);
    }
    
    saveAsTextFile() {
        const content = this.qrContent.value;
        if (!content) {
            ImageResizerUtils.showError('No content to save');
            return;
        }
        
        const blob = new Blob([content], { type: 'text/plain' });
        const filename = `qr-content-${Date.now()}.txt`;
        
        ImageResizerUtils.downloadFile(blob, filename);
        ImageResizerUtils.showSuccess('Text file saved!');
    }
    
    generateQRCode() {
        const text = this.qrText.value.trim();
        if (!text) {
            ImageResizerUtils.showError('Please enter text or URL to encode');
            return;
        }
        
        const size = parseInt(this.qrSizeSelect.value);
        const color = this.qrColor.value;
        
        // Clear previous QR code
        this.generatedQr.innerHTML = '';
        
        // Generate QR code
        QRCode.toCanvas(text, {
            width: size,
            height: size,
            color: {
                dark: color,
                light: '#ffffff'
            },
            margin: 1
        }, (error, canvas) => {
            if (error) {
                ImageResizerUtils.showError('Error generating QR code: ' + error.message);
                return;
            }
            
            canvas.id = 'qrCanvas';
            canvas.style.border = '2px solid #e5e7eb';
            canvas.style.borderRadius = '8px';
            
            this.generatedQr.appendChild(canvas);
            
            // Store the canvas for later use
            this.currentQrCanvas = canvas;
            
            ImageResizerUtils.showSuccess('QR code generated successfully!');
        });
    }
    
    downloadQRCode(format) {
        if (!this.currentQrCanvas) {
            ImageResizerUtils.showError('No QR code to download');
            return;
        }
        
        const text = this.qrText.value.trim() || 'qr-code';
        const filename = `qr-code-${Date.now()}`;
        
        if (format === 'png') {
            // Convert canvas to PNG
            const dataUrl = this.currentQrCanvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `${filename}.png`;
            link.click();
            
            ImageResizerUtils.showSuccess('PNG downloaded!');
            
        } else if (format === 'svg') {
            // Generate SVG
            const size = parseInt(this.qrSizeSelect.value);
            const color = this.qrColor.value;
            
            QRCode.toString(this.qrText.value, {
                type: 'svg',
                width: size,
                color: {
                    dark: color,
                    light: '#ffffff'
                },
                margin: 1
            }, (error, svgString) => {
                if (error) {
                    ImageResizerUtils.showError('Error generating SVG: ' + error.message);
                    return;
                }
                
                const blob = new Blob([svgString], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${filename}.svg`;
                link.click();
                
                URL.revokeObjectURL(url);
                ImageResizerUtils.showSuccess('SVG downloaded!');
            });
        }
    }
    
    async copyQRImage() {
        if (!this.currentQrCanvas) {
            ImageResizerUtils.showError('No QR code to copy');
            return;
        }
        
        try {
            // Convert canvas to blob
            this.currentQrCanvas.toBlob(async (blob) => {
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({
                            [blob.type]: blob
                        })
                    ]);
                    ImageResizerUtils.showSuccess('QR code copied to clipboard!');
                } catch (err) {
                    // Fallback for browsers that don't support image copying
                    ImageResizerUtils.showError('Image copying not supported in this browser');
                }
            });
        } catch (error) {
            console.error('Copy error:', error);
            ImageResizerUtils.showError('Failed to copy image');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new QRScanner();
});