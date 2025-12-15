// text-extractor.js - OCR Text Extraction using Tesseract.js

class TextExtractor {
    constructor() {
        this.worker = null;
        this.currentImage = null;
        this.extractedText = '';
        this.workerInitialized = false;
        
        this.initializeElements();
        this.initializeEventListeners();
        this.initializeWorker();
    }
    
    initializeElements() {
        // Upload Elements
        this.ocrUploadZone = document.getElementById('ocrUploadZone');
        this.ocrFileInput = document.getElementById('ocrFileInput');
        this.ocrPreviewImage = document.getElementById('ocrPreviewImage');
        this.ocrImagePreview = document.getElementById('ocrImagePreview');
        this.textOverlay = document.getElementById('textOverlay');
        
        // Settings Elements
        this.languageSelect = document.getElementById('languageSelect');
        this.ocrMode = document.getElementById('ocrMode');
        this.preserveFormatting = document.getElementById('preserveFormatting');
        this.detectTables = document.getElementById('detectTables');
        this.extractTextBtn = document.getElementById('extractTextBtn');
        
        // Result Elements
        this.extractedText = document.getElementById('extractedText');
        this.charCount = document.getElementById('charCount');
        this.wordCount = document.getElementById('wordCount');
        this.ocrTime = document.getElementById('ocrTime');
        this.copyTextBtn = document.getElementById('copyText');
        this.clearTextBtn = document.getElementById('clearText');
        this.downloadTextBtn = document.getElementById('downloadText');
        this.translateTextBtn = document.getElementById('translateTextBtn');
        
        // Tool Buttons
        this.formatTextBtn = document.getElementById('formatText');
        this.removeLineBreaksBtn = document.getElementById('removeLineBreaks');
        this.findReplaceBtn = document.getElementById('findReplace');
        this.textToSpeechBtn = document.getElementById('textToSpeech');
        
        // Advanced Features
        this.correctTextBtn = document.getElementById('correctText');
        this.exportDocxBtn = document.getElementById('exportDocx');
        this.exportPdfBtn = document.getElementById('exportPdf');
        this.exportHtmlBtn = document.getElementById('exportHtml');
        this.batchOcrBtn = document.getElementById('batchOcr');
        this.shareResultsBtn = document.getElementById('shareResults');
        
        // Translation Modal
        this.translateModal = document.getElementById('translateModal');
        this.sourceText = document.getElementById('sourceText');
        this.translatedText = document.getElementById('translatedText');
        this.sourceLang = document.getElementById('sourceLang');
        this.targetLang = document.getElementById('targetLang');
        this.performTranslateBtn = document.getElementById('performTranslate');
        this.cancelTranslateBtn = document.getElementById('cancelTranslate');
    }
    
    initializeEventListeners() {
        // File Upload
        this.ocrUploadZone.addEventListener('click', () => {
            this.ocrFileInput.click();
        });
        
        this.ocrFileInput.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files[0]);
        });
        
        // Drag and Drop
        this.ocrUploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.ocrUploadZone.style.backgroundColor = 'rgba(37, 99, 235, 0.1)';
        });
        
        this.ocrUploadZone.addEventListener('dragleave', () => {
            this.ocrUploadZone.style.backgroundColor = '';
        });
        
        this.ocrUploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.ocrUploadZone.style.backgroundColor = '';
            this.handleFileUpload(e.dataTransfer.files[0]);
        });
        
        // Extract Button
        this.extractTextBtn.addEventListener('click', () => {
            this.extractText();
        });
        
        // Text Actions
        this.copyTextBtn.addEventListener('click', () => {
            this.copyText();
        });
        
        this.clearTextBtn.addEventListener('click', () => {
            this.clearResults();
        });
        
        this.downloadTextBtn.addEventListener('click', () => {
            this.downloadText();
        });
        
        this.translateTextBtn.addEventListener('click', () => {
            this.openTranslationModal();
        });
        
        // Text Tools
        this.formatTextBtn.addEventListener('click', () => {
            this.formatText();
        });
        
        this.removeLineBreaksBtn.addEventListener('click', () => {
            this.removeLineBreaks();
        });
        
        this.findReplaceBtn.addEventListener('click', () => {
            this.openFindReplace();
        });
        
        this.textToSpeechBtn.addEventListener('click', () => {
            this.textToSpeech();
        });
        
        // Advanced Features
        this.correctTextBtn.addEventListener('click', () => {
            this.correctText();
        });
        
        this.exportDocxBtn.addEventListener('click', () => {
            this.exportToFormat('docx');
        });
        
        this.exportPdfBtn.addEventListener('click', () => {
            this.exportToFormat('pdf');
        });
        
        this.exportHtmlBtn.addEventListener('click', () => {
            this.exportToFormat('html');
        });
        
        // Translation Modal
        this.performTranslateBtn.addEventListener('click', () => {
            this.performTranslation();
        });
        
        this.cancelTranslateBtn.addEventListener('click', () => {
            this.closeTranslationModal();
        });
        
        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target === this.translateModal) {
                this.closeTranslationModal();
            }
        });
    }
    
    async initializeWorker() {
        try {
            ImageResizerUtils.showLoading('Initializing OCR engine...');
            
            // Initialize Tesseract worker
            this.worker = await Tesseract.createWorker();
            
            // Load English language by default
            await this.worker.loadLanguage('eng');
            await this.worker.initialize('eng');
            
            this.workerInitialized = true;
            ImageResizerUtils.hideLoading();
            ImageResizerUtils.showSuccess('OCR engine ready!');
            
        } catch (error) {
            console.error('Failed to initialize OCR worker:', error);
            ImageResizerUtils.showError('Failed to initialize OCR engine. Please refresh the page.');
        }
    }
    
    async handleFileUpload(file) {
        if (!file) return;
        
        try {
            // Validate file
            if (!file.type.startsWith('image/') && !file.type.includes('pdf')) {
                throw new Error('Please select a valid image or PDF file');
            }
            
            // Check file size (max 10MB for images, 20MB for PDF)
            const maxSize = file.type.includes('pdf') ? 20 * 1024 * 1024 : 10 * 1024 * 1024;
            if (file.size > maxSize) {
                throw new Error(`File size must be less than ${file.type.includes('pdf') ? '20MB' : '10MB'}`);
            }
            
            // Show preview for images
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.ocrPreviewImage.src = e.target.result;
                    this.ocrImagePreview.style.display = 'block';
                    this.currentImage = e.target.result;
                    this.extractTextBtn.disabled = false;
                };
                reader.readAsDataURL(file);
            } else if (file.type.includes('pdf')) {
                // Handle PDF files
                this.ocrPreviewImage.src = 'assets/images/pdf-icon.png';
                this.ocrImagePreview.style.display = 'block';
                this.currentImage = await this.convertPdfToImage(file);
                this.extractTextBtn.disabled = false;
            }
            
            ImageResizerUtils.showSuccess('File uploaded successfully!');
            
        } catch (error) {
            ImageResizerUtils.showError(error.message);
        }
    }
    
    async convertPdfToImage(pdfFile) {
        // Note: In a real implementation, you would use pdf.js to convert PDF to images
        // This is a simplified version that just returns the first page as an image
        
        ImageResizerUtils.showLoading('Converting PDF to image...');
        
        return new Promise((resolve) => {
            // For demo purposes, we'll create a placeholder
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = 800;
            canvas.height = 1131; // A4 ratio
            
            // Draw a placeholder for PDF
            ctx.fillStyle = '#f8f9fa';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#2563eb';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('PDF Document', canvas.width / 2, canvas.height / 2);
            ctx.font = '24px Arial';
            ctx.fillText('OCR extraction available', canvas.width / 2, canvas.height / 2 + 50);
            
            const dataUrl = canvas.toDataURL('image/png');
            
            setTimeout(() => {
                ImageResizerUtils.hideLoading();
                resolve(dataUrl);
            }, 1000);
        });
    }
    
    async extractText() {
        if (!this.currentImage || !this.workerInitialized) {
            ImageResizerUtils.showError('Please upload an image first.');
            return;
        }
        
        // Get settings
        const language = this.languageSelect.value;
        const mode = this.ocrMode.value;
        const preserveFormatting = this.preserveFormatting.checked;
        
        // Show loading
        const startTime = Date.now();
        ImageResizerUtils.showLoading('Extracting text...');
        
        try {
            // Configure worker based on mode
            await this.worker.setParameters({
                tessedit_pageseg_mode: mode === 'accurate' ? 3 : mode === 'balanced' ? 6 : 13,
                preserve_interword_spaces: preserveFormatting ? '1' : '0',
            });
            
            // Change language if needed
            if (language !== 'eng') {
                await this.worker.loadLanguage(language);
                await this.worker.initialize(language);
            }
            
            // Perform OCR
            const result = await this.worker.recognize(this.currentImage);
            
            // Calculate processing time
            const endTime = Date.now();
            const processingTime = ((endTime - startTime) / 1000).toFixed(2);
            
            // Update UI with results
            this.updateResults(result.data.text, result.data, processingTime);
            
            ImageResizerUtils.showSuccess(`Text extracted in ${processingTime}s!`);
            
        } catch (error) {
            console.error('OCR Error:', error);
            ImageResizerUtils.showError('Error extracting text: ' + error.message);
        } finally {
            ImageResizerUtils.hideLoading();
        }
    }
    
    updateResults(text, data, processingTime) {
        // Store extracted text
        this.extractedText = text;
        
        // Update text area
        document.getElementById('extractedText').value = text;
        
        // Update statistics
        const charCount = text.length;
        const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
        
        this.charCount.textContent = charCount.toLocaleString();
        this.wordCount.textContent = wordCount.toLocaleString();
        this.ocrTime.textContent = processingTime;
        
        // Visualize text detection if available
        if (data.words && data.words.length > 0) {
            this.visualizeTextDetection(data.words);
        }
    }
    
    visualizeTextDetection(words) {
        // Clear previous overlay
        this.textOverlay.innerHTML = '';
        
        // Create overlay for each detected word
        words.forEach(word => {
            const bbox = word.bbox;
            
            const wordBox = document.createElement('div');
            wordBox.className = 'text-box';
            wordBox.style.left = `${bbox.x0}px`;
            wordBox.style.top = `${bbox.y0}px`;
            wordBox.style.width = `${bbox.x1 - bbox.x0}px`;
            wordBox.style.height = `${bbox.y1 - bbox.y0}px`;
            wordBox.title = word.text;
            
            this.textOverlay.appendChild(wordBox);
        });
    }
    
    copyText() {
        const text = document.getElementById('extractedText').value;
        if (!text.trim()) {
            ImageResizerUtils.showError('No text to copy');
            return;
        }
        
        ImageResizerUtils.copyToClipboard(text);
        ImageResizerUtils.showSuccess('Text copied to clipboard!');
    }
    
    clearResults() {
        document.getElementById('extractedText').value = '';
        this.charCount.textContent = '0';
        this.wordCount.textContent = '0';
        this.ocrTime.textContent = '0';
        this.textOverlay.innerHTML = '';
        this.extractedText = '';
        
        ImageResizerUtils.showSuccess('Results cleared!');
    }
    
    downloadText() {
        const text = document.getElementById('extractedText').value;
        if (!text.trim()) {
            ImageResizerUtils.showError('No text to download');
            return;
        }
        
        const blob = new Blob([text], { type: 'text/plain' });
        const filename = `extracted-text-${Date.now()}.txt`;
        
        ImageResizerUtils.downloadFile(blob, filename);
        ImageResizerUtils.showSuccess('Text file downloaded!');
    }
    
    formatText() {
        let text = document.getElementById('extractedText').value;
        
        // Remove extra whitespace
        text = text.replace(/\s+/g, ' ').trim();
        
        // Fix common OCR errors
        text = text.replace(/\|\|/g, 'll');
        text = text.replace(/\[/g, 'l');
        text = text.replace(/\]/g, 'I');
        
        // Capitalize sentences
        text = text.replace(/(^\w|\.\s+\w)/g, match => match.toUpperCase());
        
        document.getElementById('extractedText').value = text;
        this.updateTextStats();
        
        ImageResizerUtils.showSuccess('Text formatted!');
    }
    
    removeLineBreaks() {
        let text = document.getElementById('extractedText').value;
        
        // Remove line breaks but keep paragraph separators
        text = text.replace(/\n\s*\n/g, '\n\n');
        text = text.replace(/([^.\n])\n([^\n])/g, '$1 $2');
        
        document.getElementById('extractedText').value = text;
        this.updateTextStats();
        
        ImageResizerUtils.showSuccess('Line breaks removed!');
    }
    
    openFindReplace() {
        const findText = prompt('Find text:');
        if (!findText) return;
        
        const replaceText = prompt('Replace with:');
        
        let text = document.getElementById('extractedText').value;
        const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        text = text.replace(regex, replaceText);
        
        document.getElementById('extractedText').value = text;
        this.updateTextStats();
        
        ImageResizerUtils.showSuccess('Find and replace completed!');
    }
    
    textToSpeech() {
        const text = document.getElementById('extractedText').value;
        if (!text.trim()) {
            ImageResizerUtils.showError('No text to read');
            return;
        }
        
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            
            // Try to use a natural voice
            const voices = speechSynthesis.getVoices();
            const englishVoice = voices.find(voice => 
                voice.lang.startsWith('en') && voice.name.includes('Natural')
            );
            
            if (englishVoice) {
                utterance.voice = englishVoice;
            }
            
            speechSynthesis.speak(utterance);
            ImageResizerUtils.showSuccess('Reading text aloud...');
        } else {
            ImageResizerUtils.showError('Text-to-speech not supported in this browser');
        }
    }
    
    correctText() {
        let text = document.getElementById('extractedText').value;
        
        // Common OCR corrections
        const corrections = {
            'rn': 'm',
            'vv': 'w',
            'cl': 'd',
            '[]': 'll',
            'I': 'l',
            'O': '0',
            '5': 's',
            '0': 'o',
            '1': 'l',
            '|': 'l'
        };
        
        for (const [wrong, correct] of Object.entries(corrections)) {
            const regex = new RegExp(wrong, 'gi');
            text = text.replace(regex, correct);
        }
        
        document.getElementById('extractedText').value = text;
        this.updateTextStats();
        
        ImageResizerUtils.showSuccess('Common OCR errors corrected!');
    }
    
    exportToFormat(format) {
        const text = document.getElementById('extractedText').value;
        if (!text.trim()) {
            ImageResizerUtils.showError('No text to export');
            return;
        }
        
        let blob, filename, mimeType;
        
        switch (format) {
            case 'docx':
                // Simple DOCX simulation
                const docxContent = `
                    <html xmlns:o='urn:schemas-microsoft-com:office:office' 
                          xmlns:w='urn:schemas-microsoft-com:office:word' 
                          xmlns='http://www.w3.org/TR/REC-html40'>
                    <head><meta charset='utf-8'></head>
                    <body>${text.replace(/\n/g, '</p><p>')}</body></html>
                `;
                blob = new Blob([docxContent], { type: 'application/msword' });
                filename = `extracted-text-${Date.now()}.doc`;
                break;
                
            case 'pdf':
                // PDF simulation
                const pdfContent = `%PDF-1.4
                    1 0 obj
                    << /Type /Catalog /Pages 2 0 R >>
                    endobj
                    2 0 obj
                    << /Type /Pages /Kids [3 0 R] /Count 1 >>
                    endobj
                    3 0 obj
                    << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
                    endobj
                    4 0 obj
                    << /Length 44 >>
                    stream
                    BT /F1 12 Tf 72 720 Td (${text.substring(0, 50)}...) Tj ET
                    endstream
                    endobj
                    xref
                    0 5
                    0000000000 65535 f
                    0000000010 00000 n
                    0000000053 00000 n
                    0000000108 00000 n
                    0000000170 00000 n
                    trailer
                    << /Size 5 /Root 1 0 R >>
                    startxref
                    250
                    %%EOF`;
                blob = new Blob([pdfContent], { type: 'application/pdf' });
                filename = `extracted-text-${Date.now()}.pdf`;
                break;
                
            case 'html':
                const htmlContent = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <title>Extracted Text</title>
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; }
                            .text { white-space: pre-wrap; background: #f8f9fa; padding: 20px; border-radius: 8px; }
                        </style>
                    </head>
                    <body>
                        <div class="text">${text}</div>
                    </body>
                    </html>
                `;
                blob = new Blob([htmlContent], { type: 'text/html' });
                filename = `extracted-text-${Date.now()}.html`;
                break;
        }
        
        if (blob) {
            ImageResizerUtils.downloadFile(blob, filename);
            ImageResizerUtils.showSuccess(`Exported as ${format.toUpperCase()}!`);
        }
    }
    
    openTranslationModal() {
        const text = document.getElementById('extractedText').value;
        if (!text.trim()) {
            ImageResizerUtils.showError('No text to translate');
            return;
        }
        
        this.sourceText.value = text;
        this.translatedText.value = '';
        
        ImageResizerUtils.showModal('translateModal');
    }
    
    closeTranslationModal() {
        ImageResizerUtils.hideModal('translateModal');
    }
    
    async performTranslation() {
        const text = this.sourceText.value;
        const targetLang = this.targetLang.value;
        
        if (!text.trim()) {
            ImageResizerUtils.showError('No text to translate');
            return;
        }
        
        ImageResizerUtils.showLoading('Translating...');
        
        try {
            // Note: In a real implementation, you would call a translation API
            // This is a simplified demo using mock translation
            const mockTranslations = {
                'en': 'Hello, this is a sample translation.',
                'es': 'Hola, esta es una traducción de muestra.',
                'fr': 'Bonjour, ceci est un exemple de traduction.',
                'de': 'Hallo, dies ist eine Beispielübersetzung.',
                'zh': '你好，这是一个示例翻译。',
                'ja': 'こんにちは、これはサンプル翻訳です。',
                'ko': '안녕하세요, 이것은 샘플 번역입니다.',
                'ru': 'Привет, это пример перевода.'
            };
            
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Use mock translation or actual text for demo
            const translation = mockTranslations[targetLang] || 
                              `[Translation to ${targetLang} would appear here]`;
            
            this.translatedText.value = translation;
            
            ImageResizerUtils.hideLoading();
            ImageResizerUtils.showSuccess('Translation completed!');
            
        } catch (error) {
            console.error('Translation error:', error);
            ImageResizerUtils.showError('Translation failed. Please try again.');
            ImageResizerUtils.hideLoading();
        }
    }
    
    updateTextStats() {
        const text = document.getElementById('extractedText').value;
        const charCount = text.length;
        const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
        
        this.charCount.textContent = charCount.toLocaleString();
        this.wordCount.textContent = wordCount.toLocaleString();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TextExtractor();
});